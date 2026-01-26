
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  TrendingUp, 
  Download, 
  Upload,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  Search,
  Calendar,
  MapPin,
  DollarSign,
  Eye,
  Users,
  Home,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';

const DataManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const [dataStats] = useState({
    totalProperties: 2847,
    activeAgents: 156,
    totalViews: 45231,
    totalLeads: 1892,
    avgPrice: 2850000,
    avgArea: 45.2,
    conversionRate: 12.5,
    monthlyGrowth: 18.3
  });

  const [regionalData] = useState([
    { region: 'Metropolitana', properties: 487, avgPrice: 4200000, growth: 12.5 },
    { region: 'Valparaíso', properties: 332, avgPrice: 3800000, growth: 15.2 },
    { region: 'O\'Higgins', properties: 298, avgPrice: 2900000, growth: 8.7 },
    { region: 'Maule', properties: 234, avgPrice: 2200000, growth: 22.1 },
    { region: 'Biobío', properties: 187, avgPrice: 1800000, growth: 11.3 },
    { region: 'Araucanía', properties: 165, avgPrice: 1500000, growth: 19.4 }
  ]);

  const [propertyTypes] = useState([
    { type: 'Agrícola', count: 1124, percentage: 39.5, avgPrice: 2100000 },
    { type: 'Industrial', count: 687, percentage: 24.1, avgPrice: 5800000 },
    { type: 'Ganadero', count: 523, percentage: 18.4, avgPrice: 3200000 },
    { type: 'Forestal', count: 298, percentage: 10.5, avgPrice: 1200000 },
    { type: 'Parcela', count: 215, percentage: 7.5, avgPrice: 8500000 }
  ]);

  const [recentActivity] = useState([
    { id: 1, type: 'property_added', agent: 'María González', property: 'Terreno Agrícola Casablanca', time: '2 min ago' },
    { id: 2, type: 'lead_generated', agent: 'Carlos Mendoza', property: 'Sitio Industrial Quilicura', time: '5 min ago' },
    { id: 3, type: 'property_viewed', agent: 'Ana Sepúlveda', property: 'Campo Ganadero Temuco', time: '12 min ago' },
    { id: 4, type: 'agent_joined', agent: 'Jorge Ruiz', property: null, time: '1 hora ago' },
    { id: 5, type: 'property_sold', agent: 'Patricia Soto', property: 'Terreno Forestal Curicó', time: '2 horas ago' }
  ]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'property_added': return <Home className="h-4 w-4 text-green-500" />;
      case 'lead_generated': return <Target className="h-4 w-4 text-blue-500" />;
      case 'property_viewed': return <Eye className="h-4 w-4 text-purple-500" />;
      case 'agent_joined': return <Users className="h-4 w-4 text-orange-500" />;
      case 'property_sold': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity: any) => {
    switch (activity.type) {
      case 'property_added': 
        return `${activity.agent} agregó ${activity.property}`;
      case 'lead_generated': 
        return `${activity.agent} generó un lead para ${activity.property}`;
      case 'property_viewed': 
        return `${activity.property} fue vista por un cliente`;
      case 'agent_joined': 
        return `${activity.agent} se unió a la plataforma`;
      case 'property_sold': 
        return `${activity.agent} vendió ${activity.property}`;
      default: 
        return 'Actividad desconocida';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold">Centro de Datos</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            <Zap className="h-4 w-4 mr-2" />
            Generar Reporte
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="properties">Propiedades</TabsTrigger>
          <TabsTrigger value="regions">Regiones</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Propiedades</p>
                    <p className="text-2xl font-bold text-green-600">{dataStats.totalProperties.toLocaleString()}</p>
                  </div>
                  <Home className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+{dataStats.monthlyGrowth}% este mes</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Agentes Activos</p>
                    <p className="text-2xl font-bold text-blue-600">{dataStats.activeAgents}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600">+12 este mes</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Visitas</p>
                    <p className="text-2xl font-bold text-purple-600">{dataStats.totalViews.toLocaleString()}</p>
                  </div>
                  <Eye className="h-8 w-8 text-purple-600" />
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-600">+8% vs mes anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Leads Generados</p>
                    <p className="text-2xl font-bold text-orange-600">{dataStats.totalLeads}</p>
                  </div>
                  <Target className="h-8 w-8 text-orange-600" />
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-sm text-orange-600">+{dataStats.conversionRate}% conversión</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Propiedades por Región
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {regionalData.slice(0, 5).map((region, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">{region.region}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">{region.properties} propiedades</span>
                        <Badge variant={region.growth > 15 ? 'default' : 'secondary'}>
                          +{region.growth}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Tipos de Propiedad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {propertyTypes.map((type, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">{type.type}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">{type.count}</span>
                        <Badge variant="outline">{type.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getActivityIcon(activity.type)}
                      <div>
                        <p className="text-sm font-medium">{getActivityText(activity)}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Buscar propiedades..." className="pl-10 w-80" />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Rango de Fecha
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Propiedades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    ${(dataStats.avgPrice / 1000000).toFixed(1)}M
                  </div>
                  <p className="text-sm text-gray-500">Precio Promedio</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {dataStats.avgArea} ha
                  </div>
                  <p className="text-sm text-gray-500">Superficie Promedio</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {dataStats.conversionRate}%
                  </div>
                  <p className="text-sm text-gray-500">Tasa de Conversión</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {propertyTypes.map((type, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{type.type}</h4>
                      <Badge variant="secondary">{type.count} propiedades</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Participación: </span>
                        <span className="font-medium">{type.percentage}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Precio Promedio: </span>
                        <span className="font-medium">${(type.avgPrice / 1000000).toFixed(1)}M</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Crecimiento: </span>
                        <span className="font-medium text-green-600">+15%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Análisis Regional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {regionalData.map((region, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-lg">{region.region}</h4>
                      <Badge variant={region.growth > 15 ? 'default' : 'secondary'}>
                        {region.growth > 15 ? 'Alto crecimiento' : 'Crecimiento moderado'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <Home className="h-6 w-6 text-green-600 mx-auto mb-1" />
                        <p className="text-sm text-gray-600">Propiedades</p>
                        <p className="text-xl font-bold">{region.properties}</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                        <p className="text-sm text-gray-600">Precio Promedio</p>
                        <p className="text-xl font-bold">${(region.avgPrice / 1000000).toFixed(1)}M</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                        <p className="text-sm text-gray-600">Crecimiento</p>
                        <p className="text-xl font-bold">+{region.growth}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="h-5 w-5 mr-2" />
                  Tendencias de Crecimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Propiedades Agregadas</h4>
                    <p className="text-2xl font-bold text-green-600">+{dataStats.monthlyGrowth}%</p>
                    <p className="text-sm text-green-700">vs mes anterior</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Nuevos Agentes</h4>
                    <p className="text-2xl font-bold text-blue-600">+8.2%</p>
                    <p className="text-sm text-blue-700">vs mes anterior</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Engagement</h4>
                    <p className="text-2xl font-bold text-purple-600">+12.5%</p>
                    <p className="text-sm text-purple-700">vs mes anterior</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Métricas de Conversión
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Visitas a Contacto</span>
                    <span className="font-bold text-green-600">3.2%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Contacto a Lead</span>
                    <span className="font-bold text-blue-600">18.5%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Lead a Venta</span>
                    <span className="font-bold text-purple-600">12.8%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Conversión Total</span>
                    <span className="font-bold text-orange-600">0.74%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generador de Reportes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Reporte</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>Reporte de Propiedades</option>
                    <option>Reporte de Agentes</option>
                    <option>Reporte de Ventas</option>
                    <option>Reporte de Leads</option>
                    <option>Reporte Regional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Período</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>Último mes</option>
                    <option>Últimos 3 meses</option>
                    <option>Últimos 6 meses</option>
                    <option>Último año</option>
                    <option>Personalizado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Formato</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>PDF</option>
                    <option>Excel</option>
                    <option>CSV</option>
                    <option>JSON</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Frecuencia</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>Una vez</option>
                    <option>Diario</option>
                    <option>Semanal</option>
                    <option>Mensual</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button className="flex-1 bg-green-600 hover:bg-green-700">
                  <Download className="h-4 w-4 mr-2" />
                  Generar Reporte
                </Button>
                <Button variant="outline" className="flex-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Programar Reporte
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reportes Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Reporte Mensual Propiedades', date: '2024-01-20', format: 'PDF', size: '2.3 MB' },
                  { name: 'Análisis de Agentes Q4', date: '2024-01-18', format: 'Excel', size: '1.8 MB' },
                  { name: 'Reporte de Ventas Enero', date: '2024-01-15', format: 'CSV', size: '845 KB' },
                  { name: 'Análisis Regional 2024', date: '2024-01-10', format: 'PDF', size: '3.1 MB' }
                ].map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{report.name}</p>
                        <p className="text-xs text-gray-500">{report.date} • {report.format} • {report.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataManagement;
