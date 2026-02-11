import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLeads, LEAD_STATUS_CONFIG, LeadStatus } from '@/hooks/useLeads';
import { 
  DollarSign, TrendingUp, Target, Users, Calendar,
  CheckCircle, Clock, ArrowRight, Handshake, Search, Loader2
} from 'lucide-react';

const SalesManagement = () => {
  const { user } = useAuth();
  const { leads, stats: leadStats, isLoading: leadsLoading } = useLeads();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch reservations for the user's lots
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ['my-reservations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('reservations')
        .select('*, lots(lot_number, name, price, project_id, projects(name))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch sold lots for revenue
  const { data: soldLots = [], isLoading: lotsLoading } = useQuery({
    queryKey: ['my-sold-lots', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('lots')
        .select('price, sale_date, lot_number, name')
        .eq('user_id', user.id)
        .eq('status', 'sold');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const isLoading = leadsLoading || reservationsLoading || lotsLoading;

  // Pipeline stages from real lead data
  const pipelineStages = [
    { name: 'Nuevo', key: 'new', color: 'bg-blue-500/10 text-blue-600' },
    { name: 'Contactado', key: 'contacted', color: 'bg-purple-500/10 text-purple-600' },
    { name: 'Interesado', key: 'interested', color: 'bg-cyan-500/10 text-cyan-600' },
    { name: 'Negociando', key: 'negotiating', color: 'bg-yellow-500/10 text-yellow-600' },
    { name: 'Convertido', key: 'converted', color: 'bg-green-500/10 text-green-600' },
    { name: 'Perdido', key: 'lost', color: 'bg-red-500/10 text-red-600' },
  ];

  const totalPipeline = leads
    .filter(l => l.status !== 'lost' && l.status !== 'converted')
    .reduce((sum, l) => sum + (l.budget_max || 0), 0);

  const activeLeads = leads.filter(l => l.status !== 'lost' && l.status !== 'converted');
  const avgDeal = activeLeads.length > 0 ? totalPipeline / activeLeads.length : 0;
  const conversionRate = leads.length > 0
    ? ((leadStats.statusCounts.converted || 0) / leads.length) * 100
    : 0;

  const paidReservations = reservations.filter(r => r.status === 'paid' || r.status === 'converted');
  const totalRevenue = soldLots.reduce((sum, l) => sum + (l.price || 0), 0);

  const filteredLeads = leads.filter(l => {
    const name = `${l.first_name} ${l.last_name || ''}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || (l.email || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatCurrency = (v: number) => {
    if (v >= 1000000000) return `$${(v / 1000000000).toFixed(1)}B`;
    if (v >= 1000000) return `$${(v / 1000000).toFixed(0)}M`;
    return `$${v.toLocaleString('es-CL')}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Ventas</h1>
        <p className="text-muted-foreground">Pipeline de ventas y oportunidades de negocio</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardContent className="p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pipeline Total</p>
            <p className="text-2xl font-bold">{formatCurrency(totalPipeline)}</p>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Deal Promedio</p>
            <p className="text-2xl font-bold">{formatCurrency(avgDeal)}</p>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tasa Conversión</p>
            <p className="text-2xl font-bold">{conversionRate.toFixed(1)}%</p>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Handshake className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ingresos Vendidos</p>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          </div>
        </CardContent></Card>
      </div>

      {/* Pipeline Visual */}
      <Card>
        <CardHeader><CardTitle>Pipeline de Ventas</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 justify-between">
            {pipelineStages.map((stage, index) => (
              <div key={stage.key} className="flex flex-col items-center min-w-[100px]">
                <div className={`w-full p-4 rounded-lg ${stage.color} text-center`}>
                  <p className="font-semibold text-sm">{stage.name}</p>
                  <p className="text-2xl font-bold mt-1">{leadStats.statusCounts[stage.key as LeadStatus] || 0}</p>
                </div>
                {index < pipelineStages.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground mt-2 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="opportunities" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="opportunities">Oportunidades ({activeLeads.length})</TabsTrigger>
          <TabsTrigger value="contracts">Contratos ({paidReservations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <Input placeholder="Buscar leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
          {filteredLeads.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No hay oportunidades aún</Card>
          ) : (
            <div className="space-y-3">
              {filteredLeads.map((lead) => {
                const status = (lead.status || 'new') as LeadStatus;
                const config = LEAD_STATUS_CONFIG[status];
                return (
                  <Card key={lead.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{lead.first_name} {lead.last_name || ''}</h3>
                            <p className="text-sm text-muted-foreground">{lead.email || lead.phone || 'Sin contacto'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`${config.color} text-white`}>{config.label}</Badge>
                          {lead.budget_max && (
                            <p className="text-lg font-bold text-green-600 mt-1">{formatCurrency(lead.budget_max)}</p>
                          )}
                        </div>
                      </div>
                      {lead.notes && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{lead.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          {paidReservations.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No hay contratos aún</Card>
          ) : (
            <div className="space-y-3">
              {paidReservations.map((res: any) => (
                <Card key={res.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{res.buyer_name}</h3>
                        <p className="text-sm text-muted-foreground">{res.buyer_email}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Lote: {res.lots?.name || res.lots?.lot_number || 'N/A'}
                          {res.lots?.projects?.name && ` • ${res.lots.projects.name}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={res.status === 'converted' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'}>
                          {res.status === 'converted' ? 'Convertido' : 'Pagado'}
                        </Badge>
                        <p className="text-lg font-bold mt-1">{formatCurrency(res.reservation_amount)}</p>
                        {res.paid_at && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(res.paid_at).toLocaleDateString('es-CL')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesManagement;
