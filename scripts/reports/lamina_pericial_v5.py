"""
Láminas planimétricas periciales OT-PER-2026-0087-V5 (P-01 y P-02).

Entradas (todas preexistentes, sin geometría inventada):
  - /tmp/anexo4b/work/parcelas_v4b.json  (reconstrucción GIS V5: 754 lotes, faja, 59 torres)
  - /mnt/user-uploads/KMZ_Sol_de_Caone_Rev0-4.kmz  (eje LT, caminos de acceso)
  - /mnt/documents/Base_Empirica_V5_LT220_Caone_Mataquito.xlsx  (IDV y clase V0-V4 del V5)
  - Cuadro PES oficial notificado (14 lotes, 35.777 m²) — prevalece para efectos jurídicos.

Salidas: PDF A3 apaisado vectorial, PNG 300 dpi y tabla XLSX/CSV/GeoJSON.
"""
import csv
import json
import math
import os
import re
import zipfile

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.patches import Patch, Polygon as MplPoly, Rectangle
from openpyxl import Workbook, load_workbook
from pyproj import Transformer
from shapely import wkt as shwkt
from shapely.geometry import LineString, MultiLineString, Point, Polygon, mapping
from shapely.affinity import rotate as shrotate
from shapely.ops import unary_union

WORK = "/tmp/anexo4b/work"
OUT = "/mnt/documents"
UP = "/mnt/user-uploads"
LT_KMZ = f"{UP}/KMZ_Sol_de_Caone_Rev0-4.kmz"
XLSX = f"{OUT}/Base_Empirica_V5_LT220_Caone_Mataquito.xlsx"
FOLIO = "OT-PER-2026-0087-V5"
T = Transformer.from_crs("EPSG:4326", "EPSG:32719", always_xy=True)

# --- Cuadro PES oficial notificado (dato jurídico, no recalculado) ----------
PES = {  # lote: (superficie lote m2, superficie PES m2, % afectación)
    61: (6500, 5574, 85.8), 60: (5500, 3710, 67.5), 57: (6000, 3572, 59.5),
    56: (5500, 3130, 56.9), 55: (5500, 2817, 51.2), 54: (6300, 2965, 47.1),
    53: (5000, 2207, 44.1), 52: (5000, 2057, 41.1), 51: (5000, 1967, 39.3),
    50: (5100, 1904, 37.3), 49: (5000, 1951, 39.0), 48: (5000, 1857, 37.1),
    47: (6000, 1822, 30.4), 62: (5300, 244, 4.6),
}
PES_TOTAL, SUP_TOTAL, PCT_TOTAL = 35777, 76700, 46.6
LARGO_FAJA, ANCHO_FAJA = 1198.33, 29.86
CLASES = ["V0", "V1", "V2", "V3", "V4"]
CLASE_TOTALES = {"V0": 132, "V1": 194, "V2": 338, "V3": 60, "V4": 30}
FILL = {"V0": "#f2f2f2", "V1": "#f0e6cf", "V2": "#f7e08a", "V3": "#f2b06a", "V4": "#e2603c"}
CLASE_TXT = {
    "V0": "exposición nula / muy baja", "V1": "exposición baja",
    "V2": "exposición media", "V3": "exposición alta", "V4": "exposición muy alta",
}
RECL = "Rol 168-915"
FONT = "DejaVu Sans"
plt.rcParams.update({"font.family": FONT, "pdf.fonttype": 42, "ps.fonttype": 42})


# ------------------------------------------------------------------ datos --
def load_caminos():
    with zipfile.ZipFile(LT_KMZ) as z:
        name = [f for f in z.namelist() if f.endswith(".kml")][0]
        kml = z.read(name).decode("utf-8", "replace")
    lines = []
    for fname, body in re.findall(r"<Folder>\s*<name>(.*?)</name>(.*?)</Folder>", kml, re.S):
        if fname not in ("Acceso LTE", "Caminos Internos con Línea Eléctrica"):
            continue
        for c in re.finditer(r"<(LineString|Polygon)>(.*?)</\1>", body, re.S):
            cc = re.search(r"<coordinates>(.*?)</coordinates>", c.group(2), re.S)
            if not cc:
                continue
            pts = []
            for tok in cc.group(1).split():
                p = tok.split(",")
                if len(p) >= 2:
                    pts.append(T.transform(float(p[0]), float(p[1])))
            if len(pts) >= 2:
                lines.append(LineString(pts))
    return lines


def load_base():
    ws = load_workbook(XLSX)["BASE_EMPIRICA_754"]
    rows = list(ws.iter_rows(min_row=2, values_only=True))
    return {(r[0], int(r[1])): dict(
        sup=r[2], x=r[3], y=r[4], d_faja=r[5], d_torre=r[6], d_cond=r[7],
        idv=r[10], clase=r[11], cruzado=r[15], sup_faja=r[16]) for r in rows}


def load_geo():
    d = json.load(open(f"{WORK}/parcelas_v4b.json"))
    faja = shwkt.loads(d["faja_wkt"])
    torres = [tuple(t) for t in d["torres"]]
    lotes = []
    for rol, arr in d["predios"].items():
        for x in arr:
            lotes.append(dict(rol=rol, n=int(x["n"]), poly=shwkt.loads(x["wkt"]),
                              area=x["area_gis"], area_faja=x["area_faja"],
                              cruzada=x["cruzada"], d_faja=x["d_faja"], d_torre=x["d_torre"]))
    return lotes, faja, torres


# ------------------------------------------------------------ validaciones --
def validar(lotes, base, torres):
    errs = []
    if sum(v[1] for v in PES.values()) != PES_TOTAL:
        errs.append(f"Suma PES = {sum(v[1] for v in PES.values())} ≠ {PES_TOTAL}")
    if sum(v[0] for v in PES.values()) != SUP_TOTAL:
        errs.append(f"Suma superficies 14 lotes = {sum(v[0] for v in PES.values())} ≠ {SUP_TOTAL}")
    if round(PES_TOTAL / SUP_TOTAL * 100, 1) != PCT_TOTAL:
        errs.append("Porcentaje de afectación directa no reproduce 46,6 %")
    if len(PES) != 14:
        errs.append("El cuadro PES no contiene 14 lotes")
    if len(lotes) != 754:
        errs.append(f"Universo GIS = {len(lotes)} ≠ 754 lotes")
    ids = [(l["rol"], l["n"]) for l in lotes]
    if len(set(ids)) != len(ids):
        errs.append("Existen identificadores de lote duplicados")
    if any(l["poly"].is_empty or l["n"] is None for l in lotes):
        errs.append("Existen polígonos sin ID o vacíos")
    faltan = [i for i in ids if i not in base]
    if faltan:
        errs.append(f"{len(faltan)} lotes sin registro en la Base Empírica V5")
    cnt = {c: 0 for c in CLASES}
    for i in ids:
        cnt[base[i]["clase"]] += 1
    if cnt != CLASE_TOTALES:
        errs.append(f"Distribución de clases {cnt} ≠ {CLASE_TOTALES}")
    if sum(cnt.values()) != 754:
        errs.append("V0+V1+V2+V3+V4 ≠ 754")
    if len(torres) != 59 or any(len(t) != 2 for t in torres):
        errs.append(f"Estructuras georreferenciadas = {len(torres)} ≠ 59")
    for n in PES:
        if (RECL, n) not in base:
            errs.append(f"Lote notificado {n} sin geometría en el rol {RECL}")
    return errs, cnt


# --------------------------------------------------------------- dibujado --
def escala_real(ax_w_in, ancho_m):
    return ancho_m / (ax_w_in * 0.0254)


def barra_escala(ax, x0, y0, ancho_m):
    """Barra de escala gráfica en unidades de terreno."""
    paso = 100
    for cand in (25, 50, 100, 200, 250, 500, 1000, 2000):
        if cand * 4 <= ancho_m * 0.32:
            paso = cand
    ax.add_patch(Rectangle((x0 - paso * 0.35, y0 - ancho_m * 0.030),
                           paso * 4.7, ancho_m * 0.062,
                           facecolor="white", alpha=0.88, edgecolor="none", zorder=7))
    for i in range(4):
        ax.add_patch(Rectangle((x0 + i * paso, y0), paso, ancho_m * 0.006,
                               facecolor="black" if i % 2 == 0 else "white",
                               edgecolor="black", lw=0.5, zorder=8))
    for i in range(5):
        ax.text(x0 + i * paso, y0 - ancho_m * 0.012, f"{i * paso:,}".replace(",", "."),
                ha="center", va="top", fontsize=5.5, zorder=8)
    ax.text(x0 + 2 * paso, y0 + ancho_m * 0.016, "metros", ha="center", fontsize=5.5, zorder=8)



def norte(ax, x, y, h, ang=0.0):
    dx, dy = math.sin(math.radians(ang)) * h, math.cos(math.radians(ang)) * h
    ax.annotate("", xy=(x + dx, y + dy), xytext=(x, y),
                arrowprops=dict(arrowstyle="-|>", color="black", lw=0.9), zorder=8)
    ax.text(x + dx * 1.15, y + dy * 1.15, "N", ha="center", va="bottom", fontsize=8,
            fontweight="bold", zorder=8)


def dibujar_mapa(ax, lotes, base, faja, torres, caminos, bbox, etiquetas=None,
                 label_pct=False, grid=True):
    x0, y0, x1, y1 = bbox
    for l in lotes:
        p = l["poly"]
        if p.bounds[2] < x0 or p.bounds[0] > x1 or p.bounds[3] < y0 or p.bounds[1] > y1:
            continue
        clase = base[(l["rol"], l["n"])]["clase"]
        ax.add_patch(MplPoly(list(p.exterior.coords), closed=True,
                             facecolor=FILL[clase], alpha=0.45,
                             edgecolor="#555555", lw=0.25, zorder=2))
    # límite predial de cada rol
    for rol in sorted({l["rol"] for l in lotes}):
        u = unary_union([l["poly"] for l in lotes if l["rol"] == rol])
        geoms = u.geoms if u.geom_type == "MultiPolygon" else [u]
        for g in geoms:
            ax.plot(*g.exterior.xy, color="black", lw=0.9, zorder=4)
    # faja PES (hachurado)
    fg = [g for g in getattr(faja, "geoms", [faja]) if g.geom_type == "Polygon"]
    for g in fg:
        ax.add_patch(MplPoly(list(g.exterior.coords), closed=True, facecolor="none",
                             edgecolor="#b00020", lw=0.7, hatch="////", zorder=5))
        ax.add_patch(MplPoly(list(g.exterior.coords), closed=True, facecolor="#b00020",
                             alpha=0.10, edgecolor="none", zorder=3))
    # caminos
    for c in caminos:
        parts = list(getattr(c, "geoms", [c]))
        for g in parts:
            if g.geom_type == "LineString" and not g.is_empty:
                ax.plot(*g.xy, color="#7a6a55", lw=0.6, zorder=4)
            elif g.geom_type == "Polygon":
                ax.plot(*g.exterior.xy, color="#7a6a55", lw=0.6, zorder=4)
    # eje LT + torres
    eje = LineString(sorted(torres, key=lambda t: (t[0], t[1])))
    ax.plot(*eje.xy, color="#8b005d", lw=0.8, ls=(0, (6, 3)), zorder=6)
    tx = [t[0] for t in torres]
    ty = [t[1] for t in torres]
    ax.scatter(tx, ty, s=11, facecolor="white", edgecolor="#8b005d", lw=0.8, zorder=7)
    if etiquetas:
        for l in lotes:
            if (l["rol"], l["n"]) not in etiquetas:
                continue
            c = l["poly"].representative_point()
            txt = str(l["n"])
            if label_pct:
                txt = f"{l['n']}\n{PES[l['n']][2]:.1f}%".replace(".", ",")
            ax.text(c.x, c.y, txt, ha="center", va="center", fontsize=4.6,
                    color="black", zorder=9, linespacing=1.1,
                    bbox=dict(boxstyle="square,pad=0.08", fc="white", ec="none", alpha=0.75))
    ax.set_xlim(x0, x1)
    ax.set_ylim(y0, y1)
    ax.set_aspect("equal")
    if grid:
        ax.tick_params(labelsize=5.5, direction="in", length=2.5)
        ax.ticklabel_format(style="plain", useOffset=False)
        ax.grid(True, color="#c8c8c8", lw=0.3, ls=(0, (2, 3)))
        for lab in ax.get_yticklabels():
            lab.set_rotation(90)
            lab.set_va("center")
    for s in ax.spines.values():
        s.set_linewidth(0.8)
        s.set_color("black")


def marco(fig, titulo, subt):
    fig.patches.append(Rectangle((0.014, 0.014), 0.972, 0.972, transform=fig.transFigure,
                                 facecolor="none", edgecolor="black", lw=1.1))
    fig.patches.append(Rectangle((0.021, 0.021), 0.958, 0.958, transform=fig.transFigure,
                                 facecolor="none", edgecolor="#777777", lw=0.5))
    fig.text(0.032, 0.958, titulo, fontsize=13, fontweight="bold", va="center")
    fig.text(0.032, 0.934, subt, fontsize=7.2, va="center", color="#222222", linespacing=1.4)


# ------------------------------------------------------------ panel lateral --
class Panel:
    """Panel técnico con cajas de altura adaptativa (dos pasadas: medir y dibujar)."""

    def __init__(self, ax, sc=1.0, draw=True):
        self.ax, self.sc, self.draw, self.y = ax, sc, draw, 1.0

    # --- primitivas -------------------------------------------------------
    def _t(self, x, y, s, size, **kw):
        if self.draw:
            self.ax.text(x, y, s, transform=self.ax.transAxes, fontsize=size * self.sc,
                         va="top", linespacing=1.35, **kw)

    def kv(self, y, k, v, bold=False):
        w = "bold" if bold else "normal"
        self._t(0.02, y, k, 5.7, fontweight=w)
        self._t(0.98, y, v, 5.7, fontweight=w, ha="right")
        return y - 0.0128 * self.sc

    def row(self, y, cells, bold=False, size=5.1):
        w = "bold" if bold else "normal"
        for t, x, al in cells:
            self._t(x, y, t, size, fontweight=w, ha="left" if al == "l" else "right")
        return y - 0.0092 * self.sc

    def para(self, y, txt, size=5.0):
        self._t(0.02, y, txt, size)
        return y - 0.0092 * self.sc * (txt.count("\n") + 1)

    def rule(self, y):
        y -= 0.006 * self.sc
        if self.draw:
            self.ax.plot([0.02, 0.98], [y + 0.004, y + 0.004], transform=self.ax.transAxes,
                         color="black", lw=0.5)
        return y - 0.002 * self.sc

    # --- caja -------------------------------------------------------------
    def box(self, titulo, content):
        sc = self.sc
        top = self.y
        hdr = 0.021 * sc
        y_end = content(self, top - hdr - 0.008 * sc)
        h = top - y_end + 0.004 * sc
        if self.draw:
            ax = self.ax
            ax.add_patch(Rectangle((0, top - h), 1, h, transform=ax.transAxes,
                                   facecolor="none", edgecolor="black", lw=0.7, clip_on=False))
            ax.add_patch(Rectangle((0, top - hdr), 1, hdr, transform=ax.transAxes,
                                   facecolor="#e8e8e8", edgecolor="black", lw=0.7, clip_on=False))
            ax.text(0.012, top - hdr / 2, titulo, transform=ax.transAxes,
                    fontsize=6.3 * sc, fontweight="bold", va="center")
        self.y = top - h - 0.011 * sc
        return self.y


# --- contenidos reutilizables ------------------------------------------------
def c_simbologia(p, y):
    sc = p.sc
    items = [
        ("predial", "Límite predial (rol)"),
        ("lote", "Límite de lote"),
        ("faja", "Faja de servidumbre PES (afectación física)"),
        ("eje", "Eje LT 1x220 kV Caone–Mataquito"),
        ("torre", "Torre / estructura georreferenciada"),
        ("camino", "Camino de acceso"),
    ]
    for kind, label in items:
        yy = y - 0.0035 * sc
        if p.draw:
            ax = p.ax
            if kind == "predial":
                ax.plot([0.03, 0.10], [yy, yy], transform=ax.transAxes, color="black", lw=1.1)
            elif kind == "lote":
                ax.plot([0.03, 0.10], [yy, yy], transform=ax.transAxes, color="#555555", lw=0.5)
            elif kind == "faja":
                ax.add_patch(Rectangle((0.03, yy - 0.004), 0.07, 0.008, transform=ax.transAxes,
                                       facecolor="none", edgecolor="#b00020", lw=0.7,
                                       hatch="////"))
            elif kind == "eje":
                ax.plot([0.03, 0.10], [yy, yy], transform=ax.transAxes, color="#8b005d",
                        lw=0.9, ls=(0, (5, 3)))
            elif kind == "torre":
                ax.plot([0.065], [yy], transform=ax.transAxes, marker="o", ms=3.0,
                        mfc="white", mec="#8b005d", mew=0.9, ls="none")
            else:
                ax.plot([0.03, 0.10], [yy, yy], transform=ax.transAxes, color="#7a6a55", lw=0.7)
        p._t(0.13, y, label, 5.2)
        y -= 0.0115 * sc
    y -= 0.003 * sc
    p._t(0.02, y, "CLASE DE EXPOSICIÓN / DOMINANCIA VISUAL (modelo V5)", 5.1,
         fontweight="bold")
    y -= 0.0115 * sc
    for c in CLASES:
        if p.draw:
            p.ax.add_patch(Rectangle((0.03, y - 0.0085 * sc), 0.07, 0.008 * sc,
                                     transform=p.ax.transAxes, facecolor=FILL[c], alpha=0.45,
                                     edgecolor="#555555", lw=0.4))
        p._t(0.13, y, f"{c} – {CLASE_TXT[c]}", 5.2)
        y -= 0.0115 * sc
    y = p.para(y, "V0–V4 expresa clase de exposición visual; no constituye por sí\n"
                  "sola un porcentaje de depreciación económica.", size=4.8)
    return y


def c_cartucho(lamina, escala_txt):
    campos = [
        ("PROYECTO", "LT 1x220 kV Caone–Mataquito"),
        ("MANDANTE", "Forestal Valle Escondido SpA"),
        ("DOCUMENTO", "Plano Pericial de Afectación Directa y Visual"),
        ("LÁMINA", lamina),
        ("FOLIO", f"{FOLIO}-{lamina}"),
        ("SISTEMA", "UTM 19S – EPSG:32719"),
        ("ESCALA", escala_txt),
        ("FECHA", "agosto 2026"),
        ("FUENTE", "PES notificados / KMZ concesionaria /\ncartografía parcelaria / Base Empírica V5"),
        ("ELABORADO", "OfertaTerrenos · Valuation"),
        ("ESTADO", "Documento técnico para análisis pericial"),
    ]

    def fn(p, y):
        for k, v in campos:
            p._t(0.02, y, k, 5.0, color="#333333")
            p._t(0.34, y, v, 5.2)
            y -= 0.0115 * p.sc * (v.count("\n") + 1)
        return y
    return fn


def c_tabla_pes(base, con_remanente=False):
    def fn(p, y):
        if con_remanente:
            cols = [("Lote", 0.02, "l"), ("Sup. m²", 0.235, "r"), ("PES m²", 0.43, "r"),
                    ("% afect.", 0.62, "r"), ("Rem. m²", 0.82, "r"), ("Clase", 0.99, "r")]
        else:
            cols = [("Lote", 0.02, "l"), ("Sup. m²", 0.30, "r"), ("PES m²", 0.55, "r"),
                    ("% afect.", 0.78, "r"), ("Clase V5", 0.99, "r")]
        y = p.row(y, cols, bold=True)
        for n, (s, pes, pct) in sorted(PES.items(), key=lambda kv2: -kv2[1][2]):
            cl = base[(RECL, n)]["clase"]
            f = f"{pct:.1f}".replace(".", ",") + " %"
            if con_remanente:
                cells = [(str(n), 0.02, "l"), (f"{s:,}".replace(",", "."), 0.235, "r"),
                         (f"{pes:,}".replace(",", "."), 0.43, "r"), (f, 0.62, "r"),
                         (f"{s - pes:,}".replace(",", "."), 0.82, "r"), (cl, 0.99, "r")]
            else:
                cells = [(str(n), 0.02, "l"), (f"{s:,}".replace(",", "."), 0.30, "r"),
                         (f"{pes:,}".replace(",", "."), 0.55, "r"), (f, 0.78, "r"),
                         (cl, 0.99, "r")]
            y = p.row(y, cells, bold=n in (61, 60, 57, 56, 55))
        y = p.rule(y)
        if con_remanente:
            tot = [("TOTAL 14 lotes", 0.02, "l"), ("76.700", 0.235, "r"), ("35.777", 0.43, "r"),
                   ("46,6 %", 0.62, "r"), ("40.923", 0.82, "r"), ("—", 0.99, "r")]
        else:
            tot = [("TOTAL 14 lotes", 0.02, "l"), ("76.700", 0.30, "r"), ("35.777", 0.55, "r"),
                   ("46,6 %", 0.78, "r"), ("—", 0.99, "r")]
        y = p.row(y, tot, bold=True)
        y = p.para(y, "En negrita los lotes 61, 60, 57, 56 y 55: mayor porcentaje de\n"
                      "afectación física según los PES notificados.", size=4.8)
        return y
    return fn


OBS = [
    "1. La lámina integra la afectación física de los Planos Especiales de Servidumbre\n"
    "     con el análisis de exposición visual desarrollado en la Base Empírica V5.",
    "2. Para efectos de superficie jurídicamente afectada prevalecen los PES oficiales\n"
    "     notificados: 35.777 m² sobre 14 lotes (76.700 m²), equivalentes al 46,6 %.",
    "3. La clasificación V0–V4 corresponde al modelo de dominancia/exposición visual V5\n"
    "     y no constituye por sí sola un porcentaje de depreciación económica.",
    "4. La infraestructura aérea genera una zona de influencia visual que excede\n"
    "     físicamente la superficie comprendida en la servidumbre.",
    "5. La eventual depreciación comercial debe determinarse mediante evidencia de\n"
    "     mercado y análisis pericial separado, sin doble contabilización.",
]

PREVAL = ("Para efectos indemnizatorios prevalecen los Planos Especiales de Servidumbre\n"
          "notificados. La reconstrucción GIS V5 se emplea para análisis espacial y visual.\n"
          "La reconstrucción GIS identifica 13 cruces geométricos; la pretensión jurídica\n"
          "conserva los 14 lotes y 35.777 m² de los PES (el lote 62 registra 244 m² de faja,\n"
          "bajo la tolerancia de la reconstrucción). Diferencia informada expresamente.")

CTX = ("Se ha identificado la existencia de oposición local organizada respecto de\n"
       "infraestructura de transmisión en el sector. Este antecedente se incorpora sólo\n"
       "como contexto territorial y no constituye por sí mismo prueba de depreciación\n"
       "económica; no se le asigna valor monetario.")


def panel_p01(p, base, cnt, esc_txt):
    def resumen(p, y):
        y = p.kv(y, "Superficie 14 lotes notificados", "76.700 m²")
        y = p.kv(y, "Superficie PES notificada", "35.777 m²")
        y = p.kv(y, "Afectación directa", "46,6 %", bold=True)
        y = p.kv(y, "Longitud aproximada afectada", "1.198,33 m")
        y = p.kv(y, "Ancho medio faja PES", "aprox. 29,86 m")
        y = p.kv(y, "N° de lotes notificados", "14")
        return p.kv(y, "Tensión", "220 kV")

    def control(p, y):
        y = p.kv(y, "Planos / roles analizados", "9")
        y = p.kv(y, "Lotes analizados", "754")
        y = p.kv(y, "Superficie total analizada", "433,7 ha")
        y = p.kv(y, "Estructuras georreferenciadas", "59")
        y = p.kv(y, "V0 / V1 / V2 / V3 / V4",
                 f"{cnt['V0']} / {cnt['V1']} / {cnt['V2']} / {cnt['V3']} / {cnt['V4']}")
        return p.kv(y, "Suma de clases (control)", f"{sum(cnt.values())} = 754 OK", bold=True)

    def obs(p, y):
        for t in OBS:
            y = p.para(y, t)
        return y

    p.box("CUADRO RESUMEN – AFECTACIÓN DIRECTA (PES OFICIAL)", resumen)
    p.box("LOTES NOTIFICADOS – SUPERFICIE / PES / % AFECTACIÓN", c_tabla_pes(base))
    p.box("CONTROL DEL UNIVERSO VISUAL V5", control)
    p.box("SIMBOLOGÍA", c_simbologia)
    p.box("OBSERVACIONES TÉCNICAS", obs)
    p.box("NOTA DE PREVALENCIA Y TRAZABILIDAD", lambda p, y: p.para(y, PREVAL))
    p.box("CONTEXTO TERRITORIAL (NOTA SECUNDARIA)", lambda p, y: p.para(y, CTX))
    p.box("CARTUCHO TÉCNICO", c_cartucho("P01", esc_txt))
    return 1.0 - p.y


def panel_p02(p, base, esc_txt):
    def sup(p, y):
        y = p.kv(y, "Superficie notificada total", "76.700 m²")
        y = p.kv(y, "Superficie gravada por PES", "35.777 m²")
        return p.kv(y, "Superficie remanente libre", "40.923 m²", bold=True)

    nota = ("El hachurado representa la afectación física (faja PES). El color de fondo del\n"
            "polígono representa la clase de exposición visual V5 (V0–V4). Ambos conceptos\n"
            "son independientes y no deben sumarse ni contabilizarse dos veces. Los\n"
            "porcentajes rotulados corresponden a los PES oficiales notificados y no a la\n"
            "reconstrucción GIS del V5.")

    p.box("CUADRO DE LOS 14 LOTES NOTIFICADOS", c_tabla_pes(base, con_remanente=True))
    p.box("SUPERFICIE REMANENTE Y LIBRE", sup)
    p.box("SIMBOLOGÍA", c_simbologia)
    p.box("NOTA METODOLÓGICA", lambda p, y: p.para(y, nota))
    p.box("CARTUCHO TÉCNICO", c_cartucho("P02", esc_txt))
    return 1.0 - p.y


def render_panel(fig, fn):
    """Dos pasadas: mide con sc=1 en un eje descartable y dibuja ajustado."""
    tmp = fig.add_axes([0.663, 0.045, 0.305, 0.855])
    tmp.axis("off")
    total = fn(Panel(tmp, 1.0, draw=False))
    fig.delaxes(tmp)
    sc = min(1.0, 0.995 / total)
    ax = fig.add_axes([0.663, 0.045, 0.305, 0.855])
    ax.axis("off")
    fn(Panel(ax, sc, draw=True))
    return sc


# ------------------------------------------------------------------ láminas --
MAP_BOX = [0.032, 0.045, 0.615, 0.855]


def _bbox(geom, factor):
    fx0, fy0, fx1, fy1 = geom.bounds
    cx, cy = (fx0 + fx1) / 2, (fy0 + fy1) / 2
    w = max((fx1 - fx0) / (MAP_BOX[2] * 16.54 / (MAP_BOX[3] * 11.69)), fy1 - fy0) * factor
    ratio = MAP_BOX[2] * 16.54 / (MAP_BOX[3] * 11.69)
    return (cx - w * ratio / 2, cy - w / 2, cx + w * ratio / 2, cy + w / 2)


def _decorar(ax, bbox, ang=0.0, ejes=True):
    ancho_m = bbox[2] - bbox[0]
    esc = escala_real(MAP_BOX[2] * 16.54, ancho_m)
    barra_escala(ax, bbox[0] + ancho_m * 0.045, bbox[1] + ancho_m * 0.05, ancho_m)
    norte(ax, bbox[2] - ancho_m * 0.06, bbox[1] + ancho_m * 0.045, ancho_m * 0.055, ang)
    if ejes:
        ax.set_xlabel("Este UTM 19S (m) – EPSG:32719", fontsize=5.8)
        ax.set_ylabel("Norte UTM 19S (m) – EPSG:32719", fontsize=5.8)
    return f"1:{round(esc / 100) * 100:,}".replace(",", ".") + " (A3)"


def lamina_p01(lotes, base, faja, torres, caminos, cnt):
    fig = plt.figure(figsize=(16.54, 11.69))
    marco(fig, "PLANO PERICIAL DE AFECTACIÓN DIRECTA Y VISUAL",
          "Proyecto Valle Escondido / Fundo Hualañé  ·  Línea Eléctrica 1x220 kV Caone–Mataquito\n"
          "Hualañé – Región del Maule  ·  Folio " + FOLIO + "-P01")
    ax = fig.add_axes(MAP_BOX)
    universo = unary_union([l["poly"] for l in lotes])
    bbox = _bbox(universo, 1.10)
    win = Polygon([(bbox[0], bbox[1]), (bbox[2], bbox[1]), (bbox[2], bbox[3]), (bbox[0], bbox[3])])
    dibujar_mapa(ax, lotes, base, faja.intersection(win), torres,
                 [c.intersection(win) for c in caminos if c.intersects(win)], bbox,
                 etiquetas={(RECL, n) for n in PES})
    esc_txt = _decorar(ax, bbox)
    render_panel(fig, lambda p: panel_p01(p, base, cnt, esc_txt))
    fig.savefig(f"{OUT}/Lamina_Pericial_P01_Valle_Escondido_LT220_Caone.pdf")
    fig.savefig("/tmp/qa/P01.png", dpi=300)
    plt.close(fig)
    return esc_txt


def lamina_p02(lotes, base, faja, torres, caminos):
    fig = plt.figure(figsize=(16.54, 11.69))
    marco(fig, "P-02 · DETALLE DE LOS 14 LOTES DIRECTAMENTE AFECTADOS",
          "Proyecto Valle Escondido / Fundo Hualañé  ·  Línea Eléctrica 1x220 kV Caone–Mataquito\n"
          "Hualañé – Región del Maule  ·  Folio " + FOLIO + "-P02")
    sel = [l for l in lotes if l["rol"] == RECL and l["n"] in PES]
    u0 = unary_union([l["poly"] for l in sel])
    ang, orig = 90.0, u0.centroid

    def R(g):
        return shrotate(g, -ang, origin=orig)

    selr = [dict(l, poly=R(l["poly"])) for l in sel]
    torresr = [(pt.x, pt.y) for pt in (R(Point(t)) for t in torres)]

    def vista(rect, lotes_v, factor, etiquetas, titulo):
        ax = fig.add_axes(rect)
        u = unary_union([l["poly"] for l in lotes_v])
        fx0, fy0, fx1, fy1 = u.bounds
        cx, cy = (fx0 + fx1) / 2, (fy0 + fy1) / 2
        ratio = rect[2] * 16.54 / (rect[3] * 11.69)
        h = max((fx1 - fx0) / ratio, fy1 - fy0) * factor
        bbox = (cx - h * ratio / 2, cy - h / 2, cx + h * ratio / 2, cy + h / 2)
        win = Polygon([(bbox[0], bbox[1]), (bbox[2], bbox[1]),
                       (bbox[2], bbox[3]), (bbox[0], bbox[3])])
        cam = [g for g in (R(c).intersection(win) for c in caminos) if not g.is_empty]
        dibujar_mapa(ax, selr, base, R(faja).intersection(win), torresr, cam, bbox,
                     etiquetas=etiquetas, label_pct=True, grid=False)
        ax.set_xticks([])
        ax.set_yticks([])
        ancho_m = bbox[2] - bbox[0]
        esc = escala_real(rect[2] * 16.54, ancho_m)
        barra_escala(ax, bbox[0] + ancho_m * 0.035, bbox[1] + ancho_m * 0.055, ancho_m)
        norte(ax, bbox[2] - ancho_m * 0.055, bbox[1] + ancho_m * 0.05, ancho_m * 0.05, ang)
        ax.text(0.004, 1.012, titulo, transform=ax.transAxes, fontsize=7.0,
                fontweight="bold", va="bottom")
        ax.text(0.996, 1.012, f"Escala aprox. 1:{round(esc / 100) * 100:,}".replace(",", "."),
                transform=ax.transAxes, fontsize=6.0, va="bottom", ha="right")
        return f"1:{round(esc / 100) * 100:,}".replace(",", ".") + " (A3)"

    esc_txt = vista([0.032, 0.610, 0.615, 0.265], selr, 1.10,
                    {(RECL, n) for n in PES},
                    "VISTA GENERAL · 14 LOTES NOTIFICADOS Y FAJA PES")
    gA = {(RECL, n) for n in (61, 60, 62)}
    gB = {(RECL, n) for n in (57, 56, 55)}
    vista([0.032, 0.345, 0.615, 0.215],
          [l for l in selr if (l["rol"], l["n"]) in gA], 1.14, gA,
          "DETALLE A · LOTES 61, 60 Y 62")
    vista([0.032, 0.100, 0.615, 0.215],
          [l for l in selr if (l["rol"], l["n"]) in gB], 1.14, gB,
          "DETALLE B · LOTES 57, 56 Y 55")
    fig.text(0.032 + 0.615 / 2, 0.068,
             "Láminas giradas 90° respecto del norte geográfico para ajustar la faja al formato de hoja. "
             "Sistema UTM 19S – EPSG:32719; grilla de coordenadas omitida por la rotación "
             "(coordenadas de centroide de cada lote en la tabla de respaldo).",
             ha="center", va="top", fontsize=5.6, color="#222222")
    render_panel(fig, lambda p: panel_p02(p, base, esc_txt))
    fig.savefig(f"{OUT}/Lamina_Pericial_P02_14_Lotes_Afectados_LT220_Caone.pdf")
    fig.savefig("/tmp/qa/P02.png", dpi=300)
    plt.close(fig)


def exportar_tablas(lotes, base, faja):
    hdr = ["Rol", "Lote", "Superficie GIS m2", "Superficie PES oficial m2",
           "% afectacion PES", "IDV", "Clase V", "Dist. min. faja (m)",
           "Dist. min. estructura (m)", "Cruzado por faja (GIS)",
           "Sup. faja en lote GIS (m2)", "Centroide X UTM19S", "Centroide Y UTM19S",
           "Lote notificado PES"]
    rows = []
    for l in sorted(lotes, key=lambda l: (l["rol"], l["n"])):
        b = base[(l["rol"], l["n"])]
        notif = l["rol"] == RECL and l["n"] in PES
        rows.append([l["rol"], l["n"], l["area"],
                     PES[l["n"]][1] if notif else "",
                     PES[l["n"]][2] if notif else "",
                     b["idv"], b["clase"], b["d_faja"], b["d_torre"],
                     "Si" if l["cruzada"] else "No", l["area_faja"], b["x"], b["y"],
                     "Si" if notif else "No"])
    wb = Workbook()
    ws = wb.active
    ws.title = "LOTES_REPRESENTADOS"
    ws.append(hdr)
    for r in rows:
        ws.append(r)
    for i, w in enumerate([13, 7, 16, 22, 16, 9, 9, 17, 21, 19, 22, 18, 18, 18], 1):
        ws.column_dimensions[chr(64 + i) if i <= 26 else "A"].width = w
    ws.freeze_panes = "A2"
    wb.save(f"{OUT}/Lamina_Pericial_V5_Lotes_Representados.xlsx")
    with open(f"{OUT}/Lamina_Pericial_V5_Lotes_Representados.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(hdr)
        w.writerows(rows)

    T4326 = Transformer.from_crs("EPSG:32719", "EPSG:4326", always_xy=True)
    feats = []
    for l in lotes:
        b = base[(l["rol"], l["n"])]
        notif = l["rol"] == RECL and l["n"] in PES
        feats.append({"type": "Feature", "geometry": mapping(l["poly"]), "properties": {
            "rol": l["rol"], "lote": l["n"], "area_gis_m2": l["area"], "idv": b["idv"],
            "clase_v": b["clase"], "cruzado_faja": bool(l["cruzada"]),
            "sup_faja_gis_m2": l["area_faja"],
            "pes_oficial_m2": PES[l["n"]][1] if notif else None,
            "pct_pes": PES[l["n"]][2] if notif else None}})
    feats.append({"type": "Feature", "geometry": mapping(faja),
                  "properties": {"capa": "Faja de servidumbre PES (reconstrucción GIS V5)"}})
    gj = {"type": "FeatureCollection",
          "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::32719"}},
          "features": feats}
    json.dump(gj, open(f"{OUT}/Lamina_Pericial_V5_Poligonos_EPSG32719.geojson", "w"))
    return len(rows)


def main():
    os.makedirs("/tmp/qa", exist_ok=True)
    lotes, faja, torres = load_geo()
    base = load_base()
    caminos = load_caminos()
    errs, cnt = validar(lotes, base, torres)
    if errs:
        print("VALIDACIÓN FALLIDA — EXPORTACIÓN DETENIDA:")
        for e in errs:
            print("  -", e)
        raise SystemExit(1)
    print("Validaciones 1-11: OK  ·", cnt, "· torres", len(torres), "· caminos", len(caminos))
    esc = lamina_p01(lotes, base, faja, torres, caminos, cnt)
    lamina_p02(lotes, base, faja, torres, caminos)
    n = exportar_tablas(lotes, base, faja)
    print("Láminas generadas. Escala P-01", esc, "· filas tabla", n)


if __name__ == "__main__":
    main()
