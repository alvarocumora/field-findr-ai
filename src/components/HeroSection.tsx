import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Sparkles, Zap, Shield, TrendingUp, MapPin, Play, ChevronRight } from 'lucide-react';
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
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Video/Image Background with overlay */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2832&q=80')`,
          }}
        />
        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-background/90" />
      </div>

      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      
      {/* Content */}
      <div className="container relative z-10 px-4 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Text Content */}
            <div className="text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full glass border border-primary/20 opacity-0 animate-fade-in">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-sm text-muted-foreground">Potenciado por</span>
                <span className="text-sm font-semibold text-primary">Inteligencia Artificial</span>
              </div>

              {/* Main Heading */}
              <h1 className="mb-6 opacity-0 animate-fade-in-up stagger-1">
                <span className="block text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold tracking-tight text-foreground leading-[1.1]">
                  El futuro de
                </span>
                <span className="block text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold tracking-tight leading-[1.1] mt-2">
                  <span className="gradient-text-hero">invertir en</span>
                </span>
                <span className="block text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold tracking-tight leading-[1.1] mt-2">
                  <span className="gradient-text-hero">terrenos</span>
                  <span className="text-foreground"> está aquí</span>
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl opacity-0 animate-fade-in-up stagger-2">
                Descubre, analiza y adquiere propiedades con herramientas de IA que predicen valorización, analizan riesgos y encuentran oportunidades ocultas.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-12 opacity-0 animate-fade-in-up stagger-3">
                <Button 
                  size="lg"
                  onClick={() => navigate('/explorar')}
                  className="h-14 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground btn-glow group"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Explorar Terrenos
                  <ChevronRight className="h-5 w-5 ml-1 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-base font-semibold glass border-white/20 hover:bg-white/10 group"
                >
                  <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  Ver Demo
                </Button>
              </div>

              {/* Quick Stats Row */}
              <div className="grid grid-cols-4 gap-4 opacity-0 animate-fade-in-up stagger-4">
                {stats.map((stat, index) => (
                  <div key={stat.label} className="text-center" style={{ animationDelay: `${0.4 + index * 0.1}s` }}>
                    <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Search Card */}
            <div className="opacity-0 animate-fade-in-up stagger-3">
              <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-primary/20">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Búsqueda Inteligente</h3>
                    <p className="text-sm text-muted-foreground">Describe tu terreno ideal</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Ej: 'agrícola con agua en el sur'"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-12 h-14 text-base bg-background/50 border-white/10 focus:border-primary/50 rounded-xl"
                    />
                  </div>

                  <Button 
                    onClick={handleSearch}
                    size="lg"
                    className="w-full h-14 text-base bg-primary hover:bg-primary/90 text-primary-foreground font-semibold btn-glow"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Buscar con IA
                  </Button>

                  {/* Quick filter chips */}
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-muted-foreground mb-3">Búsquedas populares:</p>
                    <div className="flex flex-wrap gap-2">
                      {quickFilters.map((filter) => (
                        <Button 
                          key={filter}
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-3 rounded-full text-xs bg-white/5 hover:bg-primary/20 hover:text-primary border border-white/10"
                          onClick={() => {
                            setSearchQuery(filter);
                          }}
                        >
                          {filter}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>Datos verificados</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>Análisis en tiempo real</span>
                  </div>
                </div>
              </div>
            </div>
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
