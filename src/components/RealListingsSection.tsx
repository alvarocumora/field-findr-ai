import { useState } from 'react';
import { useRealListings, RealListing } from '@/hooks/useRealListings';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, MapPin, Maximize2, Loader2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { listingCoverUrl } from '@/lib/staticMapImage';

interface RealListingsSectionProps {
  title?: string;
  subtitle?: string;
  defaultCountry?: string;
  limit?: number;
  showCountryFilter?: boolean;
  compact?: boolean;
}

const COUNTRIES = [
  { value: 'all',       label: 'Todo LATAM' },
  { value: 'Chile',     label: 'Chile' },
  { value: 'Argentina', label: 'Argentina' },
  { value: 'Colombia',  label: 'Colombia' },
  { value: 'México',    label: 'México' },
];

function formatPrice(p: number, c: string) {
  try {
    return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(p) + ' ' + c;
  } catch {
    return `${p} ${c}`;
  }
}

function ListingCard({ l, mapToken }: { l: RealListing; mapToken: string | null }) {
  const isInternal = l.source_url.startsWith('/');
  const cover = listingCoverUrl(l.image_url ? [l.image_url] : null, l.lat, l.lng, mapToken);
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    isInternal ? (
      <Link to={l.source_url} className="block">
        {children}
      </Link>
    ) : (
      <a href={l.source_url} target="_blank" rel="noopener noreferrer nofollow" className="block">
        {children}
      </a>
    );

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all">
      <Wrapper>
        <div className="aspect-video bg-muted relative overflow-hidden">
          {cover ? (
            <img
              src={cover}
              alt={l.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => ((e.currentTarget.style.display = 'none'))}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              Sin imagen
            </div>
          )}
          <Badge variant="secondary" className="absolute top-2 left-2 bg-background/90 backdrop-blur text-xs">
            {l.source_portal}
          </Badge>
          <Badge variant="secondary" className="absolute top-2 right-2 bg-background/90 backdrop-blur text-xs">
            {l.country}
          </Badge>
        </div>
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {l.title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="line-clamp-1">{l.location}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="text-base font-bold text-primary">{formatPrice(l.price, l.currency)}</div>
            {l.area_m2 ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Maximize2 className="w-3 h-3" />
                {l.area_m2.toLocaleString()} m²
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80 pt-2 border-t">
            <ExternalLink className="w-3 h-3" />
            {isInternal ? 'Ver ficha del terreno' : 'Ver en portal original'}
          </div>
        </div>
      </Wrapper>
    </Card>
  );
}

export default function RealListingsSection({
  title = 'Terrenos reales en venta ahora',
  subtitle = 'Agregado en tiempo real desde los principales portales de LATAM',
  defaultCountry = 'all',
  limit = 24,
  showCountryFilter = true,
  compact = false,
}: RealListingsSectionProps) {
  const [country, setCountry] = useState(defaultCountry);
  const { token: mapToken } = useMapboxToken();
  const { data, isLoading, isFetching, refetch, isError } = useRealListings({ country, limit });

  // Fail-silent en el landing: si no hay datos o hay error, no renderizar la sección
  // en vez de mostrar un shell vacío o un mensaje de error a los visitantes.
  if (!isLoading && (isError || !data || data.length === 0)) {
    return null;
  }


  return (
    <section className="container px-4 py-12 md:py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {showCountryFilter && (
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-44 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className={`grid gap-4 ${compact ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <>
          <div className={`grid gap-4 ${compact ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
            {data.slice(0, limit).map((l, i) => (
              <ListingCard key={`${l.id}-${i}`} l={l} mapToken={mapToken} />
            ))}

          </div>
          <p className="text-xs text-muted-foreground/70 text-center mt-6">
            Fuentes: Portalinmobiliario, Mercado Libre Inmuebles, Yapo · Información referencial agregada de portales públicos.
          </p>
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No se encontraron propiedades reales en este momento.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
            Reintentar
          </Button>
        </div>
      )}
    </section>
  );
}
