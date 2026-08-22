"""Documento de referencia del shell OT (muestra todos los bloques disponibles)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from ot_report_shell import DocMeta, Report, clp  # noqa: E402

OUT = "/mnt/documents/OT_Formato_Informes_Tasaciones.pdf"


def build() -> str:
    meta = DocMeta(
        doc_type="Informe de tasación comercial",
        title="Parcelas Valle Escondido",
        subtitle="Ruta K-60, comuna de Hualañé · Región del Maule",
        folio="OT-TAS-2026-0142",
        date="22 de agosto de 2026",
        prepared_for="Banca Empresas · Área de Riesgo de Crédito",
        author="Oferta Terrenos · Valuation",
        qr_url="https://ofertaterrenos.com/tasacion/validar",
        footer_note="Escanee el código para validar folio, fecha de emisión y huella SHA-256 del documento en ofertaterrenos.com.",
    )
    r = Report(meta)

    r.cover(
        summary=(
            "Tasación comercial de un predio rústico de 41,7 hectáreas con aptitud de subdivisión "
            "acogida al DL 3.516, elaborada bajo estándar IVS 2022 con base en comparables de "
            "mercado verificados y ajuste por accesibilidad, topografía y factibilidad sanitaria."
        ),
        highlights=[
            ("Valor de mercado (FMV)", "UF 18.400"),
            ("Rango de valor", "UF 17.100 – 19.600"),
            ("Superficie tasada", "41,7 ha"),
        ],
    )

    r.section("Resumen ejecutivo", kicker="Sección 01")
    r.p(
        "El predio se emplaza a 6,4 km del cruce de la Ruta K-60, con frente continuo a camino público "
        "enrolado y factibilidad eléctrica en el deslinde norte. La zonificación permite subdivisión "
        "mínima de 5.000 m², lo que habilita un esquema de 62 parcelas comercializables sin cambio de uso."
    )
    r.kpis([
        ("Valor unitario", "$ 2.749 / m²", "Mediana ajustada de comparables"),
        ("Valor total FMV", clp(1146000000), "Al 22-08-2026"),
        ("Liquidez estimada", "8 – 12 meses", "Venta ordenada, mayorista"),
        ("Lotes proyectados", "62", "DL 3.516, mínimo 5.000 m²"),
        ("Frente a camino", "412 m", "Camino público enrolado"),
        ("Pendiente media", "6,2 %", "Modelo de elevación Mapbox"),
    ])

    r.section("Antecedentes del inmueble", kicker="Sección 02")
    r.keyvalues([
        ("Rol de avalúo", "168-919"),
        ("Comuna / Región", "Hualañé · Maule"),
        ("Superficie escritura", "41,7 ha"),
        ("Inscripción", "Fs. 1.204 N° 812, CBR Curicó, 2021"),
        ("Uso de suelo", "Agrícola con subdivisión DL 3.516"),
        ("Servidumbres", "Eléctrica LT 1x220 kV (borde sur)"),
    ])
    r.p(
        "No se detectaron gravámenes, prohibiciones ni litigios pendientes en el certificado de hipotecas "
        "y gravámenes vigente a la fecha de emisión de este informe."
    )

    r.section("Comparables de mercado", kicker="Sección 03")
    r.table(
        ["Referencia", "Superficie", "Precio publicado", "$/m²", "Distancia"],
        [
            ["Parcela Camino Los Nogales", "5.000 m²", clp(16900000), "3.380", "2,1 km"],
            ["Loteo Rincón del Maule, lote 12", "5.200 m²", clp(15500000), "2.981", "4,8 km"],
            ["Predio Santa Rosa (venta mayorista)", "12,4 ha", clp(298000000), "2.403", "7,6 km"],
            ["Parcela Vista Hualañé", "5.000 m²", clp(14900000), "2.980", "9,2 km"],
        ],
        widths=[3.1, 1.2, 1.5, 1, 1],
    )
    r.callout(
        "Criterio de homologación",
        "Los valores publicados se ajustan en −12 % por spread de negociación observado en la zona y en "
        "−9 % adicional al pasar de retail (parcela individual) a mayorista (predio completo).",
        kind="brand",
    )

    r.section("Metodología y supuestos", kicker="Sección 04")
    r.bullets([
        "Enfoque comparativo de mercado como método principal (IVS 105, párrafo 30.1).",
        "Enfoque residual como contraste, descontando urbanización, comisiones y plazo de venta.",
        "Fecha de valor: 22 de agosto de 2026. Moneda de referencia: UF al cierre del período.",
        "Se asume título saneado, libre de ocupación y con acceso legal permanente al camino público.",
    ])
    r.callout(
        "Limitaciones del informe",
        "El presente documento no constituye levantamiento topográfico ni estudio de mecánica de suelos. "
        "Su vigencia es de 180 días corridos desde la fecha de emisión.",
        kind="warn",
    )

    r.section("Conclusión de valor", kicker="Sección 05")
    r.p(
        "Sobre la base del análisis expuesto, el valor justo de mercado del predio, en condiciones de venta "
        "ordenada y mayorista, se establece en UF 18.400, con un rango razonable de UF 17.100 a UF 19.600."
    )
    r.signature(
        "Oferta Terrenos · Valuation",
        "Perito tasador independiente — predios rurales y subdivisiones",
        "Registro interno OT-VAL-014 · contacto@ofertaterrenos.com",
    )
    r.closing(
        "Documento emitido por Oferta Terrenos. Reproducción parcial no autorizada. "
        "Verifique la vigencia del folio en ofertaterrenos.com/tasacion/validar."
    )

    return r.save(OUT)


if __name__ == "__main__":
    print(build())
