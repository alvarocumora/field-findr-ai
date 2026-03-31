import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, Search, Heart, Home, BarChart3, 
  ChevronRight, ChevronLeft, X, Sparkles, Rocket
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GuidedTourProps {
  onClose: () => void;
}

const TOUR_STEPS = [
  {
    icon: MapPin,
    title: 'Explora el Mapa',
    description: 'Navega el mapa interactivo con imagen satelital. Filtra por región, precio y superficie para encontrar tu terreno ideal.',
    highlight: 'Incluye datos topográficos y de accesibilidad',
    cta: '/explorar',
  },
  {
    icon: Search,
    title: 'Búsqueda con IA',
    description: 'Escribe en lenguaje natural: "Terreno de 5000m² con bosque en La Araucanía bajo 30 millones" y la IA encuentra los resultados.',
    highlight: 'Tecnología de búsqueda conversacional',
  },
  {
    icon: Heart,
    title: 'Guarda Favoritos',
    description: 'Marca los terrenos que te interesan y compáralos lado a lado. Recibe alertas de precio cuando bajen.',
    highlight: 'Comparador visual de hasta 4 terrenos',
  },
  {
    icon: BarChart3,
    title: 'Herramientas Pro',
    description: 'Calculadoras financieras, predictor de precios, análisis de inversión y generador de brochures con IA.',
    highlight: 'Todo incluido para profesionales',
    cta: '/tools',
  },
  {
    icon: Home,
    title: 'Diseña tu Parcela en 3D',
    description: 'Visualiza tu terreno con imagen satelital real y coloca casas, caminos y árboles en un diseñador 3D interactivo.',
    highlight: 'Único en Latinoamérica',
    cta: '/mi-terreno',
  },
];

const GuidedTour = ({ onClose }: GuidedTourProps) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const current = TOUR_STEPS[step];
  const progress = ((step + 1) / TOUR_STEPS.length) * 100;

  const handleCTA = () => {
    if (current.cta) {
      navigate(current.cta);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-primary/20 shadow-2xl">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Tour de la Plataforma</span>
              <Badge variant="secondary" className="text-[10px]">{step + 1}/{TOUR_STEPS.length}</Badge>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <current.icon className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">{current.title}</h2>
              <p className="text-muted-foreground">{current.description}</p>
            </div>
            {current.highlight && (
              <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20">
                <Sparkles className="h-3 w-3 mr-1" />
                {current.highlight}
              </Badge>
            )}
          </div>

          {/* Progress & Navigation */}
          <div className="px-6 pb-2">
            <Progress value={progress} className="h-1" />
          </div>
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <div className="flex gap-2">
              {current.cta && (
                <Button variant="outline" onClick={handleCTA}>
                  Probar ahora
                </Button>
              )}
              {step < TOUR_STEPS.length - 1 ? (
                <Button onClick={() => setStep(step + 1)} className="gap-1">
                  Siguiente <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => { navigate('/auth'); onClose(); }} className="gap-1">
                  <Rocket className="h-4 w-4" />
                  Crear Cuenta Gratis
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuidedTour;
