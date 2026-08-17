import { useState } from 'react';
import { toast } from 'sonner';
import GeoEnrichmentPanel from '@/components/map/GeoEnrichmentPanel';
import InvestmentScoreWidget from '@/components/property/InvestmentScoreWidget';
import ConceptRenderGallery from '@/components/property/ConceptRenderGallery';
import TasacionTeno from '@/components/property/TasacionTeno';
import PublishedTasacionBanner from '@/components/property/PublishedTasacionBanner';
import ListingDesigner3DDialog from '@/components/property/ListingDesigner3DDialog';
import BuyerToolsPanel from '@/components/property/BuyerToolsPanel';
import { lazy, Suspense } from 'react';
const TenoCinematicHero = lazy(() => import('@/components/property/teno-hero/TenoCinematicHero'));
import { useParams, Link } from 'react-router-dom';
import PublicLayout from '@/components/layouts/PublicLayout';
import { useListing, useListings, formatPrice, formatArea, getListingTypeLabel, getLegalStatusLabel } from '@/hooks/useListings';
import PriceHistoryChart from '@/components/property/PriceHistoryChart';
import { useToggleFavorite, useFavoriteIds } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useIsAgent } from '@/hooks/useUserRole';
import ReferLeadDialog from '@/components/property/ReferLeadDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ListingCard from '@/components/listings/ListingCard';
import ImageGallery from '@/components/property/ImageGallery';
import PropertyMap from '@/components/property/PropertyMap';
import ContactForm from '@/components/property/ContactForm';
import { ShareButtons } from '@/components/social/ShareButtons';
import VisitRequestDialog from '@/components/property/VisitRequestDialog';
import { AIInvestmentCopilot } from '@/components/ai/AIInvestmentCopilot';
import { VisualScenarioViewer } from '@/components/visual-scenarios';
import { mockVisualScenarios } from '@/data/mockVisualScenarios';
import { generatePropertyPdf } from '@/lib/propertyPdfGenerator';
import { generateScenarioPdf } from '@/lib/scenarioPdfGenerator';
import { cn } from '@/lib/utils';
import { useSEO, buildPropertyJsonLd } from '@/hooks/useSEO';
import { useListingApproval } from '@/hooks/usePropertyApprovals';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { VisualScenario } from '@/types/visualScenario';
import { useMapboxToken } from '@/hooks/useMapboxToken';

import {
import { listingCoverUrl } from '@/lib/staticMapImage';
import { useStaticMapToken } from '@/hooks/useStaticMapToken';
  Heart,
  MapPin,
  Ruler,
  FileText,
  Calendar,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Droplets,
  Zap,
  Car,
  Mountain,
  Brain,
  ChevronLeft,
  MessageCircle,
  TrendingUp,
  Box,
} from 'lucide-react';

// Teno industrial project — hardcoded polygon parsed from /listings/teno-poligono.kmz
const TENO_LISTING_ID = '4f5bca9a-22df-4afd-85cb-0fbda3667a84';
const TENO_POLYGON: number[][] = [
  [-71.10207789626766, -34.83985930032581],
  [-71.10082501892941, -34.83878040549396],
  [-71.10358736183998, -34.83656170747045],
  [-71.10540485393523, -34.83805490208448],
];

const isValidUUID = (val?: string) =>
  !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const validId = isValidUUID(id) ? id! : '';
  const { data: listing, isLoading } = useListing(validId);
  const { data: allListings = [] } = useListings({ featured: true });
  const { user } = useAuth();
  const { toggle, isLoading: isFavoriteLoading } = useToggleFavorite();
  const { data: favoriteIds = [] } = useFavoriteIds();
  const [designerOpen, setDesignerOpen] = useState(false);
  const { token: mapboxToken } = useMapboxToken();

  const isFavorite = listing ? favoriteIds.includes(listing.id) : false;
  const similarListings = allListings.filter(l => l.id !== id).slice(0, 3);
  const isTeno = listing?.id === TENO_LISTING_ID;
  const mapToken = useStaticMapToken();
  // Sin fotos cargadas mostramos una portada satelital del terreno en vez de un vacío.
  const galleryImages = (() => {
    const real = (listing?.images ?? []).filter((i) => !!i && !i.includes('placeholder.svg'));
    if (real.length > 0) return real;
    const cover = listingCoverUrl([], listing?.lat, listing?.lng, mapToken);
    return cover ? [cover] : [];
  })();
  const hasPackingTag = !!listing?.tags?.some(t => t.toLowerCase().includes('packing'));
  const designerPolygon = isTeno ? TENO_POLYGON : null;
  // Permisos: visible solo si el listing está activo/aprobado, o si lo ve su dueño (cualquier estado)
  const isListingOwner = !!user && !!listing && listing.user_id === user.id;
  const isAgent = useIsAgent();
  const canReferLead = !!user && !!listing && isAgent && !isListingOwner;
  const isListingPublished = listing?.status === 'active';
  const { data: approval } = useListingApproval(isListingOwner ? listing?.id : undefined);
  const showPackingDesigner =
    (hasPackingTag || isTeno) && (isListingPublished || isListingOwner);
  // Gate para TODO contenido 3D / visual scenarios
  const canShow3D = isListingPublished || isListingOwner;
  const visualScenarios = isTeno && canShow3D ? mockVisualScenarios : [];


  const canonicalUrl = listing ? `https://ofertaterrenos.com/propiedad/${listing.id}` : undefined;

  // Unique, human-readable SEO title per lot: "Título — 5.000 m² en Ciudad, Región | CLP $..."
  const seoTitle = listing
    ? [
        listing.title,
        listing.area_m2 ? `${formatArea(listing.area_m2, listing.area_ha)} en ${listing.city || listing.location}` : (listing.city || listing.location),
        listing.region,
      ].filter(Boolean).join(' · ')
    : 'Propiedad';

  // Auto-generated OpenGraph description (≤160 chars) unique per lot
  const seoDescription = (() => {
    if (!listing) return undefined;
    if (listing.description && listing.description.trim().length >= 80) {
      const clean = listing.description.replace(/\s+/g, ' ').trim();
      return clean.length > 158 ? `${clean.slice(0, 157)}…` : clean;
    }
    const typeLabel = getListingTypeLabel(listing.type) || 'Terreno';
    const priceLabel = formatPrice(listing.price, listing.currency);
    const areaLabel = formatArea(listing.area_m2, listing.area_ha);
    const where = [listing.city, listing.region, listing.country].filter(Boolean).join(', ');
    const legal = listing.legal_status ? ` · ${getLegalStatusLabel(listing.legal_status)}` : '';
    return `${typeLabel} de ${areaLabel} en ${where}. ${priceLabel}${legal}. Ficha con mapa, fotos y contacto directo en Ofertaterrenos.`;
  })();

  const propertyJsonLd = listing ? buildPropertyJsonLd({
    id: listing.id,
    title: listing.title,
    description: seoDescription,
    price: listing.price,
    currency: listing.currency,
    location: listing.location,
    region: listing.region,
    city: listing.city,
    country: listing.country,
    area_m2: listing.area_m2,
    images: listing.images,
    lat: listing.lat,
    lng: listing.lng,
    type: listing.type,
  }) : undefined;

  const breadcrumbJsonLd = listing ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://ofertaterrenos.com/' },
      { '@type': 'ListItem', position: 2, name: 'Explorar', item: 'https://ofertaterrenos.com/explorar' },
      ...(listing.region ? [{ '@type': 'ListItem', position: 3, name: listing.region, item: `https://ofertaterrenos.com/explorar?region=${encodeURIComponent(listing.region)}` }] : []),
      { '@type': 'ListItem', position: listing.region ? 4 : 3, name: listing.title, item: canonicalUrl },
    ],
  } : undefined;

  useSEO({
    title: seoTitle,
    description: seoDescription,
    image: listing?.images?.[0] || undefined,
    url: canonicalUrl,
    canonicalUrl,
    type: 'article',
    jsonLd: propertyJsonLd && breadcrumbJsonLd ? [propertyJsonLd, breadcrumbJsonLd] : propertyJsonLd,
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container px-4 py-6 md:py-8">
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-video rounded-2xl" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!listing) {
    return (
      <PublicLayout>
        <div className="container px-4 py-12 md:py-16 text-center">
          <div className="glass rounded-2xl p-6 md:p-8 max-w-md mx-auto">
            <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
              <Mountain className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2">
              Propiedad no encontrada
            </h1>
            <p className="text-muted-foreground mb-6">
              La propiedad que buscas no existe o ha sido removida.
            </p>
            <Button asChild className="touch-target">
              <Link to="/explorar">Explorar propiedades</Link>
            </Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const legalStatus = getLegalStatusLabel(listing.legal_status);
  const utilities = listing.utilities as { water?: boolean; electricity?: string; road_access?: string } || {};

  const handleShare = () => {
    navigator.share?.({
      title: listing.title,
      url: window.location.href,
    }).catch(() => {
      navigator.clipboard.writeText(window.location.href);
    });
  };

  const handleScenarioAnalyze = (scenario: VisualScenario) => {
    toast.info('Considera este escenario en tu análisis', {
      description: `Usa el botón "Analizar con IA" del panel derecho para evaluar "${scenario.title}" sobre este terreno.`,
    });
  };

  const handleScenarioExportPdf = async (scenario: VisualScenario) => {
    try {
      toast.info('Generando PDF del escenario…');
      await generateScenarioPdf(scenario, {
        listingTitle: listing?.title,
        listingLocation: listing ? `${listing.location}, ${listing.region}` : undefined,
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        mapboxToken: mapboxToken ?? undefined,
      });
      toast.success('PDF del escenario descargado');
    } catch (e) {
      toast.error('No se pudo generar el PDF', {
        description: e instanceof Error ? e.message : 'Error desconocido',
      });
    }
  };

  return (
    <PublicLayout>
      <div className="container px-4 py-4 md:py-8">
        {/* Back Button - Mobile */}
        <div className="flex items-center gap-4 mb-4 md:hidden">
          <Button variant="ghost" size="sm" asChild className="touch-target -ml-2">
            <Link to="/explorar">
              <ChevronLeft className="h-5 w-5 mr-1" />
              Volver
            </Link>
          </Button>
        </div>

        {/* Breadcrumb - Desktop */}
        <nav className="hidden md:flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Inicio</Link>
          <span>/</span>
          <Link to="/explorar" className="hover:text-foreground transition-colors">Explorar</Link>
          <span>/</span>
          {listing.region && (
            <>
              <Link to={`/explorar?region=${listing.region}`} className="hover:text-foreground transition-colors">{listing.region}</Link>
              <span>/</span>
            </>
          )}
          {listing.city && (
            <>
              <span className="hover:text-foreground transition-colors">{listing.city}</span>
              <span>/</span>
            </>
          )}
          <span className="text-foreground truncate max-w-[200px]">{listing.title}</span>
        </nav>

        {/* Banner de estado — visible sólo al dueño cuando la propiedad no está aprobada */}
        {isListingOwner && !isListingPublished && (
          <Alert
            className={cn(
              'mb-6 border-l-4',
              listing.status === 'rejected'
                ? 'border-destructive bg-destructive/5'
                : 'border-amber-500 bg-amber-500/5'
            )}
          >
            {listing.status === 'rejected' ? (
              <AlertCircle className="h-5 w-5 text-destructive" />
            ) : (
              <Clock className="h-5 w-5 text-amber-500" />
            )}
            <AlertTitle className="font-semibold">
              {listing.status === 'rejected'
                ? 'Publicación rechazada'
                : 'En revisión'}
            </AlertTitle>
            <AlertDescription className="mt-1 text-sm">
              {listing.status === 'rejected' ? (
                <>
                  Motivo: {approval?.rejection_reason || 'No se especificó motivo.'}
                  {' · '}Edita tu propiedad para reenviarla a revisión.
                </>
              ) : (
                <>
                  Nuestro equipo está revisando tu propiedad. Sólo tú puedes verla en este momento;
                  el marketplace, mapa 3D y visualizaciones se activan al aprobarla.
                </>
              )}
            </AlertDescription>
          </Alert>
        )}



        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Hero — Teno cinematic, otherwise standard gallery */}
            {isTeno && designerPolygon ? (
              <div className="relative">
                <Suspense fallback={<Skeleton className="w-full h-[55vh] min-h-[380px] rounded-2xl" />}>
                  <TenoCinematicHero
                    polygon={designerPolygon}
                    title={listing.title}
                    areaM2={listing.area_m2}
                    canDesign={showPackingDesigner && !!user}
                    onOpenDesigner={() => setDesignerOpen(true)}
                  />
                </Suspense>
                <div
                  className={cn(
                    "absolute right-3 md:right-4 flex gap-2",
                    // Si hay CTA Diseñar (canDesign) lo dejamos debajo para no superponerse
                    showPackingDesigner && user
                      ? "top-16 md:top-20"
                      : "top-3 md:top-4"
                  )}
                  style={{ zIndex: 'var(--z-map-overlay)' }}
                >
                  <ShareButtons
                    title={listing.title}
                    description={`${listing.title} en ${listing.location}. ${formatPrice(listing.price, listing.currency)}`}
                    variant="icon"
                    className="h-10 w-10 glass hover:bg-white/30 touch-target text-white"
                  />
                  {user && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-10 w-10 glass hover:bg-white/30 touch-target",
                        isFavorite ? 'text-red-500' : 'text-white'
                      )}
                      onClick={() => toggle(listing.id)}
                      disabled={isFavoriteLoading}
                    >
                      <Heart className={cn("h-5 w-5", isFavorite && 'fill-current')} />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              /* Gallery */
              <div className="relative">
                <ImageGallery images={galleryImages} title={listing.title} />

                {/* Actions Overlay */}
                <div className="absolute top-3 md:top-4 right-3 md:right-4 flex gap-2 z-10">
                  <ShareButtons
                    title={listing.title}
                    description={`${listing.title} en ${listing.location}. ${formatPrice(listing.price, listing.currency)}`}
                    variant="icon"
                    className="h-10 w-10 glass hover:bg-white/30 touch-target text-white"
                  />
                  {user && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-10 w-10 glass hover:bg-white/30 touch-target",
                        isFavorite ? 'text-red-500' : 'text-white'
                      )}
                      onClick={() => toggle(listing.id)}
                      disabled={isFavoriteLoading}
                    >
                      <Heart className={cn("h-5 w-5", isFavorite && 'fill-current')} />
                    </Button>
                  )}
                </div>

                {/* Badges */}
                <div className="absolute top-3 md:top-4 left-3 md:left-4 flex gap-2 z-10">
                  {listing.featured && (
                    <Badge className="bg-primary text-primary-foreground shadow-lg">Destacado</Badge>
                  )}
                  <Badge variant="secondary" className="glass shadow-lg">
                    {getListingTypeLabel(listing.type)}
                  </Badge>
                </div>
              </div>
            )}

            {/* Galería de fotos secundaria para Teno */}
            {isTeno && listing.images?.length > 0 && (
              <div className="relative">
                <ImageGallery images={galleryImages} title={listing.title} />
              </div>
            )}

            {/* Title & Location */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 leading-tight">
                {listing.title}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                <span className="text-sm md:text-base">{listing.location}, {listing.region}</span>
              </div>
            </div>

            {/* Key Facts - Mobile optimized grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { icon: Ruler, label: 'Superficie', value: formatArea(listing.area_m2, listing.area_ha) },
                { icon: FileText, label: 'ROL', value: listing.rol || 'N/A' },
                { icon: Eye, label: 'Visitas', value: listing.views_count.toString() },
                { icon: Calendar, label: 'Publicado', value: new Date(listing.created_at).toLocaleDateString('es-CL') },
              ].map((item) => (
                <Card key={item.label} className="glass border-border/50">
                  <CardContent className="p-3 md:p-4 text-center">
                    <item.icon className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-1.5 md:mb-2 text-primary" />
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-semibold text-foreground text-sm md:text-base truncate">
                      {item.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Description */}
            <Card className="glass border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  {listing.description || 'Sin descripción disponible.'}
                </p>
              </CardContent>
            </Card>

            {/* Visión del Proyecto — Teno only (renders conceptuales) */}
            {isTeno && (
              <Card className="glass border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between gap-2">
                    <span>Visión del Proyecto</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ConceptRenderGallery />
                </CardContent>
              </Card>
            )}

            {/* Tasación Comercial — generada para cualquier propiedad */}
            <PublishedTasacionBanner listingId={listing?.id} />
            <TasacionTeno listing={isTeno ? undefined : listing} />

            {/* Visual Scenarios — conditional preview */}
            {visualScenarios.length > 0 && (
              <VisualScenarioViewer
                scenarios={visualScenarios}
                title="Escenarios visuales sobre este terreno"
                onAnalyze={handleScenarioAnalyze}
                onExportPdf={handleScenarioExportPdf}
              />
            )}

            {/* Diseñador 3D Industrial — visible para listings activos con tag "packing" */}
            {showPackingDesigner && (
              <Card className="glass border-border/50 border-primary/30">
                <CardContent className="p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground flex items-center gap-2">
                      <Box className="h-4 w-4 text-primary" />
                      Diseña tu packing aquí
                      {!isListingPublished && isListingOwner && (
                        <Badge variant="outline" className="text-[10px]">Vista previa (no publicado)</Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {user
                        ? 'Arrastra galpones, andenes, cámaras de frío y áreas de maniobras sobre el polígono real del terreno. Tu diseño se guarda en tu cuenta.'
                        : 'Inicia sesión para diseñar y guardar tu propio layout industrial sobre el polígono real del terreno.'}
                    </p>
                  </div>
                  {user ? (
                    <Button
                      onClick={() => setDesignerOpen(true)}
                      className="gap-2 w-full sm:w-auto flex-shrink-0"
                    >
                      <Box className="h-4 w-4" />
                      Abrir diseñador 3D
                    </Button>
                  ) : (
                    <Button
                      asChild
                      variant="outline"
                      className="gap-2 w-full sm:w-auto flex-shrink-0"
                    >
                      <Link to={`/auth?redirect=${encodeURIComponent(window.location.pathname)}`}>
                        <Box className="h-4 w-4" />
                        Iniciar sesión para diseñar
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="glass border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Servicios y Accesos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { 
                      icon: Droplets, 
                      label: 'Agua', 
                      value: utilities.water ? 'Disponible' : 'No disponible',
                      active: utilities.water,
                      color: 'green'
                    },
                    { 
                      icon: Zap, 
                      label: 'Electricidad', 
                      value: utilities.electricity || 'No disponible',
                      active: !!utilities.electricity,
                      color: 'yellow'
                    },
                    { 
                      icon: Car, 
                      label: 'Acceso', 
                      value: utilities.road_access || 'No especificado',
                      active: !!utilities.road_access,
                      color: 'blue'
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={cn(
                        "p-2.5 rounded-lg flex-shrink-0",
                        item.active ? `bg-${item.color}-500/20` : 'bg-muted'
                      )}>
                        <item.icon className={cn(
                          "h-5 w-5",
                          item.active ? `text-${item.color}-400` : 'text-muted-foreground'
                        )} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {listing.tags.length > 0 && (
              <Card className="glass border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Características</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Potencial del Terreno */}
            {(listing.zoning || listing.tags.length > 0) && (
              <Card className="glass border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Potencial del terreno
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {listing.zoning && (
                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                        <span className="text-sm text-muted-foreground">Zonificación</span>
                        <Badge variant="secondary">{listing.zoning}</Badge>
                      </div>
                    )}
                    {listing.subdivision_eligible && (
                      <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <span className="text-sm text-foreground font-medium">Subdivisible</span>
                        <Badge className="bg-primary/20 text-primary">Apto</Badge>
                      </div>
                    )}
                    {listing.area_ha && listing.area_ha >= 5 && (
                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                        <span className="text-sm text-muted-foreground">Escala</span>
                        <span className="text-sm font-medium text-foreground">Gran superficie</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ideal Para */}
            {(() => {
              const ideals: string[] = [];
              const type = listing.type?.toLowerCase() || '';
              const tags = listing.tags.map(t => t.toLowerCase());
              if (type.includes('parcela') || tags.some(t => t.includes('agrado'))) ideals.push('Parcela de agrado');
              if (type.includes('campo') || type.includes('agricola') || tags.some(t => t.includes('agrícola'))) ideals.push('Proyecto agrícola');
              if (type.includes('industrial') || tags.some(t => t.includes('industrial'))) ideals.push('Desarrollo industrial');
              if (tags.some(t => t.includes('logístic') || t.includes('logistic'))) ideals.push('Centro logístico');
              if (tags.some(t => t.includes('energétic') || t.includes('solar'))) ideals.push('Proyecto energético');
              if (listing.subdivision_eligible) ideals.push('Subdivisión y loteo');
              if (listing.area_ha && listing.area_ha >= 10) ideals.push('Inversión de largo plazo');
              if (ideals.length === 0) ideals.push('Inversión territorial', 'Desarrollo inmobiliario');
              return ideals.length > 0 ? (
                <Card className="glass border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Ideal para</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {ideals.map(i => (
                        <Badge key={i} className="bg-primary/10 text-primary border-primary/20 text-sm px-3 py-1">
                          {i}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}

            {/* Document Checklist */}
            <Card className="glass border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Checklist Documental</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 md:space-y-3">
                  {[
                    { name: 'Título de dominio', status: listing.legal_status === 'verified' ? 'verified' : 'pending' },
                    { name: 'Certificado de dominio vigente', status: listing.legal_status === 'verified' ? 'verified' : 'pending' },
                    { name: 'Plano de subdivisión', status: listing.subdivision_eligible ? 'verified' : 'pending' },
                    { name: 'Informe de tasación', status: 'pending' },
                  ].map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-foreground text-sm md:text-base">{doc.name}</span>
                      {doc.status === 'verified' ? (
                        <Badge className="bg-green-500/20 text-green-400 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verificado
                        </Badge>
                      ) : doc.status === 'reviewing' ? (
                        <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          En revisión
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Pendiente
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Price Card */}
            <Card className="glass border-border/50 sticky top-20">
              <CardContent className="p-4 md:p-6">
                <div className="mb-4 md:mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Precio</p>
                  <p className="text-2xl md:text-3xl font-bold text-primary">
                    {formatPrice(listing.price, listing.currency)}
                  </p>
                  {listing.currency === 'UF' && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ≈ {formatPrice(Math.round(listing.price * 39500), 'CLP')}
                      <span className="ml-1 text-xs opacity-70">(UF ref. $39.500)</span>
                    </p>
                  )}
                  {listing.area_m2 && listing.area_m2 > 0 && (
                    <div className="mt-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-sm font-semibold text-primary">
                        {formatPrice(Math.round(listing.price / listing.area_m2))} / m²
                      </p>
                    </div>
                  )}
                </div>

                <Badge className={cn(legalStatus.color, "mb-4 md:mb-6")}>
                  {listing.legal_status === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {legalStatus.label}
                </Badge>

                <AIInvestmentCopilot 
                  property={{
                    id: listing.id,
                    title: listing.title,
                    price: listing.price,
                    area_m2: listing.area_m2,
                    area_ha: listing.area_ha,
                    location: listing.location,
                    region: listing.region,
                    type: listing.type,
                    zoning: listing.zoning,
                    legal_status: listing.legal_status,
                    utilities: utilities as Record<string, boolean>,
                    subdivision_eligible: listing.subdivision_eligible,
                    tags: listing.tags,
                  }}
                  trigger={
                    <Button className="w-full gap-2 mb-3 h-11 touch-target">
                      <Brain className="h-4 w-4" />
                      Analizar con IA
                    </Button>
                  }
                />

                <VisitRequestDialog
                  listingId={listing.id}
                  listingOwnerId={listing.user_id}
                  listingTitle={listing.title}
                  trigger={
                    <Button variant="outline" className="w-full glass border-primary/30 text-primary hover:bg-primary/10 h-11 touch-target mb-3">
                      <Calendar className="h-4 w-4 mr-2" />
                      Agendar visita
                    </Button>
                  }
                />

                <Button 
                  variant="ghost" 
                  className="w-full glass border-border/50 h-11 touch-target"
                  onClick={() => generatePropertyPdf({
                    title: listing.title,
                    price: listing.price,
                    currency: listing.currency,
                    location: listing.location,
                    region: listing.region,
                    area_m2: listing.area_m2,
                    area_ha: listing.area_ha,
                    description: listing.description,
                    type: listing.type,
                    zoning: listing.zoning,
                    rol: listing.rol,
                    legal_status: listing.legal_status,
                    utilities: utilities as { water?: boolean; electricity?: string; road_access?: string },
                    tags: listing.tags,
                    created_at: listing.created_at,
                  })}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar ficha PDF
                </Button>

                {/* WhatsApp Button */}
                <Button 
                  variant="outline" 
                  className="w-full gap-2 h-11 touch-target border-green-500/30 text-green-600 hover:bg-green-500/10"
                  onClick={() => {
                    const message = encodeURIComponent(
                      `Hola, me interesa la propiedad "${listing.title}" en ${listing.location}, ${listing.region}. Precio: ${formatPrice(listing.price, listing.currency)}. ¿Podrían darme más información? ${window.location.href}`
                    );
                    window.open(`https://wa.me/?text=${message}`, '_blank');
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Consultar por WhatsApp
                </Button>
              </CardContent>
            </Card>

            {/* Buyer tools: financing + investment calculators (client-side) */}
            <BuyerToolsPanel
              price={listing.currency === 'UF' ? Math.round(listing.price * 39500) : listing.price}
              areaM2={listing.area_m2}
            />

            {/* Contact Form */}
            <ContactForm listingId={listing.id} listingTitle={listing.title} listingOwnerId={listing.user_id} />

            {/* Broker referral: only visible to other agents (not the owner) */}
            {canReferLead && (
              <Card className="glass border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-primary">Corredor / Corredora</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    ¿Tienes un cliente interesado en esta propiedad? Refiérelo y recibe una comisión
                    automática si se concreta la venta.
                  </p>
                  <ReferLeadDialog listingId={listing.id} listingTitle={listing.title} />
                </CardContent>
              </Card>
            )}

            {/* Property Map */}
            <Card className="glass border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 pb-4 px-4">
                <PropertyMap 
                  lat={listing.lat} 
                  lng={listing.lng} 
                  title={listing.title} 
                />
                <p className="text-sm text-muted-foreground mt-3 text-center">
                  {listing.location}, {listing.region}
                </p>
              </CardContent>
            </Card>

            {/* Investment Score */}
            <InvestmentScoreWidget
              price={listing.price}
              area_m2={listing.area_m2}
              area_ha={listing.area_ha}
              legal_status={listing.legal_status}
              utilities={utilities as { water?: boolean; electricity?: string; road_access?: string }}
              subdivision_eligible={listing.subdivision_eligible}
              zoning={listing.zoning}
              tags={listing.tags}
            />

            {/* GIS Enrichment Data */}
            <GeoEnrichmentPanel lat={listing.lat} lng={listing.lng} />

            {/* Price History */}
            <PriceHistoryChart listingId={listing.id} currency={listing.currency} />
          </div>
        </div>

        {/* Similar Properties */}
        {similarListings.length > 0 && (
          <section className="mt-12 md:mt-16">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">
              Propiedades similares
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {similarListings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}
      </div>

      {showPackingDesigner && user && (
        <ListingDesigner3DDialog
          open={designerOpen}
          onOpenChange={setDesignerOpen}
          listingId={listing.id}
          title={listing.title}
          polygon={designerPolygon}
          area_m2={listing.area_m2}
          lat={listing.lat}
          lng={listing.lng}
          price={listing.price}
        />
      )}
    </PublicLayout>
  );
};

export default PropertyDetail;
