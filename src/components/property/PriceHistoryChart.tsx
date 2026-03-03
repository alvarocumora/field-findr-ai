import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatPrice } from '@/hooks/useListings';

interface PriceHistoryChartProps {
  listingId: string;
  currency?: string;
}

const usePriceHistory = (listingId: string) => {
  return useQuery({
    queryKey: ['price-history', listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_history')
        .select('price, currency, recorded_at')
        .eq('listing_id', listingId)
        .order('recorded_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!listingId,
  });
};

const PriceHistoryChart = ({ listingId, currency = 'CLP' }: PriceHistoryChartProps) => {
  const { data: history = [], isLoading } = usePriceHistory(listingId);

  if (isLoading || history.length <= 1) return null;

  const firstPrice = history[0]?.price || 0;
  const lastPrice = history[history.length - 1]?.price || 0;
  const priceChange = lastPrice - firstPrice;
  const pctChange = firstPrice > 0 ? ((priceChange / firstPrice) * 100).toFixed(1) : '0';

  const chartData = history.map((h) => ({
    date: new Date(h.recorded_at).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' }),
    price: Number(h.price),
  }));

  const TrendIcon = priceChange < 0 ? TrendingDown : priceChange > 0 ? TrendingUp : Minus;
  const trendColor = priceChange < 0 ? 'text-green-500' : priceChange > 0 ? 'text-red-500' : 'text-muted-foreground';

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Historial de Precios</span>
          <span className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            {pctChange}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`}
              width={55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: number) => [formatPrice(value, currency), 'Precio']}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3, fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PriceHistoryChart;

// Utility: check if price was reduced
export const usePriceReduced = (listingId: string) => {
  return useQuery({
    queryKey: ['price-reduced', listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_history')
        .select('price')
        .eq('listing_id', listingId)
        .order('recorded_at', { ascending: false })
        .limit(2);
      if (error || !data || data.length < 2) return null;
      const current = Number(data[0].price);
      const previous = Number(data[1].price);
      if (current < previous) {
        return { reduced: true, previousPrice: previous, currentPrice: current, pct: (((previous - current) / previous) * 100).toFixed(0) };
      }
      return null;
    },
    enabled: !!listingId,
  });
};
