import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Sparkles } from 'lucide-react';
import { useState } from 'react';

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    console.log('Search:', searchQuery);
  };

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Encuentra tu terreno ideal
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Explora miles de propiedades rurales e industriales con herramientas de IA y mapas interactivos.
          </p>
          
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por ubicación, tipo o características..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button 
              onClick={handleSearch}
              className="h-12 px-6 bg-primary hover:bg-primary/90"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Buscar con IA
            </Button>
          </div>

          {/* Quick filters */}
          <div className="flex flex-wrap justify-center gap-2 mt-6 text-sm">
            <Button variant="outline" size="sm" className="rounded-full">
              Agrícola
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              Industrial
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              Parcelas
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              Con agua
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
