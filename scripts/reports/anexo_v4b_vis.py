"""
Anexo Pericial V4-B — visibilidad e índice de dominancia visual (IDV) de los
675 lotes de los predios vecinos (roles 168-916/917/918/922, 168-223/224/225,
163-211) respecto de la LT 1x220 kV Caone-Mataquito.

Entrada: /tmp/anexo4b/work/parcelas_v4b.json
Salida:  /tmp/anexo4b/work/scored_v4b.json
"""
import json
import math
import os
import urllib.request

import numpy as np
from PIL import Image
from pyproj import Transformer
from shapely import wkt as shwkt
from shapely.geometry import LineString, Point

WORK = "/tmp/anexo4b/work"
TOK = os.environ["MAPBOX_TOKEN"]
Z = 15
H_OBS = 1.70
H_TORRE = 38.0
H_COND = 26.0
FLECHA = 9.0
STEP = 12.0
RADIO = 3000.0

T4326 = Transformer.from_crs("EPSG:32719", "EPSG:4326", always_xy=True)


def deg2tile(lon, lat, z):
    n = 2 ** z
    lr = math.radians(lat)
    return ((lon + 180) / 360 * n,
            (1 - math.log(math.tan(lr) + 1 / math.cos(lr)) / math.pi) / 2 * n)


def fetch_tile(z, x, y):
    p = f"{WORK}/tiles/{z}_{x}_{y}.png"
    os.makedirs(os.path.dirname(p), exist_ok=True)
    if not os.path.exists(p):
        url = (f"https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}"
               f".pngraw?access_token={TOK}")
        urllib.request.urlretrieve(url, p)
    a = np.asarray(Image.open(p).convert("RGB")).astype(np.float64)
    return -10000 + (a[:, :, 0] * 65536 + a[:, :, 1] * 256 + a[:, :, 2]) * 0.1


class DEM:
    def __init__(self, bbox, z=Z):
        self.z = z
        w, s, e, n = bbox
        x0, y0 = deg2tile(w, n, z)
        x1, y1 = deg2tile(e, s, z)
        self.tx0, self.ty0, self.tx1, self.ty1 = int(x0), int(y0), int(x1), int(y1)
        self.grid = np.vstack([
            np.hstack([fetch_tile(z, tx, ty) for tx in range(self.tx0, self.tx1 + 1)])
            for ty in range(self.ty0, self.ty1 + 1)])

    def elev(self, x, y):
        lon, lat = T4326.transform(x, y)
        xt, yt = deg2tile(lon, lat, self.z)
        px, py = (xt - self.tx0) * 256, (yt - self.ty0) * 256
        g = self.grid
        H, W = g.shape
        i = min(max(int(px), 0), W - 2)
        j = min(max(int(py), 0), H - 2)
        fx, fy = px - i, py - j
        return float(g[j, i] * (1 - fx) * (1 - fy) + g[j, i + 1] * fx * (1 - fy)
                     + g[j + 1, i] * (1 - fx) * fy + g[j + 1, i + 1] * fx * fy)

    @property
    def res_m(self):
        return 156543.03 * math.cos(math.radians(35.0)) / (2 ** self.z)


def visible(dem, ox, oy, oz, tx, ty, tz, veg=0.0, faja=None):
    d = math.hypot(tx - ox, ty - oy)
    if d < 1:
        return True
    n = max(3, int(d / STEP))
    for i in range(1, n):
        f = i / n
        px, py = ox + (tx - ox) * f, oy + (ty - oy) * f
        add = 0.0
        if veg and f * d > 30 and (faja is None or faja.distance(Point(px, py)) > 30):
            add = veg
        if dem.elev(px, py) + add > oz + (tz - oz) * f:
            return False
    return True


def nlog(v, lo, hi):
    v = max(lo, min(hi, v))
    return (math.log(v) - math.log(lo)) / (math.log(hi) - math.log(lo))


def nlin(v, lo, hi):
    return max(0.0, min(1.0, (v - lo) / (hi - lo)))


RANGOS = dict(D=(40, 600), N=(2, 20), H=(3, 25), C=(500, 3000), O=(20, 150))
PESOS = dict(D=0.20, N=0.08, H=0.18, C=0.08, S=0.14, O=0.06, A=0.06, V=0.16, P=0.04)
CORTES = [("V0", 0.00), ("V1", 0.30), ("V2", 0.45), ("V3", 0.60), ("V4", 0.75)]


def clase(v):
    c = "V0"
    for name, lim in CORTES:
        if v >= lim:
            c = name
    return c


def obs_points(poly, dem):
    minx, miny, maxx, maxy = poly.bounds
    cand = []
    nx = max(3, min(8, int((maxx - minx) / 15)))
    ny = max(3, min(8, int((maxy - miny) / 15)))
    for i in range(nx + 1):
        for j in range(ny + 1):
            p = Point(minx + (maxx - minx) * i / nx, miny + (maxy - miny) * j / ny)
            if poly.contains(p):
                cand.append(p)
    if not cand:
        cand = [poly.representative_point()]
    zc = {(p.x, p.y): dem.elev(p.x, p.y) for p in cand}
    p_alto = max(cand, key=lambda p: zc[(p.x, p.y)])
    inner = [p for p in cand if poly.exterior.distance(p) > 8] or cand
    p_viv = max(inner, key=lambda p: zc[(p.x, p.y)] + 0.02 * poly.exterior.distance(p))
    borde = poly.exterior
    p_acc = borde.interpolate(borde.project(poly.centroid))
    return {"P1": p_acc, "P2": poly.centroid, "P3": p_alto, "P4": p_viv}


def main():
    d = json.load(open(f"{WORK}/parcelas_v4b.json"))
    faja = shwkt.loads(d["faja_wkt"])
    torres = [Point(x, y) for x, y in d["torres"]]
    trace = LineString([(p.x, p.y) for p in sorted(torres, key=lambda p: (p.x, p.y))])

    lots = []
    for rol, arr in d["predios"].items():
        for r in arr:
            r["poly"] = shwkt.loads(r["wkt"])
            lots.append(r)

    xs = [lo["poly"].centroid.x for lo in lots]
    ys = [lo["poly"].centroid.y for lo in lots]
    lons, lats = T4326.transform(xs + [t.x for t in torres], ys + [t.y for t in torres])
    dem = DEM((min(lons) - 0.02, min(lats) - 0.02, max(lons) + 0.02, max(lats) + 0.02))

    tinfo = [dict(x=t.x, y=t.y, z=dem.elev(t.x, t.y)) for t in torres]
    vanos = []
    orden = sorted(tinfo, key=lambda t: (t["x"], t["y"]))
    for a, b in zip(orden, orden[1:]):
        L = math.hypot(b["x"] - a["x"], b["y"] - a["y"])
        if L > 800:
            continue
        vanos.append(dict(L=L, mx=(a["x"] + b["x"]) / 2, my=(a["y"] + b["y"]) / 2,
                          mz=(a["z"] + b["z"]) / 2 + H_COND - FLECHA))

    out = []
    for k, lo in enumerate(lots, 1):
        poly = lo["poly"]
        cen = poly.centroid
        rel = [t for t in tinfo if math.hypot(t["x"] - cen.x, t["y"] - cen.y) < RADIO]
        vrel = [v for v in vanos if math.hypot(v["mx"] - cen.x, v["my"] - cen.y) < RADIO]
        pts = obs_points(poly, dem)
        recs = {}
        for key, q in pts.items():
            gz = dem.elev(q.x, q.y)
            oz = gz + H_OBS
            visA, visB = [], []
            for t in rel:
                if visible(dem, q.x, q.y, oz, t["x"], t["y"], t["z"] + H_TORRE):
                    visA.append(t)
                    if visible(dem, q.x, q.y, oz, t["x"], t["y"], t["z"] + H_TORRE,
                               veg=6.0, faja=trace):
                        visB.append(t)
            dmin = min((math.hypot(t["x"] - q.x, t["y"] - q.y) for t in visA), default=None)
            ang_v = 0.0
            sky = 0.0
            if visA:
                tn = min(visA, key=lambda t: math.hypot(t["x"] - q.x, t["y"] - q.y))
                dd = math.hypot(tn["x"] - q.x, tn["y"] - q.y)
                ang_v = math.degrees(math.atan2(tn["z"] + H_TORRE - oz, dd)) - \
                    math.degrees(math.atan2(tn["z"] - oz, dd))
                n = max(4, int(dd / (STEP * 2)))
                maxang = -90.0
                for i in range(1, n):
                    f = i / n
                    gx, gy = q.x + (tn["x"] - q.x) * f, q.y + (tn["y"] - q.y) * f
                    maxang = max(maxang, math.degrees(
                        math.atan2(dem.elev(gx, gy) - oz, f * dd)))
                top = math.degrees(math.atan2(tn["z"] + H_TORRE - oz, dd))
                sky = 1.0 if top > maxang + 0.3 else 0.35
            cond = [v for v in vrel
                    if visible(dem, q.x, q.y, oz, v["mx"], v["my"], v["mz"])]
            angs = [math.degrees(math.atan2(t["y"] - q.y, t["x"] - q.x)) for t in visA]
            ang_h = (max(angs) - min(angs)) if len(angs) > 1 else (12.0 if angs else 0.0)
            if ang_h > 180:
                ang_h = 360 - ang_h
            recs[key] = dict(z=round(gz, 1), n_vis=len(visA), n_vis_B=len(visB),
                             dmin=round(dmin, 1) if dmin else None,
                             ang_v=round(ang_v, 2), ang_h=round(ang_h, 1), sky=sky,
                             n_cond=len(cond), len_cond=round(sum(v["L"] for v in cond)))

        def comp(modelo):
            kk = "n_vis" if modelo == "A" else "n_vis_B"
            base = max((recs[x] for x in ("P2", "P4", "P3")),
                       key=lambda r: (r[kk], -(r["dmin"] or 1e9)))
            if base[kk] == 0:
                return dict.fromkeys("DNHCSOAVP", 0.0)
            factor = 1.0 if modelo == "A" else 0.55
            return dict(
                D=1 - nlog(base["dmin"] or 600, *RANGOS["D"]),
                N=nlin(base[kk], *RANGOS["N"]),
                H=nlin(base["ang_v"], *RANGOS["H"]),
                C=nlin(base["len_cond"] * factor, *RANGOS["C"]),
                S=base["sky"],
                O=nlin(base["ang_h"], *RANGOS["O"]),
                A=1.0 if recs["P1"][kk] else 0.0,
                V=1.0 if recs["P4"][kk] else 0.0,
                P=sum(1 for x in recs if recs[x][kk]) / 4.0)

        cA, cB = comp("A"), comp("B")
        idvA = sum(PESOS[k] * cA[k] for k in PESOS)
        idvB = sum(PESOS[k] * cB[k] for k in PESOS)
        idv = 0.6 * idvA + 0.4 * idvB
        rec = {k: v for k, v in lo.items() if k not in ("poly", "wkt")}
        rec.update(idvA=round(idvA, 3), idvB=round(idvB, 3), idv=round(idv, 3),
                   clase=clase(idv), claseA=clase(idvA),
                   compA={k: round(v, 3) for k, v in cA.items()},
                   pts=recs, lon=round(T4326.transform(cen.x, cen.y)[0], 6),
                   lat=round(T4326.transform(cen.x, cen.y)[1], 6))
        out.append(rec)
        if k % 25 == 0:
            print(f"{k}/{len(lots)}", flush=True)

    json.dump(dict(meta=dict(dem_res=round(dem.res_m, 2), n_torres=len(torres),
                             h_torre=H_TORRE, h_cond=H_COND, flecha=FLECHA,
                             step=STEP, radio=RADIO),
                   lotes=out), open(f"{WORK}/scored_v4b.json", "w"))
    from collections import Counter
    print(Counter(r["clase"] for r in out))
    print("faja:", sum(1 for r in out if r["cruzada"]),
          "d_faja<100m:", sum(1 for r in out if r["d_faja"] < 100))


if __name__ == "__main__":
    main()
