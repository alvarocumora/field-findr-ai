import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PublicLayout from '@/components/layouts/PublicLayout';
import { useListing, useListings, formatPrice, formatArea, getListingTypeLabel, getLegalStatusLabel } from '@/hooks/useListings';
import { useToggleFavorite, useFavoriteIds } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
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
import { generatePropertyPdf } from '@/lib/propertyPdfGenerator';
import { cn } from '@/lib/utils';
import { useSEO } from '@/hooks/useSEO';
import {
  Heart,
  Share2,
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
  Phone,
} from 'lucide-react';

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: listing, isLoading } = useListing(id || '');
  const { data: allListings = [] } = useListings({ featured: true });
  const { user } = useAuth();
  const { toggle, isLoading: isFavoriteLoading } = useToggleFavorite();
  const { data: favoriteIds = [] } = useFavoriteIds();

  const isFavorite = listing ? favoriteIds.includes(listing.id) : false;
  const similarListings = allListings.filter(l => l.id !== id).slice(0, 3);

  useSEO({
    title: listing?.title || 'Propiedad',
    description: listing ? `${listing.title} en ${listing.location}, ${listing.region}. ${formatPrice(listing.price, listing.currency)}. ${formatArea(listing.area_m2, listing.area_ha)}.` : undefined,
    image: listing?.images?.[0] || undefined,
    url: window.location.href,
    type: 'article',
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

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Gallery */}
            <div className="relative">
              <ImageGallery images={listing.images} title={listing.title} />
              
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

            {/* Utilities */}
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

            {/* Contact Form */}
            <ContactForm listingId={listing.id} listingTitle={listing.title} listingOwnerId={listing.user_id} />

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
    </PublicLayout>
  );
};

export default PropertyDetail;
