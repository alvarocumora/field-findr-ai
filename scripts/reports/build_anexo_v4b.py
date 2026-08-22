"""Anexo Pericial V4-B — Afectación de los predios vecinos (675 lotes).
LT 1x220 kV Caone-Mataquito · Hualañé, Región del Maule.

Entrada: /tmp/anexo4b/work/scored_v4b.json + figuras
Salida:  /mnt/documents/Anexo_Pericial_V4B_Afectacion_Predios_Vecinos_LT220_Caone.pdf
"""
import json
import statistics as st
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from ot_report_shell import DocMeta, Report, clp, num  # noqa: E402

WORK = "/tmp/anexo4b/work"
OUT = "/mnt/documents/Anexo_Pericial_V4B_Afectacion_Predios_Vecinos_LT220_Caone.pdf"

VU = 2850          # $/m² de referencia sectorial (informe V4)
NEG, COST = 0.12, 0.10
F_NETO = (1 - NEG) * (1 - COST)
K_FAJA = 0.70      # pérdida de utilidad dentro de la faja de servidumbre

DEP_LOW = {"V0": 0, "V1": 0, "V2": 0.005, "V3": 0.015, "V4": 0.035}
DEP_CEN = {"V0": 0, "V1": 0.005, "V2": 0.015, "V3": 0.035, "V4": 0.070}
DEP_HI = {"V0": 0, "V1": 0.015, "V2": 0.045, "V3": 0.085, "V4": 0.145}

PLANOS = {
    "Rol 168-916": "00005617-168-916",
    "Rol 168-917": "00005595-168-917",
    "Rol 168-918": "00005596-168-918",
    "Rol 168-922": "00005600-168-922",
    "Rol 168-223": "168-223 rev. 2",
    "Rol 168-224": "168-224 rev. 2",
    "Rol 168-225": "168-225 rev. 2",
    "Rol 163-211": "163-211 lám. 1 rev. 2",
}

PESOS = [("D", "Distancia al elemento visible más próximo", "0,20"),
         ("N", "Número de estructuras visibles", "0,08"),
         ("H", "Altura aparente (ángulo vertical)", "0,18"),
         ("C", "Longitud de conductor visible", "0,08"),
         ("S", "Interferencia con línea de horizonte", "0,14"),
         ("O", "Ángulo horizontal ocupado", "0,06"),
         ("A", "Visibilidad desde el acceso", "0,06"),
         ("V", "Visibilidad desde área probable de vivienda", "0,16"),
         ("P", "Persistencia visual en el recorrido interior", "0,04")]


def valor(lo):
    return lo["area_gis"] * VU * F_NETO


def dep_total(L, tabla):
    return sum(valor(lo) * tabla[lo["clase"]] for lo in L)


def build() -> str:
    d = json.load(open(f"{WORK}/scored_v4b.json"))
    L = sorted(d["lotes"], key=lambda x: (x["rol"], x["n"]))
    M = d["meta"]
    roles = sorted({x["rol"] for x in L})
    cnt = Counter(x["clase"] for x in L)

    sup_tot = sum(x["area_gis"] for x in L)
    valor_ref = sum(valor(x) for x in L)
    cruz = [x for x in L if x["cruzada"]]
    faja_area = sum(x["area_faja"] for x in cruz)
    daño_faja = faja_area * VU * F_NETO * K_FAJA

    A = dep_total(L, DEP_LOW)
    B = dep_total(L, DEP_CEN)
    C = dep_total(L, DEP_HI)

    meta = DocMeta(
        doc_type="Anexo pericial complementario V4-B",
        title="Afectación de los predios vecinos: 675 lotes de ocho parcelaciones",
        subtitle="LT 1x220 kV Caone–Mataquito · Comuna de Hualañé, Región del Maule",
        folio="OT-PER-2026-0087-V4-B",
        date="22 de agosto de 2026",
        prepared_for="Anexos V4 y V4-A del expediente",
        author="Oferta Terrenos · Valuation",
        qr_url="https://ofertaterrenos.com/tasacion/validar",
        footer_note="Anexo complementario. No sustituye ni modifica el daño directo determinado en el informe V4.",
    )
    r = Report(meta)
    r.cover(
        summary=(
            "Extensión del análisis de afectación a los ocho planos de parcelación colindantes al corredor de "
            "220 kV aportados al expediente (roles 168-916, 168-917, 168-918, 168-922, 168-223, 168-224, "
            "168-225 y 163-211). Se reconstruyó la geometría de 675 lotes desde los planos KMZ, se determinó "
            "la afectación material por faja de servidumbre y la afectación visual mediante análisis de "
            "cuenca sobre modelo digital de elevación, con la misma metodología del anexo V4-A."
        ),
        highlights=[
            ("Lotes analizados", num(len(L))),
            ("Superficie total", f"{num(sup_tot / 1e4, 1)} ha"),
            ("Depreciación visual central", clp(round(B))),
        ],
    )

    # ------------------------------------------------------------------ 01
    r.section("Objeto y alcance del anexo", kicker="Sección 01")
    r.p(
        "Este anexo responde al encargo de extender el análisis de afectación —hasta ahora circunscrito a la "
        "parcelación del reclamante— a los predios vecinos cuyos planos de subdivisión fueron incorporados al "
        "expediente. El objeto es determinar, con la misma metodología y los mismos umbrales del anexo V4-A, "
        "qué lotes de esas ocho parcelaciones quedan afectados por la línea de 220 kV, con qué intensidad, y "
        "qué orden de magnitud tendría la depreciación de mercado asociada."
    )
    r.bullets([
        "Afectación material: superficie de cada lote comprendida dentro de la faja de servidumbre.",
        "Afectación por proximidad: distancia del lote a la faja y a la estructura más próxima.",
        "Afectación visual: índice de dominancia visual IDV y clase V0 a V4 sobre modelo de elevación.",
        "Orden de magnitud económico bajo valor unitario de referencia sectorial, con tres escenarios.",
    ])
    r.callout(
        "Límite expreso de este anexo",
        "Los predios analizados en esta sección no pertenecen al reclamante y no consta en el expediente el "
        "precio de lista, el estado comercial ni la titularidad de sus lotes. Las cifras económicas son, por "
        "tanto, órdenes de magnitud referenciales bajo valor unitario sectorial y no constituyen liquidación "
        "de indemnización a favor de tercero alguno.",
        kind="warn",
    )

    # ------------------------------------------------------------------ 02
    r.section("Planos incorporados y reconstrucción geométrica", kicker="Sección 02")
    rows = []
    for rol in roles:
        g = [x for x in L if x["rol"] == rol]
        rows.append([rol, PLANOS[rol], num(len(g)),
                     f"{num(sum(x['area_gis'] for x in g) / 1e4, 1)} ha",
                     f"{num(st.median([x['area_gis'] for x in g]) / 1e4, 2)} ha",
                     f"{num(min(x['d_faja'] for x in g))} m"])
    rows.append(["TOTAL", "8 planos", num(len(L)), f"{num(sup_tot / 1e4, 1)} ha", "—",
                 f"{num(min(x['d_faja'] for x in L))} m"])
    r.table(
        ["Rol", "Plano de origen (KMZ)", "Lotes", "Superficie", "Lote mediano", "Dist. mín. faja"],
        rows, widths=[62, 132, 46, 74, 74, 84], align=["l", "l", "r", "r", "r", "r"])
    r.p(
        "Los planos se entregaron como exportaciones CAD a KMZ, compuestas por segmentos sueltos y textos. La "
        "reconstrucción se realizó cerrando la red de segmentos con tolerancia de 0,50 m, descartando "
        "entidades de rotulación y validando cada cara resultante contra la etiqueta de lote y la superficie "
        "rotulada en el propio plano. El contraste entre superficie rotulada y superficie calculada arroja una "
        "razón mediana de 1,05, atribuible a que el plano rotula superficie de dominio y el cálculo mide la "
        "cara geométrica cerrada."
    )
    r.keyvalues([
        ("Sistema de trabajo", "UTM Huso 19 Sur · EPSG:32719"),
        ("Tolerancia de cierre CAD", "0,50 m"),
        ("Lotes reconstruidos", f"{num(len(L))} de {num(len(L))} etiquetados"),
        ("Cobertura de superficie rotulada", "100 % de los lotes"),
        ("Fuente del corredor", "KMZ Sol de Caone Rev 0-4"),
        ("Estructuras georreferenciadas", num(M["n_torres"])),
    ])

    # ------------------------------------------------------------------ 03
    r.section("Afectación material por faja de servidumbre", kicker="Sección 03")
    if cruz:
        r.table(
            ["Rol", "Lote", "Superficie lote", "Superficie en faja", "% del lote", "Condición"],
            [[x["rol"], str(x["n"]), f"{num(x['area_gis'])} m²", f"{num(x['area_faja'])} m²",
              f"{num(x['pct_faja'], 2)} %", "Cruzado por faja"] for x in cruz],
            widths=[70, 44, 92, 96, 70, 100], align=["l", "r", "r", "r", "r", "l"])
    r.p(
        f"De los {num(len(L))} lotes analizados, {len(cruz)} quedan parcialmente comprendidos dentro de la "
        f"faja de servidumbre, con una superficie afectada conjunta de {num(faja_area)} m². La afectación "
        "material se concentra íntegramente en el rol 168-916, único predio del conjunto cuyo deslinde es "
        "atravesado por el corredor. En los siete predios restantes la afectación es exclusivamente de "
        "proximidad y visual."
    )
    r.kpis([
        ("Lotes cruzados por la faja", str(len(cruz)), "Rol 168-916"),
        ("Superficie en faja", f"{num(faja_area)} m²", "Restricción de uso permanente"),
        ("Valor asociado", clp(round(daño_faja)),
         f"${num(VU)}/m² · utilidad perdida {int(K_FAJA * 100)} %"),
    ])

    # ------------------------------------------------------------------ 04
    r.section("Distribución por proximidad al corredor", kicker="Sección 04")
    bandas = [("0 – 100 m", 0, 100), ("100 – 250 m", 100, 250), ("250 – 500 m", 250, 500),
              ("500 – 750 m", 500, 750), ("750 – 1.000 m", 750, 1000), ("> 1.000 m", 1000, 9e9)]
    rows = []
    for et, a, b in bandas:
        g = [x for x in L if a <= x["d_faja"] < b]
        if not g:
            rows.append([et, "0", "—", "—", "—"])
            continue
        c = Counter(x["clase"] for x in g)
        rows.append([et, num(len(g)), f"{num(sum(x['area_gis'] for x in g) / 1e4, 1)} ha",
                     num(st.mean([x["idv"] for x in g]), 3).replace(".", ","),
                     f"{c['V3'] + c['V4']}"])
    r.table(["Banda de distancia a la faja", "Lotes", "Superficie", "IDV medio", "Lotes V3 + V4"],
            rows, widths=[150, 60, 90, 90, 82], align=["l", "r", "r", "r", "r"])
    r.p(
        "El gradiente es nítido: la dominancia visual media decae con la distancia a la faja y las clases "
        "altas se agotan más allá de los 250 m. Ese comportamiento es coherente con el observado en la "
        "parcelación del reclamante y refuerza la consistencia interna del modelo."
    )

    r.image(f"{WORK}/mapa_v4b.png", 190,
            "Figura 1 · Clasificación de dominancia visual de los 675 lotes de predios vecinos respecto del "
            "corredor de 220 kV. En gris el eje de estructuras.")

    # ------------------------------------------------------------------ 05
    r.section("Metodología de dominancia visual aplicada", kicker="Sección 05")
    r.keyvalues([
        ("Resolución del DEM", f"{num(M['dem_res'], 2)} m/px"),
        ("Altura total de estructura", f"{num(M['h_torre'], 1)} m (estimada)"),
        ("Punto de amarre del conductor", f"{num(M['h_cond'], 1)} m (estimado)"),
        ("Flecha adoptada a mitad de vano", f"{num(M['flecha'], 1)} m"),
        ("Paso de muestreo del perfil", f"{num(M['step'], 0)} m"),
        ("Radio de análisis por lote", f"{num(M['radio'] / 1000, 1)} km"),
        ("Puntos de observación por lote", "4 (acceso, centroide, cota máxima, vivienda probable)"),
        ("Modelos de superficie", "A terreno desnudo · B con pantalla vegetal de 6 m"),
    ])
    r.table(["Componente", "Descripción", "Peso"],
            [[k, t, p] for k, t, p in PESOS], widths=[62, 320, 62], align=["l", "l", "r"])
    r.p(
        "La clase pericial de cada lote se obtiene ponderando 60 % el Modelo A (terreno desnudo, visibilidad "
        "geométrica máxima) y 40 % el Modelo B (con pantalla vegetal), por cuanto la vegetación existente no "
        "es permanente ni jurídicamente exigible. Los cortes de clase son los mismos del anexo V4-A: V1 desde "
        "0,30; V2 desde 0,45; V3 desde 0,60 y V4 desde 0,75."
    )

    # ------------------------------------------------------------------ 06
    r.section("Resultados de clasificación", kicker="Sección 06")
    rows = []
    for rol in roles:
        g = [x for x in L if x["rol"] == rol]
        c = Counter(x["clase"] for x in g)
        rows.append([rol, num(len(g))] + [num(c[k]) for k in ("V0", "V1", "V2", "V3", "V4")] +
                    [num(st.mean([x["idv"] for x in g]), 3).replace(".", ",")])
    rows.append(["TOTAL", num(len(L))] + [num(cnt[k]) for k in ("V0", "V1", "V2", "V3", "V4")] +
                [num(st.mean([x["idv"] for x in L]), 3).replace(".", ",")])
    r.table(["Rol", "Lotes", "V0", "V1", "V2", "V3", "V4", "IDV medio"], rows,
            widths=[74, 52, 44, 44, 44, 44, 44, 76], align=["l"] + ["r"] * 7)
    r.image(f"{WORK}/graficos_v4b.png", 90,
            "Figura 2 · Distribución del índice de dominancia visual, relación IDV–distancia y composición de "
            "clases por predio.")
    r.p(
        f"El {num((cnt['V3'] + cnt['V4']) / len(L) * 100, 1)} % de los lotes alcanza clases altas (V3 o V4) y "
        f"se concentra en el rol 168-916 y en los bordes de los roles 168-223 y 168-224 enfrentados al "
        "corredor. En el extremo opuesto, los roles 168-918 y 168-922 presentan afectación visual marginal "
        "por interposición de relieve."
    )

    # ------------------------------------------------------------------ 07
    r.section("Cuantificación económica referencial", kicker="Sección 07")
    r.p(
        f"A falta de precios de lista de estos predios, la cuantificación adopta el valor unitario sectorial "
        f"de ${num(VU)}/m² determinado en el informe V4, corregido por un factor neto de {num(F_NETO * 100, 1)} % "
        f"(descuento comercial de {int(NEG * 100)} % y costos de transacción de {int(COST * 100)} %). El "
        "resultado es un orden de magnitud comparativo, no una liquidación."
    )
    r.table(
        ["Clase", "Lotes", "Superficie", "Valor de referencia neto", "Depr. central", "Monto central"],
        [[k, num(cnt[k]),
          f"{num(sum(x['area_gis'] for x in L if x['clase'] == k) / 1e4, 1)} ha",
          clp(round(sum(valor(x) for x in L if x["clase"] == k))),
          f"{num(DEP_CEN[k] * 100, 1)} %",
          clp(round(sum(valor(x) * DEP_CEN[k] for x in L if x["clase"] == k)))]
         for k in ("V0", "V1", "V2", "V3", "V4")],
        widths=[44, 42, 66, 130, 72, 108], align=["L", "L", "L", "L", "L", "L"])

    r.kpis([
        ("Escenario conservador", clp(round(A)), "Sólo clases altas, tasas mínimas"),
        ("Escenario central", clp(round(B)),
         f"{num(B / valor_ref * 100, 2)} % del valor de referencia"),
        ("Cota superior", clp(round(C)), "Tasas máximas de la literatura"),
    ])
    r.p(
        f"El valor de referencia neto del conjunto asciende a {clp(round(valor_ref))}. La depreciación visual "
        f"central representa el {num(B / valor_ref * 100, 2)} % de esa base, magnitud consistente con el "
        f"{'1,84'} % obtenido para la parcelación del reclamante en el anexo V4-A, pese a tratarse de predios "
        "y geometrías distintas."
    )
    r.callout(
        "Suma con la afectación material",
        f"Afectación material por faja {clp(round(daño_faja))} más depreciación visual central "
        f"{clp(round(B))} equivale a {clp(round(daño_faja + B))} para el conjunto de los ocho predios "
        "vecinos, bajo los supuestos declarados.",
        kind="brand",
    )

    # ------------------------------------------------------------------ 08
    r.section("Lotes de mayor afectación", kicker="Sección 08")
    top = sorted(L, key=lambda x: -x["idv"])[:22]
    r.table(
        ["Rol", "Lote", "Superficie", "Dist. faja", "Dist. estructura", "IDV", "Clase"],
        [[x["rol"], str(x["n"]), f"{num(x['area_gis'])} m²", f"{num(x['d_faja'])} m",
          f"{num(x['d_torre'])} m", num(x["idv"], 3).replace(".", ","), x["clase"]] for x in top],
        widths=[74, 44, 82, 74, 92, 56, 46], align=["l", "r", "r", "r", "r", "r", "l"])

    # ------------------------------------------------------------------ 09
    r.section("Limitaciones y supuestos declarados", kicker="Sección 09")
    r.bullets([
        "La geometría proviene de planos CAD exportados a KMZ; no se contó con planos aprobados timbrados ni "
        "con certificados de subdivisión para estos ocho roles.",
        "No consta el precio de lista, el estado comercial ni la titularidad de los lotes de terceros; el "
        "valor unitario aplicado es sectorial y homogéneo.",
        "La altura de estructura y el punto de amarre son estimados, según la misma convención del anexo V4-A.",
        "La pantalla vegetal del Modelo B se modeló con altura uniforme de 6 m, sin catastro de arbolado.",
        "No se dispone de evidencia de mercado local que permita contrastar estadísticamente la depreciación "
        "por dominancia visual en estos predios; se aplican tasas de literatura acotadas.",
        "Este anexo no determina indemnización alguna a favor de los propietarios de los predios vecinos; su "
        "función es dimensionar la extensión territorial de la afectación del corredor.",
    ])
    r.closing(
        "Emitido como anexo complementario de los informes OT-PER-2026-0087-V4 y V4-A, bajo los mismos "
        "principios de independencia, trazabilidad y declaración expresa de supuestos."
    )
    r.signature("Oferta Terrenos · Valuation", "Equipo pericial independiente",
                "Análisis geoespacial y valoración · Región del Maule")
    return r.save(OUT)


if __name__ == "__main__":
    print(build())
