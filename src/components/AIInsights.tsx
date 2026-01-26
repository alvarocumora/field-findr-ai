
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  BarChart3,
  MapPin,
  DollarSign,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const AIInsights = () => {
  const insights = [
    {
      type: 'opportunity',
      title: 'Oportunidad de Inversión Detectada',
      description: 'Terrenos agrícolas en Curicó muestran 23% más actividad esta semana',
      confidence: 87,
      impact: 'high',
      action: 'Ver propiedades en Curicó',
      icon: Target,
      color: 'bg-green-500'
    },
    {
      type: 'market',
      title: 'Tendencia de Precios',
      description: 'Precios de terrenos industriales aumentaron 8% en el último mes',
      confidence: 94,
      impact: 'medium',
      action: 'Analizar tendencia',
      icon: TrendingUp,
      color: 'bg-blue-500'
    },
    {
      type: 'recommendation',
      title: 'Recomendación Personalizada',
      description: 'Basado en tu búsqueda, te recomendamos explorar terrenos forestales',
      confidence: 76,
      impact: 'medium',
      action: 'Ver recomendaciones',
      icon: Lightbulb,
      color: 'bg-yellow-500'
    },
    {
      type: 'alert',
      title: 'Nueva Propiedad Similar',
      description: 'Encontramos una propiedad que coincide con tus criterios guardados',
      confidence: 91,
      impact: 'high',
      action: 'Ver propiedad',
      icon: AlertCircle,
      color: 'bg-purple-500'
    }
  ];

  const marketMetrics = [
    {
      title: 'Actividad del Mercado',
      value: '92%',
      change: '+15%',
      positive: true,
      description: 'Comparado con el mes anterior'
    },
    {
      title: 'Precio Promedio/Ha',
      value: '$2.8M',
      change: '+8%',
      positive: true,
      description: 'Región Metropolitana'
    },
    {
      title: 'Tiempo Promedio Venta',
      value: '34 días',
      change: '-12%',
      positive: true,
      description: 'Propiedades destacadas'
    },
    {
      title: 'Satisfacción Cliente',
      value: '4.8/5',
      change: '+0.2',
      positive: true,
      description: 'Puntuación promedio'
    }
  ];

  const predictions = [
    {
      region: 'Región Metropolitana',
      prediction: 'Crecimiento moderado',
      probability: 78,
      timeframe: '3 meses',
      factors: ['Desarrollo urbano', 'Demanda industrial']
    },
    {
      region: 'Valparaíso',
      prediction: 'Alto potencial',
      probability: 85,
      timeframe: '6 meses',
      factors: ['Proyectos portuarios', 'Turismo']
    },
    {
      region: 'Maule',
      prediction: 'Oportunidad agrícola',
      probability: 82,
      timeframe: '4 meses',
      factors: ['Exportaciones', 'Tecnificación']
    }
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold">Insights de IA</h2>
        </div>
        <Badge className="bg-green-100 text-green-800">
          <Zap className="h-3 w-3 mr-1" />
          Actualizado hace 5 min
        </Badge>
      </div>

      {/* Market Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {marketMetrics.map((metric, index) => (
          <Card key={index} className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{metric.title}</span>
                <Badge variant={metric.positive ? 'default' : 'destructive'}>
                  {metric.change}
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1">{metric.value}</div>
              <div className="text-xs text-gray-500">{metric.description}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Insights Personalizados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className={`${insight.color} w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`}>
                    <insight.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{insight.title}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge className={getImpactColor(insight.impact)}>
                          {insight.impact === 'high' ? 'Alto' : insight.impact === 'medium' ? 'Medio' : 'Bajo'} Impacto
                        </Badge>
                        <span className={`text-sm font-medium ${getConfidenceColor(insight.confidence)}`}>
                          {insight.confidence}% confianza
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-3">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <Progress value={insight.confidence} className="w-32" />
                      <Button size="sm" variant="outline">
                        {insight.action}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Predictions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Predicciones de Mercado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictions.map((pred, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{pred.region}</span>
                  </div>
                  <Badge variant="outline">{pred.timeframe}</Badge>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-semibold">{pred.prediction}</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={pred.probability} className="w-24" />
                    <span className="text-sm font-medium text-green-600">{pred.probability}%</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pred.factors.map((factor, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Análisis de Precios</h3>
            <p className="text-sm text-gray-600">Comparar precios por región</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Recomendaciones</h3>
            <p className="text-sm text-gray-600">Propiedades personalizadas</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Alertas Inteligentes</h3>
            <p className="text-sm text-gray-600">Notificaciones automáticas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIInsights;
