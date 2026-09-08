import { Button } from '@/components/ui/button';
import { ArrowRight, CalendarDays, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden border-t border-border/50 py-20 md:py-28">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      <div className="container relative px-4">
        <div className="mx-auto max-w-5xl text-center">

            {/* Heading */}
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Conoce el terreno antes de decidir.
            </h2>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Agenda una visita a un proyecto o publica tu loteo con un recorrido comercial completo.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate('/agendar')}
                className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold btn-glow animate-pulse-glow"
              >
                <CalendarDays className="mr-2 h-5 w-5" />
                Agendar una visita
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/comenzar')}
                className="h-14 px-8 text-lg border-border hover:border-primary/50 hover:bg-primary/10"
              >
                <Building2 className="mr-2 h-5 w-5" />
                Publicar un proyecto
              </Button>
            </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
