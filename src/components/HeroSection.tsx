import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Sparkles, ArrowRight, Zap, Shield, TrendingUp, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    navigate('/search', { state: { query: searchQuery } });
  };

  const stats = [
    { value: '15K+', label: 'Terrenos', icon: MapPin },
    { value: '98%', label: 'Precisión IA', icon: Zap },
    { value: '$2.5B', label: 'En ventas', icon: TrendingUp },
    { value: '100%', label: 'Verificados', icon: Shield },
  ];

  const quickFilters = [
    'Agrícola',
    'Industrial', 
    'Parcelas',
    'Con agua',
    'Vista al mar',
    'Inversión',
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-pattern" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3 animate-float" />
      
      {/* Content */}
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8 opacity-0 animate-fade-in">
            <div className="glass inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-muted-foreground">Potenciado por</span>
              <span className="font-semibold text-primary">Inteligencia Artificial</span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-center mb-6 opacity-0 animate-fade-in-up stagger-1">
            <span className="block text-4xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tight text-foreground">
              El futuro de invertir
            </span>
            <span className="block text-4xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tight gradient-text-hero mt-2">
              en terrenos está aquí
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground text-center mb-10 max-w-2xl mx-auto opacity-0 animate-fade-in-up stagger-2">
            Descubre, analiza y adquiere propiedades con herramientas de IA que predicen valorización, analizan riesgos y encuentran oportunidades ocultas.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8 opacity-0 animate-fade-in-up stagger-3">
            <div className="glass-strong rounded-2xl p-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Describe tu terreno ideal... 'agrícola con agua en el sur'"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-12 h-14 text-base bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                  />
                </div>
                <Button 
                  onClick={handleSearch}
                  size="lg"
                  className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold btn-glow animate-pulse-glow"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Buscar con IA
                </Button>
              </div>
            </div>
          </div>

          {/* Quick filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-16 opacity-0 animate-fade-in-up stagger-4">
            {quickFilters.map((filter, index) => (
              <Button 
                key={filter}
                variant="outline" 
                size="sm" 
                className="rounded-full glass border-white/10 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
                style={{ animationDelay: `${0.4 + index * 0.05}s` }}
              >
                {filter}
              </Button>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 opacity-0 animate-fade-in-up stagger-5">
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className="glass rounded-2xl p-6 text-center card-hover border-gradient"
                style={{ animationDelay: `${0.5 + index * 0.1}s` }}
              >
                <stat.icon className="h-6 w-6 text-primary mx-auto mb-3" />
                <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground opacity-0 animate-fade-in stagger-5">
          <span className="text-xs uppercase tracking-widest">Explorar</span>
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-primary rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
