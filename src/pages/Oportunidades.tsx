import { useState, useMemo } from 'react';
import PublicLayout from '@/components/layouts/PublicLayout';
import { useListings, formatPrice, formatArea, Listing } from '@/hooks/useListings';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSEO } from '@/hooks/useSEO';
import {
  TrendingUp, MapPin, Ruler, ArrowRight, Sparkles,
  Wheat, Factory, Zap, Truck, Star,
} from 'lucide-react';

const FILTERS = [
  { key: 'all', label: 'Todas', icon: Star },
  { key: 'campo', label: 'Agrícola', icon: Wheat },
  { key: 'industrial', label: 'Industrial', icon: Factory },
  { key: 'energetico', label: 'Energético', icon: Zap },
  { key: 'logistico', label: 'Logístico', icon: Truck },
];

const OpportunityCard = ({ listing }: { listing: Listing }) => {
  const image = listing.images?.[0] || '/placeholder.svg';
  const pricePerM2 = listing.area_m2 && listing.area_m2 > 0
    ? Math.round(listing.price / listing.area_m2)
    : null;

  return (
    <Link to={`/propiedad/${listing.id}`}>
      <Card className="overflow-hidden border-border/40 hover:border-primary/40 hover:shadow-xl transition-all group h-full">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={image}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            {listing.featured && (
              <Badge className="bg-primary text-primary-foreground shadow-lg text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Oportunidad
              </Badge>
            )}
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-white font-bold text-lg leading-tight drop-shadow-lg">
              {formatPrice(listing.price, listing.currency)}
            </p>
            {pricePerM2 && (
              <p className="text-white/80 text-xs mt-0.5">
                {formatPrice(pricePerM2)} / m²
              </p>
            )}
          </div>
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {listing.title}
          </h3>
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{listing.location}, {listing.region}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <Ruler className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{formatArea(listing.area_m2, listing.area_ha)}</span>
          </div>
          {listing.tags && listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {listing.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

const Oportunidades = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const { data: listings = [], isLoading } = useListings({ featured: true });

  useSEO({
    title: 'Oportunidades de Inversión en Terrenos | Ofertaterrenos.com',
    description: 'Descubre las mejores oportunidades de inversión en terrenos, campos y parcelas de Chile. Propiedades con alto potencial de plusvalía.',
  });

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return listings;
    return listings.filter(l =>
      l.type === activeFilter ||
      l.tags?.some(t => t.toLowerCase().includes(activeFilter))
    );
  }, [listings, activeFilter]);

  return (
    <PublicLayout showFooter>
      <div className="container px-4 py-12 md:py-16">
        {/* Header */}
        <div className="max-w-2xl mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Marketplace de Oportunidades
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Oportunidades de inversión territorial
          </h1>
          <p className="text-muted-foreground text-lg">
            Terrenos seleccionados con alto potencial de desarrollo, plusvalía y ubicación estratégica.
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === f.key
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <f.icon className="h-3.5 w-3.5" />
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <TrendingUp className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Sin oportunidades en esta categoría</h3>
            <p className="text-muted-foreground mb-6">Prueba con otra categoría o explora todo el inventario.</p>
            <Button asChild>
              <Link to="/explorar">Explorar terrenos</Link>
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(listing => (
              <OpportunityCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            ¿Tienes un terreno con potencial de inversión?
          </p>
          <Button asChild size="lg">
            <Link to="/auth?role=agent">
              Publicar oportunidad
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Oportunidades;
