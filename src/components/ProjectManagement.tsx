import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  BarChart3,
  PlusCircle,
  Filter,
  Download,
  Eye
} from 'lucide-react';

const UrbanizationManagement = () => {
  const [selectedProject, setSelectedProject] = useState('proyecto-1');
  const [searchTerm, setSearchTerm] = useState('');

  const projects = [
    {
      id: 'proyecto-1',
      name: 'Condominio Las Palmas',
      location: 'Chicureo, Santiago',
      status: 'Construcción',
      progress: 65,
      budget: 8500000000,
      spent: 5525000000,
      startDate: '2024-01-15',
      endDate: '2025-06-30',
      units: 45,
      unitsSold: 32,
      unitsReserved: 8,
      unitsAvailable: 5,
      contractor: 'Constructora ABC',
      projectManager: 'Carlos Mendoza',
      phase: 'Obra Gruesa',
      milestones: [
        { name: 'Excavación', status: 'completed', date: '2024-02-28' },
        { name: 'Fundaciones', status: 'completed', date: '2024-04-15' },
        { name: 'Obra Gruesa', status: 'in-progress', date: '2024-12-30' },
        { name: 'Terminaciones', status: 'pending', date: '2025-04-30' },
        { name: 'Entrega', status: 'pending', date: '2025-06-30' }
      ]
    },
    {
      id: 'proyecto-2',
      name: 'Parcelas El Roble',
      location: 'Curacaví, Santiago',
      status: 'Comercialización',
      progress: 85,
      budget: 3200000000,
      spent: 2720000000,
      startDate: '2023-08-01',
      endDate: '2024-12-31',
      units: 25,
      unitsSold: 18,
      unitsReserved: 4,
      unitsAvailable: 3,
      contractor: 'Grupo Inmobiliario DEF',
      projectManager: 'Ana Sepúlveda',
      phase: 'Marketing',
      milestones: [
        { name: 'Urbanización', status: 'completed', date: '2024-01-30' },
        { name: 'Infraestructura', status: 'completed', date: '2024-05-15' },
        { name: 'Permisos', status: 'completed', date: '2024-07-30' },
        { name: 'Comercialización', status: 'in-progress', date: '2024-12-31' },
        { name: 'Escrituración', status: 'pending', date: '2025-02-28' }
      ]
    }
  ];

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planificación': return 'bg-blue-100 text-blue-800';
      case 'Construcción': return 'bg-orange-100 text-orange-800';
      case 'Comercialización': return 'bg-green-100 text-green-800';
      case 'Entregado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'pending': return <AlertTriangle className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const currentProject = projects.find(p => p.id === selectedProject);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Gestión de Proyectos</h1>
          <p className="text-muted-foreground">Administra y monitorea tus proyectos inmobiliarios</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button className="bg-gradient-primary text-white">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nuevo Proyecto
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Proyectos Activos</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Inversión Total</p>
                <p className="text-2xl font-bold">$24.5B</p>
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
                <p className="text-sm font-medium text-muted-foreground">Unidades Vendidas</p>
                <p className="text-2xl font-bold">247</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">ROI Promedio</p>
                <p className="text-2xl font-bold">23.4%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="projects">Proyectos</TabsTrigger>
          <TabsTrigger value="construction">Construcción</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Project Overview */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>Resumen de Proyectos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProjects.map((project) => (
                  <Card key={project.id} className="border-2 hover:border-primary transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{project.name}</h3>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2" />
                          {project.location}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progreso</span>
                            <span>{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Vendidas: {project.unitsSold}/{project.units}</span>
                          <span>Disponibles: {project.unitsAvailable}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar proyectos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>

          {/* Projects List */}
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="card-elegant">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{project.name}</h3>
                      <p className="text-muted-foreground flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {project.location}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Progreso</p>
                      <div className="mt-1">
                        <Progress value={project.progress} className="h-2" />
                        <p className="text-sm font-medium mt-1">{project.progress}%</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Presupuesto</p>
                      <p className="text-lg font-semibold">${(project.budget / 1000000000).toFixed(1)}B</p>
                      <p className="text-sm text-green-600">
                        Gastado: ${(project.spent / 1000000000).toFixed(1)}B
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unidades</p>
                      <p className="text-lg font-semibold">{project.units} total</p>
                      <p className="text-sm">
                        <span className="text-green-600">{project.unitsSold} vendidas</span> • 
                        <span className="text-orange-600"> {project.unitsReserved} reservadas</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fase Actual</p>
                      <p className="text-lg font-semibold">{project.phase}</p>
                      <p className="text-sm text-muted-foreground">PM: {project.projectManager}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="construction" className="space-y-6">
          {currentProject && (
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Pipeline de Construcción - {currentProject.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentProject.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      {getMilestoneIcon(milestone.status)}
                      <div className="flex-1">
                        <h4 className="font-semibold">{milestone.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Fecha objetivo: {new Date(milestone.date).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <Badge 
                        className={
                          milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                          milestone.status === 'in-progress' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {milestone.status === 'completed' ? 'Completado' :
                         milestone.status === 'in-progress' ? 'En Progreso' : 'Pendiente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Rendimiento Financiero</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>ROI Promedio</span>
                    <span className="text-2xl font-bold text-green-600">23.4%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Margen de Ganancia</span>
                    <span className="text-2xl font-bold text-blue-600">18.7%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tiempo Promedio Venta</span>
                    <span className="text-2xl font-bold text-orange-600">4.2 meses</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Métricas de Construcción</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Proyectos a Tiempo</span>
                    <span className="text-2xl font-bold text-green-600">85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Dentro de Presupuesto</span>
                    <span className="text-2xl font-bold text-blue-600">78%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Satisfacción Cliente</span>
                    <span className="text-2xl font-bold text-purple-600">4.6/5</span>
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

export default UrbanizationManagement;