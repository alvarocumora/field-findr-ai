import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PublicLayout from '@/components/layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LotReservationDialog } from '@/components/lots/LotReservationDialog';
import { TourViewer360 } from '@/components/tour/TourViewer360';
import ViewerErrorBoundary from '@/components/viewer/ViewerErrorBoundary';
import { TourMinimap } from '@/components/tour/TourMinimap';
import { TourSceneManager } from '@/components/tour/TourSceneManager';
import { TourEditor } from '@/components/tour/TourEditor';
import { useTourScenes } from '@/hooks/useTourScenes';
import { LotDetailSheet } from '@/components/lots/LotDetailSheet';
import { LotDesigner3DDialog } from '@/components/lots/LotDesigner3DDialog';
import { LotMapView } from '@/components/lots/LotMapView';
import { PlanCompareView } from '@/components/lots/PlanCompareView';
import { LegalTab } from '@/components/projects/LegalTab';
import { applyLegalOverrides } from '@/lib/projects/legalOverrides';
import { FinancingCalculator } from '@/components/projects/FinancingCalculator';
import { PublicLotQuoter } from '@/components/projects/PublicLotQuoter';
import { EnhancedLotCard } from '@/components/lots/EnhancedLotCard';
import { ProjectReviews } from '@/components/projects/ProjectReviews';
import { ShareButtons } from '@/components/social/ShareButtons';
import { ProjectBrochureTab } from '@/components/projects/ProjectBrochureTab';
import { ProjectHero } from '@/components/projects/ProjectHero';
import { FloatingQuoter } from '@/components/projects/FloatingQuoter';
import FeatureProjectButton from '@/components/projects/FeatureProjectButton';
import { SocialProofToast } from '@/components/projects/SocialProofToast';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { LotComparatorInProject } from '@/components/projects/LotComparatorInProject';
import {
  MapPin,
  ArrowLeft,
  ArrowUp,
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
  Camera,
  FileDown,
  Store,
} from 'lucide-react';
import { useBulkPublishLots } from '@/hooks/useBulkPublishLots';
import { publishableLots } from '@/lib/marketplace/lotToListing';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useSEO, buildProjectJsonLd } from '@/hooks/useSEO';
import { useReviewStats } from '@/hooks/useReviews';
import { projectSocial } from '@/lib/landing/projectSocial';
import { LandingLeadForm } from '@/pages/landing/LandingLeadForm';
import { resolveProjectInquiryLot } from '@/lib/projects/projectInquiry';

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

const isValidUUID = (val?: string) =>
  !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const validId = isValidUUID(id);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [leadOpen, setLeadOpen] = useState(false);
  const [reservationLot, setReservationLot] = useState<any | null>(null);
  const [financingLot, setFinancingLot] = useState<any | null>(null);
  const [detailLot, setDetailLot] = useState<any | null>(null);
  // The financing overlay is a custom modal: Escape closes it (and only it).
  useEffect(() => {
    if (!financingLot) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFinancingLot(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [financingLot]);

  const closeQuoter = useCallback(() => {
    setSelectedLot(null);
    setDetailLot(null);
  }, []);
  const [designerLot, setDesignerLot] = useState<any | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [editingSceneIdx, setEditingSceneIdx] = useState<number | null>(null);
  const [tourYaw, setTourYaw] = useState(0);
  const tourSectionRef = useRef<HTMLDivElement>(null);
  const scrollToTour = () => tourSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const { scenes: tourScenes, isLoading: tourScenesLoading } = useTourScenes(id);
  const [searchParamsTab] = useSearchParams();
  const tabParam = ['map','quoter','lots','info','compare','reviews','brochure','tour360'].includes(searchParamsTab.get('tab') ?? '') ? searchParamsTab.get('tab')! : 'map';
  // Tabs controlado (no defaultValue): un link a ?tab=tour360 hacia un
  // proyecto sin panorámicas dejaba el área de tabs en blanco (ningún
  // TabsTrigger calzaba con "tour360" si no es dueño) — se corrige más abajo
  // una vez que tourScenes termina de cargar, cayendo a "map".
  const [activeTab, setActiveTab] = useState(tabParam);

  // Las landings específicas pueden abrir directamente el formulario de consulta.
  // El ID del lote se resuelve contra el inventario público antes de enviarlo al CRM.
  useEffect(() => {
    if (searchParamsTab.get('consulta') === '1') setLeadOpen(true);
  }, [searchParamsTab]);
  const bulkPublish = useBulkPublishLots();

  // Links con ?tab=tour360 (landings de proyecto) esperan ver el tour de
  // inmediato: el visor real vive arriba como pieza central, la pestaña
  // de abajo ya no monta una segunda instancia — así que saltamos ahí.
  useEffect(() => {
    if (tabParam === 'tour360' && tourScenes.length > 0) scrollToTour();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam, tourScenes.length]);

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
    enabled: validId,
  });

  // Un link ?tab=tour360 hacia un proyecto sin panorámicas (y donde el
  // visitante no es el dueño) dejaba el área de tabs en blanco: ningún
  // TabsTrigger="tour360" llega a registrarse, así que el Tabs no tenía qué
  // mostrar. Resuelto tourScenes, si queda vacío se cae a "map" en vez de
  // dejar la pantalla sin contenido (gap #2 de la auditoría).
  useEffect(() => {
    if (tabParam !== 'tour360' || tourScenesLoading) return;
    const ownsProject = !!user && project?.user_id === user.id;
    if (tourScenes.length === 0 && !ownsProject) setActiveTab('map');
  }, [tabParam, tourScenesLoading, tourScenes.length, project?.user_id, user]);

  const { data: lots = [], isLoading: lotsLoading, error: lotsError } = useQuery({
    queryKey: ['project-lots', id],
    queryFn: async () => {
      // ProjectDetail is a public commercial surface. Use the same PII-free RPC
      // for every session so authenticated owners/admins and anonymous visitors
      // receive the exact same stable lot shape. Direct select('*') can fail on
      // buyer_* column grants and silently leave the cards/designer empty.
      const { data, error } = await supabase.rpc('get_public_lots', { p_project_id: id });
      if (error) throw error;
      return (data || []).sort((a: any, b: any) =>
        String(a.lot_number || '').localeCompare(String(b.lot_number || ''), undefined, { numeric: true })
      );
    },
    enabled: validId && !!project,
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
    
    const prices = available.filter(l => Number.isFinite(l.price) && l.price! > 0).map(l => l.price!);
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

  const { legalDocuments, permits, legalStatus } = applyLegalOverrides(
    project,
    (project as any)?.legal_documents || [],
    (project as any)?.permits || [],
    (project as any)?.legal_status || 'pending',
  );
  const rolNumber = (project as any)?.rol_number;

  const projectJsonLd = project ? buildProjectJsonLd({
    id: project.id,
    slug: project.slug,
    name: project.name,
    description: project.description,
    city: project.city,
    region: project.region,
    country: project.country,
    latitude: project.latitude,
    longitude: project.longitude,
    images: (project as any)?.images,
    total_lots: lotsLoading || lotsError ? null : lots.length,
    available_lots: lotsLoading || lotsError ? null : availableLots.length,
  }) : undefined;

  const social = project ? projectSocial(project, lotsLoading || lotsError ? undefined : lots) : undefined;

  useSEO({
    title: project?.name || 'Proyecto',
    description: social?.description,
    image: social?.image,
    url: social?.url,
    canonicalUrl: social?.url,
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

  // Block draft projects for non-owners
  const isDraft = project.status === 'draft';
  const isProjectOwner = !!user && project.user_id === user.id;
  if (isDraft && !isProjectOwner) {
    return (
      <PublicLayout>
        <div className="container px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Proyecto no disponible</h1>
          <p className="text-muted-foreground mb-6">Este proyecto aún no ha sido publicado.</p>
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  // selectedLotData removed - now using LotDetailSheet
  const isOwner = !!user && project.user_id === user.id;
  const publishableCount = isOwner ? publishableLots(lots as any[]).length : 0;

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
    const message = encodeURIComponent(`Hola, me interesa el proyecto ${project.name}. ${social?.url} ¿Podrían darme más información?`);
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    } else {
      setLeadOpen(true);
    }
  };

  return (
    <PublicLayout>
      <div className={`theme-rural min-h-screen bg-background ${isMobile ? 'pb-20' : ''}`}>
        {/* Breadcrumbs */}
        <div className="container px-4 pt-4 pb-2">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Inicio</Link>
            <span>/</span>
            <Link to="/explorar" className="hover:text-primary transition-colors">Explorar</Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-[200px]">{project.name}</span>
          </nav>
        </div>

        {/* Tour 360 como pieza central cuando el proyecto tiene panorámicas.
            Única instancia del visor: la pestaña "Tour 360" de abajo apunta
            aquí en vez de montar un segundo TourViewer360 (antes se veía
            duplicado al entrar con ?tab=tour360). */}
        {tourScenes.length > 0 && (
          <section ref={tourSectionRef} className="container px-4 pb-4 space-y-3 scroll-mt-20" aria-label="Tour 360 del proyecto">
            <ViewerErrorBoundary label="el tour 360" className="h-[420px]">
            <TourViewer360
              scenes={tourScenes}
              lots={lots}
              onYawChange={setTourYaw}
              onLotClick={(lotId) => {
                const lot = lots.find(l => l.id === lotId);
                if (lot) {
                  setSelectedLot(lot.id);
                  setDetailLot(lot);
                }
              }}
            />
            </ViewerErrorBoundary>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-2xl border bg-card p-4 text-center">
              <div>
                <p className="text-xl font-bold">{areaRange ? `${Math.round(areaRange.min).toLocaleString('es-CL')} m²` : '—'}</p>
                <p className="text-xs text-muted-foreground">Superficie desde</p>
              </div>
              <div>
                <p className="text-xl font-bold">{availableLots.length} de {lots.length}</p>
                <p className="text-xs text-muted-foreground">Parcelas disponibles</p>
              </div>
              <div>
                <p className="text-xl font-bold">{priceRange ? `$${priceRange.min.toLocaleString('es-CL')} CLP` : 'No informado'}</p>
                <p className="text-xs text-muted-foreground">Precio desde</p>
              </div>
              <div className="flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Toca una parcela en la imagen para ver su ficha</p>
              </div>
            </div>
          </section>
        )}

        {/* Immersive Hero */}
        <ProjectHero
          project={project}
          lots={lots}
          inventoryReady={!lotsLoading && !lotsError}
          availableLots={availableLots}
          reservedLots={reservedLots}
          soldLots={soldLots}
          priceRange={priceRange}
          areaRange={areaRange}
          isMobile={isMobile}
          onCall={handleCall}
          onMessage={handleMessage}
        />

        <div className="container px-4 py-3">
          <Button onClick={() => setLeadOpen(true)} className="min-h-11">Agendar visita o consultar</Button>
        </div>
        <Dialog open={leadOpen} onOpenChange={setLeadOpen}>
          <DialogContent>
            <DialogTitle>Consulta por {project.name}</DialogTitle>
            <LandingLeadForm
              projectId={project.id}
              projectOwnerId={project.user_id}
              projectSlug={project.slug || project.id}
              lot={resolveProjectInquiryLot(lots, searchParamsTab)}
              onSuccess={() => setLeadOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Social Proof */}
        {!isOwner && <SocialProofToast projectId={project.id} />}

        {/* Owner controls */}
        {isOwner && (
          <div className="container px-4 pb-2 flex flex-wrap items-center gap-2">
            <Link to={`/proyecto/${project.id}/experiencia`}>
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <Camera className="h-3.5 w-3.5" />
                Ver Micrositio Inmersivo
              </Button>
            </Link>
            {publishableCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
                disabled={bulkPublish.isPending}
                onClick={() => bulkPublish.mutate({ project, lots })}
              >
                <Store className="h-3.5 w-3.5" />
                {bulkPublish.isPending
                  ? 'Publicando…'
                  : `Publicar ${publishableCount} disponible${publishableCount === 1 ? '' : 's'} en marketplace`}
              </Button>
            )}
            <FeatureProjectButton
              projectId={project.id}
              projectName={project.name}
              featured={(project as any).featured}
              featuredUntil={(project as any).featured_until ?? null}
            />
          </div>
        )}

        {/* Floating Quoter */}
        {!isOwner && (
          <FloatingQuoter
            selectedLot={detailLot || (selectedLot ? lots.find(l => l.id === selectedLot) : null)}
            projectName={project.name}
            onReserve={(lot) => setReservationLot(lot)}
            onFinance={(lot) => setFinancingLot(lot)}
            onClose={closeQuoter}
          />
        )}

        {/* Main Content - Full Width */}
        <div className="container px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
              {(tourScenes.length > 0 || isOwner) && (
                <TabsTrigger value="tour360" className="gap-2">
                  <Camera className="h-4 w-4" />
                  Tour 360
                </TabsTrigger>
              )}
            </TabsList>

            {/* Map Tab */}
            <TabsContent value="map">
              <ViewerErrorBoundary label="el mapa de parcelas" className="h-[420px]"><LotMapView
                lots={lots}
                projectCenter={{
                  lat: project.latitude || -34.9767,
                  lng: project.longitude || -71.7856
                }}
                onLotClick={(lot) => {
                  setSelectedLot(lot.id);
                  setDetailLot(lot);
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
                showAdminControls={isOwner}
                onOpenCompare={
                  ((project as any).plan_images?.length > 0)
                    ? () => setShowCompare(true)
                    : undefined
                }
              /></ViewerErrorBoundary>


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
              {lotsLoading && (
                <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
                  Cargando parcelas...
                </div>
              )}
              {lotsError && !lotsLoading && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
                  No se pudo cargar el inventario de parcelas. Recarga la página o vuelve a intentar en unos segundos.
                </div>
              )}
              {!lotsLoading && !lotsError && sortedLots.length === 0 && (
                <div className="rounded-2xl border border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                  Este proyecto todavía no tiene parcelas públicas disponibles.
                </div>
              )}
              {!lotsLoading && !lotsError && sortedLots.length > 0 && (
                <div className="flex justify-end mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={async () => {
                      const { downloadProjectPriceList } = await import('@/lib/priceList/priceListPdf');
                      downloadProjectPriceList({
                        title: project.name,
                        subtitle: [project.location, project.city, project.region].filter(Boolean).join(', ') || undefined,
                        lots: sortedLots,
                      });
                    }}
                  >
                    <FileDown className="h-4 w-4" /> Lista de precios (PDF)
                  </Button>
                </div>
              )}
              {!lotsLoading && !lotsError && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedLots.map((lot, index) => (
                  <EnhancedLotCard
                    key={lot.id}
                    lot={lot as any}
                    index={index}
                    totalAvailable={availableLots.length}
                    isSelected={selectedLot === lot.id}
                    onView3D={(lot) => {
                      setSelectedLot(lot.id);
                      setDesignerLot(lot);
                    }}
                    onView={(lot) => {
                      setSelectedLot(lot.id);
                      setDetailLot(lot);
                    }}
                    onSimulateFinancing={(lot) => {
                      setSelectedLot(lot.id);
                      setFinancingLot(lot);
                    }}
                  />
                ))}
                </div>
              )}
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

            {/* Brochure Tab */}
            <TabsContent value="brochure">
              <div className="max-w-2xl">
                <ProjectBrochureTab project={project} lots={lots} />
              </div>
            </TabsContent>

            {/* Tour 360 Tab */}
            <TabsContent value="tour360">
              <div className="space-y-6">
                {/* El visor en sí vive arriba, como pieza central de la página
                    (una sola instancia de TourViewer360). Aquí solo el
                    minimapa, sincronizado con ese visor vía tourYaw. */}
                {tourScenes.length > 0 && editingSceneIdx === null && (
                  <div className="space-y-3">
                    <Button variant="outline" size="sm" onClick={scrollToTour} className="gap-2">
                      <ArrowUp className="h-4 w-4" />
                      Ver tour 360 arriba
                    </Button>
                    <div className="rounded-2xl overflow-hidden border h-[420px] lg:h-[600px]">
                      <TourMinimap
                        center={{
                          lat: project.latitude || -34.9767,
                          lng: project.longitude || -71.7856,
                        }}
                        lots={lots}
                        yaw={tourYaw}
                        onLotClick={(lotId) => {
                          const lot = lots.find(l => l.id === lotId);
                          if (lot) {
                            setSelectedLot(lot.id);
                            setDetailLot(lot);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}


                {isOwner && editingSceneIdx !== null && tourScenes[editingSceneIdx] && (
                  <div>
                    <Button variant="ghost" size="sm" className="mb-2" onClick={() => setEditingSceneIdx(null)}>
                      ← Volver al visor
                    </Button>
                    <TourEditor
                      scene={tourScenes[editingSceneIdx]}
                      allScenes={tourScenes}
                      lots={lots}
                      projectId={project.id}
                    />
                  </div>
                )}

                {isOwner && (
                  <TourSceneManager
                    projectId={project.id}
                    onPreviewScene={(idx) => setEditingSceneIdx(idx)}
                  />
                )}

                {/* Sin fotos 360: mostramos el recorrido aéreo del plano en vez de un vacío */}
                {!isOwner && tourScenes.length === 0 && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
                      <Camera className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        Este proyecto aún no tiene fotos 360°. Mientras tanto, recorre el terreno
                        desde el aire y haz clic en cada parcela para ver su ficha.
                      </p>
                    </div>
                    <div className="rounded-2xl overflow-hidden border h-[520px]">
                      <ViewerErrorBoundary label="el mapa de parcelas" className="h-[420px]"><LotMapView
                        lots={lots}
                        projectCenter={{
                          lat: project.latitude || -34.9767,
                          lng: project.longitude || -71.7856,
                        }}
                        onLotClick={(lot) => {
                          setSelectedLot(lot.id);
                          setDetailLot(lot);
                        }}
                        selectedLotId={selectedLot}
                        projectId={project.id}
                        kmzFileUrl={(project as any).kmz_file_url}
                        readOnly
                      /></ViewerErrorBoundary>
                    </div>
                  </div>
                )}

              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Financing Calculator Modal */}
        {financingLot && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`Simulador de crédito · Lote ${financingLot.lot_number}`}
            onClick={() => setFinancingLot(null)}
          >
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

        {/* Lot Detail Sheet */}
        <LotDetailSheet
          lot={detailLot}
          open={!!detailLot}
          onOpenChange={(open) => !open && setDetailLot(null)}
          projectName={project.name}
          legalDocuments={legalDocuments}
          project={project}
          canManage={isOwner}
          onReserve={(lot) => {
            setDetailLot(null);
            setReservationLot(lot);
          }}
          onDesign={(lot) => {
            setDetailLot(null);
            setDesignerLot(lot);
          }}
          onFinance={(lot) => {
            setDetailLot(null);
            setFinancingLot(lot);
          }}
        />

        {/* 3D Designer Dialog */}
        <LotDesigner3DDialog
          lot={designerLot}
          open={!!designerLot}
          onOpenChange={(open) => !open && setDesignerLot(null)}
        />
      </div>
    </PublicLayout>
  );
};

export default ProjectDetail;
