import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  FolderOpen, Plus, Search, MapPin, Calendar, 
  Users, TrendingUp, Building2, Eye, Edit, Settings
} from 'lucide-react';
import Layout from './Layout';

interface Project {
  id: string;
  name: string;
  location: string;
  status: 'planning' | 'active' | 'sold_out' | 'completed';
  totalLots: number;
  availableLots: number;
  reservedLots: number;
  soldLots: number;
  startDate: string;
  imageUrl?: string;
  description: string;
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Valle del Sol',
    location: 'La Serena, Región de Coquimbo',
    status: 'active',
    totalLots: 50,
    availableLots: 25,
    reservedLots: 10,
    soldLots: 15,
    startDate: '2024-01-01',
    description: 'Proyecto de parcelas con vista al mar y acceso a servicios básicos.',
  },
  {
    id: '2',
    name: 'Bosque Nativo',
    location: 'Pucón, Región de la Araucanía',
    status: 'active',
    totalLots: 30,
    availableLots: 8,
    reservedLots: 7,
    soldLots: 15,
    startDate: '2023-06-15',
    description: 'Parcelas rodeadas de bosque nativo con vista al volcán.',
  },
  {
    id: '3',
    name: 'Costa Pacífico',
    location: 'Algarrobo, Región de Valparaíso',
    status: 'sold_out',
    totalLots: 20,
    availableLots: 0,
    reservedLots: 0,
    soldLots: 20,
    startDate: '2023-01-01',
    description: 'Lotes premium frente al mar con todos los servicios.',
  },
  {
    id: '4',
    name: 'Montaña Verde',
    location: 'Chillán, Región de Ñuble',
    status: 'planning',
    totalLots: 40,
    availableLots: 40,
    reservedLots: 0,
    soldLots: 0,
    startDate: '2024-06-01',
    description: 'Nuevo proyecto en etapa de planificación con vista a la cordillera.',
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  planning: { label: 'En Planificación', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  active: { label: 'Activo', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  sold_out: { label: 'Agotado', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  completed: { label: 'Completado', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20' },
};

const ProjectsManagement = () => {
  const [projects] = useState<Project[]>(mockProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStats = {
    projects: projects.length,
    totalLots: projects.reduce((acc, p) => acc + p.totalLots, 0),
    soldLots: projects.reduce((acc, p) => acc + p.soldLots, 0),
    revenue: projects.reduce((acc, p) => acc + p.soldLots * 25000000, 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
  };

  const getSoldPercentage = (project: Project) => {
    return Math.round((project.soldLots / project.totalLots) * 100);
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Proyectos de Loteo</h1>
            <p className="text-muted-foreground">Gestiona tus desarrollos inmobiliarios</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Proyecto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre del Proyecto</Label>
                  <Input placeholder="ej: Valle del Sol" />
                </div>
                <div className="space-y-2">
                  <Label>Ubicación</Label>
                  <Input placeholder="ej: La Serena, Región de Coquimbo" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total de Lotes</Label>
                    <Input type="number" placeholder="50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Inicio</Label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea placeholder="Descripción del proyecto..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
                <Button onClick={() => setShowAddDialog(false)}>Crear Proyecto</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Proyectos</p>
                  <p className="text-2xl font-bold">{totalStats.projects}</p>
                </div>
                <FolderOpen className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Lotes</p>
                  <p className="text-2xl font-bold">{totalStats.totalLots}</p>
                </div>
                <MapPin className="h-8 w-8 text-blue-500/60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lotes Vendidos</p>
                  <p className="text-2xl font-bold text-green-600">{totalStats.soldLots}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500/60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos Est.</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(totalStats.revenue)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proyectos..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Project Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-background relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Building2 className="h-16 w-16 text-primary/30" />
                </div>
                <Badge className={`absolute top-4 right-4 ${statusConfig[project.status].color}`}>
                  {statusConfig[project.status].label}
                </Badge>
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {project.location}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progreso de ventas</span>
                    <span className="font-medium">{getSoldPercentage(project)}%</span>
                  </div>
                  <Progress value={getSoldPercentage(project)} className="h-2" />
                </div>

                {/* Lot Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-green-500/10 rounded-lg p-2">
                    <p className="text-lg font-bold text-green-600">{project.availableLots}</p>
                    <p className="text-xs text-muted-foreground">Disponibles</p>
                  </div>
                  <div className="bg-yellow-500/10 rounded-lg p-2">
                    <p className="text-lg font-bold text-yellow-600">{project.reservedLots}</p>
                    <p className="text-xs text-muted-foreground">Reservados</p>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-2">
                    <p className="text-lg font-bold text-blue-600">{project.soldLots}</p>
                    <p className="text-xs text-muted-foreground">Vendidos</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 gap-1">
                    <Eye className="h-4 w-4" />
                    Ver Lotes
                  </Button>
                  <Button variant="outline" className="flex-1 gap-1">
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ProjectsManagement;
