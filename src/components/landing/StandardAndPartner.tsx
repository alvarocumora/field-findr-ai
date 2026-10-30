import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, FileCheck2, MapPinned, Orbit, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PILLARS = [
  { icon: Orbit, title: 'Explora antes de viajar', text: 'Acércate al entorno desde tu teléfono: abre el tour 360 desde las fichas que lo incorporan y prepara tu visita.' },
  { icon: MapPinned, title: 'Elige tu lugar en el mapa', text: 'Conecta ubicación, superficie y precio. Compara las parcelas del proyecto y consulta por la que más te interesa.' },
  { icon: FileCheck2, title: 'Avanza con un equipo', text: 'Pide los antecedentes legales y las condiciones de compra al vendedor. Coordina tu visita y prepara tu reserva desde la ficha.' },
];

export const EcosystemStandard = () => (
  <section className="relative border-y border-border/50 bg-muted/10 py-16 md:py-24" aria-labelledby="standard-title">
    <div className="container px-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">De la pantalla al terreno</p>
      <h2 id="standard-title" className="mt-3 max-w-3xl font-editorial text-3xl font-medium md:text-5xl">Descubre. Compara. Hazlo realidad.</h2>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {PILLARS.map((p, i) => (
          <article key={p.title} className="brand-border relative overflow-hidden rounded-3xl bg-card p-7">
            <span className="font-editorial text-6xl text-primary/30">0{i + 1}</span>
            <span className="brand-gradient-btn mt-4 grid h-11 w-11 place-items-center rounded-2xl"><p.icon className="h-5 w-5" /></span>
            <h3 className="mt-5 font-editorial text-xl font-medium">{p.title}</h3>
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
      <h2 className="mx-auto max-w-3xl font-editorial text-4xl font-medium md:text-6xl">
        Tu parcela te está <span className="gradient-text-hero">esperando.</span>
      </h2>
      <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="brand-gradient-btn h-12 rounded-full border-0 px-8 text-base font-semibold">
          <Link to="/agendar?meeting_type=visita_terreno&source=portada"><CalendarDays className="mr-2 h-4 w-4" />Solicitar una visita</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-8">
          <Link to="/explorar">Explorar mapa completo <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>

      <Link to="/brokers" className="brand-border group mx-auto mt-14 flex max-w-2xl items-center justify-between gap-4 rounded-2xl bg-card/70 p-5 text-left backdrop-blur">
        <span className="flex items-center gap-3">
          <Building2 className="h-5 w-5 shrink-0 text-primary" />
          <span>
            <span className="block text-sm font-semibold text-foreground">¿Vendes o recomiendas parcelas?</span>
            <span className="block text-xs text-muted-foreground">Únete a la red de vendedores. Descubre proyectos, material comercial y condiciones de comisión.</span>
          </span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  </section>
);
