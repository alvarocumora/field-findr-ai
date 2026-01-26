import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  Target,
  Users,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Phone,
  Mail,
  MessageSquare,
  Eye,
  Edit,
  PlusCircle,
  Filter,
  Download,
  ArrowRight,
  Handshake,
  CreditCard,
  Building,
  MapPin
} from 'lucide-react';

const SalesManagement = () => {
  const [selectedPipeline, setSelectedPipeline] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const salesStages = [
    { name: 'Lead', color: 'bg-gray-100 text-gray-800', count: 45 },
    { name: 'Contactado', color: 'bg-blue-100 text-blue-800', count: 32 },
    { name: 'Calificado', color: 'bg-yellow-100 text-yellow-800', count: 28 },
    { name: 'Propuesta', color: 'bg-orange-100 text-orange-800', count: 18 },
    { name: 'Negociación', color: 'bg-purple-100 text-purple-800', count: 12 },
    { name: 'Cerrado', color: 'bg-green-100 text-green-800', count: 8 },
    { name: 'Perdido', color: 'bg-red-100 text-red-800', count: 5 }
  ];

  const opportunities = [
    {
      id: 'OPP-001',
      client: 'María González Martínez',
      company: 'Agrícola Santa Rosa Ltda.',
      email: 'maria.gonzalez@santarosa.cl',
      phone: '+56912345678',
      property: 'Terreno Agrícola Casablanca 50 há',
      value: 185000000,
      probability: 85,
      stage: 'Negociación',
      expectedCloseDate: '2024-02-15',
      agent: 'Carlos Mendoza',
      lastActivity: '2024-01-18',
      nextAction: 'Envío contrato final',
      source: 'Website',
      tags: ['Alta prioridad', 'Financiamiento propio'],
      activities: 15,
      documents: 8
    },
    {
      id: 'OPP-002',
      client: 'Roberto Silva Chen',
      company: 'Inversiones RKS',
      email: 'roberto.silva@rks.cl',
      phone: '+56987654321',
      property: 'Sitio Industrial Quilicura 20 há',
      value: 290000000,
      probability: 70,
      stage: 'Propuesta',
      expectedCloseDate: '2024-03-30',
      agent: 'Ana Sepúlveda',
      lastActivity: '2024-01-17',
      nextAction: 'Presentación ejecutiva',
      source: 'Referido',
      tags: ['Inversionista', 'Múltiples propiedades'],
      activities: 12,
      documents: 5
    },
    {
      id: 'OPP-003',
      client: 'Carmen López Reyes',
      company: 'Familia López',
      email: 'carmen.lopez@gmail.com',
      phone: '+56956789123',
      property: 'Parcela de Agrado Pirque 10 há',
      value: 125000000,
      probability: 45,
      stage: 'Calificado',
      expectedCloseDate: '2024-04-15',
      agent: 'Jorge Ruiz',
      lastActivity: '2024-01-16',
      nextAction: 'Visita programada',
      source: 'Social Media',
      tags: ['Primera compra', 'Evaluando financiamiento'],
      activities: 6,
      documents: 3
    }
  ];

  const contracts = [
    {
      id: 'CONT-001',
      client: 'Patricia Morales',
      property: 'Campo Ganadero Temuco',
      value: 420000000,
      status: 'Firmado',
      signDate: '2024-01-15',
      deliveryDate: '2024-02-28',
      agent: 'Carlos Mendoza',
      paymentPlan: '30% pie, 70% crédito',
      notary: 'Notaría González & Asociados'
    },
    {
      id: 'CONT-002',
      client: 'Diego Hernández',
      property: 'Terreno Industrial Norte',
      value: 180000000,
      status: 'En Proceso',
      signDate: '2024-01-10',
      deliveryDate: '2024-03-15',
      agent: 'Ana Sepúlveda',
      paymentPlan: '40% pie, 60% crédito',
      notary: 'Notaría San Martín'
    }
  ];

  const getStageColor = (stage: string) => {
    const stageData = salesStages.find(s => s.name === stage);
    return stageData ? stageData.color : 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Firmado': return 'bg-green-100 text-green-800';
      case 'En Proceso': return 'bg-orange-100 text-orange-800';
      case 'Pendiente': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOpportunities = opportunities.filter(opp =>
    opp.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPipelineValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);
  const avgDealSize = totalPipelineValue / opportunities.length;
  const conversionRate = (opportunities.filter(opp => opp.stage === 'Cerrado').length / opportunities.length) * 100;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Gestión de Ventas</h1>
          <p className="text-muted-foreground">Administra tu pipeline de ventas y oportunidades de negocio</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button className="bg-gradient-primary text-white">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nueva Oportunidad
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pipeline Total</p>
                <p className="text-2xl font-bold">${(totalPipelineValue / 1000000000).toFixed(1)}B</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Deal Promedio</p>
                <p className="text-2xl font-bold">${(avgDealSize / 1000000).toFixed(0)}M</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Tasa Conversión</p>
                <p className="text-2xl font-bold">{conversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Oportunidades</p>
                <p className="text-2xl font-bold">{opportunities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Pipeline Visual */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Pipeline de Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 justify-between">
            {salesStages.map((stage, index) => (
              <div key={stage.name} className="flex flex-col items-center min-w-[120px]">
                <div className={`w-full p-4 rounded-lg ${stage.color} text-center`}>
                  <p className="font-semibold">{stage.name}</p>
                  <p className="text-2xl font-bold mt-2">{stage.count}</p>
                </div>
                {index < salesStages.length - 1 && (
                  <ArrowRight className="h-6 w-6 text-muted-foreground mt-4 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="opportunities" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar oportunidades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las etapas</SelectItem>
                {salesStages.map(stage => (
                  <SelectItem key={stage.name} value={stage.name}>{stage.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Más Filtros
            </Button>
          </div>

          {/* Opportunities List */}
          <div className="space-y-4">
            {filteredOpportunities.map((opp) => (
              <Card key={opp.id} className="card-elegant hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{opp.client}</h3>
                        <p className="text-muted-foreground">{opp.company}</p>
                        <p className="text-sm text-muted-foreground">{opp.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStageColor(opp.stage)}>
                        {opp.stage}
                      </Badge>
                      <p className="text-2xl font-bold text-green-600 mt-2">
                        ${(opp.value / 1000000).toFixed(0)}M
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Propiedad</p>
                      <p className="font-medium flex items-center">
                        <Building className="h-4 w-4 mr-1" />
                        {opp.property}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Probabilidad</p>
                      <div className="flex items-center space-x-2">
                        <Progress value={opp.probability} className="flex-1 h-2" />
                        <span className="text-sm font-medium">{opp.probability}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cierre Esperado</p>
                      <p className="font-medium flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(opp.expectedCloseDate).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Agente</p>
                      <p className="font-medium">{opp.agent}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      {opp.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
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
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Próxima acción: {opp.nextAction}</span>
                      <span>{opp.activities} actividades • {opp.documents} documentos</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>Contratos de Venta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Contrato</th>
                      <th className="text-left p-4 font-medium">Cliente</th>
                      <th className="text-left p-4 font-medium">Propiedad</th>
                      <th className="text-left p-4 font-medium">Valor</th>
                      <th className="text-left p-4 font-medium">Estado</th>
                      <th className="text-left p-4 font-medium">Entrega</th>
                      <th className="text-left p-4 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((contract) => (
                      <tr key={contract.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{contract.id}</p>
                            <p className="text-sm text-muted-foreground">
                              Firmado: {new Date(contract.signDate).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">{contract.client}</p>
                          <p className="text-sm text-muted-foreground">{contract.agent}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">{contract.property}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-green-600">
                            ${(contract.value / 1000000).toFixed(0)}M
                          </p>
                          <p className="text-sm text-muted-foreground">{contract.paymentPlan}</p>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(contract.status)}>
                            {contract.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <p className="text-sm">
                            {new Date(contract.deliveryDate).toLocaleDateString('es-ES')}
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
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

        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Pagos Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">$124M</div>
                  <p className="text-sm text-muted-foreground">8 pagos pendientes</p>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Pagos Este Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">$287M</div>
                  <p className="text-sm text-muted-foreground">15 pagos recibidos</p>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Comisiones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">$18.5M</div>
                  <p className="text-sm text-muted-foreground">Comisiones generadas</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Performance por Agente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">Carlos Mendoza</p>
                      <p className="text-sm text-muted-foreground">8 deals • $520M</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">75%</p>
                      <p className="text-sm text-muted-foreground">Close rate</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">Ana Sepúlveda</p>
                      <p className="text-sm text-muted-foreground">6 deals • $410M</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">68%</p>
                      <p className="text-sm text-muted-foreground">Close rate</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">Jorge Ruiz</p>
                      <p className="text-sm text-muted-foreground">4 deals • $285M</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">55%</p>
                      <p className="text-sm text-muted-foreground">Close rate</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Métricas de Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Ciclo Promedio de Venta</span>
                    <span className="text-xl font-bold">4.2 meses</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Valor Promedio Deal</span>
                    <span className="text-xl font-bold">$165M</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Leads to Close %</span>
                    <span className="text-xl font-bold">18.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Revenue YTD</span>
                    <span className="text-xl font-bold text-green-600">$2.4B</span>
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

export default SalesManagement;