"""Tasación consolidada del portafolio Hualañé / Caone — 638 parcelas, 494,25 ha.

Genera el PDF con el shell canónico de Oferta Terrenos.
    python3 scripts/reports/build_tasacion_caone_portafolio.py
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter

from ot_report_shell import DocMeta, Report, clp, num
from tasacion_caone_model import (
    ANCLAS, ANCLA_UNIT, CAPEX_PARCELA, COM_CORRETAJE, ADMIN_GG, MARKETING,
    CONTINGENCIA, DESC_BLOQUE, DESC_PANO, ELASTICIDAD, FACTOR_LIQUIDACION,
    PISO_CAMPO_HA, R_INVERSIONISTA, R_NEGOCIO, RITMO_FRENTE, RITMO_MAX,
    TASA_IMPUESTO, UF, valorizar,
)

OUT_DIR = "/mnt/documents"
FECHA = "24 de agosto de 2026"
FOLIO = "OT-TAS-2026-0871"

filas, tot, socs = valorizar()

MM = lambda v: f"$ {num(v / 1e6, 0)} M"          # millones de pesos
MM1 = lambda v: f"$ {num(v / 1e6, 1)} M"         # millones con un decimal
UFV = lambda v: f"UF {num(v / UF, 0)}"


# --------------------------------------------------------------------------- #
# Gráficos
# --------------------------------------------------------------------------- #

def grafico_cascada(path: str) -> str:
    etapas = [
        ("Valor retail\nbruto (638)", tot["retail"]),
        ("− Comisión,\nmarketing, adm.", -tot["retail"] * (COM_CORRETAJE + MARKETING + ADMIN_GG)),
        ("− CAPEX de\nhabilitación", -tot["capex"]),
        ("− Impuesto\na la renta", -(tot["retail"] * (1 - COM_CORRETAJE - MARKETING - ADMIN_GG)
                                     - tot["capex"]) * TASA_IMPUESTO),
        ("− Efecto plazo\n(38 meses, 16 %)", None),
        ("Valor presente\ndel negocio", tot["npv_negocio"]),
    ]
    bruto = tot["retail"] * (1 - COM_CORRETAJE - MARKETING - ADMIN_GG) - tot["capex"]
    utilidad = bruto - bruto * TASA_IMPUESTO
    etapas[4] = (etapas[4][0], -(utilidad - tot["npv_negocio"]))

    fig, ax = plt.subplots(figsize=(9.2, 3.5), dpi=200)
    base = 0.0
    for i, (label, val) in enumerate(etapas):
        if i in (0, len(etapas) - 1):
            ax.bar(i, val / 1e6, color="#164E34" if i == 0 else "#22C55E", width=0.62)
            ax.text(i, val / 1e6 + 220, f"{val/1e6:,.0f}".replace(",", "."),
                    ha="center", fontsize=8.4, fontweight="bold", color="#12181A")
            base = val if i == 0 else base
        else:
            ax.bar(i, -val / 1e6, bottom=(base + val) / 1e6, color="#9AA8A3", width=0.62)
            ax.plot([i - 0.31, i + 0.31], [base / 1e6] * 2, color="#C7D0CC", lw=0.8, zorder=0)
            ax.text(i, (base + val) / 1e6 - 260, f"{val/1e6:,.0f}".replace(",", "."),
                    ha="center", va="top", fontsize=7.6, color="#B45309", fontweight="bold")
            base += val
    ax.set_xticks(range(len(etapas)))
    ax.set_xticklabels([e[0] for e in etapas], fontsize=7.4)
    ax.set_ylabel("Millones de pesos", fontsize=8)
    ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:,.0f}".replace(",", ".")))
    ax.tick_params(axis="y", labelsize=7.4)
    ax.set_ylim(0, tot["retail"] / 1e6 * 1.12)
    ax.grid(axis="y", color="#E2E6E3", lw=0.6)
    ax.set_axisbelow(True)
    for s in ("top", "right", "left"):
        ax.spines[s].set_visible(False)
    fig.tight_layout()
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    return path


def grafico_banda(path: str) -> str:
    minimo = tot["valor_bloque"] * 0.90
    central = tot["valor_bloque"]
    inicial = sum(v["valor_pano"] for v in socs.values())
    rapido = tot["valor_rapido"]
    fig, ax = plt.subplots(figsize=(9.2, 1.9), dpi=200)
    ax.barh(0, (inicial - rapido) / 1e6, left=rapido / 1e6, height=0.34, color="#E7F2EA")
    ax.barh(0, (inicial - minimo) / 1e6, left=minimo / 1e6, height=0.34, color="#B9E2C8")
    for val, label, color in [
        (rapido, "Liquidación", "#B45309"),
        (minimo, "Mínimo defendible", "#164E34"),
        (central, "Valor comercial", "#22C55E"),
        (inicial, "Precio de salida", "#0EA5E9"),
    ]:
        ax.plot([val / 1e6, val / 1e6], [-0.28, 0.28], color=color, lw=2.2)
        ax.text(val / 1e6, 0.42, label, ha="center", fontsize=7.3, color=color, fontweight="bold")
        ax.text(val / 1e6, -0.52, f"{val/1e6:,.0f}".replace(",", ".") + " M",
                ha="center", fontsize=7.6, color="#12181A", fontweight="bold")
    ax.set_ylim(-0.9, 0.75)
    ax.set_yticks([])
    ax.set_xlabel("Millones de pesos", fontsize=7.6)
    ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:,.0f}".replace(",", ".")))
    ax.tick_params(axis="x", labelsize=7.2)
    for s in ("top", "right", "left"):
        ax.spines[s].set_visible(False)
    fig.tight_layout()
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    return path


# --------------------------------------------------------------------------- #
# Informe
# --------------------------------------------------------------------------- #

def build() -> str:
    minimo = tot["valor_bloque"] * 0.90
    inicial = sum(v["valor_pano"] for v in socs.values())
    desc_max = 1 - minimo / inicial

    r = Report(DocMeta(
        doc_type="Tasación comercial consolidada de portafolio",
        title="Proyecto Hualañé / Caone",
        subtitle="638 parcelas · 494,25 ha · comunas de Hualañé y Licantén, Región del Maule",
        folio=FOLIO,
        date=FECHA,
        prepared_for="Sociedades titulares · negociación del portafolio",
        author="OFERTA TERRENOS · Valuation",
        qr_url="https://ofertaterrenos.com/tasacion/validar",
        facts=[
            ("Universo", "638 parcelas · 494,25 ha · 11 roles"),
            ("Titulares", "4 sociedades"),
            ("Exclusiones", "Explora Park y 14 lotes permutados Hijuela 4"),
            ("Unidad de cuenta", f"CLP; UF = $ {num(UF, 2)} (21-08-2026)"),
            ("Norma de referencia", "IVS 2022 · enfoque de mercado y residual dinámico"),
        ],
    ))

    r.cover(
        highlights=[
            ("Valor de mercado en bloque", MM(tot["valor_bloque"])),
            ("Valor presente del negocio", MM(tot["npv_negocio"])),
            ("Valor retail potencial", MM(tot["retail"])),
        ],
        summary=(
            "Determinación del valor comercial del portafolio completo de parcelas disponibles "
            "del Proyecto Hualañé / Caone, para efectos de una eventual venta en bloque a un "
            "comprador independiente y financieramente capaz, y determinación del valor "
            "individual por sociedad y por rol. La conclusión se construye sobre evidencia de "
            "mercado vigente y sobre transacciones cerradas del propio inventario, y no sobre "
            "valores históricos de aporte de las partes."
        ),
    )

    # ------------------------------------------------------------ resumen
    r.section("1. Resumen ejecutivo", "Conclusiones de valor")
    r.p(
        "El portafolio corresponde a 638 parcelas ya subdivididas o con subdivisión en trámite, "
        "distribuidas en 11 roles y 494,25 hectáreas en el secano costero de la Región del Maule "
        "(comunas de Hualañé y Licantén). Su valor no proviene de la aptitud agrícola del suelo "
        "—que en la zona se transa entre $ 2,0 y $ 3,5 millones por hectárea— sino de la condición "
        "de suelo legalmente parcelable con producto ya validado comercialmente en el mismo predio."
    )
    r.p(
        "Se distinguen cuatro medidas de valor que no deben confundirse entre sí: el valor retail "
        "potencial (suma futura de 638 ventas minoristas), el valor presente del negocio (ese flujo "
        "descontado por costos, impuestos y plazo), el valor de mercado del portafolio en bloque "
        "(lo que pagaría hoy un comprador único) y el valor de liquidación (venta forzada)."
    )
    r.kpis([
        ("A · Valor retail potencial", MM(tot["retail"]), f"{UFV(tot['retail'])} · flujo bruto a 38 meses"),
        ("B · Valor presente del negocio", MM(tot["npv_negocio"]), f"{UFV(tot['npv_negocio'])} · VAN al {int(R_NEGOCIO*100)} %"),
        ("C · Venta en bloque", MM(tot["valor_bloque"]), f"{UFV(tot['valor_bloque'])} · conclusión principal"),
        ("D · Valor de liquidación", MM(tot["valor_rapido"]), "Venta forzada en 6 a 9 meses"),
        ("E · Suma por sociedades", MM(inicial), "Escenario 2 · 4 operaciones"),
        ("Valor unitario en bloque", f"$ {num(tot['valor_bloque']/tot['ha']/1e6, 1)} M/ha", f"{num(tot['valor_bloque']/638/1e6,1)} M por parcela"),
    ])
    r.callout(
        "Conclusión de valor",
        f"El valor comercial del portafolio completo del Proyecto Hualañé / Caone, para una "
        f"operación única en bloque, al {FECHA}, se establece en {MM(tot['valor_bloque'])} "
        f"({UFV(tot['valor_bloque'])}), equivalente a $ {num(tot['valor_bloque']/tot['ha']/1e6,1)} "
        f"millones por hectárea y a $ {num(tot['valor_bloque']/638/1e6,1)} millones por parcela. "
        f"La banda de negociación defendible va de {MM(minimo)} a {MM(inicial)}.",
        kind="brand",
    )

    # ------------------------------------------------------------ activos
    r.page_break()
    r.section("2. Activos objeto de tasación", "Universo y exclusiones")
    r.p(
        "El universo corresponde exclusivamente al catastro de parcelas disponibles del Proyecto "
        "Hualañé / Caone. Se excluyen íntegramente del análisis el Proyecto Explora Park y los "
        "14 lotes permutados de la Hijuela 4, tanto de las superficies como de los valores."
    )
    r.table(
        ["Sociedad", "Rol", "Activo", "Parcelas", "Ha", "Sup. media"],
        [[f["sociedad"].replace(" SpA", ""), f["rol"], f["activo"], str(f["parcelas"]),
          num(f["ha"], 2), f"{num(f['sup_parcela'],0)} m²"] for f in filas]
        + [["TOTAL", "11 roles", "4 sociedades", "638", "494,25", f"{num(494.25*10000/638,0)} m²"]],
        widths=[2.4, 1.0, 2.2, 0.8, 0.8, 1.3],
        align=["L", "L", "L", "R", "R", "R"],
    )
    r.keyvalues([
        ("Forestal Altas Cumbres SpA", f"285 parcelas · 191,55 ha · 4 roles"),
        ("Agrícola Río Maule SpA", "47 parcelas · 53,33 ha · 1 rol"),
        ("Forestal Valle Escondido SpA", "40 parcelas · 41,75 ha · 1 rol"),
        ("Forestal Los Andes SpA", "266 parcelas · 207,62 ha · 5 roles"),
    ])

    # ------------------------------------------------------------ metodología
    r.section("3. Metodología", "IVS 2022 · enfoque de mercado y residual dinámico")
    r.bullets([
        "Enfoque de mercado (comparación): construcción de un valor unitario retail por metro "
        "cuadrado a partir de transacciones cerradas y de oferta vigente homologada, ajustado por "
        "superficie de la parcela.",
        "Enfoque residual dinámico (flujo de caja descontado): el valor presente del negocio se "
        "obtiene proyectando el flujo mensual de ventas del inventario, descontando costos "
        "comerciales, CAPEX de habilitación, impuesto a la renta y el efecto del plazo.",
        "Los valores históricos de aporte, VNGP o registros contables de las sociedades se emplean "
        "sólo como antecedente secundario y no como conclusión de valor.",
        "Se distingue explícitamente valor de mercado, valor de venta rápida, valor retail futuro y "
        "valor presente del portafolio, conforme a IVS 104 (bases de valor).",
    ])
    r.subsection("3.1 Anclas de valor unitario")
    r.p(
        "La base primaria son operaciones cerradas dentro del mismo predio matriz y en su entorno "
        "inmediato, que constituyen la mejor evidencia disponible de disposición a pagar real."
    )
    r.table(
        ["Ancla de valor", "Sup. media", "Valor unitario", "Naturaleza"],
        [[nombre, f"{num(sup,0)} m²", f"$ {num(val,0)} /m²",
          "Escrituras cerradas" if "escritura" in nombre.lower() else "Oferta homologada"]
         for nombre, sup, val in ANCLAS]
        + [["Valor unitario adoptado · parcela tipo 5.000 m²", "5.000 m²",
            f"$ {num(ANCLA_UNIT,0)} /m²", "Conclusión del tasador"]],
        widths=[3.0, 1.0, 1.2, 1.4],
        align=["L", "R", "R", "L"],
    )
    r.p(
        f"El valor unitario se ajusta por tamaño mediante una elasticidad de "
        f"−{num(ELASTICIDAD,2)} sobre la superficie (a mayor superficie, menor precio por metro "
        f"cuadrado), lo que reproduce con error inferior al 2 % el valor de lista observado hoy en "
        f"Parque Mirador. Los valores resultantes por rol van de $ "
        f"{num(min(f['unit'] for f in filas),0)} a $ {num(max(f['unit'] for f in filas),0)} por m²."
    )

    # ------------------------------------------------------------ comparables
    r.section("4. Evidencia de mercado", "Comparables Región del Maule · 2025-2026")
    r.subsection("4.1 Producto minorista comparable (parcelas de agrado)")
    r.table(
        ["Ubicación / proyecto", "Superficie", "Precio publicación", "$/ha impl.", "Estado / fuente"],
        [
            ["Hualañé · Valles del Maule (loteo)", "5.000 m²", "$ 13.990.000", "$ 28,0 M",
             "Vigente · portalterreno.cl"],
            ["Licantén-costa · Brisas de Lipimavida (18 parc.)", "5.000 m²", "$ 12.000.000",
             "$ 24,0 M", "Vigente · parcelaschilespa.cl"],
            ["Costa Maule · Mirador de Trilco (16 parc.)", "5.000 m²", "UF 921 ≈ $ 37,6 M",
             "$ 75,3 M", "Con factibilidad luz y agua"],
            ["Vichuquén · sector J-80", "5.000 m²", "$ 12.990.000", "$ 26,0 M",
             "Vigente · chilepropiedades.cl"],
            ["Teno · ruta J-440", "5.000 m²", "$ 21.000.000", "$ 42,0 M",
             "Bajo la mediana comunal ($ 32,5 M)"],
            ["Sagrada Familia · sector La Isla", "5.000 m²", "$ 78.000.000", "$ 156,0 M",
             "A 4,3 km de Ruta 5 · no comparable directo"],
            ["Vichuquén · borde lago (Culenmapu)", "5.000 m²", "UF 4.223 ≈ $ 172,5 M",
             "$ 345,1 M", "Techo del mercado regional · no comparable"],
        ],
        widths=[2.8, 1.0, 1.5, 0.95, 1.85],
        align=["L", "R", "R", "R", "L"],
    )
    r.subsection("4.2 Suelo sin subdividir (piso de valor)")
    r.table(
        ["Ubicación", "Superficie", "Precio", "$/ha", "Observación"],
        [
            ["Romeral · campo en producción", "30,0 ha", "$ 58.000.000", "$ 1,9 M",
             "Secano interior sin subdivisión"],
            ["Parral · Fundo Agua Dulce", "por hectárea", "$ 3.000.000/ha", "$ 3,0 M",
             "Referencia de orden de magnitud"],
            ["Curepto · campo agrícola", "6,99 ha", "$ 200.000.000", "$ 28,6 M",
             "Predio pequeño con mejoras"],
        ],
        widths=[2.4, 1.0, 1.4, 0.9, 2.3],
        align=["L", "R", "R", "R", "L"],
    )
    r.callout(
        "Ajustes aplicados a los comparables",
        "Los comparables costeros y de borde de lago (Vichuquén, Trilco) se descartan como "
        "referencia directa por prima de localización no replicable en Caone. Los comparables de "
        "Hualañé y Licantén interior se homologan a la baja por asking-to-transaction (−6 %) y se "
        "corrigen por superficie. Los campos sin subdividir fijan el piso absoluto de valor del "
        f"portafolio en $ {num(PISO_CAMPO_HA/1e6,1)} millones por hectárea, es decir "
        f"{MM(tot['piso_campo'])} para las 494,25 ha.",
        kind="info",
    )
    r.subsection("4.3 Contexto regulatorio y de oferta")
    r.bullets([
        "El instructivo del Ministerio de Agricultura de 2024 endureció la certificación de "
        "subdivisiones rurales del DL 3.516; las solicitudes ante el SAG cayeron a un tercio "
        "respecto de 2022 (Diario Financiero, 26-03-2025 y 02-09-2025).",
        "El efecto sobre este portafolio es favorable en términos relativos: la restricción de "
        "nueva oferta legalmente parcelable premia a los proyectos con subdivisión ya materializada "
        "o en trámite avanzado, que es la condición del Proyecto Hualañé / Caone.",
        "El efecto adverso es de demanda: el fin del boom post-pandemia alarga los plazos de "
        "absorción, variable que este informe incorpora directamente en el descuento por plazo.",
    ])

    # ------------------------------------------------------------ escenario 3
    r.section("5. Escenario 3 — Valor retail del inventario", "Suma futura de 638 ventas minoristas")
    r.p(
        "Corresponde al valor agregado potencial de las 638 parcelas comercializadas una a una a "
        "valores actuales de mercado, con el producto ya habilitado. Es un valor bruto futuro: no "
        "descuenta costos, impuestos, plazo ni riesgo, y por lo tanto NO constituye el valor del "
        "proyecto ni un precio de venta del portafolio."
    )
    r.table(
        ["Rol", "Activo", "Parc.", "Ha", "$/m²", "Por parcela", "Retail del paño", "$/ha"],
        [[f["rol"], f["activo"], str(f["parcelas"]), num(f["ha"], 2), num(f["unit"], 0),
          MM1(f["valor_parcela"]), MM(f["retail"]), f"{num(f['retail_ha']/1e6,1)} M"] for f in filas]
        + [["TOTAL", "Portafolio", "638", "494,25", num(tot["retail"] / (494.25 * 10000), 0),
            MM1(tot["retail"] / 638), MM(tot["retail"]), f"{num(tot['retail']/494.25/1e6,1)} M"]],
        widths=[0.95, 1.6, 0.6, 0.7, 0.7, 1.15, 1.3, 0.75],
        align=["L", "L", "R", "R", "R", "R", "R", "R"],
        size=7.8,
    )
    r.callout("A · Valor total retail potencial",
              f"{MM(tot['retail'])} ({UFV(tot['retail'])}), equivalente a $ "
              f"{num(tot['retail']/638/1e6,1)} millones por parcela promedio y $ "
              f"{num(tot['retail']/494.25/1e6,1)} millones por hectárea. Es un flujo que se "
              f"materializa a lo largo de aproximadamente {tot['meses']} meses de comercialización.",
              kind="warn")

    # ------------------------------------------------------------ escenario 4
    r.section("6. Escenario 4 — Valor presente del negocio", "Flujo de caja descontado")
    r.p(
        "El valor presente se obtiene proyectando mensualmente la venta del inventario y "
        "descontando de cada mes los costos comerciales, el CAPEX de habilitación pendiente y el "
        "impuesto a la renta, para luego traer el flujo neto a valor presente."
    )
    r.keyvalues([
        ("Absorción en régimen", f"{num(RITMO_FRENTE,1)} parcelas/mes por frente · tope {num(RITMO_MAX,0)}/mes"),
        ("Plazo de venta del portafolio", f"{tot['meses']} meses (rampa de 6 meses)"),
        ("Corretaje", f"{int(COM_CORRETAJE*100)} % sobre ventas"),
        ("Marketing", f"{int(MARKETING*100)} % sobre ventas"),
        ("Administración y gastos generales", f"{int(ADMIN_GG*100)} % sobre ventas"),
        ("CAPEX de habilitación", f"{MM(tot['capex'])} · incluye {int(CONTINGENCIA*100)} % de contingencia"),
        ("Impuesto a la renta", f"{int(TASA_IMPUESTO*100)} % sobre utilidad"),
        ("Tasa de descuento del negocio", f"{int(R_NEGOCIO*100)} % anual real"),
    ])
    r.p(
        f"El CAPEX considera $ {num(CAPEX_PARCELA['bruto']/1e6,1)} millones por parcela en los paños "
        f"que requieren camino interior, electrificación, agua y escrituración completa, y $ "
        f"{num(CAPEX_PARCELA['avanzado']/1e6,1)} millones por parcela en los roles 163-356, 163-357 "
        f"y 163-358, cuya habilitación se encuentra en estado avanzado. Se desembolsa en los "
        f"primeros 24 meses."
    )
    r.image(grafico_cascada(f"/tmp/qa/_caone_cascada.png"), 62 * 2.83465,
            caption="Puente de valor: del valor retail bruto de las 638 parcelas al valor presente "
                    "del negocio. Cifras en millones de pesos.")
    r.callout("B · Valor presente económico del inventario",
              f"{MM(tot['npv_negocio'])} ({UFV(tot['npv_negocio'])}), equivalente al "
              f"{num(tot['npv_negocio']/tot['retail']*100,1)} % del valor retail bruto. Esta es la "
              f"medida correcta del valor del negocio para su actual propietario, si decide "
              f"desarrollarlo y venderlo por su cuenta.",
              kind="ok")

    # ------------------------------------------------------------ escenario 1
    r.section("7. Escenario 1 — Venta en bloque a inversionista", "Conclusión principal")
    r.p(
        "La pregunta central del encargo es cuánto pagaría hoy un fondo, inmobiliaria, family "
        "office o desarrollador por adquirir el portafolio completo en una sola operación. La "
        "respuesta no es el valor presente del negocio para el actual dueño, sino ese mismo flujo "
        "descontado a la tasa de retorno que exige un comprador de este perfil, menos el descuento "
        "propio de una operación de gran tamaño."
    )
    r.table(
        ["Concepto", "Efecto", "Valor"],
        [
            ["Valor retail bruto del inventario", "Punto de partida", MM(tot["retail"])],
            ["Costos comerciales (corretaje, marketing, administración)",
             f"−{int((COM_CORRETAJE+MARKETING+ADMIN_GG)*100)} % sobre ventas",
             "−" + MM(tot["retail"] * (COM_CORRETAJE + MARKETING + ADMIN_GG))],
            ["CAPEX de habilitación pendiente y contingencias", "Desembolso 24 meses",
             "−" + MM(tot["capex"])],
            ["Impuesto a la renta", f"{int(TASA_IMPUESTO*100)} %", "Incorporado en el flujo"],
            ["Efecto plazo y riesgo · hurdle del inversionista",
             f"VAN al {int(R_INVERSIONISTA*100)} % anual", MM(tot["npv_inv"])],
            ["Descuento por tamaño y concentración de la operación",
             f"−{int(DESC_BLOQUE*100)} %", "−" + MM(tot["npv_inv"] * DESC_BLOQUE)],
            ["VALOR DE MERCADO DEL PORTAFOLIO EN BLOQUE", "Conclusión", MM(tot["valor_bloque"])],
        ],
        widths=[3.6, 1.7, 1.4],
        align=["L", "L", "R"],
    )
    r.bullets([
        f"Tamaño de la operación: un solo comprador debe absorber 638 unidades, lo que concentra "
        f"riesgo comercial y limita el universo de compradores; se refleja en el descuento del "
        f"{int(DESC_BLOQUE*100)} %.",
        f"Plazo de absorción: {tot['meses']} meses estimados con comercialización multifrente; es "
        f"el factor de mayor impacto sobre el valor.",
        f"Costo financiero y margen requerido: capturados en la tasa de descuento del "
        f"{int(R_INVERSIONISTA*100)} % anual real, coherente con el retorno exigido a proyectos de "
        f"parcelación rural en Chile.",
        "Riesgo regulatorio: el endurecimiento de la certificación SAG afecta la subdivisión de los "
        "paños aún no materializados y debe verificarse rol por rol en la due diligence.",
    ])
    r.callout("C · Valor estimado de venta del portafolio completo en bloque",
              f"{MM(tot['valor_bloque'])} ({UFV(tot['valor_bloque'])}) · $ "
              f"{num(tot['valor_bloque']/tot['ha']/1e6,1)} millones por hectárea · $ "
              f"{num(tot['valor_bloque']/638/1e6,1)} millones por parcela. Representa el "
              f"{num(tot['valor_bloque']/tot['retail']*100,1)} % del valor retail bruto y "
              f"{num(tot['valor_bloque']/tot['piso_campo'],1)} veces el valor del mismo suelo sin "
              f"subdividir.", kind="brand")

    # ------------------------------------------------------------ escenario 2
    r.section("8. Escenario 2 — Venta por sociedades o macrolotes", "Cuatro operaciones separadas")
    r.p(
        "Cada sociedad se valoriza como una operación independiente, con su propio ritmo de "
        "absorción (menor número de frentes comerciales activos) y un descuento por concentración "
        f"reducido al {int(DESC_PANO*100)} %, dado el menor tamaño del ticket y el mayor universo "
        "de compradores."
    )
    r.table(
        ["Sociedad", "Parc.", "Ha", "Retail", "VAN 16 %", "Valor de venta", "Venta rápida", "Meses"],
        [[s.replace(" SpA", ""), str(v["parcelas"]), num(v["ha"], 2), MM(v["retail"]),
          MM(v["npv_negocio"]), MM(v["valor_pano"]), MM(v["valor_rapido"]), str(v["meses"])]
         for s, v in socs.items()]
        + [["SUMA DE LAS PARTES", "638", "494,25", MM(tot["retail"]),
            MM(sum(v["npv_negocio"] for v in socs.values())), MM(inicial),
            MM(sum(v["valor_rapido"] for v in socs.values())), "—"]],
        widths=[2.3, 0.7, 0.8, 1.2, 1.2, 1.3, 1.2, 0.7],
        align=["L", "R", "R", "R", "R", "R", "R", "R"],
        size=7.8,
    )
    r.p(
        f"La suma de las cuatro operaciones separadas ({MM(inicial)}) supera en "
        f"{num((inicial/tot['valor_bloque']-1)*100,1)} % el valor del portafolio vendido en bloque "
        f"({MM(tot['valor_bloque'])}). Esa diferencia —{MM(inicial - tot['valor_bloque'])}— es "
        f"precisamente el precio de la liquidez y de la simplicidad de una operación única, y "
        f"constituye el margen de negociación estructural del vendedor."
    )

    r.subsection("8.1 Valor individual por paño y rol")
    r.table(
        ["Rol", "Activo", "Sociedad", "Parc.", "Ha", "$/ha", "Por parcela",
         "Valor del paño", "Venta rápida"],
        [[f["rol"], f["activo"], f["sociedad"].replace(" SpA", "").replace("Forestal ", "")
          .replace("Agrícola ", ""), str(f["parcelas"]), num(f["ha"], 2),
          f"{num(f['valor_pano']/f['ha']/1e6,1)} M",
          f"{num(f['valor_pano']/f['parcelas']/1e6,1)} M",
          MM(f["valor_pano"]), MM(f["valor_rapido"])] for f in filas]
        + [["TOTAL", "Portafolio", "4 sociedades", "638", "494,25",
            f"{num(inicial/494.25/1e6,1)} M", f"{num(inicial/638/1e6,1)} M", MM(inicial),
            MM(sum(f["valor_rapido"] for f in filas))]],
        widths=[0.9, 1.7, 1.35, 0.55, 0.7, 0.85, 0.95, 1.1, 1.0],
        align=["L", "L", "L", "R", "R", "R", "R", "R", "R"],
        size=7.2,
    )
    r.p(
        "El valor por rol se obtiene prorrateando el valor de venta de su sociedad según el valor "
        "presente individual de cada paño, de modo que la suma por rol reconcilia exactamente con "
        "el valor por sociedad y con el total del Escenario 2."
    )

    # ------------------------------------------------------------ liquidación
    r.section("9. Valor de liquidación", "Venta forzada en 6 a 9 meses")
    r.p(
        f"Corresponde a una enajenación acelerada, con exposición al mercado reducida y sin poder "
        f"de negociación del vendedor. Se estima aplicando un factor de "
        f"{num((1-tot['valor_rapido']/tot['valor_bloque'])*100,0)} % de castigo sobre el valor de mercado en bloque, con "
        f"piso absoluto en el valor del suelo sin subdividir."
    )
    r.kpis([
        ("D · Valor de liquidación", MM(tot["valor_rapido"]), UFV(tot["valor_rapido"])),
        ("Piso · suelo sin subdividir", MM(tot["piso_campo"]), f"$ {num(PISO_CAMPO_HA/1e6,1)} M/ha"),
        ("Castigo vs. valor de mercado", f"−{num((1-tot['valor_rapido']/tot['valor_bloque'])*100,0)} %",
         "Exposición de 6 a 9 meses"),
    ])

    # ------------------------------------------------------------ banda
    r.section("10. Banda de negociación recomendada", "Estrategia de precio")
    r.image(grafico_banda(f"/tmp/qa/_caone_banda.png"), 42 * 2.83465,
            caption="Banda de negociación del portafolio completo. Cifras en millones de pesos.")
    r.table(
        ["Referencia", "Valor CLP", "Valor UF", "$/ha", "Uso"],
        [
            ["Precio inicial recomendado de oferta", MM(inicial), UFV(inicial),
             f"{num(inicial/494.25/1e6,1)} M", "Salida a mercado · suma de las partes"],
            ["Valor comercial central", MM(tot["valor_bloque"]), UFV(tot["valor_bloque"]),
             f"{num(tot['valor_bloque']/494.25/1e6,1)} M", "Cierre esperado en bloque"],
            ["Precio mínimo defendible", MM(minimo), UFV(minimo),
             f"{num(minimo/494.25/1e6,1)} M", "Piso de negociación · no bajar sin contrapartida"],
            ["Valor de liquidación", MM(tot["valor_rapido"]), UFV(tot["valor_rapido"]),
             f"{num(tot['valor_rapido']/494.25/1e6,1)} M", "Sólo venta forzada"],
        ],
        widths=[2.4, 1.3, 1.2, 0.9, 2.4],
        align=["L", "R", "R", "R", "L"],
    )
    r.keyvalues([
        ("Descuento máximo razonable en bloque 100 %", f"{num(desc_max*100,1)} % sobre el precio de salida"),
        ("Rango de cierre esperado", f"{MM(minimo)} — {MM(tot['valor_bloque']*1.06)}"),
    ])
    r.subsection("10.1 Variables que aumentan el valor")
    r.bullets([
        "Certificados SAG / DL 3.516 vigentes y planos aprobados para la totalidad de los roles: "
        "elimina el principal riesgo del comprador y puede sostener entre 8 % y 12 % adicional.",
        "Factibilidad eléctrica y de agua acreditada por rol (empalme troncal, derechos DGA "
        "inscritos): el comparable Mirador de Trilco, con factibilidad real, se ofrece a más del "
        "doble por hectárea que los loteos sin ella.",
        "Caminos interiores ejecutados y recepcionados: reduce CAPEX del comprador y acelera la "
        "absorción, con efecto directo sobre el VAN.",
        "Continuidad del canal de venta ya operativo del proyecto (inventario publicado, base de "
        "leads y transacciones cerradas verificables) traspasado con la operación.",
        "Financiamiento directo al comprador final ya estructurado, que amplía la demanda efectiva.",
    ])
    r.subsection("10.2 Variables que disminuyen el valor")
    r.bullets([
        "Endurecimiento adicional de la normativa de subdivisión rural o rechazo de certificaciones "
        "pendientes en los paños aún no materializados.",
        "Prolongación del plazo de absorción: cada 12 meses adicionales de venta reducen el valor "
        "presente en torno a un 12 % a 15 %.",
        "Gravámenes, servidumbres o litigios sobre los roles; en particular, la servidumbre "
        "eléctrica LT 1x220 kV Caone–Mataquito, cuyo efecto sobre los lotes afectados está "
        "cuantificado en informe pericial separado y no está incorporado en esta tasación.",
        "Deuda de contribuciones, regularizaciones pendientes o falta de accesos inscritos.",
        "Alza de tasas de interés de largo plazo, que eleva el hurdle del comprador.",
    ])

    # ------------------------------------------------------------ supuestos
    r.section("11. Supuestos, limitaciones y declaración", "")
    r.bullets([
        "Valoración a la fecha del informe, en pesos chilenos de agosto de 2026; UF = "
        f"$ {num(UF,2)} (21-08-2026).",
        "Se asume que las superficies y el número de parcelas del catastro entregado son correctos "
        "y que los inmuebles se encuentran libres de gravámenes, salvo mención expresa.",
        "No se practicó inspección topográfica ni estudio de títulos; el informe no sustituye una "
        "due diligence legal ni un estudio de mecánica de suelos.",
        "Se excluyen expresamente el Proyecto Explora Park y los 14 lotes permutados de la "
        "Hijuela 4, tanto de las superficies como de los valores.",
        "Los valores históricos de aporte y registros contables de las sociedades no fueron "
        "utilizados como conclusión de valor.",
        "El efecto de la servidumbre eléctrica LT 1x220 kV Caone–Mataquito sobre los lotes "
        "afectados se trata en informe pericial independiente y no se descuenta aquí.",
        "El presente informe es confidencial y su uso se limita al destinatario y al propósito "
        "declarado de negociación del portafolio.",
    ])
    r.signature(
        "OFERTA TERRENOS · Valuation",
        "Tasación comercial de portafolio · IVS 2022",
        f"Folio {FOLIO} · {FECHA}",
    )
    r.closing(
        "Documento verificable en ofertaterrenos.com/tasacion/validar. Las conclusiones de valor "
        "corresponden a la fecha del informe y a las bases de valor declaradas en la sección 3."
    )

    path = f"{OUT_DIR}/Tasacion_Consolidada_Portafolio_Hualane_Caone.pdf"
    return r.save(path)


if __name__ == "__main__":
    print(build())
