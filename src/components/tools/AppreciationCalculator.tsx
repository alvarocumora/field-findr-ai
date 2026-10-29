import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';

const REGIONS = [
  { value: 'all', label: 'Todas las regiones' },
  { value: 'Metropolitana', label: 'Metropolitana' },
  { value: 'Valparaíso', label: 'Valparaíso' },
  { value: 'Biobío', label: 'Biobío' },
  { value: 'La Araucanía', label: 'La Araucanía' },
  { value: 'Los Lagos', label: 'Los Lagos' },
];

const AppreciationCalculator = () => {
  const [region, setRegion] = useState('all');

  const { data: priceData, isLoading } = useQuery({
    queryKey: ['appreciation', region],
    queryFn: async () => {
      const query = supabase
        .from('price_history')
        .select('price, recorded_at, listing_id')
        .order('recorded_at', { ascending: true })
        .limit(500);

      const { data } = await query;
      if (!data || data.length === 0) return [];

      // Group by month
      const byMonth: Record<string, number[]> = {};
      data.forEach((d: any) => {
        const month = format(new Date(d.recorded_at), 'yyyy-MM');
        if (!byMonth[month]) byMonth[month] = [];
        byMonth[month].push(Number(d.price));
      });

      return Object.entries(byMonth)
        .map(([month, prices]) => ({
          month,
          avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        }))
        .slice(-24); // Last 24 months
    },
  });

  const appreciation = priceData && priceData.length >= 2
    ? ((priceData[priceData.length - 1].avgPrice - priceData[0].avgPrice) / priceData[0].avgPrice * 100).toFixed(1)
    : null;

  // Simple projection (linear)
  const projected = priceData && priceData.length >= 2
    ? (() => {
        const last = priceData[priceData.length - 1];
        const rate = (priceData[priceData.length - 1].avgPrice - priceData[0].avgPrice) / priceData.length;
        return [1, 2, 3, 4, 5, 6].map(i => ({
          month: `+${i}m`,
          avgPrice: Math.round(last.avgPrice + rate * i),
          projected: true,
        }));
      })()
    : [];

  const chartData = [...(priceData || []), ...projected];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Calculadora de Plusvalía
            </CardTitle>
            <CardDescription>Evolución de precios histórica y proyección estimada</CardDescription>
          </div>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">Cargando datos...</div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <AlertCircle className="h-8 w-8" />
            <p>No hay datos históricos de precios suficientes</p>
          </div>
        ) : (
          <>
            {appreciation && (
              <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Variación en el periodo</p>
                <p className={`text-2xl font-bold ${Number(appreciation) >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                  {Number(appreciation) >= 0 ? '+' : ''}{appreciation}%
                </p>
              </div>
            )}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString('es-CL')}`, 'Precio promedio']}
                    labelFormatter={(label) => `Periodo: ${label}`}
                  />
                  {priceData && priceData.length > 0 && (
                    <ReferenceLine x={priceData[priceData.length - 1].month} stroke="hsl(var(--primary))" strokeDasharray="5 5" label="Hoy" />
                  )}
                  <Line
                    type="monotone"
                    dataKey="avgPrice"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              * La proyección es estimada basada en tendencia lineal. No constituye asesoría financiera.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AppreciationCalculator;
