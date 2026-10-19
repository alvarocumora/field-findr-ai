import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CalendarCheck, FileSpreadsheet, HandCoins, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CAPABILITIES = [
  { icon: FileSpreadsheet, label: 'Inventario y lotes' },
  { icon: UsersRound, label: 'Leads y seguimiento' },
  { icon: CalendarCheck, label: 'Visitas y reservas' },
  { icon: HandCoins, label: 'Ventas y comisiones' },
];

const ProfessionalNetworkSection = () => (
  <section className="border-y border-border/50 bg-muted/20 py-16 md:py-24" aria-labelledby="professional-network-title">
    <div className="container px-4">
      <div className="overflow-hidden rounded-3xl border border-primary/15 bg-card/75">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-7 md:p-10 lg:p-12">
            <Building2 className="h-5 w-5 text-primary" />
            <p className="mt-6 font-swiss text-[11px] text-primary">Para inmobiliarias, loteadores y corredores</p>
            <h2 id="professional-network-title" className="mt-3 max-w-2xl font-editorial text-3xl font-medium leading-[1.05] md:text-5xl">
              No sólo publiques terrenos. Opera tu proyecto desde la misma red.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Centraliza inventario, oportunidades, visitas, cotizaciones, reservas y ventas para que tu equipo comercial trabaje sobre una sola fuente de verdad.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              <Button asChild size="lg">
                <Link to="/planes-loteos">Publicar y gestionar un proyecto <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/contacto-loteos">Hablar con el equipo</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-border/60 lg:border-l lg:border-t-0">
            {CAPABILITIES.map((capability) => (
              <div key={capability.label} className="flex min-h-36 flex-col justify-between border-b border-r border-border/50 p-5 last:border-b-0 even:border-r-0 lg:min-h-44">
                <capability.icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-swiss text-[10px] text-muted-foreground">Sales OS</p>
                  <p className="mt-1 font-heading text-base font-semibold">{capability.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ProfessionalNetworkSection;
