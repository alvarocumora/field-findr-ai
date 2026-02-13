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
import { AIMasterplanTab } from '@/components/projects/AIMasterplanTab';
import { useAuth } from '@/hooks/useAuth';
import {
  MapPin,
  ArrowLeft,
  DollarSign,
  Maximize2,
  Phone,
  Mail,
  Image as ImageIcon,
  Map,
  List,
  Navigation,
  Scale,
  Calculator,
  Brain,
  ImageOff,
  MessageCircle
} from 'lucide-react';
import { useState, useMemo } from 'react';

const formatPrice = (price: number | null) => {
  if (!price) return 'Consultar';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(price);
};

const formatArea = (area: number) => {
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(area);
};

const getPriceColor = (price: number | null, status: string) => {
  if (status === 'sold') return { bg: 'bg-gray-400', border: 'border-gray-500', text: 'text-gray-600' };
  if (status === 'reserved') return { bg: 'bg-amber-400', border: 'border-amber-500', text: 'text-amber-600' };
  if (!price) return { bg: 'bg-primary', border: 'border-primary', text: 'text-primary' };
  if (price <= 15990000) return { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-emerald-600' };
  if (price <= 17990000) return { bg: 'bg-sky-500', border: 'border-sky-600', text: 'text-sky-600' };
  if (price <= 24990000) return { bg: 'bg-stone-500', border: 'border-stone-600', text: 'text-stone-600' };
  return { bg: 'bg-slate-800', border: 'border-slate-900', text: 'text-slate-800' };
};

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
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

  // Fetch owner profile for contact info
  const { data: ownerProfile } = useQuery({
    queryKey: ['owner-profile', project?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', project!.user_id)
        .maybeSingle();
      return data;
    },
    enabled: !!project?.user_id,
  });

  // Sort lots numerically
  const sortedLots = useMemo(() => {
    return [...lots].sort((a, b) => {
      const numA = parseInt(a.lot_number) || 0;
      const numB = parseInt(b.lot_number) || 0;
      return numA - numB;
    });
  }, [lots]);

  // Dynamic stats from real lot data
  const { availableLots, soldLots, reservedLots, priceRange, areaRange } = useMemo(() => {
    const available = lots.filter(l => l.status === 'available');
    const sold = lots.filter(l => l.status === 'sold');
    const reserved = lots.filter(l => l.status === 'reserved');
    
    const prices = lots.filter(l => l.price).map(l => l.price!);
    const areas = lots.map(l => Number(l.area)).filter(a => a > 0);
    
    return {
      availableLots: available,
      soldLots: sold,
      reservedLots: reserved,
      priceRange: prices.length > 0 
        ? { min: Math.min(...prices), max: Math.max(...prices) } 
        : null,
      areaRange: areas.length > 0 
        ? { min: Math.min(...areas), max: Math.max(...areas) } 
        : null,
    };
  }, [lots]);

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
  const isOwner = !!user && project.user_id === user.id;

  // Contact handlers
  const handleCall = () => {
    const phone = ownerProfile?.phone;
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    } else {
      // Fallback to WhatsApp with project info
      const message = encodeURIComponent(`Hola, me interesa el proyecto ${project.name} en ${project.city}, ${project.region}.`);
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
  };

  const handleMessage = () => {
    const phone = ownerProfile?.phone;
    const message = encodeURIComponent(`Hola, me interesa el proyecto ${project.name} en ${project.city}, ${project.region}. ¿Podrían darme más información?`);
    if (phone) {
      // Clean phone number for WhatsApp
      const cleanPhone = phone.replace(/[^0-9+]/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    } else if (ownerProfile?.email) {
      const subject = encodeURIComponent(`Consulta sobre ${project.name}`);
      window.open(`mailto:${ownerProfile.email}?subject=${subject}&body=${message}`, '_self');
    }
  };

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
                  {isOwner && (
                    <TabsTrigger value="ai-analysis" className="gap-2">
                      <Brain className="h-4 w-4" />
                      IA Análisis
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* Interactive Map Tab - Always use LotMapView */}
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
                      queryClient.invalidateQueries({ queryKey: ['project-lots', id] });
                      queryClient.invalidateQueries({ queryKey: ['project', id] });
                    }}
                    readOnly={!isOwner}
                  />
                </TabsContent>

                {/* Lots List Tab - Numerically sorted */}
                <TabsContent value="lots" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedLots.map((lot, index) => (
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

                {/* Gallery Tab - Dynamic */}
                <TabsContent value="gallery" className="space-y-4">
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <ImageOff className="h-16 w-16 text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                      Galería no disponible
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {isOwner 
                        ? 'Aún no has subido imágenes para este proyecto. Pronto podrás agregar fotos desde aquí.'
                        : 'Este proyecto aún no tiene imágenes disponibles.'}
                    </p>
                  </div>
                </TabsContent>

                {/* AI Analysis Tab - Owner only */}
                {isOwner && (
                  <TabsContent value="ai-analysis" className="space-y-4">
                    <AIMasterplanTab
                      project={project}
                      lots={lots}
                    />
                  </TabsContent>
                )}
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Financing Calculator */}
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

              {/* Stats Card - Dynamic */}
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

                  {priceRange && (
                    <div className="pt-4 border-t border-border">
                      <div className="text-sm text-muted-foreground mb-2">Rango de precios</div>
                      <div className="text-xl font-bold text-primary">
                        {formatPrice(priceRange.min)}
                        {priceRange.min !== priceRange.max && ` - ${formatPrice(priceRange.max)}`}
                      </div>
                    </div>
                  )}

                  {areaRange && (
                    <div className="pt-4 border-t border-border">
                      <div className="text-sm text-muted-foreground mb-2">Área por lote</div>
                      <div className="text-lg font-semibold">
                        {formatArea(areaRange.min)}
                        {areaRange.min !== areaRange.max && ` - ${formatArea(areaRange.max)}`} m²
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Card - Functional */}
              <Card className="glass-strong">
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold text-lg">¿Interesado?</h3>
                  <p className="text-sm text-muted-foreground">
                    Contáctanos para agendar una visita o recibir más información.
                  </p>
                  
                  <div className="space-y-2">
                    <Button className="w-full gap-2" onClick={handleCall}>
                      <Phone className="h-4 w-4" />
                      Llamar ahora
                    </Button>
                    <Button variant="outline" className="w-full gap-2" onClick={handleMessage}>
                      <MessageCircle className="h-4 w-4" />
                      Enviar WhatsApp
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
                        <div className="text-sm font-semibold">{formatArea(Number(selectedLotData.area))} m²</div>
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
