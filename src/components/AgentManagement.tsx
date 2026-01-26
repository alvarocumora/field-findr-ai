
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Shield, 
  TrendingUp, 
  Star,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Eye,
  MessageCircle,
  Award,
  Target,
  Zap,
  BarChart3,
  Settings,
  Plus,
  Edit,
  Search
} from 'lucide-react';

const AgentManagement = () => {
  const [agents, setAgents] = useState([
    {
      id: 1,
      name: 'María González',
      email: 'maria.gonzalez@example.com',
      phone: '912345678',
      location: 'Valparaíso',
      specialization: 'Terrenos Agrícolas',
      rating: 4.8,
      reviews: 127,
      properties: 23,
      sales: 15,
      revenue: 2850000,
      joined: '2023-03-15',
      verified: true,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b2e9d7ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
      performance: {
        monthlyLeads: 45,
        conversionRate: 12.5,
        avgResponseTime: '15 min',
        satisfaction: 4.7
      },
      metrics: {
        profileViews: 1247,
        contactClicks: 89,
        propertyViews: 3456,
        leadGeneration: 34
      }
    },
    {
      id: 2,
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@example.com',
      phone: '987654321',
      location: 'Santiago',
      specialization: 'Sitios Industriales',
      rating: 4.9,
      reviews: 93,
      properties: 18,
      sales: 12,
      revenue: 3200000,
      joined: '2023-01-22',
      verified: true,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      performance: {
        monthlyLeads: 38,
        conversionRate: 15.8,
        avgResponseTime: '12 min',
        satisfaction: 4.9
      },
      metrics: {
        profileViews: 892,
        contactClicks: 67,
        propertyViews: 2847,
        leadGeneration: 28
      }
    },
    {
      id: 3,
      name: 'Ana Sepúlveda',
      email: 'ana.sepulveda@example.com',
      phone: '956789123',
      location: 'Temuco',
      specialization: 'Campos Ganaderos',
      rating: 4.7,
      reviews: 156,
      properties: 31,
      sales: 20,
      revenue: 4100000,
      joined: '2022-11-08',
      verified: true,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      performance: {
        monthlyLeads: 52,
        conversionRate: 18.2,
        avgResponseTime: '8 min',
        satisfaction: 4.8
      },
      metrics: {
        profileViews: 1856,
        contactClicks: 123,
        propertyViews: 4567,
        leadGeneration: 42
      }
    }
  ]);

  const [selectedAgent, setSelectedAgent] = useState(agents[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTotalAgents = () => agents.length;
  const getActiveAgents = () => agents.filter(agent => agent.status === 'active').length;
  const getVerifiedAgents = () => agents.filter(agent => agent.verified).length;
  const getAverageRating = () => {
    const total = agents.reduce((sum, agent) => sum + agent.rating, 0);
    return (total / agents.length).toFixed(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold">Gestión de Agentes</h2>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Agente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Agentes</p>
                <p className="text-2xl font-bold text-green-600">{getTotalAgents()}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Activos</p>
                <p className="text-2xl font-bold text-blue-600">{getActiveAgents()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Verificados</p>
                <p className="text-2xl font-bold text-purple-600">{getVerifiedAgents()}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rating Promedio</p>
                <p className="text-2xl font-bold text-orange-600">{getAverageRating()}</p>
              </div>
              <Star className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list">Lista de Agentes</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar agentes por nombre, especialización o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <img
                          src={agent.avatar}
                          alt={agent.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        {agent.verified && (
                          <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                            <Shield className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-lg">{agent.name}</h3>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {agent.email}
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {agent.phone}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {agent.location}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 mb-3">
                          <Badge variant="secondary">{agent.specialization}</Badge>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-sm font-medium">{agent.rating}</span>
                            <span className="text-sm text-gray-500 ml-1">({agent.reviews} reseñas)</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-green-600">{agent.properties}</div>
                            <div className="text-xs text-gray-500">Propiedades</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-blue-600">{agent.sales}</div>
                            <div className="text-xs text-gray-500">Ventas</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-purple-600">${(agent.revenue / 1000000).toFixed(1)}M</div>
                            <div className="text-xs text-gray-500">Ingresos</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-orange-600">{agent.performance.conversionRate}%</div>
                            <div className="text-xs text-gray-500">Conversión</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Perfil
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Contactar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Agente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <img src={agent.avatar} alt={agent.name} className="w-10 h-10 rounded-full" />
                        <div>
                          <h4 className="font-semibold">{agent.name}</h4>
                          <p className="text-sm text-gray-500">{agent.specialization}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{agent.performance.conversionRate}% conversión</Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-sm text-gray-500">Leads/Mes</div>
                        <div className="text-lg font-bold text-green-600">{agent.performance.monthlyLeads}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Tiempo Respuesta</div>
                        <div className="text-lg font-bold text-blue-600">{agent.performance.avgResponseTime}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Satisfacción</div>
                        <div className="text-lg font-bold text-purple-600">{agent.performance.satisfaction}/5</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Ventas</div>
                        <div className="text-lg font-bold text-orange-600">{agent.sales}</div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progreso de Meta Mensual</span>
                        <span>{Math.round((agent.performance.monthlyLeads / 50) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((agent.performance.monthlyLeads / 50) * 100, 100)}%` }}
                        ></div>
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
                <CardTitle>Métricas Generales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Ingresos</span>
                    <span className="font-bold text-green-600">
                      ${(agents.reduce((sum, agent) => sum + agent.revenue, 0) / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ventas Totales</span>
                    <span className="font-bold text-blue-600">
                      {agents.reduce((sum, agent) => sum + agent.sales, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Propiedades Activas</span>
                    <span className="font-bold text-purple-600">
                      {agents.reduce((sum, agent) => sum + agent.properties, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Leads Mensuales</span>
                    <span className="font-bold text-orange-600">
                      {agents.reduce((sum, agent) => sum + agent.performance.monthlyLeads, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agents
                    .sort((a, b) => b.performance.conversionRate - a.performance.conversionRate)
                    .slice(0, 3)
                    .map((agent, index) => (
                      <div key={agent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{agent.name}</div>
                            <div className="text-xs text-gray-500">{agent.specialization}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{agent.performance.conversionRate}%</div>
                          <div className="text-xs text-gray-500">conversión</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Agentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Verificación Automática</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Configurar criterios para verificación automática de agentes
                </p>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm">Verificar email automáticamente</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm">Requerir documentos de identificación</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Verificar número telefónico</span>
                  </label>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Comisiones</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Configurar estructura de comisiones por tipo de propiedad
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Terrenos Agrícolas</label>
                    <Input type="number" placeholder="3.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sitios Industriales</label>
                    <Input type="number" placeholder="4.0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Campos Ganaderos</label>
                    <Input type="number" placeholder="3.0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Terrenos Forestales</label>
                    <Input type="number" placeholder="2.5" />
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Límites de Publicación</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Configurar límites por plan de membresía
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Plan Básico</label>
                    <Input type="number" placeholder="5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Plan Pro</label>
                    <Input type="number" placeholder="20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Plan Premium</label>
                    <Input type="text" placeholder="Ilimitado" />
                  </div>
                </div>
              </div>

              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Settings className="h-4 w-4 mr-2" />
                Guardar Configuración
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentManagement;
