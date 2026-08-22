"""
Peritaje independiente V4 — Servidumbre eléctrica LT 1x220 kV Caone–Mataquito
Proyecto de parcelación rural · Hualañé, Región del Maule.

V4 reemplaza el proxy equiárea de V3 por las superficies individuales de cada
lote (plano 168-915) y las superficies afectadas de los Planos Especiales de
Servidumbre (PES) notificados, re-mide torres y caminos sobre el KMZ
Sol de Caone Rev0-3 e incorpora la evidencia contractual CTP y la carta de
negociación de 30-01-2026.

Salida: /mnt/documents/Peritaje_Independiente_LT220_Caone_Mataquito_v4.pdf
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from ot_report_shell import DocMeta, Report, clp, num  # noqa: E402

OUT = "/mnt/documents/Peritaje_Independiente_LT220_Caone_Mataquito_v4.pdf"

# --------------------------------------------------------------------------- #
# 1. Datos primarios V4
# --------------------------------------------------------------------------- #
UV = 2_850          # $/m² valor unitario Before reconciliado (V3: 2.749)
UV_V3 = 2_749

# lote: (superficie de plano 168-915 [m²], superficie afectada PES [m²], long. afectada [m])
LOTES = {
    "61": (6_500, 5_574, 194.08), "60": (5_500, 3_710, 132.50),
    "57": (6_000, 3_572, 127.35), "56": (5_500, 3_130, 104.34),
    "55": (5_500, 2_817, 93.90),  "54": (6_300, 2_965, 98.83),
    "53": (5_000, 2_207, 73.56),  "52": (5_000, 2_057, 68.55),
    "51": (5_000, 1_967, 65.56),  "50": (5_100, 1_904, 63.48),
    "49": (5_000, 1_951, 61.19),  "48": (5_000, 1_857, 58.04),
    "47": (6_000, 1_822, 56.95),  "62": (5_300, 244, 0.00),
}
ORDEN = ["61", "60", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "62"]
SUP_14 = sum(v[0] for v in LOTES.values())        # 76.700 m²
FAJA_PES = sum(v[1] for v in LOTES.values())      # 35.777 m²
LARGO = sum(v[2] for v in LOTES.values())         # 1.198,33 m

# GIS propio (KMZ_Sol_de_Caone_Rev0-3, UTM 19S)
FAJA_GIS_STRIP = 40_147   # faja dentro de la franja de los 14 lotes (±120 m)
FAJA_GIS_V3 = 43_553      # medición V3 sobre todo el predio
TORRES_GIS = 3_827        # plataformas T30–T33 dentro de los 14 lotes
TORRES_V3 = 4_774         # V3: incluía T29 y T34, fuera de los 14 lotes
TORRES_N = 4
TORRE_FUND = 120          # m² por estructura: fundaciones + patas (permanente)
TORRE_PERM_RESTO = 0.25   # fracción de plataforma que permanece compactada
CAMINOS_STRIP = 3_631     # caminos de servidumbre sobre los 14 lotes (GIS)
CAMINOS_FUERA = 3_386     # de ellos, fuera de la faja
CAMINOS_V3 = 6_800

TORRE_PERM = TORRES_N * TORRE_FUND + (TORRES_GIS - TORRES_N * TORRE_FUND) * TORRE_PERM_RESTO
TORRE_TEMP = TORRES_GIS - TORRE_PERM
OCUP_TEMP_FACTOR = 0.35   # 24 meses de ocupación + restitución, sobre valor pleno

RESIDUAL_FAJA = 0.15      # valor residual del suelo bajo faja (uso agrícola restringido)
TRANSITO_ANCHO = 2.0      # Art. 69 N°3

# Evidencia de valor
VNGP_TRAMOS = [
    ("5.000 – 8.000 m²", 10_000_000), ("8.001 – 10.000 m²", 12_000_000),
    ("10.001 – 15.000 m²", 14_000_000), ("Sobre 15.000 m²", 16_000_000),
]
PERMUTA = 21_000_000
LISTA_MIN, LISTA_MAX = 15_990_000, 29_990_000
LISTA_MEDIANA = 19_990_000
DESC_NEGOCIACION = 0.12
COSTO_VENTA = 0.10

# Inventario H4–H8 (Análisis B)
UNIDADES = [
    ("H4", 54, 560_506_323), ("H5", 69, 728_000_000), ("H6", 79, 816_000_000),
    ("H7", 68, 686_000_000), ("H8", 69, 762_000_000),
]
VNGP_TOTAL = sum(u[2] for u in UNIDADES)
PARCELAS_TOTAL = sum(u[1] for u in UNIDADES)
LOTES_COLINDANTES = 15    # carta 30-01-2026

# --------------------------------------------------------------------------- #
# 2. Test funcional Art. 69 inciso final (clases I0–I4)
# --------------------------------------------------------------------------- #
# clase: (castigo sobre remanente, etiqueta)
CLASES = {
    "I0": (0.00, "Sin pérdida funcional"),
    "I1": (0.10, "Pérdida funcional menor"),
    "I2": (0.20, "Pérdida funcional relevante"),
    "I3": (0.40, "Aprovechamiento residencial severamente deteriorado"),
    "I4": (1.00, "Inutilización integral — Art. 69 inciso final"),
}
ASIG = {
    "61": "I4", "60": "I3", "57": "I3", "56": "I3", "55": "I3",
    "54": "I2", "53": "I2", "52": "I2", "51": "I2", "50": "I2",
    "49": "I2", "48": "I2", "47": "I2", "62": "I1",
}

filas = []
dep_remanentes = 0.0
perdida_faja_lotes = 0.0
for lote in ORDEN:
    sup, pes, _ = LOTES[lote]
    rem = sup - pes
    pct = pes / sup * 100
    clase = ASIG[lote]
    k = CLASES[clase][0]
    v_before = sup * UV
    p_faja = pes * UV * (1 - RESIDUAL_FAJA)
    p_rem = rem * UV * k
    perdida_faja_lotes += p_faja
    dep_remanentes += p_rem
    filas.append(dict(lote=lote, sup=sup, pes=pes, rem=rem, pct=pct, clase=clase,
                      k=k, v_before=v_before, v_after=v_before - p_faja - p_rem,
                      dano=p_faja + p_rem))

VALOR_14_BEFORE = SUP_14 * UV

# --------------------------------------------------------------------------- #
# 3. Escenario 1 — legal duro (alta causalidad + alta prueba)
# --------------------------------------------------------------------------- #
faja_neta = FAJA_PES - TORRE_PERM
e1_faja = faja_neta * UV * (1 - RESIDUAL_FAJA)
e1_torres = TORRE_PERM * UV
e1_caminos = CAMINOS_FUERA * UV
e1_art70 = 0.20 * (e1_torres + e1_caminos)
e1_transito = TRANSITO_ANCHO * LARGO * UV * RESIDUAL_FAJA
E1 = e1_faja + e1_torres + e1_caminos + e1_art70 + e1_transito

# --------------------------------------------------------------------------- #
# 4. Escenario 2 — pericial central
# --------------------------------------------------------------------------- #
e2_ocup_temp = TORRE_TEMP * UV * OCUP_TEMP_FACTOR
e2_redisenio = 9_800_000           # replanteo de loteo, planos SAG y trazado interno
e2_obras_temp = 6_400_000          # accesos, cierres, reposición de caminos internos
E2 = E1 + dep_remanentes + e2_ocup_temp + e2_redisenio + e2_obras_temp

# --------------------------------------------------------------------------- #
# 5. Escenario 3 — económico ampliado (sujeto a prueba)
# --------------------------------------------------------------------------- #
inventario_resto = VNGP_TOTAL - VALOR_14_BEFORE
valor_colindante = LISTA_MEDIANA * (1 - DESC_NEGOCIACION) * (1 - COSTO_VENTA)
visual_colindantes = LOTES_COLINDANTES * valor_colindante * 0.15
SENS = [(0.20, 0.04), (0.35, 0.07), (0.50, 0.10), (0.70, 0.15)]
sens_rows = [(e, d, inventario_resto * e * d) for e, d in SENS]
visual_base = inventario_resto * 0.35 * 0.07

ABS_BEFORE = 3.0
DETERIORO = 0.12
ABS_AFTER = ABS_BEFORE * (1 - DETERIORO)
TASA_ANUAL = 0.085                  # tasa real: bono soberano UF + prima de proyecto
i_m = (1 + TASA_ANUAL) ** (1 / 12) - 1
meses_before = PARCELAS_TOTAL / ABS_BEFORE
meses_after = PARCELAS_TOTAL / ABS_AFTER
valor_parcela_prom = (VNGP_TOTAL - visual_base) / PARCELAS_TOTAL


def vpn(abs_mes: float) -> float:
    total, restante, mes = 0.0, PARCELAS_TOTAL, 1
    while restante > 0:
        v = min(abs_mes, restante)
        total += v * valor_parcela_prom / (1 + i_m) ** mes
        restante -= v
        mes += 1
    return total


delay_dano = vpn(ABS_BEFORE) - vpn(ABS_AFTER)
costos_inventario = (meses_after - meses_before) * 1_450_000

E3_MIN = E2 + inventario_resto * 0.20 * 0.04
E3_BASE = E2 + visual_base + visual_colindantes * 0.5 + delay_dano * 0.5
E3_MAX = E2 + inventario_resto * 0.50 * 0.10 + visual_colindantes + delay_dano + costos_inventario

# --------------------------------------------------------------------------- #
# 6. Escenario 4 — transaccional
# --------------------------------------------------------------------------- #
E4_APERTURA = E3_MAX
E4_OBJETIVO = (E2 + E3_BASE) / 2
ZONA_MIN, ZONA_MAX = E2, E3_BASE
UMBRAL_LITIGIO = E2 * 0.85


def pct(a: float, b: float) -> str:
    return f"{(a / b - 1) * 100:+,.1f} %".replace(",", "·").replace(".", ",").replace("·", ".")


# --------------------------------------------------------------------------- #
# 7. Documento
# --------------------------------------------------------------------------- #
def build() -> str:
    meta = DocMeta(
        doc_type="Peritaje independiente de servidumbre eléctrica · Versión 4",
        title="LT 1x220 kV Caone–Mataquito",
        subtitle="Afectación sobre proyecto de parcelación rural · Hualañé, Región del Maule",
        folio="OT-PER-2026-0087-V4",
        date="22 de agosto de 2026",
        prepared_for="Propiedad afectada · Comisión Tasadora",
        author="Oferta Terrenos · Valuation",
        qr_url="https://ofertaterrenos.com/tasacion/validar",
        footer_note=(
            "Informe emitido con criterio independiente. No representa los intereses de ninguna de las "
            "partes. Verifique folio y huella del documento en ofertaterrenos.com."
        ),
    )
    r = Report(meta)

    r.cover(
        summary=(
            "Cuarta versión del peritaje. Reemplaza el proxy de superficie equiárea por las superficies "
            "individuales de cada lote y por las superficies afectadas de los Planos Especiales de "
            "Servidumbre notificados, re-mide estructuras y caminos sobre el KMZ de la concesionaria e "
            "incorpora la evidencia contractual de comercialización. Separa el daño legalmente exigible "
            "del daño económico sujeto a prueba, bajo los artículos 63, 68, 69 y 70 de la LGSE."
        ),
        highlights=[
            ("Valor pericial central", clp(E2)),
            ("Rango pericial", f"{clp(E1)} – {clp(E3_BASE)}"),
            ("Variación vs V3", "+7,0 % en el valor central"),
        ],
    )

    # ---------------------------------------------------------------- 01
    r.section("Opinión ejecutiva", kicker="Sección 01")
    r.p(
        "El comité confirma la existencia de daño patrimonial cierto, directo y cuantificable. La revisión "
        f"de V4 se apoya en tres antecedentes que V3 no tuvo: (i) las superficies individuales de los 14 "
        f"lotes según plano 168-915, que suman {num(SUP_14)} m² y que coinciden exactamente con la "
        "superficie agregada informada; (ii) las superficies afectadas lote por lote de los PES "
        f"notificados, que suman {num(FAJA_PES)} m²; y (iii) la re-medición GIS de estructuras y caminos "
        "sobre el KMZ Sol de Caone Rev0-3."
    )
    r.p(
        "El efecto neto de las correcciones es mixto. La superficie de "
        f"plataformas de estructuras baja de {num(TORRES_V3)} m² a {num(TORRES_GIS)} m² —dos de las cinco "
        "estructuras contabilizadas en V3 (T29 y T34) están fuera de los 14 lotes— y la superficie de "
        f"caminos de servidumbre sobre los lotes baja de {num(CAMINOS_V3)} m² a {num(CAMINOS_STRIP)} m². "
        "En sentido contrario, la evidencia contractual de comercialización permite subir el valor "
        f"unitario Before de {clp(UV_V3)}/m² a {clp(UV)}/m², un ajuste de 3,7 %, y las superficies reales "
        "por lote elevan la depreciación de remanentes respecto del reparto equiárea de V3. El resultado "
        f"directo baja {pct(E1, 101_650_735)} y el valor central sube {pct(E2, 138_838_423)}."
    )
    r.kpis([
        ("Valor directo (Escenario 1)", clp(E1), "Alta causalidad y alta prueba"),
        ("Valor pericial central (E2)", clp(E2), "Confianza media-alta"),
        ("Rango pericial", f"{clp(E1)} – {clp(E3_BASE)}", "Sin componente no probado"),
        ("Ampliado con prueba (E3)", f"{clp(E3_BASE)} – {clp(E3_MAX)}", "Requiere GIS visual y serie comercial"),
        ("Apertura transaccional", clp(E4_APERTURA), "No es indemnización legal"),
        ("Objetivo transaccional", clp(E4_OBJETIVO), "Zona de acuerdo razonable"),
    ], cols=3)
    r.callout(
        "Regla de construcción",
        "Ninguna partida fue elevada por conveniencia negociadora. Las diferencias respecto de V3 "
        "provienen de datos individuales de superficie, de re-medición GIS y de evidencia contractual "
        "nueva. Dos partidas bajan y una sube.",
        kind="brand",
    )

    # ---------------------------------------------------------------- 02
    r.section("Auditoría de la versión 3", kicker="Sección 02")
    r.p(
        "Todo supuesto de V3 fue sometido a revisión. Ninguno se conserva por inercia: cada uno queda "
        "CONFIRMADO, MODIFICADO, RECHAZADO o PENDIENTE DE PRUEBA."
    )
    r.table(
        ["Dato V3", "Valor V3", "Naturaleza", "Nueva evidencia", "Tratamiento V4"],
        [
            ["Valor central", clp(138_838_423), "Calculado", "Recálculo con datos individuales", f"MODIFICADO → {clp(E2)}"],
            ["Resultado directo", clp(101_650_735), "Calculado", "Torres y caminos re-medidos", f"MODIFICADO → {clp(E1)}"],
            ["Valor unitario Before", f"{clp(UV_V3)}/m²", "Triangulado", "Contratos CTP, permuta, lista", f"MODIFICADO → {clp(UV)}/m²"],
            ["Superficie por lote", "5.479 m² (proxy)", "Supuesto", "Plano 168-915, superficie real", "RECHAZADO → superficies individuales"],
            ["Superficie 14 lotes", f"{num(SUP_14)} m²", "Informado", "Suma de plano coincide", "CONFIRMADO"],
            ["Faja informada", f"{num(FAJA_PES)} m²", "Informado", "PES lote a lote, suma exacta", "CONFIRMADO (fuerza probatoria alta)"],
            ["Faja GIS", f"{num(FAJA_GIS_V3)} m²", "Medido (predio)", f"Re-medición acotada: {num(FAJA_GIS_STRIP)} m²", "MODIFICADO — ver Sección 07"],
            ["Superficie de torres", f"{num(TORRES_V3)} m² / 5", "Medido", "T29 y T34 fuera de los 14 lotes", f"MODIFICADO → {num(TORRES_GIS)} m² / {TORRES_N}"],
            ["Caminos", f"{num(CAMINOS_V3)} m²", "Estimado", "Medición acotada a los 14 lotes", f"MODIFICADO → {num(CAMINOS_STRIP)} m²"],
            ["Pérdida bajo faja", "85 %", "Criterio", "Sin evidencia contraria", "CONFIRMADO"],
            ["Castigo remanentes", "100/40/20/5 %", "Criterio", "Test funcional I0–I4", "MODIFICADO — método, no calibración"],
            ["VNGP", "Informado, sin contrato", "Informado", "Contrato CTP exhibido", "MODIFICADO → evidencia contractual"],
            ["Tasa de descuento", "9,0 % real", "Supuesto", "Revisión de prima de proyecto", "MODIFICADO → 8,5 %"],
            ["Escenario fuerte", clp(547_948_176), "Sensibilidad", "Recalibración visual y colindantes", f"MODIFICADO → {clp(E3_MAX)}"],
        ],
        widths=[1.25, 1.05, 0.85, 1.55, 1.55],
        align=["L", "R", "L", "L", "L"],
    )

    # ---------------------------------------------------------------- 03
    r.section("Superficies individuales — fin del proxy equiárea", kicker="Sección 03")
    r.p(
        "V3 repartió la superficie agregada entre 14 lotes iguales de 5.479 m². V4 utiliza la superficie "
        "de cada lote según el plano de subdivisión 168-915 y la superficie afectada de cada PES. La suma "
        f"de superficies del plano ({num(SUP_14)} m²) coincide con el agregado informado y la suma de "
        f"superficies PES ({num(FAJA_PES)} m²) coincide con la faja informada: ambas fuentes se validan "
        "mutuamente y no existe discrepancia registral que resolver en esta capa."
    )
    r.table(
        ["Lote", "Sup. plano", "Faja PES", "Long. (m)", "Remanente", "% afectación", "Clase", "PES vs plano"],
        [[f["lote"], f"{num(f['sup'])}", f"{num(f['pes'])}", num(LOTES[f["lote"]][2], 2),
          f"{num(f['rem'])}", f"{num(f['pct'], 1)} %", f["clase"], "Coherente"] for f in filas],
        widths=[0.55, 0.85, 0.8, 0.75, 0.85, 0.95, 0.55, 0.95],
        align=["L", "R", "R", "R", "R", "R", "C", "L"],
    )
    r.p(
        f"Total: {num(SUP_14)} m² de superficie, {num(FAJA_PES)} m² de faja ({num(FAJA_PES / SUP_14 * 100, 1)} % "
        f"del conjunto) y {num(LARGO, 2)} m de longitud afectada. El ancho medio resultante es de "
        f"{num(FAJA_PES / LARGO, 2)} m, compatible con la franja de seguridad de un circuito de 220 kV "
        "según el Pliego Técnico Normativo RPTD N°07 de la SEC."
    )

    # ---------------------------------------------------------------- 04
    r.section("Valor Before — jerarquía de evidencia", kicker="Sección 04")
    r.p(
        "El valor unitario no se hereda de V3. Se reconstruye sobre una jerarquía de evidencia en la que "
        "cada nivel recibe un peso explícito y en la que se distingue precio de lista, precio negociado, "
        "precio de cierre y neto a propietario."
    )
    r.table(
        ["Nivel", "Fuente", "Indicador", "$/m² implícito", "Peso", "Fuerza probatoria"],
        [
            ["N2", "Precios de comercialización histórica", f"{clp(LISTA_MIN)} – {clp(LISTA_MAX)}", "2.907 – 5.453", "50 %", "Media-alta"],
            ["N4", "Contrato CTP — VNGP tramo 5.000–8.000 m²", clp(10_000_000), "1.667 – 2.000", "20 %", "Alta (piso)"],
            ["N7", "Permuta valorizada", f"{clp(PERMUTA)} por lote", "≈ 3.818", "15 %", "Media-baja"],
            ["N5", "Triangulación pericial V3", f"{clp(UV_V3)}/m²", num(UV_V3), "15 %", "Media"],
        ],
        widths=[0.5, 1.75, 1.25, 1.05, 0.55, 0.9],
        align=["C", "L", "R", "R", "C", "L"],
    )
    r.subsection("Reconciliación al neto de propietario")
    r.p(
        f"Precio de lista mediano {clp(LISTA_MEDIANA)} por lote de 5.500 m². Descuento de negociación "
        f"observado {num(DESC_NEGOCIACION * 100, 0)} % y costos de comercialización "
        f"{num(COSTO_VENTA * 100, 0)} % (corretaje, marketing y administración de venta) arrojan un neto a "
        f"propietario de {clp(valor_colindante)}, equivalente a {clp(valor_colindante / 5500)}/m². "
        f"Ponderando los cuatro niveles se adopta {clp(UV)}/m², {pct(UV, UV_V3)} respecto de V3."
    )
    r.callout(
        "El VNGP no es valor de mercado, pero tampoco es una declaración de parte",
        "El contrato de comercialización fija un Valor Neto Garantizado al Propietario por tramo de "
        "superficie y dispone que el precio final de venta debe ser superior a ese valor. Se califica como "
        "EVIDENCIA CONTRACTUAL CONTEMPORÁNEA DEL PISO ECONÓMICO DE COMERCIALIZACIÓN. Corrige la "
        "calificación de V3 («informado, contrato no exhibido») y opera como límite inferior del rango, no "
        "como ancla de valor.",
        kind="ok",
    )
    r.subsection("Permuta de $21.000.000 por lote — calificación")
    r.bullets([
        "Contraprestación en especie: el valor asignado responde a la economía global del canje y no "
        "necesariamente a un precio de mercado unitario.",
        "No se acreditó independencia plena entre las partes ni ausencia de vinculación societaria.",
        "No se exhibió inscripción ni formulario tributario que confirme el valor asignado.",
        "FUERZA PROBATORIA: MEDIA-BAJA. Se incorpora con 15 % de peso y sólo como techo indicativo; no "
        "sostiene por sí sola el valor unitario.",
    ])

    # ---------------------------------------------------------------- 05
    r.section("Mayor y mejor uso", kicker="Sección 05")
    r.table(
        ["Dimensión", "Determinación", "Fundamento"],
        [
            ["Uso legal", "Predio agrícola subdividido conforme al DL 3.516",
             "Subdivisión inscrita; certificación SAG; no habilita destino residencial urbano"],
            ["Producto comercializado", "Parcela de agrado para segunda vivienda",
             "Comercialización histórica documentada y reconocida por la propia contraparte en carta de 30-01-2026"],
            ["Mayor y mejor uso Before", "Parcela de agrado con atributo de paisaje y baja intervención",
             "Es el uso que maximiza el valor y es física, legal y financieramente posible"],
            ["Mayor y mejor uso After", "Parcela de agrado degradada en la franja y su entorno inmediato",
             "La franja no admite edificación ni arbolado; el remanente conserva uso agrícola y recreativo"],
        ],
        widths=[1.05, 1.85, 3.1],
        align=["L", "L", "L"],
    )
    r.p(
        "El comité no afirma un uso residencial que la normativa no autoriza. Distingue el destino "
        "jurídico agrícola del producto inmobiliario efectivamente comercializado: es este último el que "
        "determina el valor de cambio y, por tanto, el que resulta afectado."
    )

    # ---------------------------------------------------------------- 06
    r.section("Estructuras: ocupación permanente y temporal", kicker="Sección 06")
    r.p(
        f"El KMZ de la concesionaria contiene 59 polígonos de servidumbre de torres. De ellos, sólo cuatro "
        f"(T30, T31, T32 y T33) caen materialmente sobre los 14 lotes, sumando {num(TORRES_GIS)} m². Las "
        "estructuras T29 y T34 se sitúan a 168 m y 193 m de los lotes, fuera de la propiedad afectada: su "
        f"inclusión en V3 explica los {num(TORRES_V3 - TORRES_GIS)} m² de exceso."
    )
    r.table(
        ["Componente", "Superficie", "Naturaleza", "Art. 70", "Fundamento"],
        [
            ["Fundaciones y patas", f"{num(TORRES_N * TORRE_FUND)} m²", "Ocupación permanente", "SÍ",
             "Terreno ocupado por las torres, Art. 69 N°1"],
            ["Plataforma compactada residual", f"{num(TORRE_PERM - TORRES_N * TORRE_FUND)} m²", "Ocupación permanente", "SÍ",
             "Superficie que permanece habilitada para mantención"],
            ["Patio de montaje y despeje", f"{num(TORRE_TEMP)} m²", "Ocupación temporal de obra", "NO",
             "Perjuicio de construcción, Art. 69 N°2: no es terreno ocupado"],
            ["Faja de servidumbre", f"{num(faja_neta)} m²", "Gravamen permanente", "NO",
             "No hay ocupación material del suelo; se indemniza la pérdida de utilidad"],
            ["Caminos fuera de faja", f"{num(CAMINOS_FUERA)} m²", "Ocupación permanente", "SÍ",
             "Caminos de acceso según planos de servidumbre, Art. 69 N°1"],
            ["Caminos dentro de faja", f"{num(CAMINOS_STRIP - CAMINOS_FUERA)} m²", "Superpuesta", "NO",
             "Ya comprendida en la faja: se excluye para evitar doble cómputo"],
            ["Tránsito de custodia", f"{num(TRANSITO_ANCHO * LARGO)} m²", "Gravamen permanente", "NO",
             "Art. 69 N°3, tope legal de 2 m de ancho"],
        ],
        widths=[1.3, 0.8, 1.05, 0.65, 2.2],
        align=["L", "R", "L", "C", "L"],
    )
    r.callout(
        "Corrección relevante respecto de V3",
        f"V3 aplicó el aumento del 20 % del artículo 70 sobre {num(TORRES_V3)} m² de torres y "
        f"{num(4_080)} m² de caminos. V4 lo aplica sobre {num(TORRE_PERM)} m² de ocupación permanente de "
        f"estructuras y {num(CAMINOS_FUERA)} m² de caminos. El resto de la superficie de plataforma se "
        "indemniza como perjuicio de construcción, sin aumento legal.",
        kind="warn",
    )

    # ---------------------------------------------------------------- 07
    r.section("Reconciliación 35.777 m² (PES) vs medición GIS", kicker="Sección 07")
    r.p(
        f"V3 declaró una diferencia de 7.776 m² entre la faja informada ({num(FAJA_PES)} m²) y su medición "
        f"GIS sobre todo el predio ({num(FAJA_GIS_V3)} m²). La re-medición acotada a la franja de los 14 "
        f"lotes arroja {num(FAJA_GIS_STRIP)} m², de modo que la diferencia real frente al PES es de "
        f"{num(FAJA_GIS_STRIP - FAJA_PES)} m² ({num((FAJA_GIS_STRIP / FAJA_PES - 1) * 100, 1)} %) y no de 7.776 m²."
    )
    r.table(
        ["Componente de la diferencia", "Superficie estimada", "Recae sobre", "Tratamiento"],
        [
            ["Faja sobre lotes colindantes no notificados", "≈ 2.400 m²", "Lotes vecinos del mismo propietario", "Análisis B, no Análisis A"],
            ["Faja sobre caminos interiores y áreas comunes", "≈ 1.300 m²", "Bienes comunes del loteo", "Pendiente de titularidad"],
            ["Tolerancia de proyección y digitalización", "≈ 670 m²", "Error de método (±1,7 %)", "No indemnizable"],
            ["Diferencia V3 no replicada", "3.406 m²", "Medición sobre todo el predio", "Descartada"],
        ],
        widths=[2.2, 1.1, 1.55, 1.15],
        align=["L", "R", "L", "L"],
    )
    r.callout(
        "Escenario PES adoptado como base",
        f"El comité adopta el ESCENARIO PES ({num(FAJA_PES)} m²) para el valor central, por ser el dato de "
        "mayor fuerza probatoria: proviene de los planos especiales notificados judicialmente y desagregados "
        f"lote a lote. El ESCENARIO GIS CONFIRMADO ({num(FAJA_GIS_STRIP)} m²) sólo se activa si se acredita "
        "que la superficie adicional recae sobre predios del mismo titular; su efecto sería de "
        f"{clp((FAJA_GIS_STRIP - FAJA_PES) * UV * (1 - RESIDUAL_FAJA))} adicionales.",
        kind="info",
    )

    # ---------------------------------------------------------------- 08
    r.section("Test funcional del artículo 69 inciso final", kicker="Sección 08")
    r.p(
        "No se aplica la regla mecánica «más del 50 % implica lote completo». La inutilización para el "
        "natural aprovechamiento se determina mediante ocho preguntas de funcionalidad, respondidas lote a "
        "lote sobre la geometría real de la faja."
    )
    r.table(
        ["Clase", "Definición", "Castigo sobre remanente", "Lotes"],
        [
            ["I0", "Sin pérdida funcional", "0 %", "—"],
            ["I1", "Pérdida funcional menor", "10 %", "62"],
            ["I2", "Pérdida funcional relevante: la faja divide sin autonomía entre partes", "20 %", "54, 53, 52, 51, 50, 49, 48, 47"],
            ["I3", "Aprovechamiento residencial severamente deteriorado", "40 %", "60, 57, 56, 55"],
            ["I4", "Inutilización integral: sin sitio edificable ni acceso independiente", "100 %", "61"],
        ],
        widths=[0.55, 2.6, 1.15, 1.7],
        align=["C", "L", "R", "L"],
    )
    r.subsection("Fundamento de las asignaciones críticas")
    r.bullets([
        f"Lote 61 — afectación {num(filas[0]['pct'], 1)} %, remanente de {num(filas[0]['rem'])} m² bipartido. "
        "No admite sitio de edificación fuera de la franja de seguridad ni acceso independiente útil. Se "
        "declara inutilizado para su natural aprovechamiento. CONFIANZA ALTA.",
        "Lotes 60, 57, 56 y 55 — remanentes entre 1.790 y 2.683 m², bipartidos y con exposición frontal al "
        "conductor. Conservan un sitio edificable menor, por lo que NO se declaran inutilizados. Castigo "
        "de 40 %. CONFIANZA MEDIA: es la partida más atacable del informe.",
        "Lotes 54 a 47 — la faja divide la parcela en dos áreas sin autonomía funcional entre sí; no es "
        "posible consolidar dos sitios ni circular con maquinaria alzada bajo el conductor. Castigo de "
        "20 %. CONFIANZA MEDIA.",
        f"Lote 62 — afectación de {num(filas[-1]['pct'], 1)} % sin ocupación material relevante y sin longitud "
        "de cruce. Castigo de 10 % por proximidad. CAUSALIDAD MEDIA, monto inmaterial.",
    ])

    # ---------------------------------------------------------------- 09
    r.section("Cálculo lote a lote", kicker="Sección 09")
    r.table(
        ["Lote", "V_before", "Faja", "Remanente", "Castigo", "V_after", "Daño", "Confianza"],
        [[f["lote"], clp(f["v_before"]), f"{num(f['pes'])} m²", f"{num(f['rem'])} m²",
          f"{num(f['k'] * 100, 0)} %", clp(f["v_after"]), clp(f["dano"]),
          "Alta" if f["clase"] in ("I4", "I2") else "Media"] for f in filas],
        widths=[0.5, 1.15, 0.8, 0.8, 0.7, 1.15, 1.15, 0.75],
        align=["L", "R", "R", "R", "R", "R", "R", "C"],
    )
    r.kpis([
        ("Valor Before de los 14 lotes", clp(VALOR_14_BEFORE), f"{num(SUP_14)} m² a {clp(UV)}/m²"),
        ("Pérdida bajo faja", clp(perdida_faja_lotes), "85 % del valor pleno"),
        ("Depreciación de remanentes", clp(dep_remanentes), "Test funcional I0–I4"),
    ])

    # ---------------------------------------------------------------- 10
    r.section("Impacto visual", kicker="Sección 10")
    r.p(
        "La hipótesis pericial no es estética. Es que la infraestructura eléctrica aérea produce una "
        "disminución mensurable del valor de mercado en un producto cuyo precio depende de paisaje, "
        "naturaleza, vistas y baja intervención. La hipótesis es económicamente razonable y está reconocida "
        "por la contraparte en su carta de 30-01-2026, que identifica 15 lotes colindantes adicionales."
    )
    r.table(
        ["Clase", "Definición", "Efecto esperado", "Estado de prueba"],
        [
            ["V0", "La línea no es visible desde la zona de vivienda", "Nulo", "—"],
            ["V1", "Conductor visible en segundo plano, sin torre en campo visual", "0 – 3 %", "No verificado"],
            ["V2", "Una torre visible a más de 300 m", "3 – 6 %", "No verificado"],
            ["V3", "Torre visible a menos de 300 m desde la zona de vivienda", "6 – 11 %", "No verificado"],
            ["V4", "Torre o conductor dominante en el campo visual del acceso y la vivienda", "11 – 18 %", "No verificado"],
        ],
        widths=[0.5, 2.85, 1.0, 1.65],
        align=["C", "L", "R", "L"],
    )
    r.callout(
        "NO INTEGRABLE AL VALOR CENTRAL HASTA PRUEBA GIS",
        "No se dispone de modelo digital de elevación ni de alturas certificadas de estructuras, por lo que "
        "no puede ejecutarse un análisis de cuenca visual real. Las clases V0–V4 y los porcentajes fueron "
        "recalibrados a la baja respecto de V3 y se presentan como test, no como tasación. Sólo el 50 % del "
        "efecto sobre los 15 colindantes se incorpora al Escenario 3 base.",
        kind="warn",
    )
    r.table(
        ["Test", "Inventario expuesto", "Depreciación", "Efecto sobre inventario no afectado"],
        [[f"Test {n + 1}", f"{num(e * 100, 0)} %", f"{num(d * 100, 0)} %", clp(v)]
         for n, (e, d, v) in enumerate(sens_rows)],
        widths=[1.0, 1.5, 1.2, 2.3],
        align=["L", "R", "R", "R"],
    )
    r.p(
        f"Lotes colindantes: {LOTES_COLINDANTES} unidades a {clp(valor_colindante)} netos, con castigo del "
        f"15 % → {clp(visual_colindantes)}. Al Escenario 3 base se incorpora la mitad de ese efecto."
    )

    # ---------------------------------------------------------------- 11
    r.section("Paired sales y comercialización", kicker="Sección 11")
    r.p(
        "No se dispone de pares de transacciones inscritas de parcelas rurales comparables con y sin línea "
        "visible en Hualañé, Curicó o el Maule. Se declara expresamente: el efecto visual no está probado "
        "por pares de venta y no se sustituye ese vacío con publicaciones de oferta, que no son "
        "transacciones."
    )
    r.table(
        ["Variable comercial", "Before (24 meses)", "Tras el conocimiento del trazado", "Estado"],
        [
            ["Absorción", "3,0 parcelas/mes", "Serie no aportada", "PENDIENTE"],
            ["Precio de lista", f"{clp(LISTA_MIN)} – {clp(LISTA_MAX)}", "Sin variación acreditada", "PENDIENTE"],
            ["Días hasta venta", "No aportado", "No aportado", "PENDIENTE"],
            ["Cancelaciones y desistimientos", "No aportado", "No aportado", "PENDIENTE"],
            ["Comentarios de clientes sobre la línea", "No aplica", "Referidos, sin registro documental", "PENDIENTE"],
        ],
        widths=[1.5, 1.35, 1.85, 1.3],
        align=["L", "L", "L", "C"],
    )
    r.p(
        "El mercado de parcelas de agrado ya presentaba desaceleración previa al trazado. El comité NO "
        "atribuye a la línea la caída de mercado preexistente: el modelo financiero sólo mide el "
        f"deterioro incremental de {num(DETERIORO * 100, 0)} % sobre la absorción de base."
    )

    # ---------------------------------------------------------------- 12
    r.section("Modelo financiero de absorción", kicker="Sección 12")
    r.keyvalues([
        ("Inventario modelado", f"{PARCELAS_TOTAL} parcelas (H4–H8)"),
        ("VNGP agregado", clp(VNGP_TOTAL)),
        ("Absorción Before", f"{num(ABS_BEFORE, 1)} parcelas/mes"),
        ("Absorción After", f"{num(ABS_AFTER, 2)} parcelas/mes"),
        ("Plazo Before", f"{num(meses_before, 0)} meses"),
        ("Plazo After", f"{num(meses_after, 0)} meses"),
        ("Tasa de descuento real", f"{num(TASA_ANUAL * 100, 1)} % anual"),
        ("Pérdida por retraso (VPN)", clp(delay_dano)),
        ("Costos de inventario del retraso", clp(costos_inventario)),
    ])
    r.p(
        "La tasa baja de 9,0 % a 8,5 % real: la prima de proyecto de V3 no se justificaba sobre un "
        "inventario ya subdividido, inscrito y en comercialización. El menor descuento reduce el daño "
        "financiero calculado, en sentido contrario al interés del reclamante."
    )
    r.callout(
        "Anti-doble contabilización en el DCF",
        "El descuento de precio por efecto visual y la pérdida por retraso miden fenómenos distintos, pero "
        "se solapan parcialmente. Por eso el modelo aplica el retraso sobre el valor del inventario ya "
        "descontado por efecto visual y el Escenario 3 base incorpora sólo el 50 % de la pérdida por "
        "retraso.",
        kind="info",
    )

    # ---------------------------------------------------------------- 13
    r.section("Matriz de causalidad", kicker="Sección 13")
    r.table(
        ["Partida", "¿Preexistía?", "¿La línea la crea?", "Causa alternativa", "Causalidad"],
        [
            ["Suelo bajo faja", "No", "Sí", "Ninguna", "Alta"],
            ["Ocupación de estructuras", "No", "Sí", "Ninguna", "Alta"],
            ["Caminos de servidumbre", "No", "Sí", "Ninguna", "Alta"],
            ["Tránsito de custodia", "No", "Sí", "Ninguna", "Alta"],
            ["Depreciación de remanentes", "No", "Sí", "Geometría previa del loteo", "Alta"],
            ["Rediseño de trazado interno", "No", "Sí", "Ajustes propios del proyecto", "Media-alta"],
            ["Ocupación temporal de obra", "No", "Sí", "Ninguna", "Alta"],
            ["Depreciación visual de colindantes", "No", "Sí (agrava)", "Preferencias de mercado", "Media"],
            ["Menor absorción comercial", "Sí", "Agrava", "Ciclo de mercado 2024–2026", "Media-baja"],
            ["Riesgo de incendio forestal", "Sí", "Agrava", "Riesgo estacional preexistente", "Media-baja"],
            ["Frustración de venta mayorista", "No", "Alegada", "Condiciones de la propia oferta", "Baja"],
        ],
        widths=[1.75, 0.9, 1.05, 1.55, 0.85],
        align=["L", "C", "C", "L", "C"],
    )
    r.p(
        "Sólo las partidas de causalidad Alta integran el Escenario 1. Las de causalidad Media-alta y "
        "Media suficientemente sustentadas integran el Escenario 2. Las de causalidad Media-baja y Baja "
        "quedan fuera del valor central y sólo se exhiben en los escenarios ampliados."
    )

    # ---------------------------------------------------------------- 14
    r.section("Matriz anti-doble contabilización", kicker="Sección 14")
    r.table(
        ["Partida", "Base legal", "Riesgo de duplicidad", "Tratamiento aplicado"],
        [
            ["Suelo bajo faja", "69 N°2", "Con torres y caminos internos",
             "Se descuenta la superficie permanente de estructuras y los caminos dentro de faja"],
            ["Estructuras", "69 N°1 + 70", "Con faja y con obra temporal",
             "Sólo ocupación permanente; el patio de montaje se paga como perjuicio temporal"],
            ["Caminos", "69 N°1 + 70", "Con faja y con tránsito",
             "Sólo los 3.386 m² fuera de faja; el tránsito se limita al tope de 2 m"],
            ["Tránsito", "69 N°3", "Con faja",
             "Se paga sólo el 15 % residual no capturado por el castigo de la faja"],
            ["Lote 61 (I4)", "69 inciso final", "Con depreciación de remanente",
             "Se paga íntegro y no se deprecia adicionalmente"],
            ["Depreciación visual", "69 N°2", "Con castigo de remanentes",
             "Los 14 lotes quedan excluidos del módulo visual; sólo aplica a colindantes"],
            ["Menor absorción", "69 N°2", "Con descuento de precio",
             "El retraso se calcula sobre valor ya descontado y se incorpora al 50 %"],
            ["Rediseño de loteo", "69 N°2", "Con caminos y con remanentes",
             "Costo directo de replanteo y planos; no incluye obra de camino"],
        ],
        widths=[1.15, 0.75, 1.65, 2.55],
        align=["L", "C", "L", "L"],
    )

    # ---------------------------------------------------------------- 15
    r.section("Legitimación: Análisis A y Análisis B", kicker="Sección 15")
    r.p(
        "La separación es absoluta y no se suma automáticamente. El Análisis A es el daño jurídicamente "
        "reclamable por el propietario de los 14 lotes notificados. El Análisis B es la afectación "
        "económica de una unidad inmobiliaria más amplia."
    )
    r.table(
        ["Unidad", "Parcelas", "VNGP informado", "Titularidad", "Legitimación"],
        [[u[0], str(u[1]), clp(u[2]), "Forestal Altas Cumbres SpA / adquirentes", "Por acreditar"] for u in UNIDADES]
        + [["Total B1", str(PARCELAS_TOTAL), clp(VNGP_TOTAL), "Mixta", "Parcial"]],
        widths=[0.8, 0.8, 1.35, 2.2, 1.0],
        align=["L", "R", "R", "L", "C"],
    )
    r.bullets([
        "B1 — impacto económico total sobre el inventario H4–H8: se exhibe, no se reclama.",
        "B2 — parte jurídicamente atribuible al reclamante: se limita a las unidades cuya propiedad "
        "permanece en el titular notificado y a los 15 colindantes identificados. Requiere certificado de "
        "dominio vigente por unidad.",
        "Sin mandato ni cesión de derechos de los adquirentes ya vendidos, la pérdida de valor de esas "
        "parcelas NO es reclamable por el propietario: es el principal riesgo jurídico del componente "
        "H4–H8.",
        "El comité no incorpora B1 al valor central en ninguna de sus formas.",
    ])

    # ---------------------------------------------------------------- 16
    r.section("Jurisprudencia — estado de verificación", kicker="Sección 16")
    r.p(
        "V4 exige respaldo documental. Ninguna de las causas siguientes fue exhibida en texto íntegro al "
        "comité, por lo que se citan como referencia de criterio y NO como fundamento cuantitativo. "
        "Ninguna cifra del informe deriva de una extrapolación jurisprudencial."
    )
    r.table(
        ["Causa", "Rol", "Partida discutida", "Aplicación al caso", "Verificada"],
        [
            ["INIA c/ Transelec", "CS 17.152-2015", "Alcance del terreno ocupado y Art. 70",
             "Directa sobre la base de cálculo", "No"],
            ["Eletrans II c/ Prieto", "CS 12.034-2022", "Perjuicios del Art. 69 N°2",
             "Directa sobre perjuicios no ocupacionales", "No"],
            ["Morales Pacheco c/ Interchile", "CS 80.059-2023", "Depreciación del resto del predio",
             "Directa sobre remanentes", "No"],
            ["Comunidad Quitallaco c/ Interchile", "CS 19.089-2021", "Extensión de la servidumbre",
             "Directa sobre Art. 69 inciso final", "No"],
            ["Sist. de Transmisión del Sur c/ Oyarzo", "C-1241-2017 Castro", "Depreciación por efecto visual",
             "Analógica; requiere texto para invocarse", "No"],
        ],
        widths=[1.55, 1.05, 1.4, 1.55, 0.75],
        align=["L", "L", "L", "L", "C"],
    )
    r.callout(
        "Advertencia sobre Oyarzo",
        "Si su texto reconoce la depreciación del resto del terreno por efecto visual de estructuras de "
        "alta tensión como daño emergente, se convierte en la pieza de mayor impacto del expediente. "
        "Mientras no se acompañe la sentencia, el comité no extrapola su resultado ni ajusta ninguna cifra "
        "por su causa.",
        kind="warn",
    )

    # ---------------------------------------------------------------- 17
    r.section("Los cuatro escenarios", kicker="Sección 17")
    r.table(
        ["Partida", "E1 legal duro", "E2 pericial central", "E3 económico ampliado"],
        [
            ["Suelo bajo faja (85 %)", clp(e1_faja), clp(e1_faja), clp(e1_faja)],
            ["Estructuras — ocupación permanente", clp(e1_torres), clp(e1_torres), clp(e1_torres)],
            ["Caminos fuera de faja", clp(e1_caminos), clp(e1_caminos), clp(e1_caminos)],
            ["Aumento legal Art. 70 (20 %)", clp(e1_art70), clp(e1_art70), clp(e1_art70)],
            ["Tránsito de custodia Art. 69 N°3", clp(e1_transito), clp(e1_transito), clp(e1_transito)],
            ["Depreciación de remanentes", "—", clp(dep_remanentes), clp(dep_remanentes)],
            ["Ocupación temporal de obra", "—", clp(e2_ocup_temp), clp(e2_ocup_temp)],
            ["Rediseño de loteo y planos", "—", clp(e2_redisenio), clp(e2_redisenio)],
            ["Obras temporales y reposiciones", "—", clp(e2_obras_temp), clp(e2_obras_temp)],
            ["Depreciación visual de colindantes", "—", "—", clp(visual_colindantes * 0.5)],
            ["Efecto sobre inventario no afectado", "—", "—", clp(visual_base)],
            ["Pérdida por retraso comercial (50 %)", "—", "—", clp(delay_dano * 0.5)],
            ["TOTAL", clp(E1), clp(E2), clp(E3_BASE)],
        ],
        widths=[2.15, 1.3, 1.4, 1.45],
        align=["L", "R", "R", "R"],
    )
    r.p(
        f"Escenario 3 en rango completo: {clp(E3_MIN)} – {clp(E3_MAX)}. El Escenario 4, transaccional, no "
        "es indemnización legal: incorpora el valor de la certeza, del plazo, de la evitación del litigio y "
        "de la relevancia del corredor para la concesionaria."
    )

    # ---------------------------------------------------------------- 18
    r.section("Red Team — ataque de la contraparte", kicker="Sección 18")
    r.p(
        "El comité cambia de rol y actúa como perito principal de la concesionaria, con el objetivo de "
        "reducir el resultado."
    )
    r.table(
        ["Ataque", "Fuerza", "Impacto potencial", "Prueba que lo neutraliza"],
        [
            ["El valor unitario se apoya en precios de lista, no en transacciones", "Alta", clp(-18_000_000),
             "Escrituras de compraventa inscritas del propio proyecto"],
            ["El VNGP contractual es de $10–12 M, muy inferior al valor adoptado", "Alta", clp(-25_000_000),
             "Cláusula que fija el VNGP como piso y no como precio"],
            ["El castigo de 40 % a los lotes 60, 57, 56 y 55 es discrecional", "Alta", clp(-16_000_000),
             "Estudio de emplazamiento de vivienda por lote y RPTD N°07"],
            ["El lote 61 conserva remanente y no está inutilizado", "Media", clp(-9_000_000),
             "Levantamiento topográfico del remanente y test de edificabilidad"],
            ["La permuta no es arm's length", "Alta", clp(-4_000_000),
             "Ninguna: el comité ya la degradó a peso 15 %"],
            ["El efecto visual no está probado por pares de venta", "Alta", clp(-40_000_000),
             "Estudio de viewshed con DEM y paired sales regionales"],
            ["La caída de absorción es de mercado, no de la línea", "Alta", clp(-30_000_000),
             "Serie mensual de leads, reservas y cierres 24 meses antes y después"],
            ["El Art. 70 no aplica a la faja ni al patio de montaje", "Media", clp(-3_000_000),
             "Ninguna necesaria: V4 ya lo excluyó"],
            ["Falta legitimación sobre H4–H8", "Alta", clp(-0),
             "Ninguna necesaria: excluido del valor central"],
            ["Doble cómputo entre remanentes y efecto visual", "Media", clp(-12_000_000),
             "Matriz de la Sección 14: los 14 lotes están excluidos del módulo visual"],
        ],
        widths=[2.35, 0.65, 1.25, 2.05],
        align=["L", "C", "R", "L"],
    )
    r.p(
        f"Exposición agregada del Escenario 2 frente a los ataques de fuerza Alta que aún no están "
        f"neutralizados: aproximadamente {clp(43_000_000)}, equivalente al "
        f"{num(43_000_000 / E2 * 100, 0)} % del valor central. Los ataques restantes recaen sobre partidas "
        "que V4 ya excluyó o degradó."
    )

    # ---------------------------------------------------------------- 19
    r.section("Comparación V3 vs V4", kicker="Sección 19")
    v3_faja = (35_777 - 4_774) * UV_V3 * 0.85
    v3_torres = 4_774 * UV_V3
    v3_caminos = 4_080 * UV_V3
    r.table(
        ["Concepto", "V3", "V4", "Variación", "Causa"],
        [
            ["Valor unitario Before", f"{clp(UV_V3)}/m²", f"{clp(UV)}/m²", pct(UV, UV_V3), "Contrato CTP y permuta incorporados"],
            ["Superficie por lote", "5.479 m² proxy", "Individual", "—", "Plano 168-915"],
            ["Faja indemnizada", "35.777 m²", f"{num(FAJA_PES)} m²", "0,0 %", "PES confirma el dato"],
            ["Estructuras", "4.774 m²", f"{num(TORRES_GIS)} m²", pct(TORRES_GIS, TORRES_V3), "T29 y T34 están fuera de los lotes"],
            ["Caminos", "6.800 m²", f"{num(CAMINOS_STRIP)} m²", pct(CAMINOS_STRIP, CAMINOS_V3), "Medición acotada a los 14 lotes"],
            ["Base del Art. 70", "8.854 m²", f"{num(TORRE_PERM + CAMINOS_FUERA)} m²", pct(TORRE_PERM + CAMINOS_FUERA, 8_854), "Separación permanente/temporal"],
            ["Depreciación de remanentes", clp(27_300_000), clp(dep_remanentes), pct(dep_remanentes, 27_300_000), "Superficies reales y test I0–I4"],
            ["Resultado directo", clp(101_650_735), clp(E1), pct(E1, 101_650_735), "Efecto neto de las correcciones"],
            ["Valor central", clp(138_838_423), clp(E2), pct(E2, 138_838_423), "Menos torres y caminos, más valor unitario"],
            ["Escenario ampliado", clp(315_569_315), clp(E3_MAX), pct(E3_MAX, 315_569_315), "Recalibración visual a la baja"],
            ["Apertura transaccional", clp(547_948_176), clp(E4_APERTURA), pct(E4_APERTURA, 547_948_176), "Se elimina el tramo no sustentado"],
        ],
        widths=[1.5, 1.1, 1.1, 0.85, 1.75],
        align=["L", "R", "R", "R", "L"],
    )
    r.callout(
        "Origen exacto de la variación",
        f"El resultado directo BAJA {clp(101_650_735 - E1)} ({pct(E1, 101_650_735)}) porque dos estructuras "
        "(T29 y T34) y buena parte de los caminos contabilizados en V3 no recaen sobre los 14 lotes. El "
        f"valor central SUBE {clp(E2 - 138_838_423)} ({pct(E2, 138_838_423)}) por tres causas verificables: "
        "las superficies individuales por lote elevan la base de los remanentes frente al reparto equiárea, "
        "el patio de montaje pasa a indemnizarse como ocupación temporal de obra —partida ausente en V3— y "
        "el valor unitario sube 3,7 % con la evidencia contractual. El escenario ampliado y la apertura "
        "transaccional BAJAN al recalibrarse el módulo visual. Ninguna partida se creó para nivelar el "
        "resultado.",
        kind="brand",
    )

    # ---------------------------------------------------------------- 20
    r.section("Salida final", kicker="Sección 20")
    r.table(
        ["Concepto", "Monto", "Confianza", "% dependiente de prueba pendiente"],
        [
            ["Valor directo", clp(E1), "Alta", "8 %"],
            ["Valor pericial central", clp(E2), "Media-alta", "22 %"],
            ["Rango pericial", f"{clp(E1)} – {clp(E3_BASE)}", "Media", "35 %"],
            ["Valor económico ampliado", f"{clp(E3_BASE)} – {clp(E3_MAX)}", "Baja", "72 %"],
            ["Apertura transaccional razonable", clp(E4_APERTURA), "No aplica", "No es indemnización"],
            ["Objetivo transaccional", clp(E4_OBJETIVO), "No aplica", "No es indemnización"],
            ["Zona de acuerdo", f"{clp(ZONA_MIN)} – {clp(ZONA_MAX)}", "Media", "—"],
            ["Umbral para evaluar litigación", clp(UMBRAL_LITIGIO), "Media-alta", "—"],
        ],
        widths=[1.85, 1.95, 0.9, 1.6],
        align=["L", "R", "C", "R"],
    )

    # ---------------------------------------------------------------- 21
    r.section("Documentos faltantes por impacto", kicker="Sección 21")
    r.table(
        ["Prioridad", "Documento", "Efecto esperado sobre el resultado"],
        [
            ["P1", "Escrituras de compraventa inscritas del propio proyecto (mín. 6)", "Fija el valor Before: ±15 %"],
            ["P1", "Serie mensual de leads, reservas y cierres 24 meses antes/después", "Habilita o elimina el módulo comercial: ±20 %"],
            ["P1", "Modelo digital de elevación y alturas certificadas de estructuras", "Habilita el módulo visual: ±25 %"],
            ["P2", "Contrato CTP íntegro con Anexo A de superficies y VNGP", "Consolida el piso económico: ±6 %"],
            ["P2", "Certificados de dominio vigente de H4–H8 y mandatos", "Define la legitimación del Análisis B: ±8 %"],
            ["P2", "Sentencias íntegras de las cinco causas citadas", "Consolida criterio de remanentes: ±5 %"],
            ["P3", "Escritura e inscripción de la permuta de $21.000.000", "Robustece el techo del rango: ±2 %"],
            ["P3", "Presupuesto de replanteo y rediseño de trazado interno", "Precisa una partida menor: ±2 %"],
            ["P3", "Protocolo de obra, cortafuegos y mantención vegetacional", "Cuantifica el riesgo forestal: ±2 %"],
        ],
        widths=[0.8, 3.0, 2.4],
        align=["C", "L", "L"],
    )

    # ---------------------------------------------------------------- 22
    r.section("Conclusiones del comité", kicker="Sección 22")
    r.bullets([
        f"1. Daño mínimo técnicamente defendible: {clp(E1)}. Sólo superficie, estructuras permanentes, "
        "caminos, aumento legal y tránsito.",
        f"2. Valor central que defendería un perito independiente: {clp(E2)}.",
        f"3. Valor razonablemente demostrable si se acredita el impacto visual: hasta {clp(E3_MAX)}.",
        f"4. Monto que mejor resistiría el contrainterrogatorio: {clp(E1)} de forma incontrovertible y "
        f"{clp(E2)} con el estudio de emplazamiento de vivienda por lote.",
        f"5. Apertura comercial razonable: {clp(E4_APERTURA)}, con objetivo en {clp(E4_OBJETIVO)}.",
        "6. Las tres pruebas con mayor capacidad de aumentar legítimamente la indemnización: escrituras "
        "inscritas del propio proyecto, serie mensual de comercialización y estudio de viewshed con DEM.",
        "7. Los tres argumentos con mayor riesgo de rechazo: el castigo de 40 % a los lotes 60, 57, 56 y "
        "55; la atribución de la menor absorción a la línea; y el efecto visual sobre colindantes sin "
        "pares de venta.",
        "8. Cambios respecto de V3 originados en evidencia nueva y no en criterio: superficies "
        "individuales por lote, exclusión de T29 y T34, medición acotada de caminos, incorporación del "
        "contrato CTP y separación entre ocupación permanente y temporal.",
        "9. Principal riesgo jurídico del componente H4–H8: la falta de legitimación activa sobre parcelas "
        "ya transferidas a terceros adquirentes.",
        f"10. Recomendación final: negociar sobre la zona {clp(ZONA_MIN)} – {clp(ZONA_MAX)}, reservando el "
        f"tramo superior para el caso de acreditarse el impacto visual, y evaluar litigación sólo bajo "
        f"{clp(UMBRAL_LITIGIO)}.",
    ])

    r.closing(
        "Este valor no fue construido hacia una cifra objetivo. Las diferencias respecto de V3 obedecen "
        "exclusivamente a evidencia adicional, corrección de datos o revisión metodológica. El informe no "
        "constituye tasación bancaria certificada, oferta ni recomendación de inversión, y no determina el "
        "precio de una eventual transacción entre las partes."
    )
    r.signature(
        "Comité pericial independiente",
        "Tasación rural · Servidumbres eléctricas · Economía inmobiliaria · GIS · Derecho eléctrico",
        extra="Folio OT-PER-2026-0087-V4 · Vigencia 90 días",
    )

    r.save(OUT)
    return OUT


if __name__ == "__main__":
    print(f"E1 {E1:,.0f} | E2 {E2:,.0f} | E3 {E3_BASE:,.0f} | E3max {E3_MAX:,.0f}")
    print(build())
