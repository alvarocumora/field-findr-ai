"""
Peritaje independiente — Servidumbre eléctrica LT 1x220 kV Caone–Mataquito
sobre proyecto de parcelación rural (Hualañé, Región del Maule).

Comité pericial independiente. Genera el informe en el shell único de
Oferta Terrenos (scripts/reports/ot_report_shell.py).
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from ot_report_shell import DocMeta, Report, clp, num  # noqa: E402

OUT = "/mnt/documents/Peritaje_Independiente_LT220_Caone_Mataquito_v3.pdf"

# --------------------------------------------------------------------------- #
# 1. Datos del caso (informados por el mandante) y GIS propio
# --------------------------------------------------------------------------- #
UV = 2749                      # $/m² valor unitario Before (triangulado)
N_LOTES = 14
SUP_14 = 76_700                # m² informados
FAJA_14 = 35_777               # m² informados dentro de los 14 lotes
LARGO = 1_198.33               # m
ANCHO = FAJA_14 / LARGO        # 29,86 m
AREA_LOTE = SUP_14 / N_LOTES   # 5.478,6 m² (proxy equiárea)

# GIS propio sobre KMZ_Sol_de_Caone_Rev0 ∩ deslinde del proyecto
FAJA_GIS = 43_553              # m² de faja dentro del predio (todo el predio)
TORRES = 4_774                 # m² de sellos de fundación / plataformas
CAMINOS = 6_800                # m² de caminos de servidumbre
CAMINOS_FUERA = 4_080          # m² de caminos fuera de la faja (60 %)
N_TORRES = 5

# Afectación informada por lote
AFECTACION = [
    ("61", 85.8, "A"), ("60", 67.5, "A"), ("57", 59.5, "A"), ("56", 56.9, "A"),
    ("55", 51.2, "A"),
    ("54", 47.1, "B"), ("53", 44.1, "B"), ("52", 41.1, "B"), ("51", 39.3, "B"),
    ("49", 39.0, "B"), ("50", 37.3, "B"), ("48", 37.1, "B"), ("47", 30.4, "B"),
    ("62", 4.6, "C"),
]

# Inventario H4–H8 (VNGP informado)
UNIDADES = [
    ("H4", 54, 560_506_323), ("H5", 69, 728_000_000), ("H6", 79, 816_000_000),
    ("H7", 68, 686_000_000), ("H8", 69, 762_000_000),
]
VNGP_TOTAL = sum(u[2] for u in UNIDADES)
PARCELAS_TOTAL = sum(u[1] for u in UNIDADES)

RESIDUAL_FAJA = 0.15   # valor residual del suelo bajo la faja (uso agrícola restringido)


def castigo_remanente(rem_m2: float, grupo: str) -> tuple[float, str]:
    """Devuelve (castigo sobre el remanente, fundamento)."""
    if rem_m2 < 1_000:
        return 1.00, "Remanente inferior a 1.000 m² y bipartido: sin sitio de edificación viable"
    if grupo == "A":
        return 0.40, "Remanente <2.500 m², bipartido por la faja y con exposición frontal al conductor"
    if grupo == "B":
        return 0.20, "Faja divide la parcela en dos áreas sin autonomía funcional entre sí"
    return 0.05, "Proximidad y exposición lateral sin ocupación material relevante"


rows_lote = []
dep_remanentes = 0
perdida_faja_lotes = 0
for lote, pct, grupo in AFECTACION:
    afect = AREA_LOTE * pct / 100
    rem = AREA_LOTE - afect
    v_before = AREA_LOTE * UV
    k, fund = castigo_remanente(rem, grupo)
    perd_faja = afect * UV * (1 - RESIDUAL_FAJA)
    perd_rem = rem * UV * k
    v_after = v_before - perd_faja - perd_rem
    perdida_faja_lotes += perd_faja
    dep_remanentes += perd_rem
    rows_lote.append(dict(lote=lote, grupo=grupo, pct=pct, afect=afect, rem=rem,
                          v_before=v_before, v_after=v_after, k=k,
                          perd=perd_faja + perd_rem, fund=fund))

# ---- Resultado 1: valor directo (Art. 69 N°1 + suelo de la faja + Art. 70)
FAJA_NETA = FAJA_14 - TORRES
r1_faja = FAJA_NETA * UV * (1 - RESIDUAL_FAJA)
r1_torres = TORRES * UV
r1_caminos = CAMINOS_FUERA * UV
r1_base = r1_faja + r1_torres + r1_caminos
r1_art70 = 0.20 * (r1_torres + r1_caminos)      # 20 % sólo sobre terrenos ocupados (69 N°1)
R1 = r1_base + r1_art70

# ---- Resultado 2: daño patrimonial demostrable
r2_redisenio = 9_800_000       # replanteo, replaneo de loteo y actualización de planos
R2 = R1 + dep_remanentes + r2_redisenio

# ---- Resultado 3: ampliado (visual + comercial), sujeto a prueba
inventario_resto = VNGP_TOTAL - sum(r["v_before"] for r in rows_lote)
SENS = [(0.25, 0.05), (0.40, 0.08), (0.60, 0.12), (0.75, 0.15)]
sens_rows = [(e, d, inventario_resto * e * d) for e, d in SENS]
visual_base = inventario_resto * 0.40 * 0.08

# Comercialización: absorción 3 parcelas/mes; deterioro 15 % → VPN diferencial
ABS_BEFORE = 3.0
DETERIORO = 0.15
ABS_AFTER = ABS_BEFORE * (1 - DETERIORO)
TASA_ANUAL = 0.09
i = (1 + TASA_ANUAL) ** (1 / 12) - 1
meses_before = PARCELAS_TOTAL / ABS_BEFORE
meses_after = PARCELAS_TOTAL / ABS_AFTER
valor_parcela_prom = (VNGP_TOTAL - visual_base) / PARCELAS_TOTAL


def vpn(abs_mes: float) -> float:
    total, restante, mes = 0.0, PARCELAS_TOTAL, 1
    while restante > 0:
        v = min(abs_mes, restante)
        total += v * valor_parcela_prom / (1 + i) ** mes
        restante -= v
        mes += 1
    return total


vpn_before, vpn_after = vpn(ABS_BEFORE), vpn(ABS_AFTER)
delay_dano = vpn_before - vpn_after
costos_inventario = (meses_after - meses_before) * 1_450_000   # mantención, admin, seguridad

R3_MIN = R2 + inventario_resto * 0.25 * 0.05
R3_MAX = R2 + inventario_resto * 0.60 * 0.12 + delay_dano + costos_inventario
R3_BASE = R2 + visual_base + delay_dano * 0.5

# ---- Resultado 4: rango transaccional
R4_MIN = R2 * 1.15
R4_OBJ = (R2 + R3_BASE) / 2
R4_APERTURA = R3_MAX
UMBRAL_LITIGIO = R2 * 0.85


def build() -> str:
    meta = DocMeta(
        doc_type="Peritaje independiente de servidumbre eléctrica",
        title="LT 1x220 kV Caone–Mataquito",
        subtitle="Afectación sobre proyecto de parcelación rural · Hualañé, Región del Maule",
        folio="OT-PER-2026-0087",
        date="22 de agosto de 2026",
        prepared_for="Propiedad afectada · Uso en Comisión Tasadora o sede judicial",
        author="Oferta Terrenos · Valuation — Comité pericial independiente",
        qr_url="https://ofertaterrenos.com/tasacion/validar",
        footer_note=(
            "Informe emitido con criterio independiente. No representa los intereses de ninguna de "
            "las partes. Verifique folio y huella del documento en ofertaterrenos.com."
        ),
    )
    r = Report(meta)

    r.cover(
        summary=(
            "Determinación del perjuicio patrimonial derivado de la imposición de una servidumbre "
            "eléctrica de 220 kV sobre 14 lotes de un proyecto de parcelas de agrado, separando el "
            "daño actualmente demostrable del daño económico sujeto a prueba adicional, bajo los "
            "artículos 63, 68, 69 y 70 de la Ley General de Servicios Eléctricos."
        ),
        highlights=[
            ("Valor central pericial", clp(R2)),
            ("Rango pericial", f"{clp(R1)} – {clp(R3_BASE)}"),
            ("Confianza general", "Media"),
        ],
    )

    # 1 -------------------------------------------------------------------
    r.section("Opinión ejecutiva", kicker="Sección 01")
    r.p(
        "El comité concluye que existe daño patrimonial cierto, directo y cuantificable derivado de la "
        f"ocupación de {num(FAJA_14)} m² de faja de servidumbre, {num(TORRES)} m² de sellos de fundación de "
        f"{N_TORRES} estructuras y {num(CAMINOS)} m² de caminos de servidumbre, sobre 14 lotes que suman "
        f"{num(SUP_14)} m². El daño no se agota en la superficie ocupada: en cinco lotes la faja consume más "
        "de la mitad de la parcela y bipartita el remanente, y en ocho lotes adicionales la divide en dos "
        "áreas sin autonomía funcional entre sí."
    )
    r.p(
        "El daño ampliado por intrusión visual sobre el resto del inventario y por deterioro de la velocidad "
        "de comercialización es económicamente plausible, pero HOY NO ESTÁ DEMOSTRADO: falta cuenca visual "
        "sobre modelo de elevación, pares comparables y registro efectivo de transacciones. Se presenta "
        "separadamente y no se incorpora al valor central."
    )
    r.kpis([
        ("Resultado 1 · Directo", clp(R1), "Art. 69 N°1 + faja + Art. 70"),
        ("Resultado 2 · Demostrable", clp(R2), "Valor central pericial"),
        ("Resultado 3 · Ampliado", f"{clp(R3_MIN)} – {clp(R3_MAX)}", "Sujeto a prueba visual y comercial"),
        ("Resultado 4 · Apertura", clp(R4_APERTURA), "No es daño indemnizable"),
        ("Superficie servidumbre", f"{num(FAJA_14)} m²", f"Ancho medio {num(ANCHO, 1)} m"),
        ("Afectación conjunta", f"{num(FAJA_14 / SUP_14 * 100, 1)} %", "Sobre 14 lotes"),
    ])
    r.callout(
        "Advertencia de independencia",
        "Este informe no fue construido hacia una cifra objetivo. Tres de las partidas solicitadas por el "
        "mandante fueron excluidas del valor central por causalidad baja o ausencia de prueba, y una "
        "contradicción relevante entre la superficie de faja informada y la medida por GIS se declara "
        "expresamente en la Sección 11 en lugar de reconciliarse en silencio.",
        kind="warn",
    )

    # 2 -------------------------------------------------------------------
    r.section("Limitaciones del estudio", kicker="Sección 02")
    r.bullets([
        "No se dispuso de las superficies individuales de cada uno de los 14 lotes. Se utilizó un proxy "
        f"equiárea de {num(AREA_LOTE, 0)} m² por lote, coherente con el dato agregado informado "
        f"({num(SUP_14)} m² / 14) y con la diferencia de 0,9 puntos entre el promedio simple de afectación "
        "(45,8 %) y el promedio ponderado (46,6 %). CONFIANZA MEDIA.",
        "No se ejecutó cuenca visual (viewshed) por ausencia de modelo digital de elevación de detalle y de "
        "las alturas certificadas de estructuras. Todo el módulo visual queda en test de sensibilidad.",
        "No se dispuso de escrituras ni de registro de transacciones efectivas del proyecto. La evidencia de "
        "valor es contractual y de lista, no de transacción arm's length.",
        "No se verificó la titularidad jurídica de las unidades H4 a H8. El análisis patrimonial (A) y el "
        "análisis de unidad económica (B) se mantienen estrictamente separados.",
        "No se practicó inspección en terreno con registro fotográfico georreferenciado ni levantamiento "
        "topográfico. La geometría proviene del KMZ del proyecto de la concesionaria.",
        "No se tuvo a la vista copia de las sentencias citadas en la Sección 05; los precedentes se listan "
        "como referencias por verificar, sin atribuirles holdings ni montos.",
    ])

    # 3 -------------------------------------------------------------------
    r.section("Hechos comprobados", kicker="Sección 03")
    r.p(
        "Se califican como comprobados los hechos verificables directamente sobre los archivos "
        "geoespaciales y documentales tenidos a la vista."
    )
    r.table(
        ["Hecho", "Fuente", "Confianza"],
        [
            ["Trazado aéreo de 220 kV que cruza el deslinde del proyecto", "KMZ_Sol_de_Caone_Rev0", "Alta"],
            [f"{N_TORRES} estructuras emplazadas dentro del predio ({num(TORRES)} m²)", "KMZ, capa de torres", "Alta"],
            [f"Caminos de servidumbre por {num(CAMINOS)} m² dentro del predio", "KMZ, capa de caminos", "Alta"],
            [f"Faja de servidumbre dentro del deslinde: {num(FAJA_GIS)} m²", "Intersección GIS propia", "Alta"],
            ["Solicitud formal de notificación de servidumbre por la concesionaria", "Carta Itahue 20-08-2025", "Alta"],
            ["Propuesta económica de la concesionaria en carta de servidumbre", "Carta Infinity 10-02-2026", "Alta"],
            ["Restricciones de faja para 220 kV (edificación, vegetación, maquinaria)", "RPTD N°07 SEC", "Alta"],
        ],
        widths=[3.4, 1.9, 0.9],
        align=["L", "L", "L"],
    )

    # 4 -------------------------------------------------------------------
    r.section("Hechos informados pero no verificados", kicker="Sección 04")
    r.table(
        ["Hecho informado", "Efecto si se acredita", "Estado"],
        [
            [f"Superficie de faja sobre los 14 lotes: {num(FAJA_14)} m²", "Base de los Resultados 1 y 2", "Por verificar con Anexo A CTP"],
            ["Permuta valorizada en $21.000.000 por lote", "Elevaría el valor unitario Before", "No demostrado (posible relación entre partes)"],
            ["VNGP contractual $10 a $16 millones por tramo de superficie", "Piso económico contractual", "Informado, contrato no exhibido"],
            ["Precios de lista entre $15.990.000 y $29.990.000", "Techo comercial, no transacción", "Informado"],
            ["Absorción histórica de 3 parcelas/mes", "Base del análisis de comercialización", "Informado, sin CRM ni promesas"],
            ["Titularidad única sobre H4 a H8", "Legitimación sobre la unidad económica", "No demostrado"],
        ],
        widths=[2.4, 2.1, 1.9],
        align=["L", "L", "L"],
    )

    # 5 -------------------------------------------------------------------
    r.section("Marco jurídico aplicable", kicker="Sección 05")
    r.subsection("Estructura de la indemnización")
    r.table(
        ["Norma", "Contenido", "Aplicación en este informe"],
        [
            ["Art. 63 LGSE", "Constitución de servidumbre eléctrica y predio sirviente",
             "Determina qué lotes son jurídicamente sirvientes: sólo aquellos cruzados por la faja"],
            ["Art. 68 LGSE", "Avalúo reclamable judicialmente",
             "El valor central se construye para resistir contradicción, no para maximizar"],
            ["Art. 69 N°1", "Valor de terrenos ocupados por torres, obras y caminos",
             f"Torres {num(TORRES)} m² y caminos fuera de faja {num(CAMINOS_FUERA)} m², al 100 % del valor"],
            ["Art. 69 N°2", "Perjuicios por las obras, por el ejercicio de la servidumbre y por líneas aéreas",
             "Pérdida de uso bajo la faja (85 %) y depreciación de remanentes por fragmentación"],
            ["Art. 69 N°3", "Tránsito para custodia, conservación y reparación",
             "Servidumbre de tránsito permanente; valorizada dentro de caminos, sin partida adicional"],
            ["Art. 69 inciso final", "Terrenos inutilizados para su natural aprovechamiento",
             "Se aplica por análisis funcional caso a caso, NO por regla automática del 50 %"],
            ["Art. 70", "Incremento del 20 %",
             "Aplicado exclusivamente sobre terrenos ocupados del N°1; no sobre depreciación ni daño comercial"],
            ["RPTD N°07 SEC", "Distancias de seguridad y restricciones de faja",
             "Fundamento técnico de la pérdida de edificabilidad y de uso bajo el conductor"],
        ],
        widths=[1.1, 2.1, 3.2],
        align=["L", "L", "L"],
        size=7.9,
    )
    r.callout(
        "Criterio sobre el Artículo 70",
        "Aplicar el 20 % sobre la totalidad del daño (incluida depreciación y perjuicio comercial) es un "
        "error frecuente y una de las objeciones más sólidas de la concesionaria. En este informe el "
        f"incremento asciende a {clp(r1_art70)} y recae únicamente sobre los terrenos materialmente ocupados.",
        kind="brand",
    )

    r.subsection("Precedentes citados — estado de verificación")
    r.table(
        ["Causa", "Rol", "Utilidad", "Estado"],
        [
            ["INIA c/ Transelec", "CS 17.152-2015", "Alcance de perjuicios por líneas aéreas", "Por verificar copia"],
            ["Eletrans II S.A. c/ Prieto", "CS 12.034-2022", "Determinación de avalúo y reclamación", "Por verificar copia"],
            ["Morales Pacheco c/ Interchile", "CS 80.059-2023", "Daño a remanentes y proximidad", "Por verificar copia"],
            ["Comunidad Agrícola Quitallaco c/ Interchile", "CS 19.089-2021", "Citada habitualmente por montos altos",
             "NO utilizable como precedente firme: sentencia posteriormente anulada"],
            ["Sist. de Transmisión del Sur c/ Oyarzo", "C-1241-2017 Castro", "Criterio de primera instancia", "Por verificar copia"],
        ],
        widths=[2.3, 1.3, 2.2, 1.9],
        align=["L", "L", "L", "L"],
        size=7.9,
    )
    r.p(
        "El comité no atribuye holdings, montos ni doctrina a estas causas sin la copia íntegra de las "
        "sentencias. Su cita en un escrito sin ese respaldo constituye un riesgo procesal para la parte "
        "afectada. NO DEMOSTRADO."
    )

    # 6 y 7 ---------------------------------------------------------------
    r.section("Caracterización inmobiliaria y mayor y mejor uso", kicker="Sección 06 · 07")
    r.p(
        "El activo es un proyecto de subdivisión rural acogido a DL 3.516 destinado a parcelas de agrado, "
        "cuyo producto comercial descansa en atributos de ruralidad, vistas, baja intervención antrópica y "
        "experiencia de entorno natural. El mayor y mejor uso Before es la comercialización fraccionada de "
        "parcelas habitacionales de recreo, físicamente posible, legalmente admisible y financieramente "
        "factible conforme a la absorción informada."
    )
    r.p(
        "El mayor y mejor uso After difiere por lote: en los lotes de mayor afectación el uso residencial "
        "de recreo deja de ser financieramente factible sobre el remanente, y el mayor y mejor uso se "
        "degrada a suelo agrícola de complemento o a ampliación de la parcela vecina, lo que es "
        "precisamente el fundamento económico de la depreciación calculada en la Sección 09."
    )

    # 8 -------------------------------------------------------------------
    r.section("Línea base Before y jerarquía de evidencia", kicker="Sección 08")
    r.table(
        ["Nivel", "Evidencia disponible", "Valor implícito", "Peso asignado"],
        [
            ["1", "Transacciones arm's length comparables", "No disponible", "0 %"],
            ["2", "Transacciones reales del mismo proyecto", "No disponible", "0 %"],
            ["3", "VNGP contractual (5.000–8.000 m² → $10.000.000)", "$1.825 / m²", "35 % (piso)"],
            ["4", "Tasaciones independientes contemporáneas", "No disponible", "0 %"],
            ["5", "Precios de lista $15.990.000 – $29.990.000", "$2.918 / m² ajustado", "45 %"],
            ["6", "Permuta informada $21.000.000 por lote", "$3.833 / m²", "10 % (secundaria)"],
            ["—", "Comparables proxy de la comuna, homologados", "$2.403 – $3.380 / m²", "10 %"],
        ],
        widths=[0.5, 3.0, 1.4, 1.1],
        align=["L", "L", "R", "R"],
    )
    r.p(
        f"La triangulación arroja un valor unitario Before de {clp(UV)} por m², equivalente a "
        f"{clp(AREA_LOTE * UV)} por lote de {num(AREA_LOTE, 0)} m². Este valor se sitúa deliberadamente por "
        "debajo del precio de lista (que incorpora spread de negociación y plazo de venta) y por sobre el "
        "VNGP (que es un neto garantizado al mandante, no un valor de mercado). CONFIANZA MEDIA-ALTA."
    )
    r.callout(
        "VNGP no es tasación",
        "El Valor Neto Garantizado al Propietario es el resultado de un mandato comercial: descuenta "
        "comisión, gastos y riesgo de colocación. Constituye evidencia contractual del piso económico "
        "esperado por el propietario, no un valor de mercado. Utilizarlo como valor de mercado sería "
        "subvalorar; utilizar el precio de lista como transacción sería sobrevalorar.",
        kind="info",
    )

    # 9 -------------------------------------------------------------------
    r.section("Análisis lote por lote (Before / After)", kicker="Sección 09")
    r.p(
        "Para cada lote se aplica: pérdida del 85 % del valor del suelo comprendido en la faja (se conserva "
        "dominio y uso agrícola marginal) más un castigo sobre el remanente fundado en su geometría, "
        "superficie residual, bipartición y exposición. No se aplica ninguna regla automática por porcentaje."
    )
    r.table(
        ["Lote", "Gr.", "% af.", "Faja m²", "Rem. m²", "Castigo", "V. Before", "V. After", "Daño"],
        [[
            rw["lote"], rw["grupo"], f"{num(rw['pct'], 1)} %", num(rw["afect"], 0), num(rw["rem"], 0),
            f"{num(rw['k'] * 100, 0)} %", clp(rw["v_before"]), clp(rw["v_after"]), clp(rw["perd"]),
        ] for rw in rows_lote],
        widths=[0.55, 0.4, 0.65, 0.8, 0.8, 0.75, 1.35, 1.35, 1.35],
        align=["L", "L", "R", "R", "R", "R", "R", "R", "R"],
        size=7.6,
    )
    r.p(
        f"Pérdida agregada de los 14 lotes: {clp(perdida_faja_lotes + dep_remanentes)}, de los cuales "
        f"{clp(perdida_faja_lotes)} corresponden al suelo bajo la faja y {clp(dep_remanentes)} a la "
        "depreciación de remanentes."
    )
    r.subsection("Determinación de inutilización integral (Art. 69 inciso final)")
    r.bullets([
        "Lote 61 — afectación 85,8 %, remanente de 778 m² bipartido por la faja: no admite sitio de "
        "edificación fuera de la franja de seguridad ni acceso independiente útil. Se declara inutilizado "
        "para su natural aprovechamiento como parcela de agrado. CONFIANZA ALTA.",
        "Lotes 60, 57, 56 y 55 — remanentes entre 1.780 y 2.674 m², bipartidos y con exposición frontal al "
        "conductor. Conservan un sitio edificable menor: NO se declaran inutilizados; se castiga el "
        "remanente en 40 %. CONFIANZA MEDIA. Es la partida más atacable del informe.",
        "Lotes 54 a 47 — la faja divide la parcela en dos áreas sin autonomía funcional entre sí (no es "
        "posible circular bajo el conductor con maquinaria ni consolidar dos sitios). Castigo del 20 %. "
        "CONFIANZA MEDIA.",
        "Lote 62 — afectación de 4,6 % sin ocupación material relevante. No se excluye, pero se castiga "
        "sólo en 5 % por proximidad. CAUSALIDAD MEDIA, monto inmaterial.",
    ])

    # 10 ------------------------------------------------------------------
    r.section("Restricciones permanentes de la faja", kicker="Sección 10")
    r.bullets([
        "Prohibición de edificación de cualquier naturaleza dentro de la franja de seguridad del circuito "
        "de 220 kV (RPTD N°07): elimina la posibilidad de emplazar vivienda, quincho o bodega.",
        "Restricción de altura de vegetación y obligación de despeje permanente: incompatible con arbolado "
        "de sombra, cortina cortaviento y con el atributo paisajístico ofrecido en el producto comercial.",
        "Restricción a movimiento de tierras, maquinaria alzada, riego por aspersión de alto alcance y "
        "acopio de combustibles bajo el conductor.",
        "Servidumbre de tránsito permanente para custodia, conservación y reparación (Art. 69 N°3): "
        "ingreso de terceros sin aviso relevante, incompatible con la expectativa de privacidad.",
        "Mayor exigencia de gestión de riesgo de incendio forestal en la franja, con costo de mantención "
        "recurrente que hoy no está asignado contractualmente a la concesionaria.",
    ])

    # 11 ------------------------------------------------------------------
    r.section("Análisis GIS y contradicción detectada", kicker="Sección 11")
    r.p(
        "La intersección del trazado con el deslinde del proyecto, ejecutada sobre el KMZ de la "
        f"concesionaria, arroja {num(FAJA_GIS)} m² de faja dentro del predio, contra {num(FAJA_14)} m² "
        "informados sobre los 14 lotes."
    )
    r.kpis([
        ("Faja dentro del predio (GIS)", f"{num(FAJA_GIS)} m²", "Medición propia"),
        ("Faja informada sobre 14 lotes", f"{num(FAJA_14)} m²", "Dato del mandante"),
        ("Diferencia no asignada", f"{num(FAJA_GIS - FAJA_14)} m²", "21,8 % adicional"),
    ])
    r.callout(
        "La contradicción no se reconcilia: se declara",
        f"Los {num(FAJA_GIS - FAJA_14)} m² de diferencia recaerían sobre áreas comunes, caminos interiores y "
        "lotes no individualizados. Si el Anexo A CTP confirma esa superficie, el Resultado 1 aumenta de "
        "manera proporcional; si el dato correcto es el informado, el análisis se mantiene. El comité NO "
        "incorpora la diferencia al valor central mientras no exista plano de servidumbre acotado.",
        kind="warn",
    )

    # 12 ------------------------------------------------------------------
    r.section("Impacto visual — clasificación pendiente", kicker="Sección 12")
    r.p(
        "La hipótesis a probar es la depreciación de mercado atribuible a intrusión visual de "
        "infraestructura eléctrica aérea sobre un producto cuyo valor depende de atributos de paisaje. La "
        "hipótesis es económicamente razonable, pero la clasificación V0 a V4 por parcela no puede "
        "completarse sin modelo de elevación ni alturas certificadas de estructuras. NO DEMOSTRADO."
    )
    r.table(
        ["Clase", "Definición", "Efecto esperado sobre el valor"],
        [
            ["V0", "Sin exposición relevante: la línea no es visible desde la zona de vivienda", "Nulo"],
            ["V1", "Baja: conductor visible en segundo plano, sin torre en campo visual", "0 – 3 %"],
            ["V2", "Media: una torre visible a más de 300 m o conductor en plano medio", "3 – 7 %"],
            ["V3", "Alta: torre visible a menos de 300 m desde la zona de vivienda", "7 – 12 %"],
            ["V4", "Crítica: torre o conductor dominante en el campo visual del acceso y la vivienda", "12 – 20 %"],
        ],
        widths=[0.6, 3.4, 1.8],
        align=["L", "L", "L"],
    )
    r.subsection("Test de sensibilidad (no es tasación)")
    r.table(
        ["Escenario", "Inventario expuesto", "Depreciación", "Efecto sobre inventario no afectado"],
        [[f"Escenario {n + 1}", f"{num(e * 100, 0)} %", f"{num(d * 100, 0)} %", clp(v)]
         for n, (e, d, v) in enumerate(sens_rows)],
        widths=[1.1, 1.4, 1.1, 2.2],
        align=["L", "R", "R", "R"],
    )
    r.p(
        "Estos valores se presentan exclusivamente como test de sensibilidad sobre el VNGP del inventario "
        f"no directamente afectado ({clp(inventario_resto)}). No constituyen tasación ni integran el valor "
        "central pericial."
    )

    # 13 ------------------------------------------------------------------
    r.section("Paired sales", kicker="Sección 13")
    r.p(
        "No fue posible construir pares comparables controlados (parcelas equivalentes con y sin línea "
        "visible) por ausencia de una base de transacciones efectivas en la comuna y su entorno. El "
        "diferencial observado entre publicaciones de la zona ($2.403 a $3.380 por m²) responde "
        "mayoritariamente a superficie, accesibilidad y servicios, y no puede atribuirse a la línea. "
        "NO DEMOSTRADO."
    )
    r.callout(
        "Prueba requerida",
        "Doce a dieciocho pares de transacciones inscritas en el CBR competente, controladas por comuna, "
        "superficie, topografía, acceso, electricidad, agua y fecha, con al menos seis casos con línea de "
        "transmisión visible. Sin esta evidencia, el componente visual no es defendible ante Comisión "
        "Tasadora.",
        kind="info",
    )

    # 14 ------------------------------------------------------------------
    r.section("Velocidad de comercialización", kicker="Sección 14")
    r.p(
        f"La absorción informada Before es de {num(ABS_BEFORE, 1)} parcelas por mes en un mercado ya lento "
        "con anterioridad a la línea. El comité NO atribuye a la servidumbre la lentitud preexistente: sólo "
        "se evalúa el incremento de plazo atribuible a la intrusión."
    )
    r.table(
        ["Parámetro", "Before", "After (supuesto)", "Diferencia"],
        [
            ["Absorción mensual", f"{num(ABS_BEFORE, 2)}", f"{num(ABS_AFTER, 2)}", f"−{num(DETERIORO * 100, 0)} %"],
            ["Meses para agotar inventario", num(meses_before, 0), num(meses_after, 0), f"+{num(meses_after - meses_before, 0)}"],
            ["Valor presente del flujo", clp(vpn_before), clp(vpn_after), clp(-delay_dano)],
            ["Costos de inventario adicionales", "—", clp(costos_inventario), clp(costos_inventario)],
        ],
        widths=[2.2, 1.3, 1.5, 1.3],
    )
    r.p(
        f"Tasa de descuento real anual: {num(TASA_ANUAL * 100, 0)} %. El deterioro de absorción de "
        f"{num(DETERIORO * 100, 0)} % es un supuesto, no un hecho acreditado: requiere CRM, registro de "
        "desistimientos y comparación de curvas de venta antes y después del anuncio del trazado. "
        "CAUSALIDAD MEDIA — se incorpora al 50 % en el escenario base y se excluye del valor central."
    )

    # 15 ------------------------------------------------------------------
    r.section("Control de causalidad por partida", kicker="Sección 15")
    r.table(
        ["Partida", "¿Preexistente?", "¿La línea la causa?", "Causalidad", "Tratamiento"],
        [
            ["Suelo ocupado por torres y caminos", "No", "Sí, íntegramente", "Alta", "Valor central"],
            ["Pérdida de uso bajo la faja", "No", "Sí, íntegramente", "Alta", "Valor central"],
            ["Depreciación de remanentes Grupo A", "No", "Sí", "Alta", "Valor central"],
            ["Fragmentación funcional Grupo B", "No", "Sí", "Media-alta", "Valor central"],
            ["Rediseño y replanteo del loteo", "No", "Sí", "Alta", "Valor central"],
            ["Proximidad lote 62", "No", "Parcialmente", "Media", "Valor central (monto menor)"],
            ["Depreciación visual del resto del inventario", "No", "Agrava, magnitud no probada", "Media", "Sólo escenario ampliado"],
            ["Mayor plazo de comercialización", "Sí (mercado lento)", "Sólo agrava", "Media", "50 % en escenario base"],
            ["Estigma de mercado adicional", "No", "No separable de lo anterior", "Baja", "Excluido"],
            ["Lucro cesante del proyecto completo", "No", "No acreditado", "Baja", "Excluido"],
        ],
        widths=[2.3, 1.3, 1.9, 0.9, 1.5],
        align=["L", "L", "L", "L", "L"],
        size=7.8,
    )

    # 16 ------------------------------------------------------------------
    r.section("Matriz anti doble contabilización", kicker="Sección 16")
    r.table(
        ["Activo / partida", "Base legal", "Monto", "Conf.", "¿Incluido en otra partida?", "Tratamiento"],
        [
            [f"Faja neta {num(FAJA_NETA)} m² al 85 %", "69 N°2", clp(r1_faja), "Alta",
             "No — se descontó la superficie de torres", "Se computa"],
            [f"Torres {num(TORRES)} m² al 100 %", "69 N°1", clp(r1_torres), "Alta",
             "No — excluida de la faja", "Se computa"],
            [f"Caminos fuera de faja {num(CAMINOS_FUERA)} m²", "69 N°1 y N°3", clp(r1_caminos), "Media-alta",
             "No — los 2.720 m² dentro de la faja se excluyen", "Se computa"],
            ["Incremento del 20 %", "Art. 70", clp(r1_art70), "Alta",
             "No — sólo sobre terrenos ocupados del N°1", "Se computa"],
            ["Depreciación de remanentes", "69 N°2", clp(dep_remanentes), "Media",
             "No — recae sobre superficie fuera de la faja", "Se computa"],
            ["Rediseño y replanteo", "69 N°2", clp(r2_redisenio), "Media", "No", "Se computa"],
            ["Inutilización integral lote 61", "69 inc. final", "Incluido arriba", "Alta",
             "Sí — ya valorizado al 100 % en la línea de remanentes", "Sin partida adicional"],
            ["Depreciación visual de los 14 lotes", "69 N°2", "$ 0", "Baja",
             "Sí — el castigo de remanente ya incorpora la exposición", "Excluido"],
            ["Mayor plazo sobre valor Before", "69 N°2", "$ 0", "Baja",
             "Sí — se calcula sobre el valor After", "Excluido"],
            ["Estigma de mercado", "69 N°2", "$ 0", "Baja", "Sí — solapado con depreciación visual", "Excluido"],
        ],
        widths=[2.0, 0.8, 1.25, 0.55, 2.3, 1.1],
        align=["L", "L", "R", "L", "L", "L"],
        size=7.3,
    )

    # 17 ------------------------------------------------------------------
    r.section("Escenarios y resultados económicos", kicker="Sección 17")
    r.subsection("Resultado 1 — Valor directo de la servidumbre y terrenos ocupados")
    r.table(
        ["Componente", "Superficie", "Criterio", "Monto"],
        [
            [f"Faja neta de servidumbre", f"{num(FAJA_NETA)} m²", "85 % del valor del suelo", clp(r1_faja)],
            ["Sellos de fundación y plataformas", f"{num(TORRES)} m²", "100 % (Art. 69 N°1)", clp(r1_torres)],
            ["Caminos de servidumbre fuera de faja", f"{num(CAMINOS_FUERA)} m²", "100 % (Art. 69 N°1)", clp(r1_caminos)],
            ["Incremento legal", "—", "20 % sobre terrenos ocupados", clp(r1_art70)],
            ["RESULTADO 1", "—", "", clp(R1)],
        ],
        widths=[2.6, 1.1, 1.7, 1.5],
        align=["L", "R", "L", "R"],
    )
    r.subsection("Resultado 2 — Daño patrimonial actualmente demostrable")
    r.table(
        ["Componente", "Confianza", "Monto"],
        [
            ["Resultado 1 (directo)", "Alta", clp(R1)],
            ["Depreciación de remanentes de los 14 lotes", "Media", clp(dep_remanentes)],
            ["Rediseño, replanteo y actualización de planos", "Media", clp(r2_redisenio)],
            ["RESULTADO 2 — VALOR CENTRAL PERICIAL", "Media", clp(R2)],
        ],
        widths=[3.6, 1.1, 1.6],
    )
    r.subsection("Resultado 3 — Valor económico ampliado sujeto a prueba")
    r.table(
        ["Escenario", "Componentes adicionales", "Total"],
        [
            ["Conservador", "Sólo alta confianza y alta causalidad", clp(R1 + dep_remanentes * 0.6)],
            ["Base", "Resultado 2 + visual 40 %/8 % + 50 % del efecto plazo", clp(R3_BASE)],
            ["Fuerte", "Resultado 2 + visual 60 %/12 % + plazo íntegro + costos de inventario", clp(R3_MAX)],
        ],
        widths=[1.1, 3.5, 1.5],
        align=["L", "L", "R"],
    )
    r.callout(
        "Análisis A y Análisis B no se suman",
        "El daño sobre el patrimonio del propietario directamente afectado (Análisis A) es el Resultado 2. "
        f"La afectación económica de la unidad comercial H4–H8 ({PARCELAS_TOTAL} parcelas, VNGP "
        f"{clp(VNGP_TOTAL)}) constituye el Análisis B y sólo es reclamable en la medida en que se acredite "
        "titularidad o interés económico legítimo sobre esas unidades. Sumar B dentro de A sin esa prueba "
        "es el error que con mayor probabilidad haría caer el informe completo.",
        kind="warn",
    )

    # 18 ------------------------------------------------------------------
    r.page_break()
    r.section("Red Team — objeciones de la concesionaria", kicker="Sección 18")
    r.p("El comité formula las objeciones que la contraparte razonablemente opondrá, con su fuerza y la prueba necesaria para superarlas.")
    objeciones = [
        ("El VNGP no es valor de mercado", "Alta",
         "Correcto; se usó como piso ponderado al 35 %, no como valor de mercado",
         "Contrato de mandato comercial y liquidaciones de ventas efectivas"),
        ("La permuta no es arm's length", "Alta",
         "Se ponderó al 10 % y sólo como evidencia económica secundaria",
         "Escritura de permuta y acreditación de no relación entre las partes"),
        ("El mercado ya estaba lento antes de la línea", "Alta",
         "Se reconoce; sólo se computa el incremento y al 50 % en el escenario base",
         "Curva histórica de ventas mensual de 24 meses previos"),
        ("Los lotes fuera de la faja no son predios sirvientes", "Alta",
         "Se acepta jurídicamente; el daño se invoca por el Art. 69 N°2, no por ocupación",
         "Jurisprudencia firme sobre perjuicios a predios no sirvientes"),
        ("No se ha demostrado visibilidad real", "Alta",
         "Se reconoce expresamente; el componente visual está fuera del valor central",
         "Viewshed sobre DEM y alturas certificadas de estructuras"),
        ("No hay paired sales que acrediten depreciación", "Alta",
         "Se reconoce; sin ellas no se sostiene el escenario fuerte",
         "12–18 pares de transacciones inscritas controladas"),
        ("Doble contabilización entre depreciación y estigma", "Media",
         "Neutralizada en la matriz de la Sección 16: el estigma se excluyó",
         "La propia matriz, exhibida íntegra"),
        ("Especulación sobre ventas futuras", "Alta",
         "El lucro cesante del proyecto completo fue excluido por causalidad baja",
         "Promesas firmadas y desistimientos documentados"),
        ("Falta de legitimación sobre H4–H8", "Alta",
         "Se separó en Análisis B y no se sumó al valor central",
         "Escrituras y estructura societaria de cada unidad"),
        ("El daño visual es subjetivo", "Media",
         "Se reformuló como depreciación de mercado medible, no como juicio estético",
         "Paired sales y encuestas de disposición a pagar"),
        ("Los precios de lista superan las transacciones reales", "Alta",
         "Se aplicó ajuste a la baja y el valor unitario se fijó bajo la lista",
         "Registro de precios efectivamente transados"),
        ("Los remanentes conservan utilidad agrícola", "Media",
         "Se reconoce: se conservó un 15 % de valor bajo la faja y no se expropió el dominio",
         "Informe agronómico de aptitud del remanente"),
        ("Aplicación improcedente del incremento del 20 %", "Alta",
         "Se aplicó sólo sobre terrenos ocupados del Art. 69 N°1",
         "El propio desglose del Resultado 1"),
        ("El proxy equiárea de superficie de lotes no es exacto", "Media",
         "Se declaró como limitación; el error agregado es acotado (0,9 puntos)",
         "Anexo A CTP con superficie individual de cada lote"),
        ("Contradicción entre faja informada y faja medida por GIS", "Media",
         "Se declaró expresamente y se computó la cifra menor (conservadora)",
         "Plano de servidumbre acotado y certificado"),
        ("El Art. 69 N°3 ya remunera el tránsito y se cobra dos veces", "Media",
         "No: el tránsito se valorizó dentro de caminos, sin partida adicional",
         "Desglose de la Sección 16"),
    ]
    r.table(
        ["Objeción", "Fuerza", "Respuesta técnica", "Prueba necesaria"],
        [[o, f, resp, prueba] for o, f, resp, prueba in objeciones],
        widths=[1.9, 0.5, 2.4, 2.0],
        align=["L", "L", "L", "L"],
        size=7.2,
    )

    # 19 ------------------------------------------------------------------
    r.section("Rango de negociación", kicker="Sección 19")
    r.p(
        "La recomendación no resulta de multiplicar el daño por un factor. Se construye sobre la fortaleza "
        "jurídica del componente directo (alta), la debilidad probatoria del componente visual y comercial "
        "(hoy no acreditado), el costo y plazo de la vía contenciosa, y la relevancia del corredor para la "
        "concesionaria, que enfrenta un costo de retraso significativo y alternativas de trazado limitadas."
    )
    r.kpis([
        ("Apertura razonable", clp(R4_APERTURA), "Con reserva expresa de prueba pendiente"),
        ("Objetivo de negociación", clp(R4_OBJ), "Zona de acuerdo esperada"),
        ("Zona de acuerdo razonable", f"{clp(R4_MIN)} – {clp(R3_BASE)}", "Cierre sin litigio"),
        ("Umbral de evaluación contenciosa", clp(UMBRAL_LITIGIO), "Bajo este valor conviene evaluar reclamación"),
    ], cols=2)
    r.p(
        "El Resultado 4 no constituye daño jurídicamente indemnizable: incorpora el valor económico de "
        "obtener certeza, evitar litigación, eliminar el riesgo de anulación y cerrar el conflicto en un "
        "plazo compatible con la comercialización del proyecto."
    )

    # 20 ------------------------------------------------------------------
    r.section("Información faltante — checklist priorizado", kicker="Sección 20")
    r.table(
        ["Prioridad", "Antecedente", "Efecto sobre el informe"],
        [
            ["P1", "Anexo A CTP y plano de servidumbre acotado", "Fija superficies exactas y cierra la contradicción GIS"],
            ["P1", "Superficie individual certificada de los 14 lotes", "Elimina el proxy equiárea"],
            ["P1", "Coordenadas y altura certificada de las 5 estructuras", "Habilita el viewshed y la clasificación V0–V4"],
            ["P1", "DEM de detalle o levantamiento topográfico", "Habilita cuenca visual y pendiente por parcela"],
            ["P1", "Escrituras y estructura de titularidad H4–H8", "Define la legitimación del Análisis B"],
            ["P2", "Registro histórico de ventas y precios efectivos", "Sustituye precio de lista por transacción real"],
            ["P2", "CRM, promesas y desistimientos", "Acredita el deterioro de absorción"],
            ["P2", "Contrato de mandato comercial (VNGP) íntegro", "Consolida el piso económico contractual"],
            ["P2", "Tasaciones independientes contemporáneas al Before", "Refuerza la línea base"],
            ["P2", "Copia íntegra de las sentencias citadas", "Habilita el uso de precedentes"],
            ["P3", "Registro fotográfico georreferenciado desde cada lote", "Respalda visualmente la clasificación"],
            ["P3", "Áreas temporales de construcción y plazos de obra", "Perjuicios del período de construcción (69 N°2)"],
            ["P3", "Convenio de mantención de faja y riesgo de incendio", "Asigna el costo recurrente"],
        ],
        widths=[0.7, 2.7, 3.0],
        align=["L", "L", "L"],
        size=7.8,
    )

    # 21 ------------------------------------------------------------------
    r.section("Test final de neutralidad", kicker="Sección 21")
    r.table(
        ["Pregunta", "Respuesta del comité"],
        [
            ["A. ¿Qué evidencia reduce el valor reclamable?",
             "El mercado ya era lento; los remanentes conservan uso agrícola; el VNGP es inferior al valor usado; los lotes fuera de la faja no son predios sirvientes"],
            ["B. ¿Qué evidencia lo aumenta?",
             "La faja medida por GIS supera en 21,8 % la informada; hay 5 torres dentro del predio; la faja bipartita 13 de 14 lotes"],
            ["C. ¿Qué supuestos pesan más?",
             "El valor unitario Before ($2.749/m²) y el castigo de 40 % sobre remanentes del Grupo A"],
            ["D. ¿Qué parte depende de evidencia inexistente?",
             f"Aproximadamente {num((R3_MAX - R2) / R3_MAX * 100, 0)} % del escenario fuerte; 0 % del valor central"],
            ["E. ¿Cambia si la depreciación visual fuese cero?",
             "El valor central no cambia. El escenario fuerte cae al Resultado 2 más el efecto plazo"],
            ["F. ¿Cambia si sólo fueran indemnizables los 14 lotes?",
             "No: el valor central ya está construido exclusivamente sobre esos 14 lotes"],
            ["G. ¿Qué monto defendería un tasador independiente?",
             clp(R2)],
            ["H. ¿Qué monto atacaría exitosamente la contraparte?",
             f"Todo lo que exceda {clp(R3_BASE)} mientras no exista viewshed ni paired sales"],
        ],
        widths=[1.9, 4.1],
        align=["L", "L"],
        size=7.8,
    )

    # 22 ------------------------------------------------------------------
    r.section("Conclusión pericial", kicker="Sección 22")
    r.kpis([
        ("Valor central pericial", clp(R2), "Daño demostrable hoy"),
        ("Rango pericial", f"{clp(R1 + dep_remanentes * 0.6)} – {clp(R3_BASE)}", "Conservador a base"),
        ("Valor ampliado con prueba", f"{clp(R3_BASE)} – {clp(R3_MAX)}", "Requiere viewshed y paired sales"),
        ("Apertura transaccional sugerida", clp(R4_APERTURA), "No es daño indemnizable"),
        ("Nivel general de confianza", "Medio", "Alta en directo, baja en visual"),
        ("Superficie base del cálculo", f"{num(FAJA_14)} m²", "Cifra conservadora entre las dos disponibles"),
    ])
    r.subsection("Diez razones que explican estos valores")
    r.bullets([
        "El componente directo (faja, torres, caminos e incremento del Art. 70) es verificable sobre el KMZ "
        "de la propia concesionaria y no depende de supuestos de mercado.",
        "El valor unitario Before se triangula con cuatro fuentes de distinto peso y se fija bajo el precio "
        "de lista y sobre el VNGP, evitando ambos sesgos.",
        "La pérdida bajo la faja se computa al 85 % y no al 100 %, porque el dominio y un uso agrícola "
        "marginal subsisten.",
        "La inutilización integral se declara en un solo lote, por análisis funcional, y no por una regla "
        "automática de porcentaje.",
        "La depreciación de remanentes se funda en bipartición y superficie residual, no en apreciaciones "
        "estéticas.",
        "El incremento del 20 % recae exclusivamente sobre los terrenos materialmente ocupados, "
        "neutralizando la objeción más común de la contraparte.",
        "El impacto visual queda fuera del valor central porque no existe cuenca visual ni pares "
        "comparables: es plausible, no probado.",
        "El deterioro de la absorción se descuenta sobre el valor After y se pondera al 50 %, reconociendo "
        "que el mercado ya era lento antes de la línea.",
        "La unidad económica H4–H8 se analiza separada del patrimonio afectado y nunca se suma sin prueba "
        "de titularidad.",
        "La matriz anti doble contabilización excluyó tres partidas solicitadas (estigma, lucro cesante y "
        "depreciación visual de los 14 lotes) para preservar la defendibilidad del conjunto.",
    ])

    r.signature(
        "Comité pericial independiente",
        "Tasación rural · Servidumbres eléctricas · Economía inmobiliaria · GIS · Revisión legal y adversarial",
        "Oferta Terrenos · Valuation — Folio OT-PER-2026-0087",
    )
    r.closing(
        "Informe emitido con criterio independiente y auditable. Las conclusiones se sostienen sobre los "
        "antecedentes tenidos a la vista y quedan sujetas a los antecedentes faltantes de la Sección 20."
    )

    return r.save(OUT)


if __name__ == "__main__":
    print(build())
    print("R1", clp(R1), "| R2", clp(R2), "| R3", clp(R3_MIN), clp(R3_BASE), clp(R3_MAX), "| R4", clp(R4_APERTURA))
