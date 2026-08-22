"""
Anexo Pericial V4-A — motor GIS de impacto visual
LT 1x220 kV Caone-Mataquito · Parcelación rural Hualañé (Brisas de Caone).

Calcula, para cada parcela del proyecto:
  - puntos de observación P1..P5
  - visibilidad de torres y conductores (line-of-sight sobre DEM)
  - índice de dominancia visual IDV y clase V0..V4
Salida: /tmp/anexo/work/analisis_v4a.json
"""
import json
import math
import os
import sys
import urllib.request

import numpy as np
from pyproj import Transformer
from shapely.geometry import LineString, Point, Polygon

WORK = "/tmp/anexo/work"
TOK = os.environ.get("MAPBOX_TOKEN", "")
Z = 15                      # ~3,9 m/px a lat -35  -> DEM "BUENA"
H_OBS = 1.70                # altura del observador (m)
H_OBS_2P = 4.50             # sensibilidad segundo piso
H_TORRE = 38.0              # altura total estimada estructura suspensión 220 kV
H_CRUCETA = 30.0
H_COND = 26.0               # punto de amarre del conductor
FLECHA = 9.0                # flecha estimada conservadora a mitad de vano
STEP = 8.0                  # paso de muestreo del perfil (m)

T4326_19S = Transformer.from_crs("EPSG:4326", "EPSG:32719", always_xy=True)
T19S_4326 = Transformer.from_crs("EPSG:32719", "EPSG:4326", always_xy=True)


# --------------------------------------------------------------------- DEM --
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
    from PIL import Image
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

    def elev_ll(self, lon, lat):
        xt, yt = deg2tile(lon, lat, self.z)
        px, py = (xt - self.tx0) * 256, (yt - self.ty0) * 256
        g = self.grid
        H, W = g.shape
        x0 = min(max(int(px), 0), W - 2)
        y0 = min(max(int(py), 0), H - 2)
        fx, fy = px - x0, py - y0
        return float(g[y0, x0] * (1 - fx) * (1 - fy) + g[y0, x0 + 1] * fx * (1 - fy)
                     + g[y0 + 1, x0] * (1 - fx) * fy + g[y0 + 1, x0 + 1] * fx * fy)

    def elev(self, x, y):
        lon, lat = T19S_4326.transform(x, y)
        return self.elev_ll(lon, lat)

    @property
    def res_m(self):
        return 156543.03 * math.cos(math.radians(35.0)) / (2 ** self.z)


# ------------------------------------------------------------------- datos --
def load():
    gis = json.load(open(f"{WORK}/gis.json"))
    torres = []
    for k, t in sorted(gis["torres"].items(), key=lambda kv: int(kv[0])):
        torres.append(dict(id=t["id"], n=int(k), x=t["x"], y=t["y"],
                           dx=abs(t["x"] - t["x_kml"]), dy=abs(t["y"] - t["y_kml"])))
    lots = json.load(open(f"{WORK}/lots.json"))
    parcelas = []
    for lo in lots:
        ring = [T4326_19S.transform(c[0], c[1]) for c in lo["polygon"]]
        if len(ring) < 3:
            continue
        poly = Polygon(ring)
        if not poly.is_valid:
            poly = poly.buffer(0)
        parcelas.append(dict(n=int(lo["lot_number"]), area_db=lo["area"],
                             area_gis=poly.area, price=lo.get("price"),
                             status=lo["status"], poly=poly))
    parcelas.sort(key=lambda p: p["n"])
    return torres, parcelas


# --------------------------------------------------------- puntos de vista --
def obs_points(poly, dem):
    """P1 acceso, P2 centroide, P3 cota máxima, P4 zona probable vivienda,
    P5 mejor vista natural (punto más alejado del corredor con cota alta)."""
    minx, miny, maxx, maxy = poly.bounds
    cand = []
    nx = max(4, int((maxx - minx) / 12))
    ny = max(4, int((maxy - miny) / 12))
    for i in range(nx + 1):
        for j in range(ny + 1):
            p = Point(minx + (maxx - minx) * i / nx, miny + (maxy - miny) * j / ny)
            if poly.contains(p):
                cand.append(p)
    if not cand:
        cand = [poly.representative_point()]
    cent = poly.centroid
    zc = {(p.x, p.y): dem.elev(p.x, p.y) for p in cand}
    p_alto = max(cand, key=lambda p: zc[(p.x, p.y)])
    borde = poly.exterior
    p_acc = borde.interpolate(borde.project(cent.buffer(1).centroid))
    # vivienda probable: punto interior con cota alta y a >=8 m del deslinde
    inner = [p for p in cand if poly.exterior.distance(p) > 8] or cand
    p_viv = max(inner, key=lambda p: zc[(p.x, p.y)] + 0.02 * poly.exterior.distance(p))
    return {"P1": p_acc, "P2": cent, "P3": p_alto, "P4": p_viv, "P5": p_alto}


# ------------------------------------------------------------- visibilidad --
def visible(dem, ox, oy, oz, tx, ty, tz, veg=0.0, faja_line=None):
    """LOS con muestreo del perfil. veg = altura de pantalla vegetal (Modelo B)."""
    d = math.hypot(tx - ox, ty - oy)
    if d < 1:
        return True, 0.0
    n = max(3, int(d / STEP))
    blocked_at = None
    for i in range(1, n):
        f = i / n
        px, py = ox + (tx - ox) * f, oy + (ty - oy) * f
        ground = dem.elev(px, py)
        h_line = oz + (tz - oz) * f
        add = 0.0
        if veg and f * d > 30:
            if faja_line is None or faja_line.distance(Point(px, py)) > 30:
                add = veg
        if ground + add > h_line:
            blocked_at = f * d
            break
    return blocked_at is None, (blocked_at or d)


def frac_visible_torre(dem, ox, oy, oz, tx, ty, base_z, veg, faja_line):
    """Fracción de la estructura visible (chequeo a 0.25/0.5/0.75/1.0 de altura)."""
    vis = 0
    for f in (0.25, 0.5, 0.75, 1.0):
        ok, _ = visible(dem, ox, oy, oz, tx, ty, base_z + H_TORRE * f, veg, faja_line)
        if ok:
            vis += 1
    return vis / 4.0


def norm(v, lo, hi):
    return max(0.0, min(1.0, (v - lo) / (hi - lo)))


PESOS = dict(D=0.22, N=0.10, H=0.18, C=0.10, S=0.14, O=0.06, A=0.06, V=0.10, P=0.04)
PESOS_ALT1 = dict(D=0.32, N=0.08, H=0.14, C=0.08, S=0.10, O=0.06, A=0.06, V=0.12, P=0.04)
PESOS_ALT2 = dict(D=0.14, N=0.12, H=0.22, C=0.12, S=0.18, O=0.06, A=0.04, V=0.08, P=0.04)


def idv(c, pesos=PESOS):
    return sum(pesos[k] * c[k] for k in pesos)


def clase(v):
    if v < 0.08:
        return "V0"
    if v < 0.22:
        return "V1"
    if v < 0.40:
        return "V2"
    if v < 0.60:
        return "V3"
    return "V4"


def main():
    torres, parcelas = load()
    xs = [p["poly"].centroid.x for p in parcelas]
    ys = [p["poly"].centroid.y for p in parcelas]
    lons, lats = T19S_4326.transform(xs, ys)
    bbox = (min(lons) - 0.03, min(lats) - 0.03, max(lons) + 0.03, max(lats) + 0.03)
    dem = DEM(bbox)

    for t in torres:
        t["z"] = dem.elev(t["x"], t["y"])

    trace = LineString([(t["x"], t["y"]) for t in torres])
    # torres relevantes: a menos de 3 km del loteo
    hull = Polygon([(x, y) for x, y in zip(xs, ys)]).convex_hull
    relev = [t for t in torres if hull.distance(Point(t["x"], t["y"])) < 3000]

    # vanos (conductor) con flecha
    vanos = []
    for a, b in zip(torres, torres[1:]):
        L = math.hypot(b["x"] - a["x"], b["y"] - a["y"])
        mx, my = (a["x"] + b["x"]) / 2, (a["y"] + b["y"]) / 2
        mz = (a["z"] + H_COND + b["z"] + H_COND) / 2 - FLECHA
        vanos.append(dict(id=f'{a["id"]}-{b["id"]}', L=L, mx=mx, my=my, mz=mz))
    vanos_rel = [v for v in vanos if hull.distance(Point(v["mx"], v["my"])) < 3000]

    out = []
    for p in parcelas:
        pts = obs_points(p["poly"], dem)
        cen = p["poly"].centroid
        d_trace = trace.distance(cen)
        recs = {}
        for key in ("P1", "P2", "P3", "P4", "P5"):
            q = pts[key]
            gz = dem.elev(q.x, q.y)
            oz = gz + H_OBS
            visA, visB = [], []
            for t in relev:
                okA, _ = visible(dem, q.x, q.y, oz, t["x"], t["y"], t["z"] + H_TORRE)
                okB, _ = visible(dem, q.x, q.y, oz, t["x"], t["y"], t["z"] + H_TORRE,
                                 veg=6.0, faja_line=trace)
                if okA:
                    visA.append(t)
                if okB:
                    visB.append(t)
            dmin = min((math.hypot(t["x"] - q.x, t["y"] - q.y) for t in visA), default=None)
            frac = 0.0
            ang_v = 0.0
            if visA:
                tn = min(visA, key=lambda t: math.hypot(t["x"] - q.x, t["y"] - q.y))
                frac = frac_visible_torre(dem, q.x, q.y, oz, tn["x"], tn["y"], tn["z"],
                                          0.0, trace)
                dd = math.hypot(tn["x"] - q.x, tn["y"] - q.y)
                top = tn["z"] + H_TORRE
                ang_v = math.degrees(math.atan2(top - oz, dd)) - \
                    math.degrees(math.atan2(tn["z"] - oz, dd))
            cond = []
            for v in vanos_rel:
                ok, _ = visible(dem, q.x, q.y, oz, v["mx"], v["my"], v["mz"])
                if ok:
                    cond.append(v)
            # ángulo horizontal ocupado por el conjunto visible
            angs = [math.degrees(math.atan2(t["y"] - q.y, t["x"] - q.x)) for t in visA]
            ang_h = (max(angs) - min(angs)) if len(angs) > 1 else (12.0 if angs else 0.0)
            if ang_h > 180:
                ang_h = 360 - ang_h
            # skyline: la torre supera la línea de horizonte del perfil
            sky = 0.0
            if visA:
                tn = min(visA, key=lambda t: math.hypot(t["x"] - q.x, t["y"] - q.y))
                dd = math.hypot(tn["x"] - q.x, tn["y"] - q.y)
                n = max(4, int(dd / STEP))
                maxang = -90
                for i in range(1, n):
                    f = i / n
                    gx, gy = q.x + (tn["x"] - q.x) * f, q.y + (tn["y"] - q.y) * f
                    maxang = max(maxang, math.degrees(
                        math.atan2(dem.elev(gx, gy) - oz, f * dd)))
                top_ang = math.degrees(math.atan2(tn["z"] + H_TORRE - oz, dd))
                sky = 1.0 if top_ang > maxang + 0.3 else 0.35
            recs[key] = dict(
                z=gz, n_vis=len(visA), n_vis_B=len(visB), dmin=dmin, frac=frac,
                ang_v=ang_v, ang_h=ang_h, sky=sky, n_cond=len(cond),
                len_cond=sum(v["L"] for v in cond))
        # componentes IDV (peor caso entre P2/P4 = uso residencial real)
        base = max((recs[k] for k in ("P2", "P4", "P3")), key=lambda r: r["n_vis"] * 1e6
                   - (r["dmin"] or 1e9))
        d_ref = base["dmin"] or 5000
        comp = dict(
            D=1 - norm(d_ref, 120, 2500),
            N=norm(base["n_vis"], 0, 6),
            H=norm(base["ang_v"], 0.0, 3.0),
            C=norm(base["len_cond"], 0, 2500),
            S=base["sky"] if base["n_vis"] else 0.0,
            O=norm(base["ang_h"], 0, 60),
            A=1.0 if recs["P1"]["n_vis"] else 0.0,
            V=1.0 if recs["P4"]["n_vis"] else 0.0,
            P=sum(1 for k in recs if recs[k]["n_vis"]) / 5.0,
        )
        v = idv(comp)
        out.append(dict(
            n=p["n"], area_db=p["area_db"], area_gis=round(p["area_gis"]),
            price=p["price"], status=p["status"], d_trace=round(d_trace, 1),
            comp={k: round(x, 3) for k, x in comp.items()},
            idv=round(v, 3), idv_alt1=round(idv(comp, PESOS_ALT1), 3),
            idv_alt2=round(idv(comp, PESOS_ALT2), 3),
            clase=clase(v), clase_alt1=clase(idv(comp, PESOS_ALT1)),
            clase_alt2=clase(idv(comp, PESOS_ALT2)),
            pts={k: {kk: (round(vv, 2) if isinstance(vv, float) else vv)
                     for kk, vv in r.items()} for k, r in recs.items()},
        ))
        print(f'lote {p["n"]:>3} d={d_trace:7.0f} idv={v:.3f} {clase(v)} '
              f'vis={base["n_vis"]}', flush=True)

    meta = dict(dem_res=round(dem.res_m, 2), dem_z=Z, n_torres=len(torres),
                n_torres_rel=len(relev),
                err_kml=round(max(max(t["dx"], t["dy"]) for t in torres), 2),
                h_torre=H_TORRE, h_cond=H_COND, flecha=FLECHA,
                torres=[{k: (round(t[k], 2) if isinstance(t[k], float) else t[k])
                         for k in ("id", "x", "y", "z")} for t in relev])
    json.dump(dict(meta=meta, parcelas=out), open(f"{WORK}/analisis_v4a.json", "w"))
    print("OK", meta)


if __name__ == "__main__":
    sys.exit(main())
