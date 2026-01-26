import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Target,
  Sparkles,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: 'investment' | 'location' | 'timing' | 'market';
  properties: number;
  expectedReturn: string;
  timeframe: string;
  factors: string[];
  urgency: 'high' | 'medium' | 'low';
}

const AIRecommendationEngine = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const mockRecommendations: Recommendation[] = [
    {
      id: '1',
      title: 'Oportunidad de Inversión en Valparaíso',
      description: 'Terrenos agrícolas en Casablanca muestran potencial de valorización del 45% en 18 meses debido a nuevos proyectos vitivinícolas.',
      confidence: 87,
      impact: 'high',
      category: 'investment',
      properties: 12,
      expectedReturn: '35-45%',
      timeframe: '18 meses',
      factors: ['Expansión vitivinícola', 'Mejoras en conectividad', 'Demanda creciente'],
      urgency: 'high'
    },
    {
      id: '2',
      title: 'Timing Óptimo para Compra',
      description: 'El mercado de terrenos industriales en la RM está en un punto bajo del ciclo. Proyección de recuperación en 6-8 meses.',
      confidence: 92,
      impact: 'high',
      category: 'timing',
      properties: 8,
      expectedReturn: '20-30%',
      timeframe: '8-12 meses',
      factors: ['Ciclo de mercado', 'Política económica', 'Demanda industrial'],
      urgency: 'medium'
    },
    {
      id: '3',
      title: 'Zona Emergente: Región de Ñuble',
      description: 'Incremento del 25% en consultas por terrenos agrícolas. Precios aún 40% bajo el promedio nacional.',
      confidence: 78,
      impact: 'medium',
      category: 'location',
      properties: 15,
      expectedReturn: '15-25%',
      timeframe: '24 meses',
      factors: ['Crecimiento económico regional', 'Infraestructura mejorada', 'Incentivos gubernamentales'],
      urgency: 'low'
    },
    {
      id: '4',
      title: 'Tendencia de Mercado: Sustentabilidad',
      description: 'Terrenos aptos para energía renovable experimentan valorización acelerada. Demanda supera oferta en 3:1.',
      confidence: 94,
      impact: 'high',
      category: 'market',
      properties: 6,
      expectedReturn: '50-70%',
      timeframe: '12-18 meses',
      factors: ['Transición energética', 'Subsidios estatales', 'Demanda internacional'],
      urgency: 'high'
    }
  ];

  const categories = [
    { id: 'all', name: 'Todas', icon: Brain },
    { id: 'investment', name: 'Inversión', icon: DollarSign },
    { id: 'location', name: 'Ubicación', icon: MapPin },
    { id: 'timing', name: 'Timing', icon: Clock },
    { id: 'market', name: 'Mercado', icon: TrendingUp }
  ];

  useEffect(() => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setRecommendations(mockRecommendations);
      setIsAnalyzing(false);
    }, 2000);
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryMap = {
      investment: DollarSign,
      location: MapPin,
      timing: Clock,
      market: TrendingUp
    };
    const IconComponent = categoryMap[category as keyof typeof categoryMap] || Target;
    return <IconComponent className="h-4 w-4" />;
  };

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.category === selectedCategory);

  const runNewAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setRecommendations([...mockRecommendations].sort(() => Math.random() - 0.5));
      setIsAnalyzing(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary-glow/5 border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Motor de Recomendaciones IA</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Análisis predictivo y oportunidades personalizadas
                </p>
              </div>
            </div>
            <Button 
              onClick={runNewAnalysis}
              disabled={isAnalyzing}
              className="bg-gradient-primary hover:opacity-90"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isAnalyzing ? 'Analizando...' : 'Nuevo Análisis'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className={selectedCategory === category.id ? "bg-primary text-white" : ""}
          >
            <category.icon className="h-4 w-4 mr-2" />
            {category.name}
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <Card className="p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Brain className="h-12 w-12 text-primary animate-pulse" />
              <Sparkles className="h-6 w-6 text-primary-glow absolute -top-1 -right-1 animate-ping" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold">Analizando el mercado...</h3>
              <p className="text-sm text-muted-foreground">
                Procesando datos de {mockRecommendations.reduce((acc, rec) => acc + rec.properties, 0)} propiedades
              </p>
              <Progress value={75} className="w-48" />
            </div>
          </div>
        </Card>
      )}

      {/* Recommendations Grid */}
      {!isAnalyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRecommendations.map((rec) => (
            <Card key={rec.id} className="hover:shadow-medium transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getCategoryIcon(rec.category)}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">{rec.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        {getUrgencyIcon(rec.urgency)}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getImpactColor(rec.impact)}`}
                        >
                          {rec.impact === 'high' ? 'Alto Impacto' : 
                           rec.impact === 'medium' ? 'Impacto Medio' : 'Bajo Impacto'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{rec.confidence}%</div>
                    <div className="text-xs text-muted-foreground">Confianza</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-foreground leading-relaxed">
                  {rec.description}
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-4 py-4 bg-muted/30 rounded-lg px-3">
                  <div className="text-center">
                    <div className="font-semibold text-primary">{rec.properties}</div>
                    <div className="text-xs text-muted-foreground">Propiedades</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-primary">{rec.expectedReturn}</div>
                    <div className="text-xs text-muted-foreground">ROI Esperado</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-primary">{rec.timeframe}</div>
                    <div className="text-xs text-muted-foreground">Plazo</div>
                  </div>
                </div>

                {/* Factors */}
                <div>
                  <div className="text-sm font-medium mb-2">Factores Clave:</div>
                  <div className="flex flex-wrap gap-1">
                    {rec.factors.map((factor, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Confidence Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Nivel de Confianza</span>
                    <span className="font-medium">{rec.confidence}%</span>
                  </div>
                  <Progress value={rec.confidence} className="h-2" />
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button size="sm" className="flex-1">
                    <Target className="h-4 w-4 mr-2" />
                    Ver Propiedades
                  </Button>
                  <Button size="sm" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Análisis Detallado
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {!isAnalyzing && recommendations.length > 0 && (
        <Card className="bg-gradient-to-r from-success-light/20 to-primary-light/20 border-primary/20">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{recommendations.length}</div>
                <div className="text-sm text-muted-foreground">Recomendaciones Activas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {Math.round(recommendations.reduce((acc, rec) => acc + rec.confidence, 0) / recommendations.length)}%
                </div>
                <div className="text-sm text-muted-foreground">Confianza Promedio</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {recommendations.reduce((acc, rec) => acc + rec.properties, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Propiedades Analizadas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {recommendations.filter(rec => rec.urgency === 'high').length}
                </div>
                <div className="text-sm text-muted-foreground">Oportunidades Urgentes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIRecommendationEngine;