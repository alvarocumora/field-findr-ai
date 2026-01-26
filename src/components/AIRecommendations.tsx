
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  MapPin, 
  DollarSign, 
  BarChart3, 
  Lightbulb,
  Target,
  Zap,
  Star,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

const AIRecommendations = () => {
  const [recommendations, setRecommendations] = useState([
    {
      id: 1,
      type: 'investment',
      title: 'Oportunidad de Inversión en Región del Maule',
      description: 'Terrenos agrícolas con alto potencial de revalorización basado en desarrollo de infraestructura',
      confidence: 92,
      priceRange: '$80M - $120M',
      expectedReturn: '18-25%',
      timeframe: '2-3 años',
      factors: ['Nuevo proyecto de riego', 'Proximidad a autopista', 'Crecimiento demográfico'],
      properties: 12
    },
    {
      id: 2,
      type: 'similar',
      title: 'Propiedades Similares en tu Búsqueda',
      description: 'Basado en tus preferencias y búsquedas anteriores',
      confidence: 87,
      priceRange: '$50M - $200M',
      expectedReturn: '12-20%',
      timeframe: '1-2 años',
      factors: ['Historial de búsqueda', 'Preferencias de ubicación', 'Rango de precio'],
      properties: 8
    },
    {
      id: 3,
      type: 'market',
      title: 'Análisis de Mercado - Terrenos Forestales',
      description: 'Oportunidades emergentes en el sector forestal con precios atractivos',
      confidence: 78,
      priceRange: '$30M - $80M',
      expectedReturn: '15-22%',
      timeframe: '3-5 años',
      factors: ['Precio internacional madera', 'Nuevas regulaciones', 'Sostenibilidad'],
      properties: 24
    }
  ]);

  const [marketInsights, setMarketInsights] = useState([
    {
      title: 'Precio Promedio por Hectárea',
      value: '$2.8M',
      change: '+12%',
      positive: true,
      description: 'Región Metropolitana'
    },
    {
      title: 'Tiempo Promedio de Venta',
      value: '45 días',
      change: '-8%',
      positive: true,
      description: 'Comparado con mes anterior'
    },
    {
      title: 'Demanda Actual',
      value: 'Alta',
      change: '+18%',
      positive: true,
      description: 'Terrenos industriales'
    }
  ]);

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'investment':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'similar':
        return <Target className="h-5 w-5 text-blue-500" />;
      case 'market':
        return <BarChart3 className="h-5 w-5 text-purple-500" />;
      default:
        return <Brain className="h-5 w-5 text-gray-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold">Recomendaciones IA</h2>
        </div>
        <Button variant="outline" size="sm">
          <Zap className="h-4 w-4 mr-2" />
          Actualizar Análisis
        </Button>
      </div>

      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
          <TabsTrigger value="market">Análisis de Mercado</TabsTrigger>
          <TabsTrigger value="insights">Insights Personalizados</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getRecommendationIcon(rec.type)}
                    <div>
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    </div>
                  </div>
                  <Badge className={`${getConfidenceColor(rec.confidence)} border-0`}>
                    {rec.confidence}% confianza
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Rango de Precio</p>
                    <p className="font-semibold">{rec.priceRange}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Retorno Esperado</p>
                    <p className="font-semibold">{rec.expectedReturn}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Target className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Plazo</p>
                    <p className="font-semibold">{rec.timeframe}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Factores Clave:</h4>
                  <div className="flex flex-wrap gap-2">
                    {rec.factors.map((factor, index) => (
                      <Badge key={index} variant="outline">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {rec.properties} propiedades disponibles
                    </span>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Ver Propiedades
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {marketInsights.map((insight, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm text-gray-600">{insight.title}</h3>
                    <Badge variant={insight.positive ? 'default' : 'destructive'}>
                      {insight.change}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold mb-1">{insight.value}</p>
                  <p className="text-sm text-gray-500">{insight.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Tendencias del Mercado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-green-800">Sector en Crecimiento</h4>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-sm text-green-700">
                    Los terrenos industriales muestran una demanda sostenida con precios estables
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-yellow-800">Oportunidad</h4>
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                  </div>
                  <p className="text-sm text-yellow-700">
                    Terrenos agrícolas en zonas rurales con acceso a agua presentan alto potencial
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-blue-800">Predicción</h4>
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-blue-700">
                    Se espera un crecimiento del 8-12% en valores de terrenos forestales
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                Análisis Personalizado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border-l-4 border-green-500 bg-green-50">
                  <h4 className="font-semibold mb-2">Basado en tu Perfil</h4>
                  <p className="text-sm text-gray-700">
                    Tu historial indica preferencia por terrenos agrícolas entre 10-50 hectáreas 
                    en regiones centrales. Te recomendamos explorar oportunidades en O'Higgins.
                  </p>
                </div>

                <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                  <h4 className="font-semibold mb-2">Comportamiento de Búsqueda</h4>
                  <p className="text-sm text-gray-700">
                    Has mostrado interés en propiedades con derechos de agua. Actualmente hay 
                    15 propiedades disponibles que cumplen este criterio.
                  </p>
                </div>

                <div className="p-4 border-l-4 border-purple-500 bg-purple-50">
                  <h4 className="font-semibold mb-2">Recomendación de Inversión</h4>
                  <p className="text-sm text-gray-700">
                    Considera diversificar en terrenos forestales. El análisis predictivo sugiere 
                    una oportunidad de crecimiento del 20% en los próximos 3 años.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIRecommendations;
