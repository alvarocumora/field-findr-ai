import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeads } from '@/hooks/useLeads';
import { LeadScoreBadge } from '@/components/leads/LeadScoreBadge';
import { Search, Phone, Mail, FolderKanban, Users, TrendingUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const PIPELINE_COLUMNS = [
  { key: 'new', label: 'Nuevos', color: 'bg-blue-500', bgColor: 'bg-blue-500/10 border-blue-500/20' },
  { key: 'contacted', label: 'Contactados', color: 'bg-yellow-500', bgColor: 'bg-yellow-500/10 border-yellow-500/20' },
  { key: 'interested', label: 'Interesados', color: 'bg-purple-500', bgColor: 'bg-purple-500/10 border-purple-500/20' },
  { key: 'negotiating', label: 'Negociando', color: 'bg-orange-500', bgColor: 'bg-orange-500/10 border-orange-500/20' },
  { key: 'converted', label: 'Convertidos', color: 'bg-green-500', bgColor: 'bg-green-500/10 border-green-500/20' },
];

const SalesPipeline = () => {
  const { leads, isLoading, updateLead } = useLeads();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads;
    const q = searchQuery.toLowerCase();
    return leads.filter(l =>
      l.first_name.toLowerCase().includes(q) ||
      (l.last_name || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q)
    );
  }, [leads, searchQuery]);

  const pipelineStats = useMemo(() => {
    const total = leads.length;
    const converted = leads.filter(l => l.status === 'converted').length;
    const totalValue = leads.reduce((sum, l) => sum + (l.budget_max || 0), 0);
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    return { total, converted, totalValue, conversionRate };
  }, [leads]);

  const handleStatusChange = (leadId: string, newStatus: string) => {
    updateLead.mutate({ id: leadId, updates: { status: newStatus } });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        <div className="grid grid-cols-5 gap-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-96" />)}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <FolderKanban className="h-8 w-8 text-primary" />
          Pipeline de Ventas
        </h1>
        <p className="text-muted-foreground">Embudo visual de conversión de leads</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Total Leads', value: pipelineStats.total, iconClass: 'text-primary' },
          { icon: Target, label: 'Convertidos', value: pipelineStats.converted, iconClass: 'text-green-500' },
          { icon: TrendingUp, label: 'Tasa Conversión', value: `${pipelineStats.conversionRate}%`, iconClass: 'text-purple-500' },
          { icon: TrendingUp, label: 'Valor Pipeline', value: `$${(pipelineStats.totalValue / 1000000).toFixed(0)}M`, iconClass: 'text-emerald-500' },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-4 flex items-center gap-3">
            <s.icon className={cn('h-8 w-8', s.iconClass)} />
            <div><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></div>
          </CardContent></Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar leads..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
        {PIPELINE_COLUMNS.map(col => {
          const colLeads = filteredLeads.filter(l => (l.status || 'new') === col.key);
          return (
            <div key={col.key} className="space-y-3 min-w-[220px]">
              {/* Column Header */}
              <div className={cn('flex items-center gap-2 p-2 rounded-lg border', col.bgColor)}>
                <div className={cn('h-3 w-3 rounded-full', col.color)} />
                <span className="text-sm font-semibold flex-1">{col.label}</span>
                <Badge variant="secondary" className="text-xs">{colLeads.length}</Badge>
              </div>

              {/* Cards */}
              <div className="space-y-2 min-h-[300px]">
                {colLeads.map(lead => (
                  <Card key={lead.id} className="hover:shadow-md transition-shadow group">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">
                          {lead.first_name} {lead.last_name || ''}
                        </p>
                        <LeadScoreBadge score={lead.lead_score || 0} />
                      </div>

                      {lead.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 flex-shrink-0" />{lead.email}
                        </p>
                      )}
                      {lead.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3 flex-shrink-0" />{lead.phone}
                        </p>
                      )}

                      {lead.budget_max && (
                        <p className="text-xs font-medium text-primary">
                          Presupuesto: ${(lead.budget_max / 1000000).toFixed(0)}M
                        </p>
                      )}

                      {lead.source && (
                        <Badge variant="outline" className="text-[10px]">{lead.source}</Badge>
                      )}

                      {/* Quick status change */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                        {PIPELINE_COLUMNS.filter(c => c.key !== col.key).slice(0, 2).map(target => (
                          <button
                            key={target.key}
                            onClick={() => handleStatusChange(lead.id, target.key)}
                            className={cn('text-[10px] px-1.5 py-0.5 rounded border transition-colors hover:opacity-80', target.bgColor)}
                          >
                            → {target.label}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SalesPipeline;
