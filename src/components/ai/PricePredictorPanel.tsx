import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Loader2, Calculator, MapPin, Maximize2 } from 'lucide-react';
import { usePricePredictor } from '@/hooks/useAI';

const PROPERTY_TYPES = [
  { value: 'agricola', label: 'Agrícola' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'residencial', label: 'Residencial' },
  { value: 'parcela', label: 'Parcela de Agrado' },
  { value: 'comercial', label: 'Comercial' },
];

const FEATURES_OPTIONS = [
  'Derechos de agua',
  'Electricidad',
  'Acceso pavimentado',
  'Vista panorámica',
  'Riego tecnificado',
  'Pozo profundo',
  'Cerco perimetral',
  'Casa existente',
];

export const PricePredictorPanel = () => {
  const { prediction, isLoading, predictPrice } = usePricePredictor();
  const [area, setArea] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!area || !location) return;
    
    predictPrice({
      area: parseFloat(area),
      location,
      type,
      features: selectedFeatures,
    });
  };

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'alta': return 'bg-green-500';
      case 'media': return 'bg-yellow-500';
      case 'baja': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Predictor de Precios IA</CardTitle>
              <CardDescription>Estima el valor de mercado de un terreno</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area">Superficie (m²)</Label>
                <div className="relative">
                  <Maximize2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="area"
                    type="number"
                    placeholder="5000"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="Casablanca, Valparaíso"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Terreno</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Características</Label>
              <div className="flex flex-wrap gap-2">
                {FEATURES_OPTIONS.map(feature => (
                  <Badge
                    key={feature}
                    variant={selectedFeatures.includes(feature) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleFeature(feature)}
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !area || !location}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Estimar Precio
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {prediction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Estimación de Precio
              <Badge className={getConfidenceColor(prediction.confidence)}>
                Confianza {prediction.confidence}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Precio Estimado</p>
              <p className="text-3xl font-bold text-primary">
                ${prediction.estimatedPrice.toLocaleString('es-CL')}
              </p>
              <p className="text-sm text-muted-foreground">
                ${prediction.pricePerSqm.toLocaleString('es-CL')} / m²
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Factores de Valorización</h4>
              {prediction.factors.map((factor, i) => (
                <div key={i} className="flex items-center gap-3">
                  {factor.impact === 'positivo' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className="flex-1 text-sm">{factor.factor}</span>
                  <Progress value={factor.weight * 10} className="w-20" />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Análisis de Mercado</h4>
              <p className="text-sm text-muted-foreground">{prediction.marketAnalysis}</p>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium text-sm mb-1">💡 Recomendación</h4>
              <p className="text-sm">{prediction.recommendation}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
