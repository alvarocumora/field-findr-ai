import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  MapPin, Plus, Search, Filter, Grid3X3, List, 
  Eye, Edit, Trash2, DollarSign, Ruler, Trees, Droplets
} from 'lucide-react';
import Map from './Map';
import Layout from './Layout';

interface Lot {
  id: string;
  identifier: string;
  status: 'available' | 'reserved' | 'sold';
  area_m2: number;
  price: number;
  coordinates: [number, number];
  features: string[];
}

const mockLots: Lot[] = [
  { id: '1', identifier: 'A-001', status: 'available', area_m2: 500, price: 25000000, coordinates: [-70.65, -33.44], features: ['Vista al mar', 'Servicios básicos'] },
  { id: '2', identifier: 'A-002', status: 'reserved', area_m2: 600, price: 30000000, coordinates: [-70.66, -33.45], features: ['Esquina', 'Plano'] },
  { id: '3', identifier: 'A-003', status: 'sold', area_m2: 450, price: 22500000, coordinates: [-70.67, -33.43], features: ['Cercano a acceso'] },
  { id: '4', identifier: 'B-001', status: 'available', area_m2: 800, price: 40000000, coordinates: [-70.68, -33.44], features: ['Doble frente', 'Vista panorámica'] },
  { id: '5', identifier: 'B-002', status: 'available', area_m2: 550, price: 27500000, coordinates: [-70.64, -33.45], features: ['Arbolado', 'Tranquilo'] },
];

const LotManagement = () => {
  const [lots] = useState<Lot[]>(mockLots);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [mapboxToken] = useState(''); // User needs to add their token

  const filteredLots = lots.filter(lot => {
    const matchesSearch = lot.identifier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lot.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: lots.length,
    available: lots.filter(l => l.status === 'available').length,
    reserved: lots.filter(l => l.status === 'reserved').length,
    sold: lots.filter(l => l.status === 'sold').length,
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'reserved': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'sold': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'reserved': return 'Reservado';
      case 'sold': return 'Vendido';
      default: return status;
    }
  };

  const mapMarkers = filteredLots.map(lot => ({
    id: lot.id,
    coordinates: lot.coordinates,
    title: lot.identifier,
    status: lot.status,
    price: lot.price,
  }));

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
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Lote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Lote</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Identificador</Label>
                    <Input placeholder="ej: A-001" />
                  </div>
                  <div className="space-y-2">
                    <Label>Superficie (m²)</Label>
                    <Input type="number" placeholder="500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Precio (CLP)</Label>
                    <Input type="number" placeholder="25000000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select defaultValue="available">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Disponible</SelectItem>
                        <SelectItem value="reserved">Reservado</SelectItem>
                        <SelectItem value="sold">Vendido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Características</Label>
                  <Textarea placeholder="Vista al mar, servicios básicos, etc." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
                <Button onClick={() => setShowAddDialog(false)}>Guardar Lote</Button>
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
                  <p className="text-sm text-muted-foreground">Total Lotes</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Grid3X3 className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Disponibles</p>
                  <p className="text-2xl font-bold text-green-600">{stats.available}</p>
                </div>
                <MapPin className="h-8 w-8 text-green-500/60" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 border-yellow-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reservados</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.reserved}</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500/60" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vendidos</p>
                  <p className="text-2xl font-bold text-red-600">{stats.sold}</p>
                </div>
                <DollarSign className="h-8 w-8 text-red-500/60" />
              </div>
            </CardContent>
          </Card>
        </div>

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
            
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar lote..."
                  className="pl-10 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
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
                  <Card key={lot.id} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{lot.identifier}</CardTitle>
                        <Badge className={getStatusColor(lot.status)}>
                          {getStatusLabel(lot.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Ruler className="h-4 w-4" />
                          <span>{lot.area_m2.toLocaleString()} m²</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatPrice(lot.price)}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {lot.features.slice(0, 2).map((feature, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {lot.features.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{lot.features.length - 2}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="outline" className="flex-1 gap-1">
                          <Eye className="h-3 w-3" />
                          Ver
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 gap-1">
                          <Edit className="h-3 w-3" />
                          Editar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">Lote</th>
                        <th className="text-left p-4 font-medium">Estado</th>
                        <th className="text-left p-4 font-medium">Superficie</th>
                        <th className="text-left p-4 font-medium">Precio</th>
                        <th className="text-left p-4 font-medium">Características</th>
                        <th className="text-right p-4 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredLots.map((lot) => (
                        <tr key={lot.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-medium">{lot.identifier}</td>
                          <td className="p-4">
                            <Badge className={getStatusColor(lot.status)}>
                              {getStatusLabel(lot.status)}
                            </Badge>
                          </td>
                          <td className="p-4">{lot.area_m2.toLocaleString()} m²</td>
                          <td className="p-4 text-green-600 font-medium">{formatPrice(lot.price)}</td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {lot.features.slice(0, 2).map((f, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost"><Eye className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost"><Edit className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="map" className="m-0">
            <Card className="overflow-hidden">
              {mapboxToken ? (
                <Map
                  accessToken={mapboxToken}
                  markers={mapMarkers}
                  className="h-[600px]"
                  onMarkerClick={(id) => console.log('Clicked lot:', id)}
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
                    <Button variant="outline">Configurar Mapbox</Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default LotManagement;
