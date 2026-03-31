import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const PriceAlertCard = () => {
  const { data: priceDrops, isLoading } = useQuery({
    queryKey: ['price-drops-7d'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentHistory } = await supabase
        .from('price_history')
        .select('listing_id, price, recorded_at')
        .gte('recorded_at', sevenDaysAgo.toISOString())
        .order('recorded_at', { ascending: true });

      if (!recentHistory || recentHistory.length === 0) return [];

      // Group by listing and find drops
      const grouped: Record<string, { prices: number[]; listingId: string }> = {};
      recentHistory.forEach((h) => {
        if (!grouped[h.listing_id]) grouped[h.listing_id] = { prices: [], listingId: h.listing_id };
        grouped[h.listing_id].prices.push(h.price);
      });

      const drops = Object.values(grouped)
        .filter((g) => g.prices.length >= 2 && g.prices[g.prices.length - 1] < g.prices[0])
        .map((g) => ({
          listingId: g.listingId,
          oldPrice: g.prices[0],
          newPrice: g.prices[g.prices.length - 1],
          drop: Math.round(((g.prices[0] - g.prices[g.prices.length - 1]) / g.prices[0]) * 100),
        }))
        .sort((a, b) => b.drop - a.drop)
        .slice(0, 3);

      if (drops.length === 0) return [];

      // Fetch listing details
      const { data: listings } = await supabase
        .from('listings')
        .select('id, title, location')
        .in('id', drops.map((d) => d.listingId));

      return drops.map((d) => ({
        ...d,
        listing: listings?.find((l) => l.id === d.listingId),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !priceDrops || priceDrops.length === 0) return null;

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-destructive" />
          Precios Reducidos esta Semana
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {priceDrops.map((drop) => (
          <Link key={drop.listingId} to={`/propiedad/${drop.listingId}`}>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/40 hover:border-primary/30 transition-colors cursor-pointer">
              <div className="min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                  {drop.listing?.title || 'Propiedad'}
                </p>
                <p className="text-xs text-muted-foreground">{drop.listing?.location}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="destructive" className="text-[10px]">
                  -{drop.drop}%
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};

export default PriceAlertCard;
