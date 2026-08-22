"""Figuras del Anexo Pericial V4-B: mapa de clases visuales y gráficos."""
import json
from collections import Counter

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from shapely import wkt as shwkt  # noqa: E402

WORK = "/tmp/anexo4b/work"
COL = {"V0": "#94A3B8", "V1": "#22C55E", "V2": "#0EA5E9", "V3": "#B45309", "V4": "#B91C1C"}


def main():
    geo = json.load(open(f"{WORK}/parcelas_v4b.json"))
    sc = json.load(open(f"{WORK}/scored_v4b.json"))
    clase = {(x["rol"], x["n"]): x["clase"] for x in sc["lotes"]}
    faja = shwkt.loads(geo["faja_wkt"])

    fig, ax = plt.subplots(figsize=(9.6, 7.2), dpi=170)
    for rol, arr in geo["predios"].items():
        for r in arr:
            p = shwkt.loads(r["wkt"])
            x, y = p.exterior.xy
            c = COL[clase.get((rol, r["n"]), "V0")]
            ax.fill(x, y, facecolor=c, edgecolor="white", linewidth=0.25, alpha=0.92)
    for g in (faja.geoms if faja.geom_type == "MultiPolygon" else [faja]):
        x, y = g.exterior.xy
        ax.fill(x, y, facecolor="#12181A", alpha=0.18, edgecolor="#12181A", linewidth=0.5)
    tx = [t[0] for t in geo["torres"]]
    ty = [t[1] for t in geo["torres"]]
    ax.scatter(tx, ty, s=9, marker="^", color="#12181A", zorder=5, label="Estructuras LT 220 kV")
    bb = [shwkt.loads(x["wkt"]).bounds for arr in geo["predios"].values() for x in arr]
    pad = 350
    ax.set_xlim(min(b[0] for b in bb) - pad, max(b[2] for b in bb) + pad)
    ax.set_ylim(min(b[1] for b in bb) - pad, max(b[3] for b in bb) + pad)
    ax.set_aspect("equal")
    ax.set_xlabel("Este UTM 19S (m)", fontsize=7)
    ax.set_ylabel("Norte UTM 19S (m)", fontsize=7)
    ax.tick_params(labelsize=6)
    hs = [plt.Line2D([], [], marker="s", ls="", color=COL[k], label=f"Clase {k}")
          for k in ("V0", "V1", "V2", "V3", "V4")]
    hs.append(plt.Line2D([], [], marker="^", ls="", color="#12181A", label="Estructuras"))
    ax.legend(handles=hs, fontsize=6.5, loc="lower left", frameon=True, framealpha=0.9, edgecolor="none", ncol=3)
    ax.set_title("Clasificación de dominancia visual · 675 lotes de predios vecinos",
                 fontsize=9, color="#164E34")
    fig.tight_layout()
    fig.savefig(f"{WORK}/mapa_v4b.png")
    plt.close(fig)

    L = sc["lotes"]
    fig, axs = plt.subplots(1, 3, figsize=(11.5, 3.4), dpi=170)
    axs[0].hist([x["idv"] for x in L], bins=24, color="#164E34")
    axs[0].set_title("Distribución del IDV", fontsize=8.5, color="#164E34")
    axs[0].set_xlabel("IDV", fontsize=7)
    axs[0].set_ylabel("N° de lotes", fontsize=7)

    axs[1].scatter([x["d_faja"] for x in L], [x["idv"] for x in L], s=5,
                   c=[COL[x["clase"]] for x in L], alpha=0.8)
    axs[1].set_xlabel("Distancia a la faja de servidumbre (m)", fontsize=7)
    axs[1].set_ylabel("IDV", fontsize=7)
    axs[1].set_title("IDV vs distancia", fontsize=8.5, color="#164E34")

    roles = sorted({x["rol"] for x in L})
    bottom = [0] * len(roles)
    for k in ("V0", "V1", "V2", "V3", "V4"):
        vals = [Counter(x["clase"] for x in L if x["rol"] == r)[k] for r in roles]
        axs[2].bar(range(len(roles)), vals, bottom=bottom, color=COL[k], label=k)
        bottom = [b + v for b, v in zip(bottom, vals)]
    axs[2].set_xticks(range(len(roles)))
    axs[2].set_xticklabels([r.replace("Rol ", "") for r in roles], rotation=45,
                           fontsize=6, ha="right")
    axs[2].set_title("Clases por predio", fontsize=8.5, color="#164E34")
    axs[2].legend(fontsize=6, frameon=False, ncol=5)
    for a in axs:
        a.tick_params(labelsize=6)
        for s in ("top", "right"):
            a.spines[s].set_visible(False)
    fig.tight_layout()
    fig.savefig(f"{WORK}/graficos_v4b.png")
    print("figuras OK")


if __name__ == "__main__":
    main()
