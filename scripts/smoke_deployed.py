"""Smoke test of a deployed site: is it served the way the repository says it should be?

usage: smoke_deployed.py <base-url> [--expect-real-data] [--og-from-base] [--headers-config FILE]

Fetches the pages, the data files (with the ?v=<data_version> query) and the static files, and prints one line per
check: `PASS <name>` or `FAIL <name> <reason>`. Standard library only. This is the one script that is meant to talk to
the network; its tests use a server on localhost.

Checks: status 200; content types; the Cache-Control of every file equals the rule of web/headers.config.json; the
security headers of the pages equal the config; br or gzip compression of html, js, css and json (a body under 1 KB is
not required to be compressed); https unless the host is localhost, and Strict-Transport-Security on https; the Open
Graph and Twitter tags of the home page, an absolute https og:image that answers 200 with image/png.
With --expect-real-data the manifest must have no `origin: mock` file and references.json must say mock: false.
With --og-from-base the og:image is fetched from the base URL instead of its own host, to check a deployment whose
final domain is not live yet.

Exit 0 when every check passes. Exit 1 when any fails. Exit 2 for a usage error or a host that cannot be reached.
"""

import gzip
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG = ROOT / "web" / "headers.config.json"
USAGE = "usage: smoke_deployed.py <base-url> [--expect-real-data] [--og-from-base] [--headers-config FILE]"
PAGES = ("/", "/references.html")
OG_TAGS = ("og:title", "og:description", "og:url", "og:image", "og:image:width", "og:image:height", "twitter:card")
COMPRESSED_TYPES = ("text/html", "text/javascript", "application/javascript", "text/css", "application/json")
MIN_COMPRESSED_BYTES = 1024
TIMEOUT = 30


class Unreachable(Exception):
    pass


def pattern_to_regex(pattern):
    return re.compile("^" + re.escape(pattern).replace(r"\*", ".*") + "$")


def expected_headers(config, path):
    """The headers the config gives a path: every matching rule, in file order, a later rule overriding an earlier."""
    headers = {}
    for rule in config["rules"]:
        if pattern_to_regex(rule["source"]).match(path):
            headers.update(rule["headers"])
    return headers


def fetch(url):
    """(status, headers with lower-case names, body bytes). Raises Unreachable when there is no answer at all."""
    request = urllib.request.Request(url, headers={"Accept-Encoding": "gzip", "User-Agent": "smoke_deployed/1"})
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            return response.status, {k.lower(): v for k, v in response.headers.items()}, response.read()
    except urllib.error.HTTPError as error:
        return error.code, {k.lower(): v for k, v in error.headers.items()}, error.read()
    except (urllib.error.URLError, OSError) as error:
        reason = getattr(error, "reason", error)
        raise Unreachable(f"cannot reach {url}: {reason}") from error


def decoded(headers, body):
    return gzip.decompress(body) if headers.get("content-encoding") == "gzip" else body


class Report:
    def __init__(self, out):
        self.out = out
        self.passed = 0
        self.failed = 0

    def check(self, name, ok, reason=""):
        if ok:
            self.passed += 1
            self.out(f"PASS {name}\n")
        else:
            self.failed += 1
            self.out(f"FAIL {name} {reason}\n")
        return ok


def show(value):
    return "none" if value is None else f'"{value}"'


def check_response(report, target, path, response, config, expected_type, security=False):
    """The checks every fetched file gets. Returns False (and checks nothing more) when the status is not 200."""
    status, headers, body = response
    if not report.check(f"GET {target} status", status == 200, f"expected 200, got {status}"):
        return False
    content_type = headers.get("content-type")
    if expected_type is not None:
        report.check(
            f"GET {target} content-type",
            content_type is not None and content_type.lower().startswith(expected_type),
            f"expected {expected_type}, got {content_type}",
        )
    wanted = expected_headers(config, path)
    if "Cache-Control" in wanted:
        got = headers.get("cache-control")
        report.check(f"GET {target} cache-control", got == wanted["Cache-Control"], f"expected {show(wanted['Cache-Control'])}, got {show(got)}")
    if security:
        for name, value in wanted.items():
            if name == "Cache-Control":
                continue
            got = headers.get(name.lower())
            report.check(f"GET {target} header {name}", got == value, f"expected {show(value)}, got {show(got)}")
    if content_type and content_type.lower().startswith(COMPRESSED_TYPES):
        encoding = headers.get("content-encoding")
        report.check(
            f"GET {target} content-encoding",
            encoding in ("br", "gzip") or len(body) < MIN_COMPRESSED_BYTES,
            f"expected br or gzip, got {encoding or 'none'}",
        )
    return True


def check_open_graph(report, html, base, og_from_base):
    for tag in OG_TAGS:
        found = re.search(rf"""<meta[^>]+(?:property|name)=['"]{re.escape(tag)}['"][^>]*>""", html)
        report.check(f"GET / {tag}", found is not None, "missing")
    match = re.search(r"""<meta[^>]+property=['"]og:image['"][^>]+content=['"]([^'"]*)['"]""", html)
    if match is None:
        return
    image = match.group(1)
    if not image.startswith("https://"):
        report.check("GET / og:image", False, f"must be an absolute https URL, got {image}")
        return
    url = base + urllib.parse.urlparse(image).path if og_from_base else image
    try:
        status, headers, _ = fetch(url)
    except Unreachable as error:
        report.check("GET / og:image", False, str(error))
        return
    content_type = headers.get("content-type", "")
    report.check("GET / og:image", status == 200 and content_type.startswith("image/png"), f"{url} answered HTTP {status} with {content_type or 'no content type'}")


def check_real_data(report, manifest, references):
    mock = [f["name"] for f in manifest.get("files", []) if f.get("origin") == "mock"]
    for name in mock:
        report.check("real-data manifest", False, f"{name} has origin mock")
    if not mock:
        report.check("real-data manifest", True)
    if references is None:
        report.check("real-data references.json", False, "could not be read")
    else:
        report.check("real-data references.json", references.get("mock") is False, f"has mock: {json.dumps(references.get('mock'))}".replace("true", "true"))


def main(argv=None, out=sys.stdout.write, err=sys.stderr.write):
    args = list(sys.argv[1:] if argv is None else argv)
    config_path, expect_real, og_from_base, positional = DEFAULT_CONFIG, False, False, []
    i = 0
    while i < len(args):
        if args[i] == "--expect-real-data":
            expect_real = True
        elif args[i] == "--og-from-base":
            og_from_base = True
        elif args[i] == "--headers-config" and i + 1 < len(args):
            config_path = Path(args[i + 1])
            i += 1
        elif args[i].startswith("--"):
            err(f"{USAGE}\n")
            return 2
        else:
            positional.append(args[i])
        i += 1
    if len(positional) != 1 or not re.match(r"^https?://[^/\s]+", positional[0]):
        err(f"{USAGE}\n")
        return 2
    base = positional[0].rstrip("/")
    try:
        config = json.loads(Path(config_path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        err(f"smoke_deployed: cannot read {config_path}: {error}\n")
        return 2

    report = Report(out)
    parsed = urllib.parse.urlparse(base)
    local = parsed.hostname in ("localhost", "127.0.0.1", "::1")
    report.check("scheme", parsed.scheme == "https" or local, f"must be https unless the host is localhost, got {parsed.scheme}")

    try:
        html_by_page = {}
        for page in PAGES:
            response = fetch(base + page)
            if check_response(report, page, page, response, config, "text/html", security=True):
                html_by_page[page] = decoded(response[1], response[2]).decode("utf-8", "replace")
                if parsed.scheme == "https" and page == "/":
                    report.check("hsts", "strict-transport-security" in response[1], "missing Strict-Transport-Security on an https URL")
        if "/" in html_by_page:
            check_open_graph(report, html_by_page["/"], base, og_from_base)

        for path, expected_type in (("/robots.txt", "text/plain"), ("/favicon.svg", "image/svg+xml"), ("/og.png", "image/png")):
            check_response(report, path, path, fetch(base + path), config, expected_type)

        assets = sorted(set(re.findall(r"""(?:src|href)=['"](/assets/[^'"?]+\.(?:js|css))['"]""", html_by_page.get("/", ""))))
        for asset in assets:
            check_response(report, asset, asset, fetch(base + asset), config, "text/javascript" if asset.endswith(".js") else "text/css")

        version, manifest, references = None, None, None
        response = fetch(base + "/data/_version.json")
        if check_response(report, "/data/_version.json", "/data/_version.json", response, config, "application/json"):
            version = json.loads(decoded(response[1], response[2]) or b"{}").get("data_version")
        response = fetch(base + "/data/_manifest.json")
        if check_response(report, "/data/_manifest.json", "/data/_manifest.json", response, config, "application/json"):
            manifest = json.loads(decoded(response[1], response[2]) or b"{}")
        for entry in (manifest or {}).get("files", []):
            name = entry["name"]
            path = f"/data/{name}" if "/" not in name else f"/{name}"
            target = f"{path}?v={version}" if version and path.startswith("/data/") else path
            response = fetch(base + target)
            ok = check_response(report, target, path, response, config, "application/json")
            if ok and name == "references.json":
                references = json.loads(decoded(response[1], response[2]) or b"{}")
        if expect_real and manifest is not None:
            check_real_data(report, manifest, references)
    except Unreachable as error:
        err(f"smoke_deployed: {error}\n")
        return 2

    err(f"smoke_deployed: {report.passed + report.failed} checks, {report.failed} failed\n")
    return 1 if report.failed else 0


if __name__ == "__main__":
    sys.exit(main())
