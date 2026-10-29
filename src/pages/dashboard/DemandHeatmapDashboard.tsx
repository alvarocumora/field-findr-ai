import type { LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Flame, MapPin, TrendingUp, Users, Eye, DollarSign, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Treemap,
} from 'recharts';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#f59e0b',
  '#10b981',
  '#8b5cf6',
];

const DemandHeatmapDashboard = () => {
  const { user } = useAuth();

  // Leads by project (demand signal)
  const { data: leadsByProject = [] } = useQuery({
    queryKey: ['demand-leads-by-project', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('leads')
        .select('project_id, projects(name, city, region)')
        .eq('user_id', user!.id)
        .not('project_id', 'is', null);
      // Count by project
      const counts: Record<string, { name: string; city: string; region: string; count: number }> = {};
      (data || []).forEach((l) => {
        const pid = l.project_id;
        if (!counts[pid]) {
          counts[pid] = {
            name: l.projects?.name || 'Sin proyecto',
            city: l.projects?.city || '',
            region: l.projects?.region || '',
            count: 0,
          };
        }
        counts[pid].count++;
      });
      return Object.values(counts).sort((a, b) => b.count - a.count);
    },
    enabled: !!user,
  });

  // Reservations by project (conversion signal)
  const { data: reservationsByProject = [] } = useQuery({
    queryKey: ['demand-reservations-by-project', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('reservations')
        .select('lot_id, lots(project_id, projects(name, city))')
        .eq('user_id', user!.id);
      const counts: Record<string, { name: string; city: string; count: number; revenue: number }> = {};
      return Object.values(counts).sort((a, b) => b.count - a.count);
    },
    enabled: !!user,
  });

  // Leads by source
  const { data: leadsBySource = [] } = useQuery({
    queryKey: ['demand-leads-by-source', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('leads')
        .select('source')
        .eq('user_id', user!.id);
      const counts: Record<string, number> = {};
      (data || []).forEach((l) => {
        const src = l.source || 'Directo';
        counts[src] = (counts[src] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    },
    enabled: !!user,
  });

  // Leads by region (geographic demand)
  const { data: leadsByRegion = [] } = useQuery({
    queryKey: ['demand-leads-by-region', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('leads')
        .select('project_id, projects(region)')
        .eq('user_id', user!.id)
        .not('project_id', 'is', null);
      const counts: Record<string, number> = {};
      (data || []).forEach((l) => {
        const region = l.projects?.region || 'Sin región';
        counts[region] = (counts[region] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    },
    enabled: !!user,
  });

  // Leads by status (funnel)
  const { data: leadsByStatus = [] } = useQuery({
    queryKey: ['demand-leads-by-status', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('leads')
        .select('status')
        .eq('user_id', user!.id);
      const counts: Record<string, number> = {};
      (data || []).forEach((l) => {
        const st = l.status || 'new';
        counts[st] = (counts[st] || 0) + 1;
      });
      const order = ['new', 'contacted', 'interested', 'negotiating', 'converted', 'lost'];
      return order
        .filter(s => counts[s])
        .map(s => ({ name: statusLabel(s), value: counts[s] }));
    },
    enabled: !!user,
  });

  const totalLeads = useMemo(() => leadsBySource.reduce((s, x) => s + x.value, 0), [leadsBySource]);
  const topProject = leadsByProject[0];
  const topRegion = leadsByRegion[0];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Flame className="h-6 w-6 text-primary" />
          Mapa de Demanda
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Análisis de demanda basado en leads, interacciones y conversiones
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard icon={Users} label="Total Leads" value={totalLeads.toString()} color="text-primary" />
        <KPICard
          icon={TrendingUp}
          label="Proyecto Top"
          value={topProject?.name || '—'}
          subtext={topProject ? `${topProject.count} leads` : undefined}
          color="text-green-600"
        />
        <KPICard
          icon={MapPin}
          label="Región Top"
          value={topRegion?.name || '—'}
          subtext={topRegion ? `${topRegion.value} leads` : undefined}
          color="text-amber-600"
        />
        <KPICard
          icon={BarChart3}
          label="Fuentes"
          value={leadsBySource.length.toString()}
          color="text-blue-600"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Demand by Project */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Demanda por Proyecto</CardTitle>
            <CardDescription>Leads recibidos por cada proyecto</CardDescription>
          </CardHeader>
          <CardContent>
            {leadsByProject.length === 0 ? (
              <EmptyChart message="Sin datos de leads por proyecto" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={leadsByProject.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs fill-muted-foreground" />
                  <YAxis type="category" dataKey="name" width={120} className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Lead Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Embudo de Conversión</CardTitle>
            <CardDescription>Distribución de leads por etapa</CardDescription>
          </CardHeader>
          <CardContent>
            {leadsByStatus.length === 0 ? (
              <EmptyChart message="Sin datos de embudo" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={leadsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Bar dataKey="value" name="Leads" radius={[4, 4, 0, 0]}>
                    {leadsByStatus.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* By Source */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Leads por Fuente</CardTitle>
            <CardDescription>Canales de adquisición</CardDescription>
          </CardHeader>
          <CardContent>
            {leadsBySource.length === 0 ? (
              <EmptyChart message="Sin datos de fuentes" />
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={leadsBySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                      {leadsBySource.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {leadsBySource.slice(0, 6).map((s, i) => (
                    <div key={s.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-foreground">{s.name}</span>
                      </div>
                      <Badge variant="secondary">{s.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Region */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Demanda Geográfica</CardTitle>
            <CardDescription>Distribución por región</CardDescription>
          </CardHeader>
          <CardContent>
            {leadsByRegion.length === 0 ? (
              <EmptyChart message="Sin datos regionales" />
            ) : (
              <div className="space-y-3">
                {leadsByRegion.slice(0, 8).map((r, i) => {
                  const maxVal = leadsByRegion[0]?.value || 1;
                  const pct = Math.round((r.value / maxVal) * 100);
                  return (
                    <div key={r.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground font-medium">{r.name}</span>
                        <span className="text-muted-foreground">{r.value} leads</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    new: 'Nuevo',
    contacted: 'Contactado',
    interested: 'Interesado',
    negotiating: 'Negociando',
    converted: 'Convertido',
    lost: 'Perdido',
  };
  return map[s] || s;
};

const KPICard = ({ icon: Icon, label, value, subtext, color }: {
  icon: LucideIcon; label: string; value: string; subtext?: string; color: string;
}) => (
  <Card className="border-border/40">
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold text-foreground truncate">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </CardContent>
  </Card>
);

const EmptyChart = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
    <div className="text-center">
      <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
      <p>{message}</p>
    </div>
  </div>
);

export default DemandHeatmapDashboard;
