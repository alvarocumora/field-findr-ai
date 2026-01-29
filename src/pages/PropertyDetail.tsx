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
import { AIInvestmentCopilot } from '@/components/ai/AIInvestmentCopilot';
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
  ArrowLeft,
  Brain
} from 'lucide-react';

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: listing, isLoading } = useListing(id || '');
  const { data: allListings = [] } = useListings({ featured: true });
  const { user } = useAuth();
  const { toggle, isLoading: isFavoriteLoading } = useToggleFavorite();
  const { data: favoriteIds = [] } = useFavoriteIds();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isFavorite = listing ? favoriteIds.includes(listing.id) : false;
  const similarListings = allListings.filter(l => l.id !== id).slice(0, 3);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
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
        <div className="container px-4 py-16 text-center">
          <div className="glass rounded-2xl p-8 max-w-md mx-auto">
            <Mountain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Propiedad no encontrada
            </h1>
            <p className="text-muted-foreground mb-6">
              La propiedad que buscas no existe o ha sido removida.
            </p>
            <Button asChild>
              <Link to="/explorar">Explorar propiedades</Link>
            </Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const legalStatus = getLegalStatusLabel(listing.legal_status);
  const utilities = listing.utilities as { water?: boolean; electricity?: string; road_access?: string } || {};

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === listing.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? listing.images.length - 1 : prev - 1
    );
  };

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
      <div className="container px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Inicio</Link>
          <span>/</span>
          <Link to="/explorar" className="hover:text-foreground transition-colors">Explorar</Link>
          <span>/</span>
          <span className="text-foreground">{listing.title}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <div className="relative">
              <ImageGallery images={listing.images} title={listing.title} />
              
              {/* Actions Overlay - positioned over gallery */}
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="glass hover:bg-white/20"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5 text-white" />
                </Button>
                {user && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`glass hover:bg-white/20 ${isFavorite ? 'text-red-500' : 'text-white'}`}
                    onClick={() => toggle(listing.id)}
                    disabled={isFavoriteLoading}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                )}
              </div>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2 z-10">
                {listing.featured && (
                  <Badge className="bg-primary text-primary-foreground">Destacado</Badge>
                )}
                <Badge variant="secondary" className="glass">
                  {getListingTypeLabel(listing.type)}
                </Badge>
              </div>
            </div>

            {/* Title & Location */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {listing.title}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span>{listing.location}, {listing.region}</span>
              </div>
            </div>

            {/* Key Facts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass border-white/10">
                <CardContent className="p-4 text-center">
                  <Ruler className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Superficie</p>
                  <p className="font-semibold text-foreground">
                    {formatArea(listing.area_m2, listing.area_ha)}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass border-white/10">
                <CardContent className="p-4 text-center">
                  <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">ROL</p>
                  <p className="font-semibold text-foreground">
                    {listing.rol || 'N/A'}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass border-white/10">
                <CardContent className="p-4 text-center">
                  <Eye className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Visitas</p>
                  <p className="font-semibold text-foreground">
                    {listing.views_count}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass border-white/10">
                <CardContent className="p-4 text-center">
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Publicado</p>
                  <p className="font-semibold text-foreground">
                    {new Date(listing.created_at).toLocaleDateString('es-CL')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {listing.description || 'Sin descripción disponible.'}
                </p>
              </CardContent>
            </Card>

            {/* Utilities */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle>Servicios y Accesos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${utilities.water ? 'bg-green-500/20' : 'bg-muted'}`}>
                      <Droplets className={`h-5 w-5 ${utilities.water ? 'text-green-400' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Agua</p>
                      <p className="text-xs text-muted-foreground">
                        {utilities.water ? 'Disponible' : 'No disponible'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${utilities.electricity ? 'bg-yellow-500/20' : 'bg-muted'}`}>
                      <Zap className={`h-5 w-5 ${utilities.electricity ? 'text-yellow-400' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Electricidad</p>
                      <p className="text-xs text-muted-foreground">
                        {utilities.electricity || 'No disponible'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${utilities.road_access ? 'bg-blue-500/20' : 'bg-muted'}`}>
                      <Car className={`h-5 w-5 ${utilities.road_access ? 'text-blue-400' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Acceso</p>
                      <p className="text-xs text-muted-foreground">
                        {utilities.road_access || 'No especificado'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {listing.tags.length > 0 && (
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle>Características</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Document Checklist */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle>Checklist Documental</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Título de dominio', status: listing.legal_status === 'verified' ? 'verified' : 'pending' },
                    { name: 'Certificado de dominio vigente', status: listing.legal_status === 'verified' ? 'verified' : 'pending' },
                    { name: 'Plano de subdivisión', status: listing.subdivision_eligible ? 'verified' : 'pending' },
                    { name: 'Informe de tasación', status: 'pending' },
                  ].map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-foreground">{doc.name}</span>
                      {doc.status === 'verified' ? (
                        <Badge className="bg-green-500/20 text-green-400">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verificado
                        </Badge>
                      ) : doc.status === 'reviewing' ? (
                        <Badge className="bg-blue-500/20 text-blue-400">
                          <Clock className="h-3 w-3 mr-1" />
                          En revisión
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-400">
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
          <div className="space-y-6">
            {/* Price Card */}
            <Card className="glass border-white/10">
              <CardContent className="p-6">
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Precio</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatPrice(listing.price, listing.currency)}
                  </p>
                  {listing.area_m2 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatPrice(listing.price / listing.area_m2)} / m²
                    </p>
                  )}
                </div>

                <Badge className={`${legalStatus.color} mb-6`}>
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
                    <Button className="w-full gap-2 mb-3">
                      <Brain className="h-4 w-4" />
                      Analizar con IA
                    </Button>
                  }
                />

                <Button variant="ghost" className="w-full glass border-white/10">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar ficha PDF
                </Button>
              </CardContent>
            </Card>

            {/* Contact Form */}
            <ContactForm listingId={listing.id} listingTitle={listing.title} />

            {/* Property Map */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
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
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Propiedades similares
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
