import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="container relative z-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-strong rounded-3xl p-8 md:p-16 text-center border-gradient">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-8">
              <Sparkles className="h-4 w-4" />
              Empieza gratis hoy
            </div>

            {/* Heading */}
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              ¿Listo para encontrar
              <span className="block gradient-text-hero mt-2">tu próxima inversión?</span>
            </h2>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Únete a miles de inversores que ya usan nuestra plataforma para tomar decisiones más inteligentes en el mercado de terrenos.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate('/auth')}
                className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold btn-glow animate-pulse-glow"
              >
                Comenzar ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/search')}
                className="h-14 px-8 text-lg glass border-white/10 hover:border-primary/50 hover:bg-primary/10"
              >
                Explorar terrenos
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-white/5">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">+5,000</div>
                <div className="text-sm text-muted-foreground">Usuarios activos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">$500M+</div>
                <div className="text-sm text-muted-foreground">En transacciones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">4.9/5</div>
                <div className="text-sm text-muted-foreground">Satisfacción</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
