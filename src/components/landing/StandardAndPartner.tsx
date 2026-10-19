import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, FileCheck2, MapPinned, Orbit, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PILLARS = [
  { icon: Orbit, title: 'Recorrido aéreo real', text: 'Panorámicas de dron con cada parcela marcada y su estado en vivo.' },
  { icon: MapPinned, title: 'Cartografía de cada lote', text: 'Límites, superficie y ubicación sobre imagen satelital, no planos dibujados.' },
  { icon: FileCheck2, title: 'Reserva trazable', text: 'Comprobante con folio oficial y código QR verificable.' },
];

export const EcosystemStandard = () => (
  <section className="relative border-y border-border/50 bg-muted/10 py-16 md:py-24" aria-labelledby="standard-title">
    <div className="container px-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] gradient-text">El estándar OfertaTerrenos</p>
      <h2 id="standard-title" className="mt-3 max-w-3xl font-heading text-3xl font-bold md:text-5xl">Certeza antes de pisar el terreno.</h2>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {PILLARS.map((p, i) => (
          <article key={p.title} className="brand-border relative overflow-hidden rounded-3xl bg-card p-7">
            <span className="font-heading text-6xl font-bold gradient-text opacity-30">0{i + 1}</span>
            <span className="brand-gradient-btn mt-4 grid h-11 w-11 place-items-center rounded-2xl"><p.icon className="h-5 w-5" /></span>
            <h3 className="mt-5 font-heading text-xl font-semibold">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export const HybridCTA = () => (
  <section className="relative overflow-hidden py-20 md:py-28">
    <div className="brand-aurora absolute inset-0" aria-hidden="true" />
    <div className="container relative px-4 text-center">
      <h2 className="mx-auto max-w-3xl font-heading text-4xl font-bold md:text-6xl">
        Tu parcela te está <span className="gradient-text-hero">esperando.</span>
      </h2>
      <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="brand-gradient-btn h-12 rounded-full border-0 px-8 text-base font-semibold">
          <Link to="/agendar"><CalendarDays className="mr-2 h-4 w-4" />Agendar visita a terreno</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-8">
          <Link to="/explorar">Explorar mapa completo <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>

      <Link to="/planes-loteos" className="brand-border group mx-auto mt-14 flex max-w-2xl items-center justify-between gap-4 rounded-2xl bg-card/70 p-5 text-left backdrop-blur">
        <span className="flex items-center gap-3">
          <Building2 className="h-5 w-5 shrink-0 text-primary" />
          <span>
            <span className="block text-sm font-semibold text-foreground">¿Inmobiliaria o loteador?</span>
            <span className="block text-xs text-muted-foreground">Publica tu proyecto con tour 360, masterplan y sistema de ventas.</span>
          </span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  </section>
);
