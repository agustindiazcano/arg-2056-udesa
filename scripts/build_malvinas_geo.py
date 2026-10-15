"""Builds web/src/geo/malvinasOutline.json, the outline of the Malvinas Islands that the maps and the intro draw.

Source: Natural Earth, 1:10m Admin 0 - Countries (public domain), the feature "Falkland Is." (NAME_ES "Islas Malvinas"). The coastline is
simplified (Douglas-Peucker) and the smallest islets are dropped, so the file stays small; it is a map outline, not a survey.

Network access lives here only. Run: python scripts/build_malvinas_geo.py [path to ne_10m_admin_0_countries.geojson]
Without the argument it downloads the file (13 MB) from the Natural Earth repository.
"""
import itertools
import json
import math
import sys
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'web' / 'src' / 'geo' / 'malvinasOutline.json'
URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson'
MIN_AREA_KM2 = 20.0  # smaller islets are not drawn
TOLERANCE_DEG = 0.006  # about 650 m


def area_km2(ring):
    """Area of a ring in km2 (equirectangular around its mean latitude; enough to rank islands)."""
    lat0 = sum(p[1] for p in ring) / len(ring)
    kx, ky = 111.32 * math.cos(math.radians(lat0)), 111.32
    total = 0.0
    for (x1, y1), (x2, y2) in itertools.pairwise(ring):
        total += (x1 * kx) * (y2 * ky) - (x2 * kx) * (y1 * ky)
    return total / 2  # signed: positive when counter-clockwise


def simplify(points, tol):
    """Douglas-Peucker on an open polyline."""
    if len(points) < 3:
        return points
    (x1, y1), (x2, y2) = points[0], points[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = math.hypot(dx, dy)
    far, far_i = -1.0, 0
    for i in range(1, len(points) - 1):
        x, y = points[i]
        d = math.hypot(x - x1, y - y1) if norm == 0 else abs(dy * (x - x1) - dx * (y - y1)) / norm
        if d > far:
            far, far_i = d, i
    if far <= tol:
        return [points[0], points[-1]]
    return simplify(points[: far_i + 1], tol)[:-1] + simplify(points[far_i:], tol)


def build(geojson):
    feature = next(f for f in geojson['features'] if f['properties'].get('ADM0_A3') == 'FLK')
    geom = feature['geometry']
    polygons = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    rings = []
    for poly in polygons:
        ring = poly[0]
        if abs(area_km2(ring)) < MIN_AREA_KM2:
            continue
        open_ring = [tuple(p) for p in ring[:-1]]
        simple = simplify(open_ring + [open_ring[0]], TOLERANCE_DEG)[:-1]
        closed = [[round(x, 3), round(y, 3)] for x, y in simple]
        closed.append(closed[0])
        if area_km2(closed) < 0:  # every ring counter-clockwise
            closed = closed[::-1]
        rings.append(closed)
    rings.sort(key=lambda r: -area_km2(r))
    return rings


def main():
    if len(sys.argv) > 1:
        geojson = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    else:
        with urllib.request.urlopen(URL, timeout=300) as r:
            geojson = json.loads(r.read().decode('utf-8'))
    rings = build(geojson)
    out = {
        'source': 'Natural Earth, 1:10m Admin 0 - Countries, feature "Falkland Is." (NAME_ES "Islas Malvinas")',
        'url': 'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/',
        'license': 'Public domain (Natural Earth terms of use)',
        'retrieved_at': date.today().isoformat(),
        'note': f'Douglas-Peucker simplification at {TOLERANCE_DEG} degrees; islands under {MIN_AREA_KM2} km2 dropped; every ring counter-clockwise. A map outline, not a survey.',
        'polygons': rings,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print('escrito', OUT, len(rings), 'poligonos', sum(len(r) for r in rings), 'puntos')


if __name__ == '__main__':
    main()
