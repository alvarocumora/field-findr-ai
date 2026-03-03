import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Mountain,
  Thermometer,
  Droplets,
  Sun,
  MapPin,
  School,
  Hospital,
  ShoppingCart,
  Bus,
  UtensilsCrossed,
  Landmark,
  Fuel,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useGeoEnrichment, type GeoPOI } from '@/hooks/useGeoEnrichment';

interface GeoEnrichmentPanelProps {
  lat: number | null;
  lng: number | null;
  className?: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  educacion: School,
  salud: Hospital,
  comercio: ShoppingCart,
  transporte: Bus,
  gastronomia: UtensilsCrossed,
  finanzas: Landmark,
  combustible: Fuel,
  otro: MapPin,
};

const categoryLabels: Record<string, string> = {
  educacion: 'Educación',
  salud: 'Salud',
  comercio: 'Comercio',
  transporte: 'Transporte',
  gastronomia: 'Gastronomía',
  finanzas: 'Finanzas',
  combustible: 'Combustible',
  otro: 'Otros',
};

const GeoEnrichmentPanel = ({ lat, lng, className = '' }: GeoEnrichmentPanelProps) => {
  const { data, loading, error, enrich, reset } = useGeoEnrichment();

  useEffect(() => {
    if (lat && lng) {
      enrich(lat, lng);
    } else {
      reset();
    }
  }, [lat, lng, enrich, reset]);

  if (!lat || !lng) return null;

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Error cargando datos GIS</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="mt-2"
          onClick={() => enrich(lat, lng)}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Reintentar
        </Button>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Elevation + Address */}
      <Card className="p-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Mountain className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Elevación</p>
            <p className="text-lg font-semibold">
              {data.elevation?.elevation != null
                ? `${data.elevation.elevation} m.s.n.m.`
                : 'N/D'}
            </p>
            {data.geocode?.displayName && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                <MapPin className="h-3 w-3 inline mr-1" />
                {data.geocode.displayName}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Climate */}
      {data.climate && (
        <Card className="p-3">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Clima Anual (2024)</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Temp. máx</p>
                <p className="text-sm font-medium">{data.climate.avgTempMax}°C</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Temp. mín</p>
                <p className="text-sm font-medium">{data.climate.avgTempMin}°C</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-accent-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Lluvia anual</p>
                <p className="text-sm font-medium">{data.climate.annualRainMm} mm</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Horas sol</p>
                <p className="text-sm font-medium">{data.climate.annualSunHours} h</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* POIs */}
      {data.pois && Object.keys(data.pois).length > 0 && (
        <Card className="p-3">
          <p className="text-xs text-muted-foreground mb-2 font-medium">
            Servicios Cercanos (2 km)
          </p>
          <div className="space-y-2">
            {Object.entries(data.pois).map(([category, pois]) => {
              const Icon = categoryIcons[category] || MapPin;
              const label = categoryLabels[category] || category;
              return (
                <div key={category}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">{label}</span>
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      {(pois as GeoPOI[]).length}
                    </Badge>
                  </div>
                  <div className="pl-5 space-y-0.5">
                    {(pois as GeoPOI[]).slice(0, 3).map((poi, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-muted-foreground truncate max-w-[180px]">
                          {poi.name}
                        </span>
                        <span className="text-foreground font-medium shrink-0">
                          {poi.distance >= 1000
                            ? `${(poi.distance / 1000).toFixed(1)} km`
                            : `${poi.distance} m`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default GeoEnrichmentPanel;
