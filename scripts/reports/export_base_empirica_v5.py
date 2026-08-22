"""Exportación de la base empírica del Informe Consolidado OT-PER-2026-0087-V5.

Una fila por cada uno de los 754 lotes analizados, con los IDV y clases
exactamente como se usaron en el V5 (sin recalibrar) + hoja RESUMEN_VALIDACION.

Entrada: /tmp/anexo4b/work/parcelas_v4b.json + scored_v4b.json
Salida:  /mnt/documents/Base_Empirica_V5_LT220_Caone_Mataquito.xlsx
"""
import json
import statistics as st
from collections import Counter, defaultdict

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from shapely import wkt as shwkt

WORK = "/tmp/anexo4b/work"
OUT = "/mnt/documents/Base_Empirica_V5_LT220_Caone_Mataquito.xlsx"
RECL = "Rol 168-915"
CLASES = ["V0", "V1", "V2", "V3", "V4"]

PLANOS = {
    "Rol 168-915": "168-915 lám. 3 (reclamante)",
    "Rol 168-916": "00005617-168-916",
    "Rol 168-917": "00005595-168-917",
    "Rol 168-918": "00005596-168-918",
    "Rol 168-922": "00005600-168-922",
    "Rol 168-223": "168-223 rev. 2",
    "Rol 168-224": "168-224 rev. 2",
    "Rol 168-225": "168-225 rev. 2",
    "Rol 163-211": "163-211 lám. 1 rev. 2",
}

HDR = PatternFill("solid", start_color="0F3D2E")
HDR_F = Font(name="Arial", size=10, bold=True, color="FFFFFF")
BASE_F = Font(name="Arial", size=10)
BOLD = Font(name="Arial", size=10, bold=True)
YELLOW = PatternFill("solid", start_color="FFF3B0")

COLS = [
    ("Rol", 14), ("N° lote", 9), ("Superficie m2", 14),
    ("Centroide X (UTM 19S)", 20), ("Centroide Y (UTM 19S)", 20),
    ("Dist. min. faja (m)", 18), ("Dist. min. estructura (m)", 22),
    ("Dist. min. conductor (m)", 22), ("Torres visibles (n)", 18),
    ("Long. conductor visible (m)", 24), ("IDV exacto", 12), ("Clase visual", 13),
    ("Modelo A - IDV", 15), ("Modelo B - IDV", 15),
    ("Clasificacion pericial ponderada", 30),
    ("Cruzado por faja", 17), ("Sup. faja en lote (m2)", 21),
    ("Predio del reclamante", 21), ("Observaciones GIS", 62),
]

PONDERADA = {
    "V0": "Sin incidencia visual",
    "V1": "Incidencia visual leve",
    "V2": "Incidencia visual moderada",
    "V3": "Incidencia visual alta",
    "V4": "Incidencia visual severa / dominancia",
}


def base_point(pts):
    """Punto de observación gobernante del Modelo A (mismo criterio que el V5)."""
    return max((pts[k] for k in ("P2", "P4", "P3")),
               key=lambda r: (r["n_vis"], -(r["dmin"] or 1e9)))


def observaciones(r, cen_ok):
    o = []
    if r["cruzada"]:
        o.append(f"Faja de servidumbre atraviesa el lote ({round(r['pct_faja'], 2)}% de la superficie)")
    elif r["d_faja"] <= 50:
        o.append("Lote adyacente a la faja (<=50 m)")
    if r["d_torre"] <= 100:
        o.append(f"Estructura a {r['d_torre']} m del deslinde")
    if r["sup_kmz"]:
        dif = (r["area_gis"] / 1e4 - r["sup_kmz"]) / r["sup_kmz"] * 100
        o.append(f"Sup. rotulada en plano {r['sup_kmz']} ha; delta GIS {dif:+.1f}%")
    else:
        o.append("Plano sin rótulo de superficie; superficie de polígono reconstruido")
    if not cen_ok:
        o.append("Centroide fuera del polígono (forma irregular); se usa punto representativo")
    if r["rol"] == RECL and r["cruzada"]:
        o.append("Excluido del cálculo visual del V5 (regla de no duplicación; indemnizado en V4)")
    return ". ".join(o) + "."


def main():
    geo = json.load(open(f"{WORK}/parcelas_v4b.json"))
    sc = json.load(open(f"{WORK}/scored_v4b.json"))

    polys = {}
    for rol, arr in geo["predios"].items():
        for r in arr:
            polys[(rol, r["n"])] = shwkt.loads(r["wkt"])

    lots = sorted(sc["lotes"], key=lambda x: (x["rol"], x["n"]))

    wb = Workbook()
    ws = wb.active
    ws.title = "BASE_EMPIRICA_754"

    for i, (name, w) in enumerate(COLS, 1):
        c = ws.cell(1, i, name)
        c.font = HDR_F
        c.fill = HDR
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[1].height = 34
    ws.freeze_panes = "C2"

    for r in lots:
        poly = polys[(r["rol"], r["n"])]
        cen = poly.centroid
        bp = base_point(r["pts"])
        cen_ok = poly.contains(cen)
        ws.append([
            r["rol"], r["n"], r["area_gis"],
            round(cen.x, 2), round(cen.y, 2),
            0.0 if r["cruzada"] else r["d_faja"],
            r["d_torre"], r["d_trace"],
            bp["n_vis"], bp["len_cond"] if bp["n_vis"] else 0,
            r["idv"], r["clase"], r["idvA"], r["idvB"], PONDERADA[r["clase"]],
            "Sí" if r["cruzada"] else "No", r["area_faja"],
            "Sí" if r["rol"] == RECL else "No",
            observaciones(r, cen_ok),
        ])

    last = ws.max_row
    for row in ws.iter_rows(min_row=2, max_row=last):
        for c in row:
            c.font = BASE_F
        row[2].number_format = "#,##0"
        row[3].number_format = "#,##0.00"
        row[4].number_format = "#,##0.00"
        for i in (5, 6, 7, 9):
            row[i].number_format = "#,##0.0"
        for i in (10, 12, 13):
            row[i].number_format = "0.000"
        row[16].number_format = "#,##0"
        row[18].alignment = Alignment(wrap_text=True, vertical="top")
        row[11].alignment = Alignment(horizontal="center")
        row[15].alignment = Alignment(horizontal="center")
        row[17].alignment = Alignment(horizontal="center")

    ws.auto_filter.ref = f"A1:{get_column_letter(len(COLS))}{last}"

    # ------------------------------------------------------ RESUMEN
    rs = wb.create_sheet("RESUMEN_VALIDACION")
    roles = sorted({x["rol"] for x in lots})
    hdr = ["Rol", "Plano", "Lotes", "Superficie m2", "V0", "V1", "V2", "V3", "V4",
           "IDV promedio", "IDV mediana", "Lotes cruzados por faja", "Sup. faja m2",
           "Predio reclamante"]
    widths = [14, 26, 9, 15, 7, 7, 7, 7, 7, 14, 14, 22, 15, 17]
    rs.append(hdr)
    for i, w in enumerate(widths, 1):
        c = rs.cell(1, i)
        c.font = HDR_F
        c.fill = HDR
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        rs.column_dimensions[get_column_letter(i)].width = w
    rs.row_dimensions[1].height = 30

    by = defaultdict(list)
    for x in lots:
        by[x["rol"]].append(x)

    for rol in roles:
        g = by[rol]
        cnt = Counter(x["clase"] for x in g)
        rs.append([
            rol, PLANOS[rol], len(g), sum(x["area_gis"] for x in g),
            *[cnt.get(c, 0) for c in CLASES],
            round(st.mean(x["idv"] for x in g), 3),
            round(st.median(x["idv"] for x in g), 3),
            sum(1 for x in g if x["cruzada"]),
            sum(x["area_faja"] for x in g),
            "Sí" if rol == RECL else "No",
        ])
    n0 = 2
    n1 = rs.max_row
    rs.append([
        "TOTAL", "", f"=SUM(C{n0}:C{n1})", f"=SUM(D{n0}:D{n1})",
        *[f"=SUM({get_column_letter(5 + i)}{n0}:{get_column_letter(5 + i)}{n1})"
          for i in range(5)],
        f"=ROUND(SUMPRODUCT(C{n0}:C{n1},J{n0}:J{n1})/SUM(C{n0}:C{n1}),3)", "",
        f"=SUM(L{n0}:L{n1})", f"=SUM(M{n0}:M{n1})", "",
    ])
    tot = rs.max_row
    for c in rs[tot]:
        c.font = BOLD
    for row in rs.iter_rows(min_row=2, max_row=tot):
        for c in row:
            if c.font.b is not True:
                c.font = BASE_F
        row[3].number_format = "#,##0"
        row[12].number_format = "#,##0"
        row[2].number_format = "#,##0"

    # validación contra el Informe V5
    cntT = Counter(x["clase"] for x in lots)
    rs.append([])
    v = rs.max_row + 1
    rs.cell(v, 1, "VALIDACIÓN CONTRA EL INFORME CONSOLIDADO V5").font = BOLD
    checks = [
        ("Lotes analizados", len(lots), 754),
        ("Predios (roles)", len(roles), 9),
        ("Superficie total (ha)", round(sum(x["area_gis"] for x in lots) / 1e4, 1), 433.7),
        ("Lotes cruzados por faja", sum(1 for x in lots if x["cruzada"]), 15),
        ("Lotes cruzados · Rol 168-915", sum(1 for x in lots if x["cruzada"] and x["rol"] == RECL), 13),
        ("Clase V0", cntT.get("V0", 0), None),
        ("Clase V1", cntT.get("V1", 0), None),
        ("Clase V2", cntT.get("V2", 0), None),
        ("Clase V3", cntT.get("V3", 0), None),
        ("Clase V4", cntT.get("V4", 0), None),
        ("IDV promedio general", round(st.mean(x["idv"] for x in lots), 3), None),
    ]
    rs.append(["Concepto", "Valor exportado", "Valor Informe V5", "Estado"])
    for c in rs[rs.max_row][:4]:
        c.font = HDR_F
        c.fill = HDR
    for name, val, ref in checks:
        rs.append([name, val, ref if ref is not None else "s/ referencia numérica",
                   "OK" if (ref is None or val == ref) else "REVISAR"])
        row = rs[rs.max_row]
        for c in row:
            c.font = BASE_F
        if row[3].value == "REVISAR":
            row[3].fill = YELLOW

    rs.append([])
    rs.append(["Nota: los IDV y clases corresponden exactamente a los calculados para el "
               "Informe OT-PER-2026-0087-V5; este archivo no recalcula la tasación."])
    rs[rs.max_row][0].font = Font(name="Arial", size=9, italic=True)

    wb.save(OUT)
    print("lotes:", len(lots), "| clases:", dict(cntT))
    print("guardado:", OUT)


if __name__ == "__main__":
    main()
