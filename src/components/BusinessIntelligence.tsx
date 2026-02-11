import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  DollarSign, TrendingUp, Target, Users, Building2,
  MapPin, ArrowUpRight, BarChart3
} from 'lucide-react';

const BusinessIntelligence = () => {
  const { user } = useAuth();

  const { data: biData, isLoading } = useQuery({
    queryKey: ['business-intelligence', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Sold lots revenue
      const { data: soldLots } = await supabase
        .from('lots')
        .select('price, sale_date, project_id')
        .eq('user_id', user.id)
        .eq('status', 'sold');

      const totalRevenue = soldLots?.reduce((sum, l) => sum + (l.price || 0), 0) || 0;
      const soldCount = soldLots?.length || 0;

      // Active leads
      const { count: activeLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('status', 'in', '("lost","converted")');

      // Total leads for conversion
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: convertedLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'converted');

      // Listings by region
      const { data: listings } = await supabase
        .from('listings')
        .select('region, price, type, status')
        .eq('user_id', user.id);

      // Group by region
      const regionMap: Record<string, { count: number; totalPrice: number }> = {};
      listings?.forEach(l => {
        const region = l.region || 'Sin región';
        if (!regionMap[region]) regionMap[region] = { count: 0, totalPrice: 0 };
        regionMap[region].count++;
        regionMap[region].totalPrice += l.price || 0;
      });

      const regionalData = Object.entries(regionMap)
        .map(([region, data]) => ({
          region,
          properties: data.count,
          avgPrice: data.count > 0 ? data.totalPrice / data.count : 0,
        }))
        .sort((a, b) => b.properties - a.properties)
        .slice(0, 6);

      // Group by type
      const typeMap: Record<string, number> = {};
      listings?.forEach(l => {
        typeMap[l.type] = (typeMap[l.type] || 0) + 1;
      });
      const totalListings = listings?.length || 1;
      const typeDistribution = Object.entries(typeMap)
        .map(([type, count]) => ({ type, count, pct: Math.round((count / totalListings) * 100) }))
        .sort((a, b) => b.count - a.count);

      // Reservations
      const { data: reservations } = await supabase
        .from('reservations')
        .select('reservation_amount, status')
        .in('status', ['paid', 'converted']);

      const reservationRevenue = reservations?.reduce((sum, r) => sum + (r.reservation_amount || 0), 0) || 0;

      const conversionRate = totalLeads && totalLeads > 0
        ? ((convertedLeads || 0) / totalLeads) * 100
        : 0;

      return {
        totalRevenue,
        soldCount,
        activeLeads: activeLeads || 0,
        conversionRate,
        totalListings: listings?.length || 0,
        regionalData,
        typeDistribution,
        reservationRevenue,
      };
    },
    enabled: !!user?.id,
  });

  const formatCurrency = (v: number) => {
    if (v >= 1000000000) return `$${(v / 1000000000).toFixed(1)}B`;
    if (v >= 1000000) return `$${(v / 1000000).toFixed(0)}M`;
    return `$${v.toLocaleString('es-CL')}`;
  };

  if (isLoading || !biData) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const kpis = [
    { title: 'Ingresos Totales', value: formatCurrency(biData.totalRevenue), icon: DollarSign, color: 'text-green-600' },
    { title: 'Unidades Vendidas', value: biData.soldCount.toString(), icon: Building2, color: 'text-blue-600' },
    { title: 'Leads Activos', value: biData.activeLeads.toString(), icon: Users, color: 'text-amber-600' },
    { title: 'Tasa Conversión', value: `${biData.conversionRate.toFixed(1)}%`, icon: Target, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Business Intelligence</h1>
        <p className="text-muted-foreground">Analíticas y métricas de tu negocio inmobiliario</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-lg bg-muted flex items-center justify-center`}>
                  <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Distribution by Type */}
        <Card>
          <CardHeader><CardTitle>Distribución por Tipo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {biData.typeDistribution.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sin datos de propiedades</p>
            ) : (
              biData.typeDistribution.map((t) => (
                <div key={t.type} className="flex justify-between items-center">
                  <span className="text-sm">{t.type.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={t.pct} className="w-24 h-2" />
                    <span className="text-sm font-medium w-10 text-right">{t.pct}%</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Regional Analysis */}
        <Card>
          <CardHeader><CardTitle>Análisis por Región</CardTitle></CardHeader>
          <CardContent>
            {biData.regionalData.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sin datos regionales</p>
            ) : (
              <div className="space-y-3">
                {biData.regionalData.map((r) => (
                  <div key={r.region} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{r.region}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">{r.properties} props</span>
                      <p className="text-xs text-muted-foreground">Prom: {formatCurrency(r.avgPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader><CardTitle>Resumen de Ingresos</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(biData.totalRevenue)}</p>
              <p className="text-sm text-muted-foreground">Ingresos por Ventas</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(biData.reservationRevenue)}</p>
              <p className="text-sm text-muted-foreground">Señas Recibidas</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600">{biData.totalListings}</p>
              <p className="text-sm text-muted-foreground">Propiedades en Inventario</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessIntelligence;
