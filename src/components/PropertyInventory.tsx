import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteListing, formatPrice, formatArea, getListingTypeLabel } from '@/hooks/useListings';
import { ListingFormDialog } from '@/components/listings/ListingFormDialog';
import {
  Building2, MapPin, Eye, Trash2, PlusCircle,
  CheckCircle, Clock, BarChart3, Search, DollarSign,
  LayoutGrid, List, FileText, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ViewMode = 'table' | 'kanban';

const STATUS_COLUMNS = [
  { key: 'active', label: 'Disponible', color: 'bg-green-500/10 text-green-600 border-green-500/20', dotColor: 'bg-green-500' },
  { key: 'reserved', label: 'Reservado', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', dotColor: 'bg-orange-500' },
  { key: 'sold', label: 'Vendido', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', dotColor: 'bg-blue-500' },
  { key: 'inactive', label: 'Inactivo', color: 'bg-muted text-muted-foreground', dotColor: 'bg-muted-foreground' },
];

const PropertyInventory = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const deleteListing = useDeleteListing();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['my-listings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('listings').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getStatusLabel = (status: string) => STATUS_COLUMNS.find(s => s.key === status)?.label || status;
  const getStatusColor = (status: string) => STATUS_COLUMNS.find(s => s.key === status)?.color || 'bg-muted text-muted-foreground';

  const filteredListings = listings.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchesType = typeFilter === 'all' || l.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === 'active').length,
    reserved: listings.filter(l => l.status === 'reserved').length,
    sold: listings.filter(l => l.status === 'sold').length,
    totalValue: listings.reduce((sum, l) => sum + (l.price || 0), 0),
    totalViews: listings.reduce((sum, l) => sum + (l.views_count || 0), 0),
  };

  const types = [...new Set(listings.map(l => l.type))];

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta propiedad?')) deleteListing.mutate(id);
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`¿Eliminar ${selectedIds.size} propiedades seleccionadas?`)) {
      selectedIds.forEach(id => deleteListing.mutate(id));
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBatchStatusChange = async (newStatus: string) => {
    if (selectedIds.size === 0) return;
    try {
      for (const id of selectedIds) {
        await supabase.from('listings').update({ status: newStatus }).eq('id', id);
      }
      toast.success(`${selectedIds.size} propiedades actualizadas`);
      setSelectedIds(new Set());
    } catch { toast.error('Error al actualizar'); }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventario de Propiedades</h1>
          <p className="text-muted-foreground">Gestiona tu inventario inmobiliario</p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
            <ToggleGroupItem value="table" aria-label="Vista tabla"><List className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="kanban" aria-label="Vista kanban"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>
          <ListingFormDialog
            trigger={<Button><PlusCircle className="h-4 w-4 mr-2" />Nueva Propiedad</Button>}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: Building2, label: 'Total', value: stats.total, iconClass: 'text-primary' },
          { icon: CheckCircle, label: 'Activas', value: stats.active, iconClass: 'text-green-500' },
          { icon: Clock, label: 'Reservadas', value: stats.reserved, iconClass: 'text-orange-500' },
          { icon: DollarSign, label: 'Valor Total', value: formatPrice(stats.totalValue), iconClass: 'text-emerald-500' },
          { icon: BarChart3, label: 'Vistas', value: stats.totalViews.toLocaleString(), iconClass: 'text-purple-500' },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-4 flex items-center gap-3">
            <s.icon className={cn('h-8 w-8', s.iconClass)} />
            <div><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></div>
          </CardContent></Card>
        ))}
      </div>

      {/* Filters + Batch Actions */}
      <Card><CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por título o ubicación..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUS_COLUMNS.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {types.map(t => <SelectItem key={t} value={t}>{getListingTypeLabel(t)}</SelectItem>)}
            </SelectContent>
          </Select>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedIds.size} seleccionados</Badge>
              <Select onValueChange={handleBatchStatusChange}>
                <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Cambiar estado" /></SelectTrigger>
                <SelectContent>
                  {STATUS_COLUMNS.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="destructive" size="sm" onClick={handleBatchDelete}><Trash2 className="h-3 w-3 mr-1" />Eliminar</Button>
            </div>
          )}
        </div>
      </CardContent></Card>

      {/* Content */}
      {filteredListings.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sin propiedades</h3>
          <p className="text-muted-foreground">{searchTerm ? 'No se encontraron propiedades' : 'Publica tu primera propiedad'}</p>
        </Card>
      ) : viewMode === 'kanban' ? (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {STATUS_COLUMNS.map(col => {
            const colListings = filteredListings.filter(l => (l.status || 'active') === col.key);
            return (
              <div key={col.key} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className={cn('h-2.5 w-2.5 rounded-full', col.dotColor)} />
                  <span className="text-sm font-semibold">{col.label}</span>
                  <Badge variant="secondary" className="text-xs ml-auto">{colListings.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {colListings.map(listing => (
                    <Card key={listing.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-3 space-y-2">
                        {listing.images?.[0] && (
                          <img src={listing.images[0]} alt="" className="w-full h-24 object-cover rounded-lg" />
                        )}
                        <p className="font-medium text-sm truncate">{listing.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{listing.location}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">{formatPrice(listing.price, listing.currency || 'CLP')}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Eye className="h-3 w-3" />{listing.views_count || 0}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" asChild>
                            <a href={`/propiedad/${listing.id}`}>Ver</a>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => handleDelete(listing.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="p-4 w-10"><input type="checkbox" className="rounded" onChange={e => {
                      setSelectedIds(e.target.checked ? new Set(filteredListings.map(l => l.id)) : new Set());
                    }} /></th>
                    <th className="text-left p-4 font-medium">Propiedad</th>
                    <th className="text-left p-4 font-medium">Estado</th>
                    <th className="text-left p-4 font-medium">Precio</th>
                    <th className="text-left p-4 font-medium">Área</th>
                    <th className="text-left p-4 font-medium">Vistas</th>
                    <th className="text-left p-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.map(listing => (
                    <tr key={listing.id} className={cn('border-b hover:bg-muted/50', selectedIds.has(listing.id) && 'bg-primary/5')}>
                      <td className="p-4"><input type="checkbox" className="rounded" checked={selectedIds.has(listing.id)} onChange={() => toggleSelect(listing.id)} /></td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                            {listing.images?.[0] ? (
                              <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{listing.title}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{listing.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4"><Badge className={getStatusColor(listing.status || 'active')}>{getStatusLabel(listing.status || 'active')}</Badge></td>
                      <td className="p-4 font-medium">{formatPrice(listing.price, listing.currency || 'CLP')}</td>
                      <td className="p-4">
                        <span>{formatArea(listing.area_m2, listing.area_ha)}</span>
                        <Badge variant="outline" className="ml-2 text-xs">{getListingTypeLabel(listing.type)}</Badge>
                      </td>
                      <td className="p-4"><span className="flex items-center gap-1 text-sm"><Eye className="h-3 w-3" />{listing.views_count || 0}</span></td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" asChild><a href={`/propiedad/${listing.id}`}><Eye className="h-4 w-4" /></a></Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(listing.id)} disabled={deleteListing.isPending}>
                            <Trash2 className="h-4 w-4" />
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
      )}
    </div>
  );
};

export default PropertyInventory;
