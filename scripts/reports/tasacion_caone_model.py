"""Modelo de valorización del portafolio Hualañé / Caone (638 parcelas, 494,25 ha).

Base empírica:
  - Transacciones y asking del propio inventario (lots/listings de la plataforma).
  - Comparables públicos Maule (Hualañé, Vichuquén, Teno, Sagrada Familia, Curepto, Romeral).
Salida: dict con los 4 escenarios y el detalle por rol.
"""

from __future__ import annotations

UF = 40_860.0  # 21-ago-2026

# (sociedad, rol, activo, parcelas, ha, tier_capex)
ACTIVOS = [
    ("Forestal Altas Cumbres SpA", "168-916", "Hijuela 5", 69, 46.81, "bruto"),
    ("Forestal Altas Cumbres SpA", "168-917", "Hijuela 6", 79, 49.27, "bruto"),
    ("Forestal Altas Cumbres SpA", "168-918", "Hijuela 7", 68, 42.13, "bruto"),
    ("Forestal Altas Cumbres SpA", "168-919", "Hijuela 8", 69, 53.34, "bruto"),
    ("Agrícola Río Maule SpA", "168-920", "Hijuela 9", 47, 53.33, "bruto"),
    ("Forestal Valle Escondido SpA", "168-921", "Hijuela 10", 40, 41.75, "bruto"),
    ("Forestal Los Andes SpA", "168-922", "Hijuela 11", 43, 48.34, "bruto"),
    ("Forestal Los Andes SpA", "163-356", "Lote Uno / Parque Mirador", 24, 12.10, "avanzado"),
    ("Forestal Los Andes SpA", "163-357", "Lote Dos", 56, 30.65, "avanzado"),
    ("Forestal Los Andes SpA", "163-358", "Lote Tres", 56, 30.75, "avanzado"),
    ("Forestal Los Andes SpA", "168-924", "Lote A", 87, 85.78, "bruto"),
]

# --- Anclas de valor unitario retail (transacciones, no precios pedidos) ---
ANCLAS = [
    ("Brisas de Caone · 24 escrituras cerradas", 4_800, 4_082),
    ("Parque Mirador · asking homologado −6 %", 4_803, 3_160),
    ("Explora Park · 345 escrituras cerradas", 4_758, 2_134),
]
ANCLA_UNIT = 3_150.0   # $/m² para parcela tipo de 5.000 m² habilitada
SUP_REF = 5_000.0
ELASTICIDAD = 0.20     # p ∝ superficie^-0.20

# --- Costos ---
CAPEX_PARCELA = {"bruto": 2_600_000.0, "avanzado": 1_200_000.0}
COM_CORRETAJE = 0.08
MARKETING = 0.04
ADMIN_GG = 0.03
CONTINGENCIA = 0.05          # sobre CAPEX
TASA_IMPUESTO = 0.27
MESES_CAPEX = 24

# --- Tasas ---
R_NEGOCIO = 0.16             # valor presente del negocio (Escenario 4)
R_INVERSIONISTA = 0.22       # hurdle de un comprador en bloque
DESC_BLOQUE = 0.12           # descuento por tamaño/concentración de la operación
DESC_PANO = 0.06             # descuento al vender paño por paño
FACTOR_LIQUIDACION = 0.78    # venta forzada (6–9 meses)

PISO_CAMPO_HA = 2_800_000.0  # campo de secano sin subdividir, $/ha (comparables Romeral/Parral/Curepto)


def precio_unitario(sup_m2: float) -> float:
    return ANCLA_UNIT * (SUP_REF / sup_m2) ** ELASTICIDAD


def retail_por_activo():
    out = []
    for soc, rol, act, par, ha, tier in ACTIVOS:
        sup = ha * 10_000 / par
        pu = precio_unitario(sup)
        v_parcela = pu * sup
        total = v_parcela * par
        out.append(dict(sociedad=soc, rol=rol, activo=act, parcelas=par, ha=ha, tier=tier,
                        sup_parcela=sup, unit=pu, valor_parcela=v_parcela, retail=total,
                        retail_ha=total / ha))
    return out


RITMO_FRENTE = 4.5           # parcelas/mes por frente comercial activo (rol en venta)
RITMO_MAX = 18.0             # tope de absorción del portafolio completo


def curva_ventas(n: int, frentes: int, cap: float = RITMO_MAX):
    """Ritmo mensual agregado con rampa de 6 meses hasta el régimen."""
    regimen = min(frentes * RITMO_FRENTE, cap)
    ventas, restante, m = [], n, 0
    while restante > 0.5:
        ritmo = regimen * min(1.0, 0.35 + 0.13 * m)
        v = min(ritmo, restante)
        ventas.append(v)
        restante -= v
        m += 1
        if m > 240:
            break
    return ventas


def npv(flujos, tasa_anual):
    rm = (1 + tasa_anual) ** (1 / 12) - 1
    return sum(f / (1 + rm) ** (i + 1) for i, f in enumerate(flujos))


def flujo(parcelas: float, valor_parcela: float, capex_total: float, frentes: int,
          cap: float = RITMO_MAX):
    ventas = curva_ventas(parcelas, frentes, cap)
    n = len(ventas)
    capex_total *= (1 + CONTINGENCIA)
    flujos = []
    for i, v in enumerate(ventas):
        ingreso = v * valor_parcela
        costo_com = ingreso * (COM_CORRETAJE + MARKETING + ADMIN_GG)
        capex = capex_total / MESES_CAPEX if i < min(MESES_CAPEX, n) else 0.0
        flujos.append(ingreso - costo_com - capex)
    utilidad = sum(flujos)
    if utilidad > 0:
        imp = utilidad * TASA_IMPUESTO
        for i, f in enumerate(flujos):
            if f > 0:
                flujos[i] -= imp * f / utilidad
    return flujos, ventas


def _grupo(filas, frentes, cap=RITMO_MAX):
    par = sum(f["parcelas"] for f in filas)
    retail = sum(f["retail"] for f in filas)
    capex = sum(f["parcelas"] * CAPEX_PARCELA[f["tier"]] for f in filas)
    fl, ventas = flujo(par, retail / par, capex, frentes, cap)
    return dict(parcelas=par, ha=sum(f["ha"] for f in filas), retail=retail,
                capex=capex * (1 + CONTINGENCIA), meses=len(ventas),
                npv_negocio=npv(fl, R_NEGOCIO), npv_inv=npv(fl, R_INVERSIONISTA))


def valorizar():
    filas = retail_por_activo()

    # Escenario 3/4 — portafolio completo, comercialización multifrente
    tot = _grupo(filas, frentes=4)
    tot["valor_bloque"] = tot["npv_inv"] * (1 - DESC_BLOQUE)
    tot["valor_rapido"] = max(tot["valor_bloque"] * FACTOR_LIQUIDACION,
                              tot["ha"] * PISO_CAMPO_HA)
    tot["piso_campo"] = tot["ha"] * PISO_CAMPO_HA

    # Escenario 2 — venta por sociedad (cada sociedad con sus propios frentes)
    por_sociedad = {}
    for soc in dict.fromkeys(f["sociedad"] for f in filas):
        sub = [f for f in filas if f["sociedad"] == soc]
        g = _grupo(sub, frentes=min(len(sub), 2), cap=9.0)
        g["valor_pano"] = g["npv_inv"] * (1 - DESC_PANO)
        g["valor_rapido"] = max(g["valor_pano"] * FACTOR_LIQUIDACION, g["ha"] * PISO_CAMPO_HA)
        por_sociedad[soc] = g

    # Valor por rol: prorrateo del valor de su sociedad según NPV individual
    for f in filas:
        g = _grupo([f], frentes=1, cap=4.5)
        f["meses"] = g["meses"]
        f["capex"] = g["capex"]
        f["npv_negocio"] = g["npv_negocio"]
        f["npv_inv"] = g["npv_inv"]
    for soc, g in por_sociedad.items():
        sub = [f for f in filas if f["sociedad"] == soc]
        base = sum(x["npv_inv"] for x in sub)
        for f in sub:
            share = f["npv_inv"] / base
            f["valor_pano"] = g["valor_pano"] * share
            f["valor_bloque"] = tot["valor_bloque"] * (f["retail"] / tot["retail"])
            f["valor_rapido"] = max(f["valor_pano"] * FACTOR_LIQUIDACION,
                                    f["ha"] * PISO_CAMPO_HA)
    return filas, tot, por_sociedad


if __name__ == "__main__":
    filas, tot, soc = valorizar()
    for f in filas:
        print(f"{f['rol']} {f['activo'][:26]:26s} {f['parcelas']:3d} {f['ha']:6.2f} "
              f"u=${f['unit']:5.0f}/m2 parc=${f['valor_parcela']/1e6:5.1f}M "
              f"retail=${f['retail']/1e6:7.0f}M pano=${f['valor_pano']/1e6:6.0f}M "
              f"rapido=${f['valor_rapido']/1e6:6.0f}M meses={f['meses']}")
    print()
    for k, v in tot.items():
        print(k, round(v / 1e6, 1) if isinstance(v, float) and v > 1e6 else v)
    print("UF bloque", round(tot["valor_bloque"] / UF), "| UF/ha bloque",
          round(tot["valor_bloque"] / tot["ha"] / UF, 1))
    for s, v in soc.items():
        print(f"{s:32s} {v['parcelas']:3d} {v['ha']:6.2f} retail=${v['retail']/1e6:6.0f}M "
              f"npv16=${v['npv_negocio']/1e6:6.0f}M pano=${v['valor_pano']/1e6:6.0f}M "
              f"meses={v['meses']}")
    print("suma paños", round(sum(v['valor_pano'] for v in soc.values())/1e6),
          "vs bloque", round(tot['valor_bloque']/1e6))
