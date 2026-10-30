import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUpRight, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QUICK_FILTERS } from "./useShowcaseProjects";
import landscape from "@/assets/covers/valle-hualane.jpg";

const CinematicShowcaseHero = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (type) params.set("type", type);
    if (budget) {
      params.set("currency", "CLP");
      params.set("clpMax", budget);
    }
    navigate(`/explorar${params.size ? `?${params}` : ""}`);
  };

  return (
    <section
      className="landing-discovery-hero relative isolate overflow-hidden bg-primary text-primary-foreground"
      aria-labelledby="hero-title"
    >
      <img
        src={landscape}
        alt=""
        fetchPriority="high"
        width={1600}
        height={912}
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
      <div className="container px-4 pb-8 pt-10 sm:pb-10 sm:pt-16 lg:pb-12 lg:pt-20">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] sm:text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
          Tierra para tu próxima historia
        </p>
        <h1
          id="hero-title"
          className="mt-4 max-w-3xl font-editorial text-[2.65rem] font-medium leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl"
        >
          Menos ciudad.
          <br />
          Más posibilidades.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-foreground/90 sm:text-base">
          Encuentra una parcela para vivir, escapar o invertir. El próximo paso
          empieza por elegir tu lugar.
        </p>

        <form
          onSubmit={submit}
          role="search"
          aria-label="Buscar terrenos en venta"
          className="mt-7 grid gap-3 rounded-2xl bg-card p-4 text-card-foreground shadow-xl sm:mt-9 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-end lg:gap-0 lg:p-3"
        >
          <div className="min-w-0 lg:px-3">
            <label
              htmlFor="hero-search"
              className="mb-1.5 block text-xs font-semibold"
            >
              ¿Dónde quieres comprar?
            </label>
            <div className="relative">
              <MapPin
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary"
                aria-hidden="true"
              />
              <Input
                id="hero-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Comuna, región o proyecto"
                className="h-11 rounded-lg border-border bg-background pl-9 text-base"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:contents">
            <div className="min-w-0 lg:border-l lg:px-4">
              <label
                htmlFor="hero-type"
                className="mb-1.5 block text-xs font-semibold"
              >
                Tipo de terreno
              </label>
              <select
                id="hero-type"
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="h-11 w-full min-w-0 rounded-lg border bg-background px-2 text-sm focus-ring"
              >
                <option value="">Todos</option>
                {QUICK_FILTERS.map((filter) => (
                  <option key={filter.type} value={filter.type}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0 lg:border-l lg:px-4">
              <label
                htmlFor="hero-budget"
                className="mb-1.5 block text-xs font-semibold"
              >
                Presupuesto CLP
              </label>
              <select
                id="hero-budget"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                className="h-11 w-full min-w-0 rounded-lg border bg-background px-2 text-sm focus-ring"
              >
                <option value="">Sin límite</option>
                <option value="20000000">Hasta $20 millones</option>
                <option value="40000000">Hasta $40 millones</option>
                <option value="80000000">Hasta $80 millones</option>
                <option value="150000000">Hasta $150 millones</option>
              </select>
            </div>
          </div>
          <Button
            type="submit"
            size="lg"
            className="h-12 rounded-xl px-5"
            aria-label="Buscar parcelas y terrenos"
          >
            <Search className="mr-2 h-4 w-4" aria-hidden="true" />
            Encontrar mi terreno
          </Button>
        </form>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-sm">
          <a
            href="#proyectos-en-venta"
            className="inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline focus-ring"
          >
            Ver proyectos en venta{" "}
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </a>
          <a
            href="#encuentra-tu-parcela"
            className="inline-flex min-h-11 items-center gap-2 text-primary-foreground/90 underline-offset-4 hover:underline focus-ring"
          >
            ¿No sabes por dónde empezar?{" "}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
};
export default CinematicShowcaseHero;
