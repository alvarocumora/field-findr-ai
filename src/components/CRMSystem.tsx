import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  TrendingUp, 
  Phone, 
  Mail, 
  Calendar,
  DollarSign,
  Target,
  Star,
  Clock,
  UserPlus,
  Filter,
  Download,
  MessageSquare,
  Eye,
  Edit,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Brain
} from 'lucide-react';

const CRMSystem = () => {
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const leads = [
    {
      id: '1',
      name: 'María González',
      email: 'maria.gonzalez@email.com',
      phone: '+56912345678',
      status: 'hot',
      score: 95,
      source: 'Website',
      project: 'Condominio Las Palmas',
      budget: 180000000,
      timeline: '1-3 meses',
      lastContact: '2024-01-18',
      assignedAgent: 'Carlos Mendoza',
      interactions: 8,
      stage: 'Negociación',
      notes: 'Interesada en departamento con vista, presupuesto confirmado.',
      nextAction: 'Visita programada para el viernes'
    },
    {
      id: '2',
      name: 'Roberto Silva',
      email: 'roberto.silva@empresa.cl',
      phone: '+56987654321',
      status: 'warm',
      score: 72,
      source: 'Referido',
      project: 'Parcelas El Roble',
      budget: 120000000,
      timeline: '3-6 meses',
      lastContact: '2024-01-16',
      assignedAgent: 'Ana Sepúlveda',
      interactions: 5,
      stage: 'Evaluación',
      notes: 'Busca parcela para proyecto familiar, evalúa financiamiento.',
      nextAction: 'Envío de cotización detallada'
    },
    {
      id: '3',
      name: 'Carmen López',
      email: 'carmen.lopez@gmail.com',
      phone: '+56956789123',
      status: 'cold',
      score: 48,
      source: 'Social Media',
      project: 'Terreno Industrial Norte',
      budget: 250000000,
      timeline: '6+ meses',
      lastContact: '2024-01-10',
      assignedAgent: 'Jorge Ruiz',
      interactions: 2,
      stage: 'Inicial',
      notes: 'Primera consulta, información general solicitada.',
      nextAction: 'Llamada de seguimiento programada'
    }
  ];

  const opportunities = [
    {
      id: 'opp-1',
      client: 'María González',
      project: 'Condominio Las Palmas',
      value: 180000000,
      probability: 90,
      stage: 'Cierre',
      expectedDate: '2024-02-15',
      agent: 'Carlos Mendoza'
    },
    {
      id: 'opp-2',
      client: 'Roberto Silva',
      project: 'Parcelas El Roble',
      value: 120000000,
      probability: 65,
      stage: 'Propuesta',
      expectedDate: '2024-03-30',
      agent: 'Ana Sepúlveda'
    }
  ];

  const activities = [
    {
      id: 'act-1',
      type: 'call',
      description: 'Llamada con María González - Confirmación de visita',
      date: '2024-01-18 14:30',
      agent: 'Carlos Mendoza',
      status: 'completed'
    },
    {
      id: 'act-2',
      type: 'email',
      description: 'Envío de cotización detallada a Roberto Silva',
      date: '2024-01-18 10:15',
      agent: 'Ana Sepúlveda',
      status: 'completed'
    },
    {
      id: 'act-3',
      type: 'meeting',
      description: 'Reunión programada con Carmen López',
      date: '2024-01-19 15:00',
      agent: 'Jorge Ruiz',
      status: 'scheduled'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-red-100 text-red-800';
      case 'warm': return 'bg-orange-100 text-orange-800';
      case 'cold': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Inicial': return 'bg-gray-100 text-gray-800';
      case 'Evaluación': return 'bg-blue-100 text-blue-800';
      case 'Negociación': return 'bg-orange-100 text-orange-800';
      case 'Cierre': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">CRM Inmobiliario</h1>
          <p className="text-muted-foreground">Gestiona leads, oportunidades y relaciones con clientes</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button className="bg-gradient-primary text-white">
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Leads Activos</p>
                <p className="text-2xl font-bold">247</p>
                <div className="flex items-center text-sm text-green-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +12% vs mes anterior
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Tasa Conversión</p>
                <p className="text-2xl font-bold">18.5%</p>
                <div className="flex items-center text-sm text-green-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +3.2% vs mes anterior
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pipeline Valor</p>
                <p className="text-2xl font-bold">$4.8B</p>
                <div className="flex items-center text-sm text-red-600">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  -2.1% vs mes anterior
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Score IA Promedio</p>
                <p className="text-2xl font-bold">73.2</p>
                <div className="flex items-center text-sm text-green-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +5.8 vs mes anterior
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="leads" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
          <TabsTrigger value="activities">Actividades</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Más Filtros
            </Button>
          </div>

          {/* Leads Table */}
          <Card className="card-elegant">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Cliente</th>
                      <th className="text-left p-4 font-medium">Estado</th>
                      <th className="text-left p-4 font-medium">Score IA</th>
                      <th className="text-left p-4 font-medium">Proyecto</th>
                      <th className="text-left p-4 font-medium">Presupuesto</th>
                      <th className="text-left p-4 font-medium">Agente</th>
                      <th className="text-left p-4 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <p className="text-sm text-muted-foreground">{lead.email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Brain className="h-4 w-4 text-primary" />
                            <span className="font-medium">{lead.score}</span>
                            <Progress value={lead.score} className="w-16 h-2" />
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm">{lead.project}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">${(lead.budget / 1000000).toFixed(0)}M</p>
                          <p className="text-sm text-muted-foreground">{lead.timeline}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm">{lead.assignedAgent}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
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

        <TabsContent value="opportunities" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {opportunities.map((opp) => (
              <Card key={opp.id} className="card-elegant">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{opp.client}</h3>
                    <Badge className={getStageColor(opp.stage)}>
                      {opp.stage}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Proyecto</p>
                      <p className="font-medium">{opp.project}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Estimado</p>
                      <p className="text-xl font-bold text-green-600">
                        ${(opp.value / 1000000).toFixed(0)}M
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Probabilidad: {opp.probability}%
                      </p>
                      <Progress value={opp.probability} className="h-2" />
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cierre esperado:</span>
                      <span>{new Date(opp.expectedDate).toLocaleDateString('es-ES')}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Agente:</span>
                      <span>{opp.agent}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>Actividades Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      activity.type === 'call' ? 'bg-blue-100' :
                      activity.type === 'email' ? 'bg-green-100' :
                      'bg-orange-100'
                    }`}>
                      {activity.type === 'call' && <Phone className="h-5 w-5 text-blue-600" />}
                      {activity.type === 'email' && <Mail className="h-5 w-5 text-green-600" />}
                      {activity.type === 'meeting' && <Calendar className="h-5 w-5 text-orange-600" />}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.date} • {activity.agent}
                      </p>
                    </div>
                    
                    <Badge className={
                      activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-orange-100 text-orange-800'
                    }>
                      {activity.status === 'completed' ? 'Completado' : 'Programado'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Rendimiento por Agente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">Carlos Mendoza</p>
                      <p className="text-sm text-muted-foreground">15 leads • 6 cerrados</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">40%</p>
                      <p className="text-sm text-muted-foreground">Conversión</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">Ana Sepúlveda</p>
                      <p className="text-sm text-muted-foreground">12 leads • 4 cerrados</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">33%</p>
                      <p className="text-sm text-muted-foreground">Conversión</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">Jorge Ruiz</p>
                      <p className="text-sm text-muted-foreground">8 leads • 2 cerrados</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">25%</p>
                      <p className="text-sm text-muted-foreground">Conversión</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Fuentes de Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Website</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={45} className="w-24 h-2" />
                      <span className="text-sm font-medium">45%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Referencias</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={30} className="w-24 h-2" />
                      <span className="text-sm font-medium">30%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Social Media</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={15} className="w-24 h-2" />
                      <span className="text-sm font-medium">15%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Eventos</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={10} className="w-24 h-2" />
                      <span className="text-sm font-medium">10%</span>
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

export default CRMSystem;