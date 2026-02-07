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
import { LegalTab } from '@/components/projects/LegalTab';
import { FinancingCalculator } from '@/components/projects/FinancingCalculator';
import { EnhancedLotCard } from '@/components/lots/EnhancedLotCard';
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
  Navigation,
  Scale,
  Calculator
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
  const [financingLot, setFinancingLot] = useState<any | null>(null);

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

  // Parse legal data from project (new columns)
  const legalDocuments = (project as any)?.legal_documents || [];
  const legalStatus = (project as any)?.legal_status || 'pending';
  const rolNumber = (project as any)?.rol_number;
  const permits = (project as any)?.permits || [];

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

  const selectedLotData = lots.find(l => l.id === selectedLot);

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
              <Tabs defaultValue="interactive-map" className="space-y-4">
                <TabsList className="glass flex-wrap">
                  <TabsTrigger value="interactive-map" className="gap-2">
                    <Navigation className="h-4 w-4" />
                    Mapa Interactivo
                  </TabsTrigger>
                  <TabsTrigger value="masterplan" className="gap-2">
                    <Map className="h-4 w-4" />
                    Master Plan
                  </TabsTrigger>
                  <TabsTrigger value="lots" className="gap-2">
                    <List className="h-4 w-4" />
                    Lotes
                  </TabsTrigger>
                  <TabsTrigger value="legal" className="gap-2">
                    <Scale className="h-4 w-4" />
                    Legal
                  </TabsTrigger>
                  <TabsTrigger value="gallery" className="gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Galería
                  </TabsTrigger>
                </TabsList>

                {/* Interactive Map Tab - Uses embed if available, otherwise 3D map */}
                <TabsContent value="interactive-map" className="space-y-4">
                  {(project as any).embed_map_url ? (
                    <div className="relative glass rounded-xl overflow-hidden">
                      <iframe
                        src={(project as any).embed_map_url}
                        width="100%"
                        height="600"
                        style={{ border: 0, borderRadius: '12px' }}
                        allowFullScreen
                        title={project.name}
                        className="bg-muted"
                      />
                    </div>
                  ) : (
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
                        queryClient.invalidateQueries({ queryKey: ['project-lots', id] });
                        queryClient.invalidateQueries({ queryKey: ['project', id] });
                      }}
                    />
                  )}
                </TabsContent>

                {/* Lots List Tab - Using Enhanced Cards */}
                <TabsContent value="lots" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lots.map((lot, index) => (
                      <EnhancedLotCard
                        key={lot.id}
                        lot={lot}
                        index={index}
                        totalAvailable={availableLots.length}
                        isSelected={selectedLot === lot.id}
                        onView={(lot) => {
                          setSelectedLot(lot.id);
                          if (lot.status !== 'sold') {
                            setReservationLot(lot);
                          }
                        }}
                        onSimulateFinancing={(lot) => {
                          setSelectedLot(lot.id);
                          setFinancingLot(lot);
                        }}
                      />
                    ))}
                  </div>
                </TabsContent>

                {/* Legal Tab */}
                <TabsContent value="legal" className="space-y-4">
                  <LegalTab
                    legalDocuments={legalDocuments}
                    legalStatus={legalStatus}
                    rolNumber={rolNumber}
                    permits={permits}
                  />
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
              {/* Financing Calculator (shows when lot is selected for financing) */}
              {financingLot && (
                <FinancingCalculator
                  lotPrice={financingLot.price || 0}
                  lotNumber={financingLot.lot_number}
                  lotArea={Number(financingLot.area)}
                  projectName={project.name}
                  projectLocation={`${project.city}, ${project.region}`}
                  onClose={() => setFinancingLot(null)}
                />
              )}

              {/* Stats Card */}
              <Card className="glass-strong">
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold text-lg">Resumen del Proyecto</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10">
                      <span className="text-sm">Disponibles</span>
                      <span className="font-bold text-emerald-600">{availableLots.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10">
                      <span className="text-sm">Reservados</span>
                      <span className="font-bold text-amber-600">{reservedLots.length}</span>
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
              {selectedLotData && !financingLot && (
                <Card className="glass-strong border-primary">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xl">Lote {selectedLotData.lot_number}</h3>
                      <Badge className={getPriceColor(selectedLotData.price, selectedLotData.status || 'available').bg}>
                        {selectedLotData.status === 'sold' ? 'Vendido' : selectedLotData.status === 'reserved' ? 'Reservado' : 'Disponible'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted text-center">
                        <Maximize2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-sm font-semibold">{selectedLotData.area} m²</div>
                        <div className="text-xs text-muted-foreground">Superficie</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted text-center">
                        <DollarSign className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-sm font-semibold">{formatPrice(selectedLotData.price)}</div>
                        <div className="text-xs text-muted-foreground">Precio</div>
                      </div>
                    </div>

                    {selectedLotData.status === 'available' && (
                      <div className="space-y-2 pt-2">
                        <Button 
                          className="w-full gap-2"
                          onClick={() => setFinancingLot(selectedLotData)}
                        >
                          <Calculator className="h-4 w-4" />
                          Simular Financiamiento
                        </Button>
                        <Button 
                          variant="outline"
                          className="w-full"
                          onClick={() => setReservationLot(selectedLotData)}
                        >
                          Reservar este lote
                        </Button>
                      </div>
                    )}
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
