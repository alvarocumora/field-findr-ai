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
import { PlanCompareView } from '@/components/lots/PlanCompareView';
import { LegalTab } from '@/components/projects/LegalTab';
import { FinancingCalculator } from '@/components/projects/FinancingCalculator';
import { PublicLotQuoter } from '@/components/projects/PublicLotQuoter';
import { EnhancedLotCard } from '@/components/lots/EnhancedLotCard';
import { ProjectReviews } from '@/components/projects/ProjectReviews';
import { ShareButtons } from '@/components/social/ShareButtons';
import { ProjectBrochureTab } from '@/components/projects/ProjectBrochureTab';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { LotComparatorInProject } from '@/components/projects/LotComparatorInProject';
import {
  MapPin,
  ArrowLeft,
  DollarSign,
  Maximize2,
  Phone,
  Map,
  List,
  Calculator,
  ImageOff,
  MessageCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  Star,
  Scale,
  FileText,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useSEO, buildProjectJsonLd } from '@/hooks/useSEO';
import { useReviewStats } from '@/hooks/useReviews';

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

// Gallery component
const ProjectGallery = ({ images, isOwner }: { images: string[]; isOwner: boolean }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ImageOff className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-semibold text-muted-foreground mb-1">Galería</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {isOwner
                ? 'Aún no has subido imágenes. Edita el proyecto para agregar fotos.'
                : 'No hay imágenes disponibles para este proyecto.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <h3 className="text-base font-semibold mb-3">Galería ({images.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className="aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
              >
                <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={lightboxIndex !== null} onOpenChange={() => setLightboxIndex(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          {lightboxIndex !== null && (
            <div className="relative">
              <img
                src={images[lightboxIndex]}
                alt={`Foto ${lightboxIndex + 1}`}
                className="w-full max-h-[80vh] object-contain"
              />
              <button
                onClick={() => setLightboxIndex(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X className="h-5 w-5" />
              </button>
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setLightboxIndex((lightboxIndex + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/80 text-sm">
                {lightboxIndex + 1} / {images.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [reservationLot, setReservationLot] = useState<any | null>(null);
  const [financingLot, setFinancingLot] = useState<any | null>(null);
  const [showCompare, setShowCompare] = useState(false);

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

  const sortedLots = useMemo(() => {
    return [...lots].sort((a, b) => {
      const numA = parseInt(a.lot_number) || 0;
      const numB = parseInt(b.lot_number) || 0;
      return numA - numB;
    });
  }, [lots]);

  const { availableLots, soldLots, reservedLots, priceRange, areaRange } = useMemo(() => {
    const available = lots.filter(l => l.status === 'available');
    const sold = lots.filter(l => l.status === 'sold');
    const reserved = lots.filter(l => l.status === 'reserved');
    
    const prices = lots.filter(l => l.price).map(l => l.price!);
    const areas = lots.map(l => Number(l.area)).filter(a => a > 0);
    
    // Filter outlier areas using median-based approach
    let reasonableAreas = areas;
    if (areas.length > 2) {
      const sortedAreas = [...areas].sort((a, b) => a - b);
      const median = sortedAreas[Math.floor(sortedAreas.length / 2)];
      reasonableAreas = areas.filter(a => a >= median * 0.05 && a <= median * 10);
    }
    
    return {
      availableLots: available,
      soldLots: sold,
      reservedLots: reserved,
      priceRange: prices.length > 0 
        ? { min: Math.min(...prices), max: Math.max(...prices) } 
        : null,
      areaRange: reasonableAreas.length > 0 
        ? { min: Math.min(...reasonableAreas), max: Math.max(...reasonableAreas) } 
        : null,
    };
  }, [lots]);

  const legalDocuments = (project as any)?.legal_documents || [];
  const legalStatus = (project as any)?.legal_status || 'pending';
  const rolNumber = (project as any)?.rol_number;
  const permits = (project as any)?.permits || [];

  const projectJsonLd = project ? buildProjectJsonLd({
    id: project.id,
    name: project.name,
    description: project.description,
    city: project.city,
    region: project.region,
    country: project.country,
    latitude: project.latitude,
    longitude: project.longitude,
    images: (project as any)?.images,
    total_lots: project.total_lots,
    available_lots: project.available_lots,
  }) : undefined;

  useSEO({
    title: project?.name || 'Proyecto',
    description: project ? `${project.name} en ${project.city}, ${project.region}. ${lots.length} lotes disponibles.` : undefined,
    image: (project as any)?.images?.[0] || undefined,
    url: window.location.href,
    canonicalUrl: project ? `https://ofertaterrenos.com/proyecto/${project.id}` : undefined,
    jsonLd: projectJsonLd,
  });

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

  const handleCall = () => {
    const phone = ownerProfile?.phone;
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    } else {
      const message = encodeURIComponent(`Hola, me interesa el proyecto ${project.name} en ${project.city}, ${project.region}.`);
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
  };

  const handleMessage = () => {
    const phone = ownerProfile?.phone;
    const message = encodeURIComponent(`Hola, me interesa el proyecto ${project.name} en ${project.city}, ${project.region}. ¿Podrían darme más información?`);
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9+]/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    } else if (ownerProfile?.email) {
      const subject = encodeURIComponent(`Consulta sobre ${project.name}`);
      window.open(`mailto:${ownerProfile.email}?subject=${subject}&body=${message}`, '_self');
    }
  };

  return (
    <PublicLayout>
      <div className={`min-h-screen bg-background ${isMobile ? 'pb-20' : ''}`}>
        {/* Header */}
        <div className="border-b border-border bg-card/50">
          <div className="container px-4 py-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
            
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">{project.name}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{project.city}, {project.region}</span>
                  </div>
                </div>
                {/* Inline contact + share buttons - desktop */}
                {!isMobile && (
                  <div className="flex gap-2 shrink-0">
                    <ShareButtons 
                      title={project.name} 
                      description={`Proyecto de loteo en ${project.city}, ${project.region}. ${availableLots.length} lotes disponibles.`}
                    />
                    <Button size="sm" className="gap-2" onClick={handleCall}>
                      <Phone className="h-4 w-4" />
                      Llamar
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2" onClick={handleMessage}>
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                  </div>
                )}
              </div>

              {/* Horizontal Stats Bar */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                  {availableLots.length} disponibles
                </Badge>
                {reservedLots.length > 0 && (
                  <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/10">
                    {reservedLots.length} reservados
                  </Badge>
                )}
                <Badge variant="secondary">
                  {soldLots.length} vendidos
                </Badge>
                
                {priceRange && (
                  <>
                    <span className="text-muted-foreground hidden sm:inline">·</span>
                    <span className="text-foreground font-medium">
                      Desde {formatPrice(priceRange.min)}
                      {priceRange.min !== priceRange.max && ` — ${formatPrice(priceRange.max)}`}
                    </span>
                  </>
                )}
                
                {areaRange && (
                  <>
                    <span className="text-muted-foreground hidden sm:inline">·</span>
                    <span className="text-muted-foreground">
                      {formatArea(areaRange.min)}
                      {areaRange.min !== areaRange.max && ` — ${formatArea(areaRange.max)}`} m²
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Full Width */}
        <div className="container px-4 py-6">
          <Tabs defaultValue="map" className="space-y-4">
            <TabsList className="glass">
              <TabsTrigger value="map" className="gap-2">
                <Map className="h-4 w-4" />
                Mapa
              </TabsTrigger>
              <TabsTrigger value="quoter" className="gap-2">
                <Calculator className="h-4 w-4" />
                Cotizador
              </TabsTrigger>
              <TabsTrigger value="lots" className="gap-2">
                <List className="h-4 w-4" />
                Lotes ({lots.length})
              </TabsTrigger>
              <TabsTrigger value="info" className="gap-2">
                <Info className="h-4 w-4" />
                Info
              </TabsTrigger>
              <TabsTrigger value="compare" className="gap-2">
                <Scale className="h-4 w-4" />
                Comparar
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-2">
                <Star className="h-4 w-4" />
                Reseñas
              </TabsTrigger>
              <TabsTrigger value="brochure" className="gap-2">
                <FileText className="h-4 w-4" />
                Brochure
              </TabsTrigger>
            </TabsList>

            {/* Map Tab */}
            <TabsContent value="map">
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
                planImages={(project as any).plan_images || []}
                onLotsUpdated={() => {
                  queryClient.invalidateQueries({ queryKey: ['project-lots', id] });
                  queryClient.invalidateQueries({ queryKey: ['project', id] });
                }}
                readOnly={!isOwner}
                onOpenCompare={
                  ((project as any).plan_images?.length > 0)
                    ? () => setShowCompare(true)
                    : undefined
                }
              />

              {/* Compare dialog */}
              <Dialog open={showCompare} onOpenChange={setShowCompare}>
                <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto p-4">
                  <h2 className="text-lg font-semibold mb-2">Comparación: Polígonos KMZ vs Plano Oficial</h2>
                  <PlanCompareView
                    lots={lots}
                    projectCenter={{
                      lat: project.latitude || -34.9767,
                      lng: project.longitude || -71.7856
                    }}
                    planImages={
                      ((project as any).plan_images || []).map((url: string, idx: number) => ({
                        label: `Lámina ${idx + 1}`,
                        url,
                      }))
                    }
                  />
                </DialogContent>
              </Dialog>
              
              {/* Selected Lot Quick View under map */}
              {selectedLotData && (
                <Card className="mt-4 border-primary/30">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-bold text-lg">Lote {selectedLotData.lot_number}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Maximize2 className="h-3.5 w-3.5" />
                              {formatArea(Number(selectedLotData.area))} m²
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5" />
                              {formatPrice(selectedLotData.price)}
                            </span>
                          </div>
                        </div>
                        <Badge className={
                          selectedLotData.status === 'sold' ? 'bg-gray-400' : 
                          selectedLotData.status === 'reserved' ? 'bg-amber-500' : 'bg-emerald-500'
                        }>
                          {selectedLotData.status === 'sold' ? 'Vendido' : selectedLotData.status === 'reserved' ? 'Reservado' : 'Disponible'}
                        </Badge>
                      </div>
                      
                      {selectedLotData.status === 'available' && (
                        <div className="flex gap-2">
                          <Button size="sm" className="gap-1" onClick={() => setFinancingLot(selectedLotData)}>
                            <Calculator className="h-3.5 w-3.5" />
                            Simular
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setReservationLot(selectedLotData)}>
                            Reservar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Cotizador Tab */}
            <TabsContent value="quoter">
              <PublicLotQuoter
                lots={lots}
                projectName={project.name}
                projectId={project.id}
                projectOwnerId={project.user_id}
                projectLocation={`${project.city}, ${project.region}`}
              />
            </TabsContent>

            {/* Lots Tab */}
            <TabsContent value="lots">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

            {/* Info Tab - Legal + Gallery combined */}
            <TabsContent value="info">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Legal Section */}
                <div>
                  <LegalTab
                    legalDocuments={legalDocuments}
                    legalStatus={legalStatus}
                    rolNumber={rolNumber}
                    permits={permits}
                  />
                </div>

                {/* Gallery Section */}
                <div>
                  <ProjectGallery images={(project as any).images || []} isOwner={isOwner} />
                </div>
              </div>
            </TabsContent>

            {/* Compare Tab */}
            <TabsContent value="compare">
              <LotComparatorInProject lots={lots} />
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              <div className="max-w-2xl">
                <ProjectReviews projectId={project.id} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Financing Calculator Modal */}
        {financingLot && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setFinancingLot(null)}>
            <div className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
              <FinancingCalculator
                lotPrice={financingLot.price || 0}
                lotNumber={financingLot.lot_number}
                lotArea={Number(financingLot.area)}
                projectName={project.name}
                projectLocation={`${project.city}, ${project.region}`}
                onClose={() => setFinancingLot(null)}
              />
            </div>
          </div>
        )}

        {/* Sticky Contact Bar - Mobile */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border p-3 flex gap-2">
            <Button className="flex-1 gap-2" onClick={handleCall}>
              <Phone className="h-4 w-4" />
              Llamar
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={handleMessage}>
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          </div>
        )}

        {/* Desktop floating contact removed - now inline in header */}

        {/* Reservation Dialog */}
        <LotReservationDialog
          lot={reservationLot}
          projectName={project.name}
          open={!!reservationLot}
          onOpenChange={(open) => !open && setReservationLot(null)}
          reservationAmount={(project as any).reservation_deposit || 500000}
        />
      </div>
    </PublicLayout>
  );
};

export default ProjectDetail;
