import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteListing, formatPrice, formatArea, getListingTypeLabel } from '@/hooks/useListings';
import { ListingFormDialog } from '@/components/listings/ListingFormDialog';
import { 
  Building2, MapPin, Eye, Trash2, PlusCircle, 
  CheckCircle, Clock, BarChart3, Search, DollarSign,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const PropertyInventory = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const deleteListing = useDeleteListing();

  // Query user's own listings (all statuses)
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['my-listings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      active: 'Disponible',
      reserved: 'Reservado',
      sold: 'Vendido',
      inactive: 'Inactivo',
      pending: 'En Proceso',
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-green-500/10 text-green-600 border-green-500/20',
      reserved: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      sold: 'bg-muted text-muted-foreground',
      inactive: 'bg-muted text-muted-foreground',
      pending: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    };
    return map[status] || 'bg-muted text-muted-foreground';
  };

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
    sold: listings.filter(l => l.status === 'sold').length,
    totalValue: listings.reduce((sum, l) => sum + (l.price || 0), 0),
    totalViews: listings.reduce((sum, l) => sum + (l.views_count || 0), 0),
  };

  const types = [...new Set(listings.map(l => l.type))];

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta propiedad?')) {
      deleteListing.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
        <ListingFormDialog
          trigger={
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Nueva Propiedad
            </Button>
          }
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.total}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <div><p className="text-sm text-muted-foreground">Activas</p><p className="text-2xl font-bold">{stats.active}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Clock className="h-8 w-8 text-amber-500" />
          <div><p className="text-sm text-muted-foreground">Vendidas</p><p className="text-2xl font-bold">{stats.sold}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-emerald-500" />
          <div><p className="text-sm text-muted-foreground">Valor Total</p><p className="text-xl font-bold">{formatPrice(stats.totalValue)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-purple-500" />
          <div><p className="text-sm text-muted-foreground">Vistas</p><p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p></div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card><CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por título o ubicación..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Disponible</SelectItem>
              <SelectItem value="reserved">Reservado</SelectItem>
              <SelectItem value="sold">Vendido</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {types.map(t => <SelectItem key={t} value={t}>{getListingTypeLabel(t)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      {/* Listings Table */}
      {filteredListings.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sin propiedades</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'No se encontraron propiedades' : 'Publica tu primera propiedad'}
          </p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Propiedad</th>
                    <th className="text-left p-4 font-medium">Estado</th>
                    <th className="text-left p-4 font-medium">Precio</th>
                    <th className="text-left p-4 font-medium">Área</th>
                    <th className="text-left p-4 font-medium">Vistas</th>
                    <th className="text-left p-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.map((listing) => (
                    <tr key={listing.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{listing.title}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />{listing.location}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(listing.status || 'active')}>
                          {getStatusLabel(listing.status || 'active')}
                        </Badge>
                      </td>
                      <td className="p-4 font-medium">{formatPrice(listing.price, listing.currency || 'CLP')}</td>
                      <td className="p-4">
                        <span>{formatArea(listing.area_m2, listing.area_ha)}</span>
                        <Badge variant="outline" className="ml-2 text-xs">{getListingTypeLabel(listing.type)}</Badge>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 text-sm">
                          <Eye className="h-3 w-3" />{listing.views_count || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`/propiedad/${listing.id}`}><Eye className="h-4 w-4" /></a>
                          </Button>
                          <Button 
                            variant="ghost" size="sm" 
                            className="text-destructive" 
                            onClick={() => handleDelete(listing.id)}
                            disabled={deleteListing.isPending}
                          >
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
