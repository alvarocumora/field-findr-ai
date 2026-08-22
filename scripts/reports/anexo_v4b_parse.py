"""
Anexo Pericial V4-B — parseo de los planos KMZ de predios vecinos (roles 168-91x,
168-22x, 163-211) y de la faja/torres de la LT 1x220 kV Caone-Mataquito.

Salida: /tmp/anexo4b/work/parcelas_v4b.json
"""
import json
import os
import re
import zipfile
from collections import defaultdict

from pyproj import Transformer
from shapely.geometry import LineString, MultiLineString, Point, Polygon
from shapely.ops import polygonize, unary_union

SNAP = 0.5  # m — cierre de vértices CAD
EXC = ("mtext", "block reference", "circle", "text")

UP = "/mnt/user-uploads"
WORK = "/tmp/anexo4b/work"
T = Transformer.from_crs("EPSG:4326", "EPSG:32719", always_xy=True)

PREDIOS = {
    "00005617-168-916_KMZ": "Rol 168-916",
    "00005595-168-917_KMZ": "Rol 168-917",
    "00005596-168-918_KMZ": "Rol 168-918",
    "00005600-168-922_KMZ": "Rol 168-922",
    "168-223-2": "Rol 168-223",
    "168-224-2": "Rol 168-224",
    "168-225-2": "Rol 168-225",
    "163-211_1-2": "Rol 163-211",
    "168-915-3": "Rol 168-915",
}
LT_KMZ = "KMZ_Sol_de_Caone_Rev0-4"


def read_kml(name):
    path = os.path.join(UP, name + ".kmz")
    with zipfile.ZipFile(path) as z:
        n = [f for f in z.namelist() if f.endswith(".kml")][0]
        return z.read(n).decode("utf-8", "replace")


def coords(txt):
    out = []
    for tok in txt.split():
        p = tok.split(",")
        if len(p) >= 2:
            out.append(T.transform(float(p[0]), float(p[1])))
    return out


def placemarks(kml):
    for m in re.finditer(r"<Placemark>(.*?)</Placemark>", kml, re.S):
        b = m.group(1)
        n = re.search(r"<name>(.*?)</name>", b, re.S)
        name = re.sub(r"<[^>]+>", "", n.group(1)).strip() if n else ""
        for c in re.finditer(r"<(Polygon|LineString|Point)>(.*?)</\1>", b, re.S):
            kind = c.group(1)
            cc = re.search(r"<coordinates>(.*?)</coordinates>", c.group(2), re.S)
            if cc:
                yield name, kind, coords(cc.group(1))


# ------------------------------------------------------------------ LT ----
def load_lt():
    kml = read_kml(LT_KMZ)
    folders = dict(re.findall(r"<Folder>\s*<name>(.*?)</name>(.*?)</Folder>", kml, re.S))
    torres, faja = [], []
    for fname, body in folders.items():
        for _, kind, cs in placemarks(body):
            if kind != "Polygon" or len(cs) < 3:
                continue
            poly = Polygon(cs)
            if not poly.is_valid:
                poly = poly.buffer(0)
            if fname == "LTE":
                torres.append(poly)
            elif fname == "Faja_Servidumbre":
                faja.append(poly)
    return torres, unary_union(faja)


# -------------------------------------------------------------- parcelas --
LOTE_RE = re.compile(r"lote\s*[-:]?\s*(\d+)", re.I)
SUP_RE = re.compile(r"(?:sup\s*=\s*)?([\d.,]+)\s*ha", re.I)


def parse_predio(key):
    kml = read_kml(key)
    segs, labels, sups = [], [], []
    for name, kind, cs in placemarks(kml):
        if kind == "Point" and cs:
            p = Point(cs[0])
            m = LOTE_RE.search(name)
            if m:
                labels.append((int(m.group(1)), p))
            else:
                s = SUP_RE.fullmatch(name.strip()) or SUP_RE.search(name)
                if s and "ha" in name.lower():
                    try:
                        sups.append((float(s.group(1).replace(",", ".")), p))
                    except ValueError:
                        pass
        elif kind in ("LineString", "Polygon") and len(cs) >= 2:
            if any(e in name.lower() for e in EXC):
                continue
            ring = cs + [cs[0]] if kind == "Polygon" else cs
            snapped = [(round(x / SNAP) * SNAP, round(y / SNAP) * SNAP) for x, y in ring]
            ln = LineString(snapped)
            if ln.length > 0.1:
                segs.append(snapped)
    net = unary_union(MultiLineString(segs))
    polys = [p for p in polygonize(net) if p.area > 1500]
    out = []
    used = set()
    for num, pt in sorted(labels):
        cand = [i for i, p in enumerate(polys) if p.contains(pt) and i not in used]
        if not cand:
            continue
        i = min(cand, key=lambda i: polys[i].area)
        used.add(i)
        poly = polys[i]
        sup = None
        best = 1e9
        for v, sp in sups:
            if poly.contains(sp):
                d = sp.distance(pt)
                if d < best:
                    best, sup = d, v
        out.append(dict(n=num, poly=poly, sup_kmz=sup))
    return out, polys


def main():
    os.makedirs(WORK, exist_ok=True)
    torres, faja = load_lt()
    trace_pts = sorted((t.centroid for t in torres), key=lambda p: (p.x, p.y))
    trace = LineString([(p.x, p.y) for p in trace_pts])

    res = defaultdict(list)
    for key, rol in PREDIOS.items():
        lots, polys = parse_predio(key)
        for lo in lots:
            poly = lo["poly"]
            inter = poly.intersection(faja).area
            res[rol].append(dict(
                n=lo["n"], rol=rol, area_gis=round(poly.area),
                sup_kmz=lo["sup_kmz"],
                d_faja=round(poly.distance(faja), 1),
                d_trace=round(poly.centroid.distance(trace), 1),
                d_torre=round(min(poly.distance(t) for t in torres), 1),
                area_faja=round(inter),
                pct_faja=round(inter / poly.area * 100, 2) if poly.area else 0,
                cruzada=inter > 1,
                wkt=poly.wkt,
            ))
        print(f"{rol}: {len(lots)} lotes de {len(polys)} caras, "
              f"cruzadas={sum(1 for x in res[rol] if x['cruzada'])}")

    json.dump({"predios": res,
               "faja_wkt": faja.wkt,
               "torres": [[t.centroid.x, t.centroid.y] for t in torres]},
              open(f"{WORK}/parcelas_v4b.json", "w"))
    print("total lotes", sum(len(v) for v in res.values()))


if __name__ == "__main__":
    main()
