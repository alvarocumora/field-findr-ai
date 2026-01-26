import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Target,
  Users,
  Building2,
  MapPin,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle,
  Brain,
  Zap
} from 'lucide-react';

const BusinessIntelligence = () => {
  const [timeRange, setTimeRange] = useState('12m');
  const [selectedRegion, setSelectedRegion] = useState('all');

  const kpiData = [
    {
      title: 'Ingresos Totales',
      value: '$24.8B',
      change: '+18.2%',
      trend: 'up',
      description: 'vs período anterior',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Unidades Vendidas',
      value: '1,247',
      change: '+12.5%',
      trend: 'up',
      description: 'vs período anterior',
      icon: Building2,
      color: 'text-blue-600'
    },
    {
      title: 'Tiempo Promedio Venta',
      value: '4.2 meses',
      change: '-8.3%',
      trend: 'down',
      description: 'mejora vs anterior',
      icon: Target,
      color: 'text-orange-600'
    },
    {
      title: 'Satisfacción Cliente',
      value: '4.6/5',
      change: '+3.2%',
      trend: 'up',
      description: 'score promedio',
      icon: Users,
      color: 'text-purple-600'
    }
  ];

  const regionalData = [
    {
      region: 'Santiago',
      properties: 847,
      avgPrice: '185M',
      growth: '+15.2%',
      trend: 'up',
      marketShare: '35%',
      satisfaction: 4.7
    },
    {
      region: 'Valparaíso',
      properties: 324,
      avgPrice: '142M',
      growth: '+22.8%',
      trend: 'up',
      marketShare: '18%',
      satisfaction: 4.5
    },
    {
      region: 'Concepción',
      properties: 198,
      avgPrice: '128M',
      growth: '+8.4%',
      trend: 'up',
      marketShare: '12%',
      satisfaction: 4.3
    },
    {
      region: 'La Serena',
      properties: 156,
      avgPrice: '163M',
      growth: '-2.1%',
      trend: 'down',
      marketShare: '9%',
      satisfaction: 4.4
    }
  ];

  const predictiveInsights = [
    {
      title: 'Oportunidad de Crecimiento',
      description: 'Sector industrial en Quilicura muestra 23% más actividad',
      impact: 'Alto',
      confidence: 87,
      action: 'Expandir inventario',
      type: 'opportunity'
    },
    {
      title: 'Riesgo de Saturación',
      description: 'Parcelas de agrado en Pirque cerca del límite de demanda',
      impact: 'Medio',
      confidence: 74,
      action: 'Diversificar oferta',
      type: 'risk'
    },
    {
      title: 'Tendencia Emergente',
      description: 'Demanda por terrenos sustentables aumentó 45% último trimestre',
      impact: 'Alto',
      confidence: 92,
      action: 'Desarrollar línea eco',
      type: 'trend'
    }
  ];

  const performanceMetrics = [
    { metric: 'Leads to Sales', current: 18.5, target: 20, unit: '%' },
    { metric: 'Avg. Deal Size', current: 165, target: 170, unit: 'M' },
    { metric: 'Time to Close', current: 4.2, target: 3.8, unit: 'meses' },
    { metric: 'Customer LTV', current: 240, target: 250, unit: 'M' },
    { metric: 'Agent Productivity', current: 8.7, target: 10, unit: 'deals/mes' },
    { metric: 'Market Penetration', current: 12.3, target: 15, unit: '%' }
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Alto': return 'bg-red-100 text-red-800';
      case 'Medio': return 'bg-orange-100 text-orange-800';
      case 'Bajo': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'trend': return <Zap className="h-4 w-4 text-blue-600" />;
      default: return <Brain className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Business Intelligence</h1>
          <p className="text-muted-foreground">Analíticas avanzadas y insights predictivos para tu negocio inmobiliario</p>
        </div>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">3 meses</SelectItem>
              <SelectItem value="6m">6 meses</SelectItem>
              <SelectItem value="12m">12 meses</SelectItem>
              <SelectItem value="24m">24 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button className="bg-gradient-primary text-white">
            <Download className="h-4 w-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="card-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`h-12 w-12 rounded-lg bg-${kpi.color.split('-')[1]}-100 flex items-center justify-center`}>
                    <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`flex items-center text-sm ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.trend === 'up' ? 
                      <ArrowUpRight className="h-3 w-3 mr-1" /> : 
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    }
                    {kpi.change}
                  </div>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="regional">Análisis Regional</TabsTrigger>
          <TabsTrigger value="predictive">IA Predictiva</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue and Sales Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Evolución de Ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Gráfico de ingresos por período</p>
                    <p className="text-sm">Integración con sistema de charts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Distribución de Ventas por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Terrenos Agrícolas</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={35} className="w-24 h-2" />
                      <span className="text-sm font-medium">35%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Parcelas de Agrado</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={28} className="w-24 h-2" />
                      <span className="text-sm font-medium">28%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Terrenos Industriales</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={22} className="w-24 h-2" />
                      <span className="text-sm font-medium">22%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Terrenos Comerciales</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={15} className="w-24 h-2" />
                      <span className="text-sm font-medium">15%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performance Indicators */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>Indicadores Clave de Rendimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">94.2%</div>
                  <p className="text-sm text-muted-foreground">Satisfacción Cliente</p>
                  <div className="flex items-center justify-center mt-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+2.1% mes anterior</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">67.8%</div>
                  <p className="text-sm text-muted-foreground">Retención Clientes</p>
                  <div className="flex items-center justify-center mt-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+5.3% mes anterior</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">3.2x</div>
                  <p className="text-sm text-muted-foreground">ROI Marketing</p>
                  <div className="flex items-center justify-center mt-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+0.8x mes anterior</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-6">
          <Card className="card-elegant">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Análisis por Región</CardTitle>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Región" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="santiago">Santiago</SelectItem>
                    <SelectItem value="valparaiso">Valparaíso</SelectItem>
                    <SelectItem value="concepcion">Concepción</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Región</th>
                      <th className="text-left p-4 font-medium">Propiedades</th>
                      <th className="text-left p-4 font-medium">Precio Promedio</th>
                      <th className="text-left p-4 font-medium">Crecimiento</th>
                      <th className="text-left p-4 font-medium">Market Share</th>
                      <th className="text-left p-4 font-medium">Satisfacción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionalData.map((region, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-medium">{region.region}</span>
                          </div>
                        </td>
                        <td className="p-4">{region.properties.toLocaleString()}</td>
                        <td className="p-4">${region.avgPrice}</td>
                        <td className="p-4">
                          <div className={`flex items-center ${region.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            {region.trend === 'up' ? 
                              <ArrowUpRight className="h-3 w-3 mr-1" /> : 
                              <ArrowDownRight className="h-3 w-3 mr-1" />
                            }
                            {region.growth}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{region.marketShare}</Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{region.satisfaction}</span>
                            <Progress value={region.satisfaction * 20} className="w-16 h-2" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <Card className="card-elegant">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-primary" />
                <CardTitle>Insights Predictivos con IA</CardTitle>
                <Badge className="bg-primary/10 text-primary">Powered by AI</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictiveInsights.map((insight, index) => (
                  <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="mt-1">
                          {getTypeIcon(insight.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{insight.title}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge className={getImpactColor(insight.impact)}>
                                {insight.impact}
                              </Badge>
                              <Badge variant="outline">
                                {insight.confidence}% confianza
                              </Badge>
                            </div>
                          </div>
                          <p className="text-muted-foreground mb-3">{insight.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-primary">
                              Acción recomendada: {insight.action}
                            </span>
                            <Button variant="outline" size="sm">
                              Ver Detalles
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>Métricas de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {performanceMetrics.map((metric, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{metric.metric}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold">
                          {metric.current}{metric.unit}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          / {metric.target}{metric.unit}
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={(metric.current / metric.target) * 100} 
                      className={`h-2 ${(metric.current / metric.target) >= 0.9 ? 'bg-green-200' : 'bg-orange-200'}`} 
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0</span>
                      <span>{metric.target}{metric.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Proyección de Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">$32.4B</div>
                    <p className="text-sm text-muted-foreground">Ingresos proyectados próximos 12 meses</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center">
                      <p className="text-xl font-bold">1,650</p>
                      <p className="text-sm text-muted-foreground">Unidades estimadas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">28%</p>
                      <p className="text-sm text-muted-foreground">Crecimiento esperado</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Tendencias del Mercado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">Demanda Terrenos Sustentables</p>
                      <p className="text-sm text-muted-foreground">Crecimiento acelerado</p>
                    </div>
                    <div className="text-green-600">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">Precios Zona Metropolitana</p>
                      <p className="text-sm text-muted-foreground">Estabilización esperada</p>
                    </div>
                    <div className="text-blue-600">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">Terrenos Industriales</p>
                      <p className="text-sm text-muted-foreground">Alta demanda continúa</p>
                    </div>
                    <div className="text-green-600">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessIntelligence;