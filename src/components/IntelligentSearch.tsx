import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Sparkles, 
  MapPin, 
  TrendingUp, 
  Target,
  Mic,
  Camera,
  Filter
} from 'lucide-react';

const IntelligentSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Terrenos agrícolas Región del Maule',
    'Parcelas con agua potable Santiago',
    'Campos forestales sur de Chile'
  ]);

  const aiSuggestions = [
    {
      title: 'Búsqueda por Potencial',
      description: 'Encuentra terrenos con alto potencial de crecimiento',
      icon: TrendingUp,
      query: 'terrenos con alto potencial de valorización'
    },
    {
      title: 'Análisis de Ubicación',
      description: 'Evalúa conectividad y servicios cercanos',
      icon: MapPin,
      query: 'terrenos cerca de carreteras principales'
    },
    {
      title: 'Inversión Inteligente',
      description: 'Propiedades con mejor ROI proyectado',
      icon: Target,
      query: 'terrenos con mejor retorno de inversión'
    }
  ];

  const handleVoiceSearch = () => {
    setIsListening(!isListening);
    // Aquí implementarías la funcionalidad de reconocimiento de voz
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        setSearchQuery('Buscar terrenos agrícolas en la Región de Valparaíso');
      }, 3000);
    }
  };

  const handleAISearch = () => {
    // Simular búsqueda con IA
    console.log('AI Search:', searchQuery);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
  };

  return (
    <div className="w-full space-y-6">
      {/* Main Search Bar */}
      <Card className="p-6 bg-gradient-to-r from-white to-green-50 border-green-200 shadow-soft">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Búsqueda Inteligente con IA</span>
          </div>

          <div className="relative">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Describe el terreno ideal para tu proyecto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-20 h-12 text-base border-2 border-primary/20 focus:border-primary"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleVoiceSearch}
                    className={`h-8 w-8 p-0 ${isListening ? 'bg-red-100 text-red-600' : 'text-muted-foreground hover:text-primary'}`}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button 
                onClick={handleAISearch}
                className="h-12 px-6 bg-gradient-primary hover:opacity-90 text-white shadow-medium"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Buscar con IA
              </Button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors">
              <MapPin className="h-3 w-3 mr-1" />
              Cerca de carreteras
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors">
              Con agua potable
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors">
              Electricidad disponible
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors">
              Alto potencial
            </Badge>
            <Button variant="ghost" size="sm" className="h-auto p-1">
              <Filter className="h-3 w-3 mr-1" />
              Más filtros
            </Button>
          </div>

          {isListening && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center space-x-2 text-red-600">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Escuchando...</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* AI Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {aiSuggestions.map((suggestion, index) => (
          <Card 
            key={index}
            className="p-4 cursor-pointer hover:shadow-medium transition-all duration-300 hover:scale-105 border-primary/10 hover:border-primary/30"
            onClick={() => handleSuggestionClick(suggestion.query)}
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <suggestion.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-foreground mb-1">
                  {suggestion.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {suggestion.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold text-sm mb-3 text-foreground">Búsquedas Recientes</h4>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, index) => (
              <Badge 
                key={index}
                variant="secondary" 
                className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
                onClick={() => setSearchQuery(search)}
              >
                {search}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default IntelligentSearch;