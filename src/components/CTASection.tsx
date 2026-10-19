import { Button } from '@/components/ui/button';
import { ArrowRight, CalendarDays, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden border-t border-border/50 bg-background py-20 md:py-28">
      <div className="grid-topo absolute inset-0" aria-hidden="true" />
      <div className="container relative px-4">
        <div className="mx-auto max-w-3xl">
          <p className="font-swiss text-[11px] text-primary">Siguiente paso</p>

          <h2 className="mt-4 max-w-2xl font-editorial text-4xl font-medium leading-[1.05] text-foreground md:text-6xl">
            Conoce el terreno antes de decidir.
          </h2>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Agenda una visita a un proyecto o publica tu loteo con un recorrido comercial completo.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => navigate('/agendar')}
              className="h-12 px-7 text-base font-semibold"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Agendar una visita
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/comenzar')}
              className="h-12 px-7 text-base hover:bg-muted/40"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Publicar un proyecto
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
