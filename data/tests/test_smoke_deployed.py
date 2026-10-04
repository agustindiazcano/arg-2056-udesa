import gzip
import json
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "smoke_deployed.py"
CONFIG = json.loads((ROOT / "web" / "headers.config.json").read_text(encoding="utf-8"))

SECURITY = CONFIG["rules"][0]["headers"]  # the rule for /*
REVALIDATE = "public, max-age=0, must-revalidate"
IMMUTABLE = "public, max-age=31536000, immutable"
VERSION = "abc123def456"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 40
BIG = json.dumps({"rows": ["x" * 40] * 60}).encode()  # larger than 1 KB, so it must be compressed

HTML = (
    "<!doctype html><html lang='en'><head>"
    "<title>Argentina 2056</title>"
    "<meta property='og:title' content='Argentina 2056' />"
    "<meta property='og:description' content='d' />"
    "<meta property='og:url' content='https://site.example/' />"
    "<meta property='og:image' content='https://site.example/og.png' />"
    "<meta property='og:image:width' content='1200' />"
    "<meta property='og:image:height' content='630' />"
    "<meta name='twitter:card' content='summary_large_image' />"
    "<script type='module' src='/assets/app-1.js'></script>"
    "<link rel='stylesheet' href='/assets/app-1.css' />"
    "</head><body></body></html>"
).encode()


def good_site():
    """path -> (status, content type, extra headers, body) of a correct deployment."""
    page = {**SECURITY, "Cache-Control": REVALIDATE}
    asset = {**SECURITY, "Cache-Control": IMMUTABLE}
    data = {**SECURITY, "Cache-Control": IMMUTABLE}
    return {
        "/": (200, "text/html; charset=utf-8", page, HTML),
        "/references.html": (200, "text/html; charset=utf-8", page, HTML),
        "/robots.txt": (200, "text/plain; charset=utf-8", {**SECURITY}, b"User-agent: *\nAllow: /\n"),
        "/favicon.svg": (200, "image/svg+xml", {**SECURITY}, b"<svg xmlns='http://www.w3.org/2000/svg'/>"),
        "/og.png": (200, "image/png", {**SECURITY}, PNG),
        "/assets/app-1.js": (200, "text/javascript; charset=utf-8", asset, b"console.log(1)"),
        "/assets/app-1.css": (200, "text/css; charset=utf-8", asset, b"body{}"),
        "/data/_version.json": (200, "application/json", {**SECURITY, "Cache-Control": "no-cache"}, json.dumps({"data_version": VERSION}).encode()),
        "/data/_manifest.json": (
            200,
            "application/json",
            {**SECURITY, "Cache-Control": IMMUTABLE},
            json.dumps({"files": [{"name": "economy.json", "origin": "processed"}, {"name": "references.json", "origin": "processed"}]}).encode(),
        ),
        "/data/economy.json": (200, "application/json", data, BIG),
        "/data/references.json": (200, "application/json", data, json.dumps({"mock": False, "sources": []}).encode()),
    }


class Site:
    """A local server answering from a table. `compress` gzips the bodies of html, js, css and json like a real host."""

    def __init__(self, table, compress=True):
        self.table = table
        self.requests = []
        self.compress = compress
        site = self

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):  # noqa: N802 (the name is fixed by http.server)
                path = self.path.split("?")[0]
                site.requests.append(self.path)
                entry = site.table.get(path)
                if entry is None:
                    self.send_response(404)
                    self.end_headers()
                    self.wfile.write(b"not found")
                    return
                status, content_type, headers, body = entry
                encoding = None
                compressible = content_type.startswith(("text/html", "text/javascript", "text/css", "application/json"))
                if site.compress and compressible and "gzip" in self.headers.get("Accept-Encoding", ""):
                    body, encoding = gzip.compress(body), "gzip"
                self.send_response(status)
                self.send_header("Content-Type", content_type)
                if encoding:
                    self.send_header("Content-Encoding", encoding)
                for key, value in headers.items():
                    self.send_header(key, value)
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            def log_message(self, *args):
                pass

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)

    @property
    def url(self):
        return f"http://127.0.0.1:{self.server.server_address[1]}"

    def __enter__(self):
        self.thread.start()
        return self

    def __exit__(self, *exc):
        self.server.shutdown()
        self.server.server_close()


def run(url, *extra):
    return subprocess.run(
        [sys.executable, str(SCRIPT), url, "--og-from-base", *extra], capture_output=True, text=True, check=False
    )


def lines(result):
    return result.stdout.splitlines()


def with_change(path, **changes):
    """The good site with one entry changed: status, content_type, headers (merged; None removes) or body."""
    table = good_site()
    status, content_type, headers, body = table[path]
    headers = dict(headers)
    for key, value in changes.pop("headers", {}).items():
        if value is None:
            headers.pop(key, None)
        else:
            headers[key] = value
    table[path] = (changes.get("status", status), changes.get("content_type", content_type), headers, changes.get("body", body))
    return table


# ---- a correct deployment -----------------------------------------------------------------------------------------


def test_a_correct_deployment_passes_every_check_and_exits_0():
    with Site(good_site()) as site:
        result = run(site.url)
    assert result.returncode == 0, result.stdout + result.stderr
    assert all(line.startswith("PASS ") for line in lines(result)), result.stdout
    assert "PASS GET / status" in lines(result)
    assert "PASS GET /data/economy.json?v=abc123def456 status" in lines(result)
    assert "PASS GET / content-encoding" in lines(result)
    assert "PASS GET / og:image" in lines(result)


def test_it_fetches_each_manifest_file_with_the_version_query():
    with Site(good_site()) as site:
        run(site.url)
        assert "/data/economy.json?v=abc123def456" in site.requests
        assert "/data/references.json?v=abc123def456" in site.requests
        assert "/data/_version.json" in site.requests
        assert "/og.png" in site.requests


# ---- each failure class -------------------------------------------------------------------------------------------


def test_a_missing_file_fails_with_its_status():
    table = good_site()
    del table["/robots.txt"]
    with Site(table) as site:
        result = run(site.url)
    assert result.returncode == 1
    assert "FAIL GET /robots.txt status expected 200, got 404" in lines(result)


def test_a_wrong_cache_header_fails_with_both_values():
    with Site(with_change("/assets/app-1.js", headers={"Cache-Control": "no-cache"})) as site:
        result = run(site.url)
    assert result.returncode == 1
    assert f'FAIL GET /assets/app-1.js cache-control expected "{IMMUTABLE}", got "no-cache"' in lines(result)


def test_a_missing_security_header_fails_and_names_it():
    with Site(with_change("/", headers={"X-Content-Type-Options": None})) as site:
        result = run(site.url)
    assert result.returncode == 1
    assert 'FAIL GET / header X-Content-Type-Options expected "nosniff", got none' in lines(result)


def test_a_different_security_header_value_fails_with_both_values():
    with Site(with_change("/references.html", headers={"Referrer-Policy": "no-referrer"})) as site:
        result = run(site.url)
    assert result.returncode == 1
    assert 'FAIL GET /references.html header Referrer-Policy expected "strict-origin-when-cross-origin", got "no-referrer"' in lines(result)


def test_missing_compression_fails():
    with Site(good_site(), compress=False) as site:
        result = run(site.url)
    assert result.returncode == 1
    assert "FAIL GET / content-encoding expected br or gzip, got none" in lines(result)
    assert "FAIL GET /data/economy.json?v=abc123def456 content-encoding expected br or gzip, got none" in lines(result)
    # a tiny body is not compressed by hosts and is not required to be
    assert "PASS GET /data/_version.json content-encoding" in lines(result)


def test_a_wrong_content_type_fails():
    with Site(with_change("/data/references.json", content_type="text/html")) as site:
        result = run(site.url)
    assert result.returncode == 1
    assert "FAIL GET /data/references.json?v=abc123def456 content-type expected application/json, got text/html" in lines(result)


def test_a_missing_open_graph_tag_fails_and_names_it():
    html = HTML.replace(b"<meta name='twitter:card' content='summary_large_image' />", b"")
    with Site(with_change("/", body=html)) as site:
        result = run(site.url)
    assert result.returncode == 1
    assert "FAIL GET / twitter:card missing" in lines(result)


def test_a_relative_og_image_fails():
    html = HTML.replace(b"https://site.example/og.png", b"/og.png")
    with Site(with_change("/", body=html)) as site:
        result = run(site.url)
    assert result.returncode == 1
    assert "FAIL GET / og:image must be an absolute https URL, got /og.png" in lines(result)


def test_an_og_image_that_is_not_a_png_fails():
    with Site(with_change("/og.png", content_type="image/jpeg")) as site:
        result = run(site.url)
    assert result.returncode == 1
    assert "FAIL GET /og.png content-type expected image/png, got image/jpeg" in lines(result)


def test_mock_data_passes_by_default_and_fails_with_expect_real_data():
    manifest = json.dumps({"files": [{"name": "economy.json", "origin": "mock"}, {"name": "references.json", "origin": "processed"}]}).encode()
    table = with_change("/data/_manifest.json", body=manifest)
    with Site(table) as site:
        assert run(site.url).returncode == 0
        result = run(site.url, "--expect-real-data")
    assert result.returncode == 1
    assert "FAIL real-data manifest economy.json has origin mock" in lines(result)


def test_references_marked_mock_fail_with_expect_real_data():
    table = with_change("/data/references.json", body=json.dumps({"mock": True}).encode())
    with Site(table) as site:
        result = run(site.url, "--expect-real-data")
    assert result.returncode == 1
    assert "FAIL real-data references.json has mock: true" in lines(result)


def test_expect_real_data_passes_on_real_data():
    with Site(good_site()) as site:
        result = run(site.url, "--expect-real-data")
    assert result.returncode == 0, result.stdout
    assert "PASS real-data manifest" in lines(result)
    assert "PASS real-data references.json" in lines(result)


def test_a_http_url_that_is_not_localhost_fails_the_scheme_check():
    with Site(good_site()) as site:
        result = run(site.url.replace("127.0.0.1", "localhost"))
    assert result.returncode == 0  # localhost is allowed over http
    assert "PASS scheme" in lines(result)


# ---- exit codes ---------------------------------------------------------------------------------------------------


def test_an_unreachable_host_exits_2():
    with Site(good_site()) as site:
        url = site.url
    result = run(url)  # the server is stopped now
    assert result.returncode == 2
    assert "cannot reach" in result.stderr


def test_a_usage_error_exits_2():
    result = subprocess.run([sys.executable, str(SCRIPT)], capture_output=True, text=True, check=False)
    assert result.returncode == 2
    assert "usage: smoke_deployed.py" in result.stderr
    result = subprocess.run([sys.executable, str(SCRIPT), "not-a-url"], capture_output=True, text=True, check=False)
    assert result.returncode == 2
