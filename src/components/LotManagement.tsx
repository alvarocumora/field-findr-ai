import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MapPin, Plus, Search, Filter, Grid3X3, List, Loader2 } from 'lucide-react';
import Map from './Map';
import Layout from './Layout';
import { useLots, Lot, LotInsert } from '@/hooks/useLots';
import { useProjects } from '@/hooks/useProjects';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { LotForm } from './lots/LotForm';
import { LotCard } from './lots/LotCard';
import { LotTable } from './lots/LotTable';
import { LotStats } from './lots/LotStats';

const LotManagement = () => {
  const { lots, isLoading, stats, createLot, updateLot, deleteLot } = useLots();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { token: mapboxToken } = useMapboxToken();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [deletingLot, setDeletingLot] = useState<Lot | null>(null);

  const filteredLots = lots.filter(lot => {
    const matchesSearch = 
      lot.lot_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lot.status === statusFilter;
    const matchesProject = projectFilter === 'all' || lot.project_id === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const handleCreateLot = (data: Omit<LotInsert, 'user_id'>) => {
    createLot.mutate(data, {
      onSuccess: () => setShowAddDialog(false),
    });
  };

  const handleUpdateLot = (data: Omit<LotInsert, 'user_id'>) => {
    if (!editingLot) return;
    updateLot.mutate({ id: editingLot.id, ...data }, {
      onSuccess: () => setEditingLot(null),
    });
  };

  const handleDeleteLot = () => {
    if (!deletingLot) return;
    deleteLot.mutate(deletingLot.id, {
      onSuccess: () => setDeletingLot(null),
    });
  };

  const mapMarkers = filteredLots
    .filter(lot => lot.latitude && lot.longitude)
    .map(lot => ({
      id: lot.id,
      coordinates: [Number(lot.longitude), Number(lot.latitude)] as [number, number],
      title: lot.lot_number,
      status: (lot.status as 'available' | 'reserved' | 'sold') || 'available',
      price: lot.price ? Number(lot.price) : 0,
    }));

  if (isLoading || projectsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Lotes</h1>
            <p className="text-muted-foreground">Administra el inventario de parcelas y lotes</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={projects.length === 0}>
                <Plus className="h-4 w-4" />
                Nuevo Lote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Lote</DialogTitle>
              </DialogHeader>
              <LotForm
                projects={projects}
                onSubmit={handleCreateLot}
                onCancel={() => setShowAddDialog(false)}
                isLoading={createLot.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <LotStats stats={stats} />

        {/* No projects warning */}
        {projects.length === 0 && (
          <Card className="p-6 bg-yellow-500/5 border-yellow-500/20">
            <p className="text-yellow-700">
              No tienes proyectos creados. Crea un proyecto primero para poder agregar lotes.
            </p>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="list" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <TabsList>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-2">
                <MapPin className="h-4 w-4" />
                Mapa
              </TabsTrigger>
            </TabsList>
            
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar lote..."
                  className="pl-10 w-48"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proyectos</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="available">Disponibles</SelectItem>
                  <SelectItem value="reserved">Reservados</SelectItem>
                  <SelectItem value="sold">Vendidos</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <TabsContent value="list" className="m-0">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLots.map((lot) => (
                  <LotCard 
                    key={lot.id} 
                    lot={lot}
                    onEdit={setEditingLot}
                    onDelete={setDeletingLot}
                  />
                ))}
                {filteredLots.length === 0 && (
                  <div className="col-span-full p-8 text-center text-muted-foreground">
                    {lots.length === 0 
                      ? 'No hay lotes registrados. Crea el primer lote.'
                      : 'No se encontraron lotes con los filtros aplicados.'}
                  </div>
                )}
              </div>
            ) : (
              <LotTable 
                lots={filteredLots}
                onEdit={setEditingLot}
                onDelete={setDeletingLot}
              />
            )}
          </TabsContent>

          <TabsContent value="map" className="m-0">
            <Card className="overflow-hidden">
              {mapboxToken ? (
                <Map
                  accessToken={mapboxToken}
                  markers={mapMarkers}
                  className="h-[600px]"
                  onMarkerClick={(id) => {
                    const lot = lots.find(l => l.id === id);
                    if (lot) setEditingLot(lot);
                  }}
                />
              ) : (
                <div className="h-[600px] flex items-center justify-center bg-muted/30">
                  <div className="text-center space-y-4">
                    <MapPin className="h-16 w-16 mx-auto text-muted-foreground/50" />
                    <div>
                      <h3 className="font-semibold">Mapa no disponible</h3>
                      <p className="text-sm text-muted-foreground">
                        Configura tu token de Mapbox para ver el mapa interactivo
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={!!editingLot} onOpenChange={(open) => !open && setEditingLot(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Lote {editingLot?.lot_number}</DialogTitle>
            </DialogHeader>
            {editingLot && (
              <LotForm
                projects={projects}
                initialData={editingLot}
                onSubmit={handleUpdateLot}
                onCancel={() => setEditingLot(null)}
                isLoading={updateLot.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingLot} onOpenChange={(open) => !open && setDeletingLot(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar lote {deletingLot?.lot_number}?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El lote será eliminado permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteLot}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteLot.isPending ? 'Eliminando...' : 'Eliminar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default LotManagement;
