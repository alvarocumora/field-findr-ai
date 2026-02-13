import { Badge } from '@/components/ui/badge';
import { MapPin, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLandingStats } from '@/hooks/useLandingStats';

const formatPrice = (price: number): string => {
  if (price >= 1000000000) return `${(price / 1000000000).toFixed(1)}B`;
  if (price >= 1000000) return `${Math.round(price / 1000000)}M`;
  if (price >= 1000) return `${Math.round(price / 1000)}K`;
  return price.toString();
};

const RegionCards = () => {
  const navigate = useNavigate();
  const { data: stats } = useLandingStats();
  const regions = stats?.regionData ?? [];

  if (regions.length === 0) return null;

  return (
    <section className="py-16 md:py-20">
      <div className="container px-4">
        <div className="text-center mb-10">
          <Badge variant="outline" className="border-primary/30 text-primary mb-4">
            <Sparkles className="h-3 w-3 mr-1.5" />
            Regiones Populares
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Explora por <span className="gradient-text">región</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Terrenos disponibles en las principales regiones de Chile
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto">
          {regions.slice(0, 8).map((region) => (
            <button
              key={region.region}
              onClick={() => navigate(`/explorar?region=${encodeURIComponent(region.region)}`)}
              className="group text-left p-4 md:p-5 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-semibold text-foreground truncate">
                  {region.region}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {region.count} {region.count === 1 ? 'terreno' : 'terrenos'}
              </div>
              {region.minPrice > 0 && (
                <div className="text-xs text-primary/80 mt-1">
                  Desde ${formatPrice(region.minPrice)}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RegionCards;
