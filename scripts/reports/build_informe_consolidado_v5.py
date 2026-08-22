"""Informe Consolidado V5 — LT 1x220 kV Caone–Mataquito.

Integra en un solo documento:
  · V4   — daño directo por faja, estructuras y caminos sobre el predio del reclamante (Rol 168-915).
  · V4-A — impacto visual y depreciación comercial del predio del reclamante.
  · V4-B — afectación material y visual de los ocho predios vecinos.
Incorpora el plano 168-915 (79 lotes, 13 lotes cruzados por la faja) omitido en el anexo V4-B.

Entrada: /tmp/anexo4b/work/scored_v4b.json + figuras
Salida:  /mnt/documents/Informe_Consolidado_V5_LT220_Caone_Mataquito.pdf
"""
import json
import statistics as st
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import build_peritaje_caone_v4 as V4  # noqa: E402
from ot_report_shell import DocMeta, Report, clp, num  # noqa: E402

WORK = "/tmp/anexo4b/work"
OUT = "/mnt/documents/Informe_Consolidado_V5_LT220_Caone_Mataquito.pdf"

RECL = "Rol 168-915"          # predio del reclamante
VU = 2850                     # $/m² de referencia sectorial (informe V4)
NEG, COST = 0.12, 0.10
F_NETO = (1 - NEG) * (1 - COST)
K_FAJA = 0.70

DEP_LOW = {"V0": 0, "V1": 0, "V2": 0.005, "V3": 0.015, "V4": 0.035}
DEP_CEN = {"V0": 0, "V1": 0.005, "V2": 0.015, "V3": 0.035, "V4": 0.070}
DEP_HI = {"V0": 0, "V1": 0.015, "V2": 0.045, "V3": 0.085, "V4": 0.145}

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


def valor(lo):
    return lo["area_gis"] * VU * F_NETO


def dep(L, tabla):
    return sum(valor(x) * tabla[x["clase"]] for x in L)


def build() -> str:
    d = json.load(open(f"{WORK}/scored_v4b.json"))
    L = sorted(d["lotes"], key=lambda x: (x["rol"], x["n"]))
    M = d["meta"]
    roles = sorted({x["rol"] for x in L})

    RE = [x for x in L if x["rol"] == RECL]                 # predio reclamante
    VE = [x for x in L if x["rol"] != RECL]                 # predios vecinos
    re_cruz = [x for x in RE if x["cruzada"]]
    ve_cruz = [x for x in VE if x["cruzada"]]
    # los lotes cruzados del reclamante ya están indemnizados en el V4: no se duplica su daño visual
    re_vis = [x for x in RE if not x["cruzada"]]

    cnt = Counter(x["clase"] for x in L)
    sup_tot = sum(x["area_gis"] for x in L)

    faja_ve = sum(x["area_faja"] for x in ve_cruz)
    dano_faja_ve = faja_ve * VU * F_NETO * K_FAJA

    re_A, re_B, re_C = dep(re_vis, DEP_LOW), dep(re_vis, DEP_CEN), dep(re_vis, DEP_HI)
    ve_A, ve_B, ve_C = dep(VE, DEP_LOW), dep(VE, DEP_CEN), dep(VE, DEP_HI)

    total_recl = V4.E2 + re_B
    total_ve = dano_faja_ve + ve_B

    meta = DocMeta(
        doc_type="Informe pericial consolidado · Versión 5",
        title="LT 1x220 kV Caone–Mataquito: afectación consolidada",
        subtitle="Proyecto de parcelación rural y predios colindantes · Hualañé, Región del Maule",
        folio="OT-PER-2026-0087-V5",
        date="22 de agosto de 2026",
        prepared_for="Propiedad afectada · Comisión Tasadora",
        author="Oferta Terrenos · Valuation",
        qr_url="https://ofertaterrenos.com/tasacion/validar",
        footer_note="Consolida los informes V4, V4-A y V4-B. Prevalece sobre las cifras parciales de cada anexo.",
    )
    r = Report(meta)
    r.cover(
        summary=(
            "Documento único que reúne el daño directo por faja de servidumbre, estructuras y caminos sobre el "
            "predio del reclamante (rol 168-915), su depreciación por impacto visual y la afectación material y "
            "visual de los ocho predios colindantes incorporados al expediente. Respecto del anexo V4-B, esta "
            "versión incorpora el plano 168-915 —omitido en aquel— con sus 79 lotes y los 13 lotes atravesados "
            f"directamente por la faja, elevando el universo analizado a {num(len(L))} lotes en "
            f"{len(roles)} predios."
        ),
        highlights=[
            ("Lotes analizados", num(len(L))),
            ("Superficie total", f"{num(sup_tot / 1e4, 1)} ha"),
            ("Daño consolidado central", clp(round(total_recl + total_ve))),
        ],
    )

    # ------------------------------------------------------------------ 01
    r.section("Objeto del informe consolidado", kicker="Sección 01")
    r.p(
        "El expediente se construyó por etapas: el informe V4 determinó el daño directo sobre la parcelación "
        "del reclamante, el anexo V4-A cuantificó su depreciación por impacto visual y el anexo V4-B extendió "
        "el análisis a los predios vecinos. Este consolidado integra las tres piezas en un solo cuerpo de "
        "resultados, corrige la omisión del plano del propio reclamante en el universo geométrico del anexo "
        "V4-B y expone el total sin duplicar partidas."
    )
    r.bullets([
        "Incorporación del plano 168-915 al universo GIS: 79 lotes, 13 de ellos cruzados por la faja.",
        "Reconciliación del daño directo del V4 con la geometría reconstruida desde el plano.",
        "Depreciación visual del predio del reclamante calculada sólo sobre lotes no cruzados, para no "
        "duplicar el daño ya reconocido en el V4.",
        "Afectación material y visual de los ocho predios colindantes, con valor unitario sectorial.",
    ])
    r.callout(
        "Regla de no duplicación",
        "Los lotes atravesados por la faja del predio del reclamante ya fueron indemnizados en el informe V4 "
        "por pérdida de suelo, ocupación de estructuras y depreciación del remanente. En este consolidado esos "
        "lotes quedan excluidos del cálculo de depreciación visual, que se aplica únicamente a los lotes no "
        "cruzados del mismo predio.",
        kind="brand",
    )

    # ------------------------------------------------------------------ 02
    r.section("Universo consolidado de análisis", kicker="Sección 02")
    rows = []
    for rol in roles:
        g = [x for x in L if x["rol"] == rol]
        rows.append([rol + (" *" if rol == RECL else ""), PLANOS[rol], num(len(g)),
                     f"{num(sum(x['area_gis'] for x in g) / 1e4, 1)} ha",
                     num(len([x for x in g if x["cruzada"]])),
                     f"{num(min(x['d_faja'] for x in g))} m"])
    rows.append(["TOTAL", f"{len(roles)} planos", num(len(L)), f"{num(sup_tot / 1e4, 1)} ha",
                 num(len(re_cruz) + len(ve_cruz)), "0 m"])
    r.table(["Rol", "Plano de origen (KMZ)", "Lotes", "Superficie", "Cruzados", "Dist. mín."],
            rows, widths=[62, 130, 46, 72, 60, 62], align=["l", "l", "r", "r", "r", "r"])
    r.p(
        "(*) Predio del reclamante. Todos los planos se entregaron como exportaciones CAD a KMZ; la "
        "reconstrucción cerró la red de segmentos con tolerancia de 0,50 m en UTM 19S y validó cada cara "
        "contra la etiqueta y la superficie rotulada del propio plano."
    )
    r.keyvalues([
        ("Sistema de trabajo", "UTM Huso 19 Sur · EPSG:32719"),
        ("Predios analizados", f"{len(roles)} (1 del reclamante + 8 colindantes)"),
        ("Lotes reconstruidos", num(len(L))),
        ("Estructuras georreferenciadas", num(M["n_torres"])),
        ("Resolución del modelo de elevación", f"{num(M['dem_res'], 2)} m/px"),
        ("Fuente del corredor", "KMZ Sol de Caone Rev 0-4"),
    ])

    # ------------------------------------------------------------------ 03
    r.section("Afectación material directa por faja de servidumbre", kicker="Sección 03")
    r.p(
        f"En el universo consolidado, {len(re_cruz) + len(ve_cruz)} lotes quedan parcialmente comprendidos "
        f"dentro de la faja: {len(re_cruz)} en el predio del reclamante (rol 168-915) y {len(ve_cruz)} en el "
        "rol 168-916. Ningún otro predio del conjunto es atravesado por el corredor."
    )
    r.table(
        ["Rol", "Lote", "Superficie lote", "Superficie en faja", "% del lote", "Clase visual"],
        [[x["rol"], str(x["n"]), f"{num(x['area_gis'])} m²", f"{num(x['area_faja'])} m²",
          f"{num(x['pct_faja'], 1)} %", x["clase"]]
         for x in sorted(re_cruz + ve_cruz, key=lambda y: -y["area_faja"])],
        widths=[70, 42, 90, 96, 66, 68], align=["l", "r", "r", "r", "r", "l"])
    r.kpis([
        ("Lotes cruzados · reclamante", str(len(re_cruz)),
         f"{num(sum(x['area_faja'] for x in re_cruz))} m² en faja"),
        ("Lotes cruzados · vecinos", str(len(ve_cruz)), f"{num(faja_ve)} m² en faja"),
        ("Superficie total en faja", f"{num(sum(x['area_faja'] for x in re_cruz) + faja_ve)} m²",
         "Restricción de uso permanente"),
    ])
    r.callout(
        "Correspondencia con el informe V4",
        f"El V4 cuantificó {num(V4.FAJA_PES)} m² de faja sobre 14 lotes del reclamante a partir del plano de "
        f"servidumbre. La reconstrucción GIS del plano 168-915 identifica {len(re_cruz)} lotes con superficie "
        "intersectada; la diferencia corresponde a un lote de borde cuya intersección es marginal en la "
        "geometría reconstruida. Prevalece, para efectos indemnizatorios, la superficie del plano de "
        "servidumbre utilizada en el V4.",
        kind="warn",
    )

    # ------------------------------------------------------------------ 04
    r.section("Daño directo sobre el predio del reclamante (V4)", kicker="Sección 04")
    r.table(
        ["Partida", "Base", "Monto"],
        [["Suelo bajo faja, neto de plataformas", f"{num(V4.faja_neta)} m²", clp(round(V4.e1_faja))],
         ["Ocupación permanente de estructuras", f"{num(round(V4.TORRE_PERM))} m²", clp(round(V4.e1_torres))],
         ["Caminos de servidumbre fuera de faja", f"{num(V4.CAMINOS_FUERA)} m²", clp(round(V4.e1_caminos))],
         ["Recargo Art. 70", "20 % s/ obras", clp(round(V4.e1_art70))],
         ["Franja de tránsito Art. 69 N°3", f"{num(V4.TRANSITO_ANCHO, 1)} m x {num(V4.LARGO)} m",
          clp(round(V4.e1_transito))],
         ["Depreciación de remanentes", f"{len(V4.ORDEN)} lotes", clp(round(V4.dep_remanentes))],
         ["Ocupación temporal de plataformas", f"{num(round(V4.TORRE_TEMP))} m²", clp(round(V4.e2_ocup_temp))],
         ["Rediseño del loteo y obras temporales", "Presupuesto", clp(round(V4.e2_redisenio + V4.e2_obras_temp))]],
        widths=[210, 130, 110], align=["l", "r", "r"])
    r.kpis([
        ("Escenario legal duro", clp(round(V4.E1)), "Alta causalidad y prueba"),
        ("Escenario pericial central", clp(round(V4.E2)), "Valor de referencia del V4"),
        ("Escenario económico ampliado", clp(round(V4.E3_BASE)), "Sujeto a prueba adicional"),
    ])

    # ------------------------------------------------------------------ 05
    r.section("Metodología de dominancia visual", kicker="Sección 05")
    r.keyvalues([
        ("Altura total de estructura", f"{num(M['h_torre'], 1)} m (estimada)"),
        ("Punto de amarre del conductor", f"{num(M['h_cond'], 1)} m (estimado)"),
        ("Flecha adoptada a mitad de vano", f"{num(M['flecha'], 1)} m"),
        ("Paso de muestreo del perfil", f"{num(M['step'], 0)} m"),
        ("Radio de análisis por lote", f"{num(M['radio'] / 1000, 1)} km"),
        ("Puntos de observación por lote", "4 (acceso, centroide, cota máxima, vivienda probable)"),
        ("Modelos de superficie", "A terreno desnudo · B con pantalla vegetal de 6 m"),
        ("Ponderación de clase pericial", "60 % Modelo A · 40 % Modelo B"),
    ])
    r.p(
        "El índice de dominancia visual IDV pondera distancia al elemento visible más próximo, número de "
        "estructuras visibles, altura aparente, longitud de conductor visible, interferencia con la línea de "
        "horizonte, ángulo horizontal ocupado, visibilidad desde el acceso y desde el área probable de "
        "vivienda, y persistencia visual en el recorrido interior. Los cortes de clase son los del anexo "
        "V4-A: V1 desde 0,30; V2 desde 0,45; V3 desde 0,60 y V4 desde 0,75."
    )

    # ------------------------------------------------------------------ 06
    r.section("Resultados de clasificación consolidados", kicker="Sección 06")
    rows = []
    for rol in roles:
        g = [x for x in L if x["rol"] == rol]
        c = Counter(x["clase"] for x in g)
        rows.append([rol.replace("Rol ", ""), num(len(g))] + [num(c[k]) for k in ("V0", "V1", "V2", "V3", "V4")] +
                    [num(st.mean([x["idv"] for x in g]), 3).replace(".", ",")])
    rows.append(["TOTAL", num(len(L))] + [num(cnt[k]) for k in ("V0", "V1", "V2", "V3", "V4")] +
                [num(st.mean([x["idv"] for x in L]), 3).replace(".", ",")])
    r.table(["Rol", "Lotes", "V0", "V1", "V2", "V3", "V4", "IDV medio"], rows,
            widths=[74, 52, 44, 44, 44, 44, 44, 76], align=["l"] + ["r"] * 7)
    r.image(f"{WORK}/mapa_v4b.png", 340,
            f"Figura 1 · Clasificación de dominancia visual de los {num(len(L))} lotes de los "
            f"{len(roles)} predios respecto del corredor de 220 kV.")
    r.image(f"{WORK}/graficos_v4b.png", 180,
            "Figura 2 · Distribución del IDV, relación IDV–distancia a la faja y composición de clases por predio.")
    r.p(
        f"El {num((cnt['V3'] + cnt['V4']) / len(L) * 100, 1)} % de los lotes alcanza clases altas (V3 o V4) y "
        "se concentra en el predio del reclamante y en los bordes de los roles 168-916, 168-223 y 168-224 "
        "enfrentados al corredor. Los roles 168-918 y 168-922 presentan afectación visual marginal por "
        "interposición de relieve."
    )

    # ------------------------------------------------------------------ 07
    r.section("Depreciación visual por conjunto", kicker="Sección 07")
    r.p(
        f"La cuantificación visual adopta el valor unitario sectorial de ${num(VU)}/m² del informe V4, "
        f"corregido por un factor neto de {num(F_NETO * 100, 1)} % (descuento comercial {int(NEG * 100)} % y "
        f"costos de transacción {int(COST * 100)} %). Para el predio del reclamante se excluyen los "
        f"{len(re_cruz)} lotes cruzados, ya indemnizados en el V4."
    )
    r.table(
        ["Conjunto", "Lotes", "Valor de referencia neto", "Conservador", "Central", "Cota superior"],
        [["Reclamante", num(len(re_vis)), clp(round(sum(valor(x) for x in re_vis))),
          clp(round(re_A)), clp(round(re_B)), clp(round(re_C))],
         ["Predios vecinos", num(len(VE)), clp(round(sum(valor(x) for x in VE))),
          clp(round(ve_A)), clp(round(ve_B)), clp(round(ve_C))],
         ["TOTAL", num(len(re_vis) + len(VE)), clp(round(sum(valor(x) for x in re_vis + VE))),
          clp(round(re_A + ve_A)), clp(round(re_B + ve_B)), clp(round(re_C + ve_C))]],
        widths=[104, 36, 100, 80, 80, 82], align=["l", "r", "r", "r", "r", "r"])

    r.p(
        "El anexo V4-A determinó para el predio del reclamante una depreciación visual central de "
        "$19.562.638 sobre precios de lista reales del proyecto. La cifra de esta tabla se calcula sobre el "
        "valor unitario sectorial homogéneo, para que los nueve predios sean comparables entre sí; la "
        "diferencia se explica íntegramente por la base de valor y no por la clasificación visual. Para "
        "efectos de pretensión del reclamante prevalece la cifra del anexo V4-A."
    )

    # ------------------------------------------------------------------ 08
    r.section("Cuadro económico consolidado", kicker="Sección 08")
    r.table(
        ["Componente", "Ámbito", "Monto central"],
        [["Daño directo por faja, estructuras y caminos (V4)", "Reclamante", clp(round(V4.E1))],
         ["Depreciación de remanentes, ocupación temporal y rediseño (V4)", "Reclamante",
          clp(round(V4.E2 - V4.E1))],
         ["Depreciación por impacto visual (V4-A / V5)", "Reclamante", clp(round(re_B))],
         ["Afectación material por faja", "Rol 168-916", clp(round(dano_faja_ve))],
         ["Depreciación por impacto visual", "8 predios vecinos", clp(round(ve_B))],
         ["TOTAL CONSOLIDADO", f"{num(len(L))} lotes", clp(round(total_recl + total_ve))]],
        widths=[268, 100, 104], align=["l", "l", "r"])
    r.kpis([
        ("Reclamante · total", clp(round(total_recl)), "Daño directo + visual"),
        ("Predios vecinos · total", clp(round(total_ve)), "Referencial, no liquidación"),
        ("Consolidado central", clp(round(total_recl + total_ve)), f"{num(len(L))} lotes · {len(roles)} predios"),
    ])
    r.callout(
        "Alcance de las cifras de terceros",
        "Los montos de los predios vecinos son órdenes de magnitud bajo valor unitario sectorial: no consta "
        "en el expediente su precio de lista, estado comercial ni titularidad, y no constituyen liquidación "
        "de indemnización a favor de tercero alguno. La pretensión del reclamante se sustenta en el total de "
        f"su propio predio, {clp(round(total_recl))}, con apertura transaccional hasta "
        f"{clp(round(V4.E4_APERTURA))} según el escenario 4 del informe V4.",
        kind="warn",
    )

    # ------------------------------------------------------------------ 09
    r.section("Lotes de mayor afectación del conjunto", kicker="Sección 09")
    top = sorted(L, key=lambda x: -x["idv"])[:24]
    r.table(
        ["Rol", "Lote", "Superficie", "Dist. faja", "Dist. estructura", "IDV", "Clase"],
        [[x["rol"].replace("Rol ", ""), str(x["n"]), f"{num(x['area_gis'])} m²", f"{num(x['d_faja'])} m",
          f"{num(x['d_torre'])} m", num(x["idv"], 3).replace(".", ","), x["clase"]] for x in top],
        widths=[62, 44, 82, 74, 92, 56, 46], align=["l", "r", "r", "r", "r", "r", "l"])

    # ------------------------------------------------------------------ 10
    r.section("Limitaciones y supuestos declarados", kicker="Sección 10")
    r.bullets([
        "La geometría de los nueve predios proviene de planos CAD exportados a KMZ; no se contó con planos "
        "aprobados timbrados para los ocho roles colindantes.",
        "La superficie de faja indemnizable del reclamante es la del plano de servidumbre del informe V4; la "
        "reconstrucción GIS se emplea para clasificación y verificación, no para liquidar.",
        "La altura de estructura y el punto de amarre del conductor son estimados según la convención del V4-A.",
        "La pantalla vegetal del Modelo B se modeló con altura uniforme de 6 m, sin catastro de arbolado.",
        "No se dispone de evidencia de mercado local estadísticamente significativa para la depreciación por "
        "dominancia visual; se aplican tasas de literatura acotadas en tres escenarios.",
        "Este consolidado no determina indemnización a favor de los propietarios de los predios colindantes.",
    ])
    r.closing(
        "Emitido en consolidación de los informes OT-PER-2026-0087-V4, V4-A y V4-B, bajo los mismos "
        "principios de independencia, trazabilidad y declaración expresa de supuestos."
    )
    r.signature("Oferta Terrenos · Valuation", "Equipo pericial independiente",
                "Análisis geoespacial y valoración · Región del Maule")
    return r.save(OUT)


if __name__ == "__main__":
    print(build())
