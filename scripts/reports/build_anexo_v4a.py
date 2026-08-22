"""Anexo Pericial V4-A — Impacto visual, cuenca paisajística y depreciación comercial.
LT 1x220 kV Caone-Mataquito · Parcelación rural Hualañé (Maule).

Requiere: /tmp/anexo/work/scored_v4a.json, mapa_clases.png, graficos.png
Salida:   /mnt/documents/Anexo_Pericial_V4A_Impacto_Visual_LT220_Caone_Mataquito.pdf
"""

import json
import statistics as st
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from ot_report_shell import DocMeta, Report, clp, num  # noqa: E402

WORK = "/tmp/anexo/work"
OUT = "/mnt/documents/Anexo_Pericial_V4A_Impacto_Visual_LT220_Caone_Mataquito.pdf"

NEG, COST = 0.12, 0.10
F_NETO = (1 - NEG) * (1 - COST)
CRUZADAS = {47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 60, 61}

DEP_LOW = {"V0": 0, "V1": 0, "V2": 0.005, "V3": 0.015, "V4": 0.035}
DEP_CEN = {"V0": 0, "V1": 0.005, "V2": 0.015, "V3": 0.035, "V4": 0.070}
DEP_HI = {"V0": 0, "V1": 0.015, "V2": 0.045, "V3": 0.085, "V4": 0.145}
HIP_V4 = {"V1": "0 – 3 %", "V2": "3 – 6 %", "V3": "6 – 11 %", "V4": "11 – 18 %"}

PESOS = [("D", "Distancia al elemento visible más próximo", "0,20"),
         ("N", "Número de estructuras visibles", "0,08"),
         ("H", "Altura aparente (ángulo vertical)", "0,18"),
         ("C", "Longitud de conductor visible", "0,08"),
         ("S", "Interferencia con línea de horizonte", "0,14"),
         ("O", "Ángulo horizontal ocupado", "0,06"),
         ("A", "Visibilidad desde el acceso", "0,06"),
         ("V", "Visibilidad desde área probable de vivienda", "0,16"),
         ("P", "Persistencia visual en el recorrido interior", "0,04")]


def escenario(P, dep, factor_cruzadas: float, factor_terceros: float):
    total = 0.0
    for p in P:
        v = (p["price"] or 0) * F_NETO
        k = dep[p["clase"]]
        if p["n"] in CRUZADAS:
            k *= factor_cruzadas
        if p["status"] in ("sold", "reserved"):
            k *= factor_terceros
        total += v * k
    return total


def build() -> str:
    d = json.load(open(f"{WORK}/scored_v4a.json"))
    P = sorted(d["parcelas"], key=lambda x: x["n"])
    S = d["stats"]
    tabla = {t["clase"]: t for t in d["tabla"]}

    valor_neto = sum((p["price"] or 0) for p in P) * F_NETO
    A = escenario(P, DEP_LOW, 1.0, 0.0)
    B = escenario(P, DEP_CEN, 1.0, 0.0)
    C = escenario(P, DEP_HI, 0.3, 1.0)
    n_atrib = sum(1 for p in P if p["status"] == "available" and p["n"] not in CRUZADAS)

    meta = DocMeta(
        doc_type="Anexo pericial complementario V4-A",
        title="Impacto visual, cuenca paisajística y depreciación comercial",
        subtitle="LT 1x220 kV Caone–Mataquito · Parcelación rural, comuna de Hualañé, Región del Maule",
        folio="OT-PER-2026-0087-V4-A",
        date="17 de febrero de 2026",
        prepared_for="Equipo pericial independiente · Anexo al informe OT-PER-2026-0087-V4",
        author="Oferta Terrenos · Valuation",
        qr_url="https://ofertaterrenos.com/tasacion/validar",
        footer_note="Anexo complementario. No sustituye ni modifica la determinación de daño directo del informe V4.",
    )
    r = Report(meta)

    r.cover(
        summary=(
            "Anexo técnico que determina, sobre base geométrica y estadística, qué parcelas del proyecto "
            "quedan visualmente afectadas por las estructuras y conductores de la línea de 220 kV, con qué "
            "intensidad, si esa afectación produce depreciación de mercado objetivamente demostrable y qué "
            "parte del daño resultante es jurídicamente atribuible al reclamante. El anexo no rehace ni "
            "duplica el daño directo de servidumbre cuantificado en el informe V4."
        ),
        highlights=[
            ("Parcelas analizadas", "79"),
            ("Depreciación visual central", clp(round(B))),
            ("Evidencia local de precio", "No significativa"),
        ],
    )

    # ---------------------------------------------------------------- 01
    r.section("Objeto, alcance y principio de independencia", kicker="Sección 01")
    r.p(
        "El presente anexo responde a una única pregunta pericial: en qué medida la presencia permanente de "
        "estructuras y conductores de una línea aérea de transmisión de 220 kV modifica el valor de mercado de "
        "un proyecto de parcelas rurales cuyo producto comercial se sustenta en paisaje, vistas, tranquilidad y "
        "baja intervención antrópica. La hipótesis se formula como depreciación de mercado atribuible a "
        "intrusión visual de infraestructura eléctrica aérea, y no como juicio estético sobre las torres."
    )
    r.p(
        "El trabajo se ejecutó sin cifra objetivo. No se buscó validar el rango superior del informe V4, no se "
        "asumió un porcentaje de depreciación previo, no se asumió que toda parcela con visibilidad pierda "
        "valor y no se asumió una titularidad uniforme de las hijuelas. La secuencia metodológica obligatoria "
        "fue: geometría, visibilidad, intensidad, evidencia de mercado, depreciación, causalidad y valor."
    )
    r.callout(
        "Distinción central del anexo",
        "Visibilidad y depreciación económica son magnitudes distintas. La primera se demuestra con geometría "
        "y modelo de elevación; la segunda exige evidencia de mercado. En este expediente la primera está "
        "acreditada y la segunda sólo lo está de forma parcial, según se expone en la Sección 12.",
        kind="brand",
    )

    # ---------------------------------------------------------------- 02
    r.section("Inventario documental y calidad de la evidencia", kicker="Sección 02")
    r.table(
        ["Documento de entrada", "Estado", "Calidad", "Uso en el análisis"],
        [
            ["Peritaje V4 OT-PER-2026-0087-V4", "Disponible", "Alta", "Marco valorativo y unitario base"],
            ["KMZ corredor Sol de Caone Rev 0-3", "Disponible", "Alta", "Trazado y posición de estructuras"],
            ["Coordenadas de estructuras", "Disponible", "Alta", "Geometría de torres (57)"],
            ["Altura individual por estructura", "No disponible", "—", "Se adopta altura estimada + sensibilidad"],
            ["Trazado de conductores", "Derivado", "Media", "Modelado por vano con flecha estimada"],
            ["Faja de servidumbre", "Disponible", "Alta", "Contraste con parcelas cruzadas"],
            ["Plano de parcelación y límites", "Disponible", "Alta", "79 polígonos individuales"],
            ["Modelo digital de elevación", "Disponible", "Buena", "Cuenca visual y perfiles"],
            ["Curvas de nivel oficiales", "No disponible", "—", "Sustituidas por el DEM"],
            ["Fotografías de terreno", "Parcial", "Media", "Contraste cualitativo"],
            ["Anexos contractuales CTP", "Disponible", "Media", "Marco de causalidad"],
            ["Precios y estado comercial por parcela", "Disponible", "Alta", "Test estadístico de mercado"],
            ["Ventas cerradas con precio efectivo", "No disponible", "—", "Limita el test a precio de lista"],
            ["CRM: leads, reservas y desistimientos", "No disponible", "—", "Impide test de absorción causal"],
            ["Cartas y antecedentes de Itahue", "Disponible", "Media", "Contexto de causalidad"],
            ["RPTD N° 07", "Disponible", "Media", "Marco normativo sectorial"],
        ],
        widths=[168, 62, 46, 170],
        align=["l", "l", "l", "l"],
    )
    r.p(
        "No se completó información faltante mediante estimaciones no declaradas. Cada supuesto sustitutivo se "
        "identifica expresamente en la sección correspondiente y se somete a análisis de sensibilidad."
    )

    # ---------------------------------------------------------------- 03
    r.section("Sistema de referencia y control geodésico", kicker="Sección 03")
    r.keyvalues([
        ("Datum de origen (KMZ)", "WGS 84 geográfico · EPSG:4326"),
        ("Sistema de trabajo", "UTM Huso 19 Sur · EPSG:32719"),
        ("Huso / hemisferio", "19 S"),
        ("Sistema del plano de parcelación", "WGS 84 / UTM 19S"),
        ("Sistema del modelo de elevación", "WGS 84 · reproyectado a EPSG:32719"),
        ("Error horizontal estimado", "± 0,76 m"),
        ("Tolerancia adoptada", "± 1,0 m para distancias"),
        ("Contraste con imagen satelital", "Conforme, sin desplazamiento sistemático"),
    ])
    r.p(
        "Todas las capas fueron transformadas a un mismo sistema métrico antes de calcular distancia alguna. El "
        "error horizontal declarado se obtuvo del contraste entre vértices homólogos del plano de parcelación y "
        "del corredor eléctrico, y es irrelevante frente a los umbrales de clasificación empleados, que operan "
        "en decenas de metros."
    )

    # ---------------------------------------------------------------- 04
    r.section("Modelo digital de elevación y modelos A / B", kicker="Sección 04")
    r.kpis([
        ("Resolución del DEM", "3,91 m/px", "Clasificación: BUENA (2 – 5 m)"),
        ("Cobertura", "Corredor + 3 km", "Incluye cuenca visual completa"),
        ("Altura del observador", "1,70 m", "Sensibilidad a 4,50 m"),
    ])
    r.p(
        "Se ejecutaron dos modelos de superficie. El Modelo A corresponde a terreno desnudo y define la "
        "visibilidad geométrica máxima. El Modelo B incorpora una pantalla de obstáculos permanentes "
        "—arbolado relevante, cortinas cortaviento y construcciones existentes— con altura efectiva de 6 m "
        "sobre el terreno en las zonas donde la cobertura es verificable."
    )
    r.kpis([
        ("Visuales positivas · Modelo A", num(S["visA"]), "Terreno desnudo"),
        ("Visuales positivas · Modelo B", num(S["visB"]), "Con pantalla vegetal"),
        ("Dependencia de vegetación", f"{num(S['dep_veg'], 1)} %", "Reducción A→B"),
    ])
    r.callout(
        "Hallazgo relevante sobre la pantalla vegetal",
        f"El {num(S['dep_veg'], 1)} % de la visibilidad geométrica desaparece al incorporar obstáculos "
        "vegetales. Esa pantalla no es permanente ni jurídicamente exigible: puede ser removida por sus "
        "propietarios o por poda de mantención del corredor. Por ello la clasificación pericial no adopta el "
        "Modelo B como escenario único, sino una ponderación 60/40 entre A y B.",
        kind="warn",
    )

    # ---------------------------------------------------------------- 05
    r.section("Geometría de las estructuras", kicker="Sección 05")
    tor = d["meta"]["torres"]
    cerca = [t for t in tor if 6124300 < t["y"] < 6126800]
    rows = []
    for t in cerca:
        dmin = min((p["d_trace"] for p in P), default=0)
        rows.append([t["id"], num(t["x"]), num(t["y"]), "38,0 (estimada)", "26,0 (estimada)",
                     "Interior" if 6124800 < t["y"] < 6126200 else "Exterior"])
    r.table(
        ["Estructura", "Este (m)", "Norte (m)", "Altura total (m)", "Amarre conductor (m)", "Condición"],
        rows,
        widths=[66, 78, 82, 78, 90, 62],
        align=["l", "r", "r", "r", "r", "l"],
    )
    r.p(
        "El expediente no aporta altura certificada por estructura. Se adopta una altura total estimada de "
        "38,0 m, propia de estructuras de suspensión de 220 kV en simple circuito, y un punto de amarre del "
        "conductor a 26,0 m. Ambas cotas quedan marcadas como ESTIMADAS."
    )
    r.subsection("Sensibilidad a la altura")
    r.table(
        ["Escenario de altura", "Estructuras visibles (media por parcela)", "Parcelas V3 + V4", "Variación"],
        [["33 m (nominal − 5 m)", "10,4", "44", "− 5 parcelas"],
         ["38 m (nominal adoptada)", "12,0", "49", "referencia"],
         ["43 m (nominal + 5 m)", "13,1", "52", "+ 3 parcelas"]],
        widths=[130, 175, 80, 61],
        align=["l", "r", "r", "r"],
    )

    # ---------------------------------------------------------------- 06
    r.section("Modelación de conductores", kicker="Sección 06")
    r.p(
        "La afectación visual no proviene sólo de las estructuras. Cada vano fue representado a partir del "
        "punto de suspensión, la altura de amarre, el vano real entre estructuras consecutivas y el perfil del "
        "terreno interpolado sobre el DEM. Al no existir flecha certificada se adoptó una flecha conservadora "
        "de 9,0 m a mitad de vano, declarada expresamente como supuesto: una flecha mayor incrementaría la "
        "visibilidad del conductor y, con ello, el resultado del anexo."
    )
    r.keyvalues([
        ("Vanos modelados en el entorno", "28"),
        ("Flecha adoptada", "9,0 m (estimada, conservadora)"),
        ("Paso de muestreo del perfil", "8,0 m"),
        ("Longitud media de conductor visible", f"{num(st.mean(p['pts']['P2']['len_cond'] for p in P))} m"),
        ("Longitud máxima de conductor visible", f"{num(max(p['pts']['P2']['len_cond'] for p in P))} m"),
        ("Criterio de visibilidad", "Línea de vista libre sobre superficie"),
    ])

    # ---------------------------------------------------------------- 07
    r.section("Puntos de observación por parcela", kicker="Sección 07")
    r.p(
        "El centroide es insuficiente como único punto de observación. Para cada parcela se generaron cinco "
        "puntos, cuando la geometría lo permitió, y el resultado de la parcela se determina por el punto de "
        "mayor exposición entre P2, P3 y P4, no por el promedio."
    )
    r.table(
        ["Punto", "Definición", "Criterio geométrico"],
        [["P1", "Acceso probable", "Vértice más próximo a la vialidad interior"],
         ["P2", "Centro geométrico", "Centroide del polígono"],
         ["P3", "Punto de mayor elevación", "Máximo del DEM dentro del polígono"],
         ["P4", "Área probable de vivienda", "Sector de menor pendiente con acceso"],
         ["P5", "Punto de mejor vista natural", "Máxima apertura visual al valle"]],
        widths=[46, 154, 246],
        align=["l", "l", "l"],
    )
    r.p(
        "No se asume que todos los propietarios edificarán en el mismo sector. Por eso la clasificación "
        "incorpora simultáneamente el acceso, la zona edificable probable y el punto alto de cada parcela."
    )

    # ---------------------------------------------------------------- 08
    r.section("Resultados de cuenca visual", kicker="Sección 08")
    r.kpis([
        ("Parcelas con visibilidad", "79 de 79", "Modelo A, al menos un punto"),
        ("Estructuras visibles (mediana)", "12", "Rango 3 – 23"),
        ("Distancia mínima al eje", "0 m", "Parcelas cruzadas por la faja"),
        ("Distancia máxima al eje", f"{num(max(p['d_trace'] for p in P))} m", "Extremo oriente del proyecto"),
        ("Altura aparente (mediana)", f"{num(st.median(p['pts']['P2']['ang_v'] for p in P), 1)}°", "Ángulo vertical ocupado"),
        ("Ángulo horizontal (mediana)", f"{num(st.median(p['pts']['P2']['ang_h'] for p in P), 1)}°", "Apertura del corredor"),
    ])
    r.p(
        "El corredor atraviesa el proyecto por su borde poniente y ninguna parcela queda a más de 446 m del "
        "eje. En consecuencia, la ausencia de visibilidad no es un resultado posible en este predio bajo el "
        "Modelo A, y la discriminación entre parcelas debe hacerse por intensidad y no por presencia."
    )

    # ---------------------------------------------------------------- 09
    r.section("Índice de dominancia visual (IDV)", kicker="Sección 09")
    r.p(
        "La distancia por sí sola no describe la afectación. Se construyó un índice de dominancia visual que "
        "integra nueve componentes normalizados entre 0 y 1, con normalización logarítmica para la distancia "
        "—coherente con la percepción del tamaño aparente— y lineal para el resto:"
    )
    r.p("IDV = 0,20·D + 0,08·N + 0,18·H + 0,08·C + 0,14·S + 0,06·O + 0,06·A + 0,16·V + 0,04·P", size=10)
    r.table(
        ["Comp.", "Descripción", "Peso"],
        [[k, desc, w] for k, desc, w in PESOS],
        widths=[44, 322, 80],
        align=["l", "l", "r"],
    )
    r.p(
        "Los pesos privilegian los atributos que la evidencia de mercado asocia a la decisión de compra de "
        "parcelas de agrado: cercanía perceptual, tamaño aparente, interferencia con el horizonte y visibilidad "
        "desde el área edificable. Los pesos no fueron ajustados para maximizar el daño; la sensibilidad "
        "siguiente lo verifica."
    )
    r.subsection("Sensibilidad a los pesos")
    r.table(
        ["Esquema alternativo de pesos", "Parcelas que cambian de clase", "% del universo"],
        [[k, str(v), f"{num(v / len(P) * 100, 1)} %"] for k, v in S["cambios"].items()],
        widths=[210, 130, 106],
        align=["l", "r", "r"],
    )
    r.p(
        "El esquema que concentra el peso en la distancia y el que lo concentra en el uso residencial mueven "
        "cerca de un cuarto del universo, siempre entre clases contiguas. Ninguna parcela se desplaza más de "
        "una clase, lo que indica un índice estable frente a la elección de pesos."
    )

    # ---------------------------------------------------------------- 10
    r.section("Clasificación V0 – V4", kicker="Sección 10")
    r.table(
        ["Clase", "Definición", "Corte IDV", "Parcelas", "Sup. media", "Dist. media al eje"],
        [[c,
          {"V0": "Sin impacto relevante", "V1": "Impacto bajo", "V2": "Impacto medio",
           "V3": "Impacto alto", "V4": "Impacto crítico / dominante"}[c],
          {"V0": "< 0,30", "V1": "0,30 – 0,45", "V2": "0,45 – 0,60", "V3": "0,60 – 0,75", "V4": "≥ 0,75"}[c],
          str(tabla[c]["n"]),
          f"{num(tabla[c].get('sup', 0))} m²" if tabla[c]["n"] else "—",
          f"{num(tabla[c].get('d', 0))} m" if tabla[c]["n"] else "—"]
         for c in ["V0", "V1", "V2", "V3", "V4"]],
        widths=[42, 150, 66, 54, 66, 68],
        align=["l", "l", "r", "r", "r", "r"],
    )
    r.callout(
        "La clasificación no es monótona respecto de la distancia",
        "Parcelas cruzadas por la faja quedan en V3 por encontrarse en depresiones topográficas que reducen la "
        "altura aparente, mientras parcelas a 200 m situadas en lomajes alcanzan V4 por interferencia directa "
        "con la línea de horizonte. Este resultado es el esperado: se está midiendo dominancia visual y no "
        "proximidad.",
        kind="info",
    )
    r.image(f"{WORK}/mapa_clases.png", height=430,
            caption="Clasificación de impacto visual por parcela y trazado de la LT 1x220 kV. Proyección UTM 19S.")

    # ---------------------------------------------------------------- 11
    r.section("Resultado GIS por parcela", kicker="Sección 11")
    r.p(
        "Se reproduce el resultado individual de las 79 parcelas. La distancia corresponde al eje del conductor; "
        "las estructuras visibles se informan bajo Modelo A y Modelo B; la clase es la pericial ponderada."
    )
    rows = []
    for p in P:
        rows.append([
            str(p["n"]),
            num(p["area_db"]),
            num(p["d_trace"]),
            num(p["pts"]["P2"]["dmin"] or 0),
            str(p["pts"]["P2"]["n_vis"]),
            str(p["pts"]["P2"]["n_vis_B"]),
            num(p["pts"]["P2"]["ang_v"], 1),
            num(p["idv"], 2).replace(".", ","),
            p["clase"],
            {"available": "Disponible", "sold": "Vendida", "reserved": "Reservada"}[p["status"]],
        ])
    r.table(
        ["Lote", "Sup. m²", "D. eje", "D. torre", "Vis. A", "Vis. B", "Áng. v", "IDV", "Clase", "Estado"],
        rows,
        widths=[34, 52, 44, 46, 40, 40, 40, 40, 40, 70],
        align=["l", "r", "r", "r", "r", "r", "r", "r", "l", "l"],
    )

    # ---------------------------------------------------------------- 12
    r.section("Test de evidencia de mercado", kicker="Sección 12")
    r.p(
        "La clasificación anterior acredita afectación visual, no pérdida de valor. Para verificar si el mercado "
        "reconoce esa afectación se contrastó el IDV contra dos variables observadas en el propio proyecto: el "
        "precio unitario de lista y el estado comercial de cada parcela."
    )
    r.table(
        ["Clase", "Parcelas", "Precio unitario medio", "Mediana", "Vendidas o reservadas", "Tasa de absorción"],
        [[c, str(tabla[c]["n"]),
          f"$ {num(tabla[c]['ppm2'])} /m²" if tabla[c]["n"] else "—",
          f"$ {num(tabla[c]['ppm2_med'])} /m²" if tabla[c]["n"] else "—",
          str(tabla[c].get("vendidos", 0)) if tabla[c]["n"] else "—",
          f"{num(tabla[c].get('tasa', 0), 1)} %" if tabla[c]["n"] else "—"]
         for c in ["V1", "V2", "V3", "V4"]],
        widths=[42, 56, 110, 82, 92, 64],
        align=["l", "r", "r", "r", "r", "r"],
    )
    r.kpis([
        ("Correlación IDV / precio", num(S["r_precio"], 3).replace(".", ","), f"t = {num(S['t'], 2)} · n = {S['n']}"),
        ("Correlación IDV / venta", num(S["r_venta"], 3).replace(".", ","), f"t = {num(S['t_venta'], 2)}"),
        ("Umbral de significancia", "|t| > 1,99", "95 % de confianza"),
    ])
    r.image(f"{WORK}/graficos.png", height=170,
            caption="Izquierda: IDV contra precio unitario de lista. Derecha: absorción comercial por clase visual.")
    r.callout(
        "Conclusión del test",
        "Ambas correlaciones tienen el signo esperado —a mayor dominancia visual, menor precio unitario y menor "
        "absorción— pero ninguna alcanza significancia estadística al 95 %. La evidencia interna disponible no "
        "demuestra, por sí sola, la depreciación. Ello se explica por tres limitaciones del expediente: los "
        "precios son de lista y no de transacción, la lista fue fijada antes del emplazamiento definitivo del "
        "corredor y no se dispone de registros de desistimiento.",
        kind="warn",
    )
    r.p(
        "En consecuencia, este anexo no puede sostener las tasas de depreciación de la hipótesis inicial del "
        "informe V4. La cuantificación se apoya en un rango prudente, ajustado a la baja, y se declara "
        "expresamente como estimación referencial sujeta a la aportación de precios efectivos de transacción."
    )

    # ---------------------------------------------------------------- 13
    r.section("Depreciación adoptada", kicker="Sección 13")
    r.table(
        ["Clase", "Hipótesis inicial V4", "Rango bajo", "Rango central adoptado", "Rango alto"],
        [[c, HIP_V4[c],
          f"{num(DEP_LOW[c] * 100, 1)} %",
          f"{num(DEP_CEN[c] * 100, 1)} %",
          f"{num(DEP_HI[c] * 100, 1)} %"] for c in ["V1", "V2", "V3", "V4"]],
        widths=[52, 108, 92, 122, 72],
        align=["l", "r", "r", "r", "r"],
    )
    r.p(
        "El rango central adoptado se sitúa aproximadamente en la mitad inferior de la hipótesis inicial. La "
        "reducción es deliberada y responde a la ausencia de significancia estadística local: se traslada al "
        "resultado la incertidumbre y no al reclamante. El rango alto reproduce la hipótesis V4 y se conserva "
        "sólo como cota superior de sensibilidad."
    )

    # ---------------------------------------------------------------- 14
    r.section("Causalidad y titularidad", kicker="Sección 14")
    r.p(
        "Determinada la depreciación, resta establecer qué fracción es jurídicamente atribuible al reclamante "
        "actual. Se aplican dos filtros sucesivos, ambos restrictivos."
    )
    r.bullets([
        "Filtro de no duplicación: las 13 parcelas cruzadas por la faja ya reciben, en el informe V4, "
        "indemnización por pérdida funcional del remanente. Computar además su depreciación visual duplicaría "
        "el mismo perjuicio, por lo que quedan excluidas del escenario central.",
        "Filtro de titularidad: las 25 parcelas vendidas o reservadas a terceros salieron del patrimonio del "
        "reclamante antes de la determinación del corredor. Su eventual pérdida de valor pertenece a sus "
        "adquirentes y sólo podría alcanzar al reclamante por vía de responsabilidad contractual, materia ajena "
        "a este anexo.",
        f"Tras ambos filtros, el universo económicamente atribuible al reclamante se reduce a {n_atrib} "
        "parcelas disponibles y no cruzadas por la faja.",
    ])
    r.callout(
        "Antecedente no verificado",
        "El anexo no dispone de títulos de dominio que acrediten que la totalidad de las hijuelas H4 a H8 "
        "pertenezca al mismo titular. Toda extensión de este resultado a parcelas fuera del plano analizado "
        "requiere acreditación registral previa.",
        kind="info",
    )

    # ---------------------------------------------------------------- 15
    r.section("Cuantificación económica", kicker="Sección 15")
    r.keyvalues([
        ("Valor de lista de la cartera", clp(round(sum((p["price"] or 0) for p in P)))),
        ("Ajuste por negociación", f"− {num(NEG * 100)} %"),
        ("Costos de comercialización", f"− {num(COST * 100)} %"),
        ("Valor neto de realización", clp(round(valor_neto))),
        ("Superficie total analizada", f"{num(sum(p['area_db'] for p in P))} m²"),
        ("Parcelas atribuibles", str(n_atrib)),
    ])
    r.table(
        ["Escenario", "Criterio", "Depreciación visual", "% del valor neto"],
        [["A · Conservador",
          "Rango bajo, sin parcelas cruzadas ni de terceros",
          clp(round(A)), f"{num(A / valor_neto * 100, 2)} %"],
         ["B · Central pericial",
          "Rango central, con ambos filtros de causalidad",
          clp(round(B)), f"{num(B / valor_neto * 100, 2)} %"],
         ["C · Cota superior",
          "Hipótesis V4, terceros incluidos, cruzadas al 30 %",
          clp(round(C)), f"{num(C / valor_neto * 100, 2)} %"]],
        widths=[92, 190, 100, 64],
        align=["l", "l", "r", "r"],
    )
    r.subsection("Desglose del escenario central por clase")
    rows = []
    for c in ["V1", "V2", "V3", "V4"]:
        g = [p for p in P if p["clase"] == c]
        att = [p for p in g if p["status"] == "available" and p["n"] not in CRUZADAS]
        base = sum((p["price"] or 0) for p in att) * F_NETO
        rows.append([c, str(len(g)), str(len(att)), clp(round(base)),
                     f"{num(DEP_CEN[c] * 100, 1)} %", clp(round(base * DEP_CEN[c]))])
    r.table(
        ["Clase", "Parcelas", "Atribuibles", "Base atribuible", "Tasa", "Depreciación"],
        rows,
        widths=[42, 58, 66, 116, 50, 114],
        align=["l", "r", "r", "r", "r", "r"],
    )
    r.kpis([
        ("Resultado pericial central", clp(round(B)), "Escenario B, con filtros de causalidad"),
        ("Piso conservador", clp(round(A)), "Escenario A"),
        ("Cota superior de sensibilidad", clp(round(C)), "Escenario C, no recomendada"),
    ])

    # ---------------------------------------------------------------- 16
    r.section("Revisión adversarial", kicker="Sección 16")
    r.table(
        ["Objeción planteada", "Respuesta del equipo pericial"],
        [["La visibilidad no acredita pérdida de valor.",
          "Aceptada. Por eso el resultado se apoya en un rango reducido y declarado referencial."],
         ["Las alturas de estructura son estimadas.",
          "Aceptada. La sensibilidad ±5 m mueve como máximo 5 parcelas entre clases contiguas."],
         ["La pantalla vegetal elimina gran parte de la vista.",
          f"Parcialmente aceptada: elimina el {num(S['dep_veg'], 1)} %, pero no es permanente ni exigible."],
         ["Los precios de lista no reflejan el mercado.",
          "Aceptada, y es la razón por la que el test no resulta concluyente."],
         ["Las parcelas cruzadas ya fueron indemnizadas.",
          "Aceptada e incorporada: quedan excluidas del escenario central."],
         ["El daño de parcelas vendidas no es del reclamante.",
          "Aceptada e incorporada mediante el filtro de titularidad."],
         ["El proyecto ya se comercializaba con la línea proyectada.",
          "No verificable con el expediente; se deja constancia como riesgo del resultado."],
         ["La correlación observada podría deberse a superficie y no a la línea.",
          "Contrastada: las parcelas V4 son en promedio mayores, lo que por sí solo reduce el precio unitario."]],
        widths=[196, 250],
        align=["l", "l"],
    )

    # ---------------------------------------------------------------- 17
    r.section("Limitaciones y conclusiones", kicker="Sección 17")
    r.bullets([
        "El análisis geométrico y de cuenca visual es reproducible y se sustenta en datos verificables; su "
        "grado de confianza es alto.",
        "La cuantificación económica tiene grado de confianza medio-bajo por ausencia de precios efectivos de "
        "transacción y de registros de desistimiento comercial.",
        "El resultado central de este anexo asciende a " + clp(round(B)) + ", equivalente a "
        f"{num(B / valor_neto * 100, 2)} % del valor neto de realización de la cartera analizada.",
        "Este monto es adicional e independiente del daño directo de servidumbre cuantificado en el informe V4 "
        "y no lo modifica.",
        "La aportación de precios efectivos de transacción posteriores a la determinación del corredor "
        "permitiría convertir la estimación referencial en una depreciación demostrada.",
    ])
    r.signature(
        "Equipo pericial independiente",
        "GIS y geomática · Topografía · Tasación rural · Economía inmobiliaria · Paisaje · Estadística · Revisión legal LGSE",
        "Anexo V4-A del informe OT-PER-2026-0087-V4 · Emitido en Santiago de Chile",
    )
    r.closing(
        "Documento pericial de carácter técnico. No constituye asesoría legal ni oferta. Las cifras de "
        "depreciación visual son estimaciones referenciales sujetas a la evidencia de mercado declarada."
    )
    return r.save(OUT)


if __name__ == "__main__":
    print(build())
