import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FolderOpen, Plus, Search, MapPin, 
  TrendingUp, Building2, Eye, Edit,
  Settings, FileArchive, Trash2, Rocket
} from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useProjects, Project } from '@/hooks/useProjects';
import { KMZImportDialog } from './projects/KMZImportDialog';
import CreateProjectWizard from './projects/CreateProjectWizard';

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-muted text-muted-foreground border-border' },
  planning: { label: 'En Planificación', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  active: { label: 'Activo', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  sold_out: { label: 'Agotado', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  completed: { label: 'Completado', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20' },
};

const ProjectsManagement = () => {
  const { projects, isLoading, stats, createProject, updateProject, deleteProject, refetch } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedProjectForImport, setSelectedProjectForImport] = useState<Project | null>(null);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
  };

  const getSoldPercentage = (project: Project) => {
    const total = project.total_lots || 0;
    const sold = project.sold_lots || 0;
    return total > 0 ? Math.round((sold / total) * 100) : 0;
  };

  const estimatedRevenue = stats.soldLots * 25000000;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
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
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
              </DialogHeader>
              <CreateProjectWizard
                createProject={createProject}
                onComplete={() => setShowAddDialog(false)}
                onCancel={() => setShowAddDialog(false)}
              />
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
                  <p className="text-2xl font-bold">{stats.total}</p>
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
                  <p className="text-2xl font-bold">{stats.totalLots}</p>
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
                  <p className="text-2xl font-bold text-green-600">{stats.soldLots}</p>
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
                  <p className="text-xl font-bold text-green-600">{formatCurrency(estimatedRevenue)}</p>
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

        {/* Empty State */}
        {filteredProjects.length === 0 && !isLoading && (
          <Card className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay proyectos</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No se encontraron proyectos con ese criterio' : 'Crea tu primer proyecto de loteo'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Proyecto
              </Button>
            )}
          </Card>
        )}

        {/* Project Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-background relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Building2 className="h-16 w-16 text-primary/30" />
                </div>
                <Badge className={`absolute top-4 right-4 ${statusConfig[project.status || 'draft']?.color || statusConfig.draft.color}`}>
                  {statusConfig[project.status || 'draft']?.label || 'Borrador'}
                </Badge>
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {project.location || 'Sin ubicación'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description || 'Sin descripción'}
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
                    <p className="text-lg font-bold text-green-600">{project.available_lots || 0}</p>
                    <p className="text-xs text-muted-foreground">Disponibles</p>
                  </div>
                  <div className="bg-yellow-500/10 rounded-lg p-2">
                    <p className="text-lg font-bold text-yellow-600">{project.reserved_lots || 0}</p>
                    <p className="text-xs text-muted-foreground">Reservados</p>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-2">
                    <p className="text-lg font-bold text-blue-600">{project.sold_lots || 0}</p>
                    <p className="text-xs text-muted-foreground">Vendidos</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-1"
                    onClick={() => {
                      setSelectedProjectForImport(project);
                      setShowImportDialog(true);
                    }}
                  >
                    <FileArchive className="h-4 w-4" />
                    Importar KMZ
                  </Button>
                  <Button variant="outline" className="flex-1 gap-1" asChild>
                    <Link to={`/proyecto/${project.id}`}>
                      <Eye className="h-4 w-4" />
                      Ver
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingProject(project);
                      setShowEditDialog(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se eliminará "{project.name}" y todos sus lotes asociados ({project.total_lots || 0} lotes). Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteProject.mutate(project.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Sí, eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* KMZ Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileArchive className="h-5 w-5" />
                Importar Lotes desde KMZ
              </DialogTitle>
            </DialogHeader>
            {selectedProjectForImport && (
              <KMZImportDialog
                projectId={selectedProjectForImport.id}
                projectName={selectedProjectForImport.name}
                onComplete={() => {
                  setShowImportDialog(false);
                  setSelectedProjectForImport(null);
                  refetch();
                }}
                onCancel={() => {
                  setShowImportDialog(false);
                  setSelectedProjectForImport(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Project Dialog */}
        <Dialog open={showEditDialog} onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) setEditingProject(null);
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Proyecto</DialogTitle>
            </DialogHeader>
            {editingProject && (
              <CreateProjectWizard
                createProject={createProject}
                updateProject={updateProject}
                editingProject={editingProject}
                onComplete={() => {
                  setShowEditDialog(false);
                  setEditingProject(null);
                }}
                onCancel={() => {
                  setShowEditDialog(false);
                  setEditingProject(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default ProjectsManagement;
