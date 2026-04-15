import { useState, useMemo, DragEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeads } from '@/hooks/useLeads';
import LeadScoreBadge from '@/components/leads/LeadScoreBadge';
import { Search, Phone, Mail, FolderKanban, Users, TrendingUp, Target, GripVertical, Calendar, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInHours } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const PIPELINE_COLUMNS = [
  { key: 'new', label: 'Nuevos', color: 'bg-blue-500', bgColor: 'bg-blue-500/10 border-blue-500/20', accent: 'border-t-blue-500' },
  { key: 'contacted', label: 'Contactados', color: 'bg-yellow-500', bgColor: 'bg-yellow-500/10 border-yellow-500/20', accent: 'border-t-yellow-500' },
  { key: 'interested', label: 'Interesados', color: 'bg-purple-500', bgColor: 'bg-purple-500/10 border-purple-500/20', accent: 'border-t-purple-500' },
  { key: 'negotiating', label: 'Negociando', color: 'bg-orange-500', bgColor: 'bg-orange-500/10 border-orange-500/20', accent: 'border-t-orange-500' },
  { key: 'converted', label: 'Convertidos', color: 'bg-green-500', bgColor: 'bg-green-500/10 border-green-500/20', accent: 'border-t-green-500' },
  { key: 'lost', label: 'Perdidos', color: 'bg-red-500', bgColor: 'bg-red-500/10 border-red-500/20', accent: 'border-t-red-500' },
];

const SalesPipeline = () => {
  const { leads, isLoading, updateLead } = useLeads();
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

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

  // Funnel proportions
  const funnelData = useMemo(() => {
    return PIPELINE_COLUMNS.map(col => {
      const count = leads.filter(l => (l.status || 'new') === col.key).length;
      const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
      return { ...col, count, pct };
    });
  }, [leads]);

  // D&D handlers
  const handleDragStart = (e: DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => setDragOverColumn(null);

  const handleDrop = (e: DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    setDragOverColumn(null);
    setDraggedLeadId(null);
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.status === newStatus) return;
    updateLead.mutate({ id: leadId, status: newStatus });
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverColumn(null);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        <div className="grid grid-cols-6 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96" />)}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FolderKanban className="h-8 w-8 text-primary" />
            Pipeline de Ventas
          </h1>
          <p className="text-muted-foreground">Arrastra los leads entre columnas para cambiar su estado</p>
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar leads..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 rounded-xl" />
        </div>
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

      {/* Mini Funnel Bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-muted/30 border border-border/40">
        {funnelData.filter(f => f.count > 0).map(f => (
          <div
            key={f.key}
            className={cn(f.color, 'transition-all relative group')}
            style={{ width: `${f.pct}%`, minWidth: f.count > 0 ? '2%' : 0 }}
            title={`${f.label}: ${f.count} (${f.pct}%)`}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-0.5 rounded shadow-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {f.label}: {f.count}
            </div>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="grid grid-cols-6 gap-3 min-w-[1200px]">
          {PIPELINE_COLUMNS.map(col => {
            const colLeads = filteredLeads.filter(l => (l.status || 'new') === col.key);
            const isDragOver = dragOverColumn === col.key;

            return (
              <div
                key={col.key}
                className={cn(
                  'rounded-xl border-t-4 bg-muted/20 border border-border/40 transition-all',
                  col.accent,
                  isDragOver && 'ring-2 ring-primary/40 bg-primary/5'
                )}
                onDragOver={(e) => handleDragOver(e, col.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.key)}
              >
                {/* Column Header */}
                <div className="px-3 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                    <Badge variant="secondary" className="text-xs h-5 px-1.5 rounded-md">
                      {colLeads.length}
                    </Badge>
                  </div>
                </div>

                {/* Cards */}
                <div className="px-2 pb-2 space-y-2 min-h-[250px]">
                  {colLeads.length === 0 && (
                    <div className="flex items-center justify-center h-24 text-xs text-muted-foreground border border-dashed border-border/50 rounded-lg">
                      Sin leads
                    </div>
                  )}
                  {colLeads.map(lead => {
                    const hoursSinceUpdate = differenceInHours(new Date(), new Date(lead.updated_at));
                    const isStale = hoursSinceUpdate > 48 && col.key !== 'converted' && col.key !== 'lost';

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          'group bg-card rounded-lg border border-border/50 p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 hover:shadow-sm transition-all',
                          draggedLeadId === lead.id && 'opacity-40 scale-95',
                          isStale && 'border-l-2 border-l-red-500'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-sm font-medium text-foreground truncate">
                              {lead.first_name} {lead.last_name || ''}
                            </p>
                          </div>
                          <LeadScoreBadge lead={lead} showBreakdown={false} />
                        </div>

                        {isStale && (
                          <Badge variant="outline" className="text-[9px] h-3.5 px-1 mb-1 border-red-500/30 text-red-500">
                            ⚠ {Math.floor(hoursSinceUpdate / 24)}d sin contacto
                          </Badge>
                        )}

                        {lead.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 truncate">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                        )}

                        {lead.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{lead.phone}</span>
                            <a
                              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${lead.first_name}, te contacto desde Ofertaterrenos.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto text-green-600 hover:text-green-500 text-[10px] font-bold"
                              onClick={e => e.stopPropagation()}
                            >
                              WA →
                            </a>
                          </div>
                        )}

                        {lead.budget_max && (
                          <p className="text-[11px] font-medium text-primary">
                            ${(lead.budget_max / 1000000).toFixed(0)}M
                          </p>
                        )}

                        {lead.next_follow_up && (
                          <div className="flex items-center gap-1.5 text-[10px] text-amber-600 mt-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(lead.next_follow_up), { addSuffix: true, locale: es })}
                          </div>
                        )}

                        {lead.source && (
                          <Badge variant="outline" className="mt-1.5 text-[9px] h-4 px-1.5">{lead.source}</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SalesPipeline;
