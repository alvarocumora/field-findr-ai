import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PublicLayout from '@/components/layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LotReservationDialog } from '@/components/lots/LotReservationDialog';
import { LotMapView } from '@/components/lots/LotMapView';
import {
  MapPin,
  ArrowLeft,
  DollarSign,
  Maximize2,
  Phone,
  Mail,
  Check,
  X,
  Image as ImageIcon,
  Map,
  List,
  Navigation
} from 'lucide-react';
import { useState } from 'react';

// Color scheme based on price ranges
const getPriceColor = (price: number | null, status: string) => {
  if (status === 'sold') return { bg: 'bg-gray-400', border: 'border-gray-500', text: 'text-gray-600' };
  if (status === 'reserved') return { bg: 'bg-amber-400', border: 'border-amber-500', text: 'text-amber-600' };
  
  if (!price) return { bg: 'bg-primary', border: 'border-primary', text: 'text-primary' };
  
  if (price <= 15990000) return { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-emerald-600' };
  if (price <= 17990000) return { bg: 'bg-sky-500', border: 'border-sky-600', text: 'text-sky-600' };
  if (price <= 24990000) return { bg: 'bg-stone-500', border: 'border-stone-600', text: 'text-stone-600' };
  return { bg: 'bg-slate-800', border: 'border-slate-900', text: 'text-slate-800' };
};

const formatPrice = (price: number | null) => {
  if (!price) return 'Consultar';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(price);
};

const GALLERY_IMAGES = [
  '/projects/brisas-gallery-1.jpg',
  '/projects/brisas-gallery-2.jpg',
  '/projects/brisas-gallery-3.jpg',
  '/projects/brisas-gallery-4.jpg',
  '/projects/brisas-gallery-5.jpg',
];

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [reservationLot, setReservationLot] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'masterplan' | 'list'>('masterplan');

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      return data;
    },
    enabled: !!id,
  });

  const { data: lots = [], isLoading: lotsLoading } = useQuery({
    queryKey: ['project-lots', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('lots')
        .select('*')
        .eq('project_id', id)
        .order('lot_number', { ascending: true });
      return data || [];
    },
    enabled: !!id,
  });

  const availableLots = lots.filter(l => l.status === 'available');
  const soldLots = lots.filter(l => l.status === 'sold');
  const reservedLots = lots.filter(l => l.status === 'reserved');

  const priceRanges = [
    { price: 15990000, label: '$15.990.000', color: 'bg-emerald-500' },
    { price: 17990000, label: '$17.990.000', color: 'bg-sky-500' },
    { price: 24990000, label: '$24.990.000', color: 'bg-stone-500' },
    { price: 29990000, label: '$29.990.000', color: 'bg-slate-800' },
  ];

  if (projectLoading) {
    return (
      <PublicLayout>
        <div className="container px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </PublicLayout>
    );
  }

  if (!project) {
    return (
      <PublicLayout>
        <div className="container px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Proyecto no encontrado</h1>
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card/50">
          <div className="container px-4 py-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a proyectos
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{project.name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{project.city}, {project.region}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="text-primary border-primary">
                  {availableLots.length} disponibles
                </Badge>
                <Badge variant="secondary">
                  {soldLots.length} vendidos
                </Badge>
                <Badge variant="outline">
                  {lots.length} lotes totales
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="container px-4 py-6">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="masterplan" className="space-y-4">
                <TabsList className="glass">
                  <TabsTrigger value="masterplan" className="gap-2">
                    <Map className="h-4 w-4" />
                    Master Plan
                  </TabsTrigger>
                  <TabsTrigger value="interactive-map" className="gap-2">
                    <Navigation className="h-4 w-4" />
                    Mapa 3D
                  </TabsTrigger>
                  <TabsTrigger value="lots" className="gap-2">
                    <List className="h-4 w-4" />
                    Lista de Lotes
                  </TabsTrigger>
                  <TabsTrigger value="gallery" className="gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Galería
                  </TabsTrigger>
                </TabsList>

                {/* Master Plan Tab */}
                <TabsContent value="masterplan" className="space-y-4">
                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 p-4 glass rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-400 rounded" />
                      <span className="text-sm">Vendido</span>
                    </div>
                    {priceRanges.map((range) => (
                      <div key={range.price} className="flex items-center gap-2">
                        <div className={`w-4 h-4 ${range.color} rounded`} />
                        <span className="text-sm">{range.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Master Plan Image */}
                  <div className="relative glass rounded-xl overflow-hidden">
                    <img
                      src="/projects/brisas-de-caone-masterplan.jpg"
                      alt={`Master Plan - ${project.name}`}
                      className="w-full h-auto"
                    />
                  </div>
                </TabsContent>

                {/* Interactive 3D Map Tab */}
                <TabsContent value="interactive-map" className="space-y-4">
                  <LotMapView
                    lots={lots}
                    projectCenter={{
                      lat: project.latitude || -34.9767,
                      lng: project.longitude || -71.7856
                    }}
                    onLotClick={(lot) => {
                      setSelectedLot(lot.id);
                      if (lot.status !== 'sold') {
                        setReservationLot(lot);
                      }
                    }}
                    selectedLotId={selectedLot}
                    projectId={project.id}
                    kmzFileUrl={(project as any).kmz_file_url}
                    onLotsUpdated={() => {
                      // Refetch lots and project data
                      queryClient.invalidateQueries({ queryKey: ['project-lots', id] });
                      queryClient.invalidateQueries({ queryKey: ['project', id] });
                    }}
                  />
                </TabsContent>

                {/* Lots List Tab */}
                <TabsContent value="lots" className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {lots.map((lot) => {
                      const colors = getPriceColor(lot.price, lot.status || 'available');
                      const isSelected = selectedLot === lot.id;
                      
                      return (
                        <Card
                          key={lot.id}
                          className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                            isSelected ? 'ring-2 ring-primary' : ''
                          } ${lot.status === 'sold' ? 'opacity-60' : ''}`}
                          onClick={() => {
                            setSelectedLot(isSelected ? null : lot.id);
                            if (lot.status === 'available') {
                              setReservationLot(lot);
                            }
                          }}
                        >
                          <CardContent className="p-3">
                            <div className={`${colors.bg} text-white text-center py-2 rounded-lg mb-2`}>
                              <span className="font-bold text-lg">{lot.lot_number}</span>
                            </div>
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Área</span>
                                <span className="font-medium">{lot.area} m²</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Precio</span>
                                <span className={`font-bold ${colors.text}`}>
                                  {formatPrice(lot.price)}
                                </span>
                              </div>
                              <div className="pt-1">
                                {lot.status === 'sold' ? (
                                  <Badge variant="secondary" className="w-full justify-center text-xs">
                                    <X className="h-3 w-3 mr-1" />
                                    Vendido
                                  </Badge>
                                ) : lot.status === 'reserved' ? (
                                  <Badge className="w-full justify-center text-xs bg-amber-500">
                                    Reservado
                                  </Badge>
                                ) : (
                                  <Badge className="w-full justify-center text-xs bg-emerald-500">
                                    <Check className="h-3 w-3 mr-1" />
                                    Disponible
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* Gallery Tab */}
                <TabsContent value="gallery" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {GALLERY_IMAGES.map((img, idx) => (
                      <div key={idx} className="aspect-[4/3] rounded-xl overflow-hidden glass">
                        <img
                          src={img}
                          alt={`${project.name} - Imagen ${idx + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Stats Card */}
              <Card className="glass-strong">
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold text-lg">Resumen del Proyecto</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10">
                      <span className="text-sm">Disponibles</span>
                      <span className="font-bold text-emerald-500">{availableLots.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10">
                      <span className="text-sm">Reservados</span>
                      <span className="font-bold text-amber-500">{reservedLots.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <span className="text-sm">Vendidos</span>
                      <span className="font-bold text-muted-foreground">{soldLots.length}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground mb-2">Rango de precios</div>
                    <div className="text-xl font-bold text-primary">
                      $15.990.000 - $29.990.000
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground mb-2">Área por lote</div>
                    <div className="text-lg font-semibold">
                      5.000 - 12.500 m²
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Card */}
              <Card className="glass-strong">
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold text-lg">¿Interesado?</h3>
                  <p className="text-sm text-muted-foreground">
                    Contáctanos para agendar una visita o recibir más información.
                  </p>
                  
                  <div className="space-y-2">
                    <Button className="w-full gap-2">
                      <Phone className="h-4 w-4" />
                      Llamar ahora
                    </Button>
                    <Button variant="outline" className="w-full gap-2">
                      <Mail className="h-4 w-4" />
                      Enviar mensaje
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Lot Detail */}
              {selectedLot && (
                <Card className="glass-strong border-primary">
                  <CardContent className="p-4 space-y-3">
                    {(() => {
                      const lot = lots.find(l => l.id === selectedLot);
                      if (!lot) return null;
                      const colors = getPriceColor(lot.price, lot.status || 'available');
                      
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-xl">Lote {lot.lot_number}</h3>
                            <Badge className={colors.bg}>
                              {lot.status === 'sold' ? 'Vendido' : lot.status === 'reserved' ? 'Reservado' : 'Disponible'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-muted text-center">
                              <Maximize2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                              <div className="text-sm font-semibold">{lot.area} m²</div>
                              <div className="text-xs text-muted-foreground">Superficie</div>
                            </div>
                            <div className="p-3 rounded-lg bg-muted text-center">
                              <DollarSign className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                              <div className="text-sm font-semibold">{formatPrice(lot.price)}</div>
                              <div className="text-xs text-muted-foreground">Precio</div>
                            </div>
                          </div>

                          {lot.status === 'available' && (
                            <Button 
                              className="w-full mt-2"
                              onClick={() => setReservationLot(lot)}
                            >
                              Reservar este lote
                            </Button>
                          )}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Reservation Dialog */}
        <LotReservationDialog
          lot={reservationLot}
          projectName={project.name}
          open={!!reservationLot}
          onOpenChange={(open) => !open && setReservationLot(null)}
        />
      </div>
    </PublicLayout>
  );
};

export default ProjectDetail;
