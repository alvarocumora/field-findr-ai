"""
Anexo Pericial V4-A — scoring IDV, clasificación V0-V4 y test de mercado.
Lee /tmp/anexo/work/analisis_v4a.json y escribe /tmp/anexo/work/scored_v4a.json
"""
import json
import math
import statistics as st

WORK = "/tmp/anexo/work"

RANGOS = dict(D=(40, 600), N=(2, 20), H=(3, 25), C=(500, 3000), O=(20, 150))

PESOS = dict(D=0.20, N=0.08, H=0.18, C=0.08, S=0.14, O=0.06, A=0.06, V=0.16, P=0.04)
PESOS_ALT = {
    "W1 · distancia dominante": dict(D=0.34, N=0.06, H=0.14, C=0.06, S=0.10,
                                     O=0.04, A=0.06, V=0.16, P=0.04),
    "W2 · dominancia perceptual": dict(D=0.12, N=0.10, H=0.24, C=0.10, S=0.20,
                                       O=0.06, A=0.04, V=0.10, P=0.04),
    "W3 · uso residencial": dict(D=0.16, N=0.06, H=0.16, C=0.06, S=0.12,
                                 O=0.04, A=0.10, V=0.26, P=0.04),
}

CORTES = [("V0", 0.00), ("V1", 0.30), ("V2", 0.45), ("V3", 0.60), ("V4", 0.75)]
# hipótesis inicial de depreciación heredada de V4 (a validar, no demostrada)
HIP = {"V0": (0.0, 0.0), "V1": (0.0, 0.03), "V2": (0.03, 0.06),
       "V3": (0.06, 0.11), "V4": (0.11, 0.18)}


def nlog(v, lo, hi):
    v = max(lo, min(hi, v))
    return (math.log(v) - math.log(lo)) / (math.log(hi) - math.log(lo))


def nlin(v, lo, hi):
    return max(0.0, min(1.0, (v - lo) / (hi - lo)))


def clase(v):
    c = "V0"
    for name, lim in CORTES:
        if v >= lim:
            c = name
    return c


def componentes(p, modelo="A"):
    r = p["pts"]
    key = "n_vis" if modelo == "A" else "n_vis_B"
    base = max((r[k] for k in ("P2", "P4", "P3")), key=lambda x: (x[key], -(x["dmin"] or 1e9)))
    nvis = base[key]
    if nvis == 0:
        return dict(D=0, N=0, H=0, C=0, S=0, O=0, A=0, V=0, P=0)
    d = base["dmin"] or 600
    factor = 1.0 if modelo == "A" else 0.55   # el conductor tras pantalla vegetal
    return dict(
        D=1 - nlog(d, *RANGOS["D"]),
        N=nlin(nvis, *RANGOS["N"]),
        H=nlin(base["ang_v"], *RANGOS["H"]),
        C=nlin(base["len_cond"] * factor, *RANGOS["C"]),
        S=base["sky"],
        O=nlin(base["ang_h"], *RANGOS["O"]),
        A=1.0 if r["P1"][key] else 0.0,
        V=1.0 if r["P4"][key] else 0.0,
        P=sum(1 for k in r if r[k][key]) / 5.0,
    )


def idv(c, pesos=PESOS):
    return sum(pesos[k] * c[k] for k in pesos)


def main():
    d = json.load(open(f"{WORK}/analisis_v4a.json"))
    parcelas = d["parcelas"]
    for p in parcelas:
        cA = componentes(p, "A")
        cB = componentes(p, "B")
        p["compA"] = {k: round(v, 3) for k, v in cA.items()}
        p["compB"] = {k: round(v, 3) for k, v in cB.items()}
        p["idvA"] = round(idv(cA), 3)
        p["idvB"] = round(idv(cB), 3)
        p["claseA"] = clase(p["idvA"])
        p["claseB"] = clase(p["idvB"])
        p["alt"] = {k: clase(idv(cA, w)) for k, w in PESOS_ALT.items()}
        p["alt_idv"] = {k: round(idv(cA, w), 3) for k, w in PESOS_ALT.items()}
        # clase pericial: A y B ponderadas 60/40 (persistencia de la pantalla vegetal)
        p["idv"] = round(0.6 * p["idvA"] + 0.4 * p["idvB"], 3)
        p["clase"] = clase(p["idv"])
        p["ppm2"] = round(p["price"] / p["area_db"]) if p["price"] and p["area_db"] else None

    # -------- test de mercado: precio y absorción por clase ------------------
    grupos = {}
    for p in parcelas:
        grupos.setdefault(p["clase"], []).append(p)
    tabla = []
    for c, _ in CORTES:
        g = grupos.get(c, [])
        if not g:
            tabla.append(dict(clase=c, n=0))
            continue
        pp = [x["ppm2"] for x in g if x["ppm2"]]
        vend = sum(1 for x in g if x["status"] in ("sold", "reserved"))
        tabla.append(dict(clase=c, n=len(g), sup=round(st.mean(x["area_db"] for x in g)),
                          ppm2=round(st.mean(pp)) if pp else None,
                          ppm2_med=round(st.median(pp)) if pp else None,
                          vendidos=vend, tasa=round(vend / len(g) * 100, 1),
                          d=round(st.mean(x["d_trace"] for x in g))))

    # correlación IDV vs precio unitario y vs estado de venta
    xs = [p["idv"] for p in parcelas if p["ppm2"]]
    ys = [p["ppm2"] for p in parcelas if p["ppm2"]]
    n = len(xs)
    mx, my = st.mean(xs), st.mean(ys)
    sx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    sy = math.sqrt(sum((y - my) ** 2 for y in ys))
    r_precio = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy)
    b = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx ** 2)
    t_stat = r_precio * math.sqrt((n - 2) / max(1e-9, 1 - r_precio ** 2))

    xv = [p["idv"] for p in parcelas]
    yv = [1.0 if p["status"] in ("sold", "reserved") else 0.0 for p in parcelas]
    mxv, myv = st.mean(xv), st.mean(yv)
    sxv = math.sqrt(sum((x - mxv) ** 2 for x in xv))
    syv = math.sqrt(sum((y - myv) ** 2 for y in yv))
    r_venta = sum((x - mxv) * (y - myv) for x, y in zip(xv, yv)) / (sxv * syv)
    t_venta = r_venta * math.sqrt((len(xv) - 2) / max(1e-9, 1 - r_venta ** 2))

    # sensibilidad de pesos: % de parcelas que cambian de clase
    cambios = {}
    for k in PESOS_ALT:
        cambios[k] = sum(1 for p in parcelas if p["alt"][k] != p["claseA"])

    # dependencia de la vegetación
    visA = sum(p["pts"]["P2"]["n_vis"] for p in parcelas)
    visB = sum(p["pts"]["P2"]["n_vis_B"] for p in parcelas)

    res = dict(meta=d["meta"], parcelas=parcelas, tabla=tabla,
               stats=dict(n=n, r_precio=round(r_precio, 3), b=round(b), t=round(t_stat, 2),
                          r_venta=round(r_venta, 3), t_venta=round(t_venta, 2),
                          visA=visA, visB=visB,
                          dep_veg=round((1 - visB / visA) * 100, 1),
                          cambios=cambios,
                          idv_min=min(p["idv"] for p in parcelas),
                          idv_max=max(p["idv"] for p in parcelas)))
    json.dump(res, open(f"{WORK}/scored_v4a.json", "w"))
    for t in tabla:
        print(t)
    print(res["stats"])


if __name__ == "__main__":
    main()
