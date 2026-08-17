import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, Search, Phone, Mail, 
  TrendingUp, UserPlus, Clock, Trash2, Flame, Thermometer, Snowflake, AlertTriangle, X
} from 'lucide-react';
import { useLeads, LEAD_STATUS_CONFIG, LeadStatus, type Lead } from '@/hooks/useLeads';
import { LeadFormDialog } from '@/components/leads/LeadFormDialog';
import { useLeadScoring } from '@/hooks/useLeadScoring';
import LeadScoreBadge from '@/components/leads/LeadScoreBadge';
import LeadDetailSheet from '@/components/leads/LeadDetailSheet';

type FollowUpFilter = 'all' | 'overdue' | 'week' | 'none';

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const LeadManagement = () => {
  const { leads, isLoading, stats, deleteLead, updateLead } = useLeads();
  const { scoredLeads, stats: scoreStats } = useLeadScoring(leads);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilter>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sortByScore, setSortByScore] = useState(true);

  const sources = useMemo(
    () => Array.from(new Set(leads.map((l) => l.source).filter(Boolean) as string[])).sort(),
    [leads],
  );

  const sourceLeads = sortByScore ? scoredLeads : leads;
  const filteredLeads = sourceLeads.filter(lead => {
    const name = `${lead.first_name} ${lead.last_name || ''}`.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = name.includes(q) ||
                          (lead.email || '').toLowerCase().includes(q) ||
                          (lead.phone || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;

    let matchesFollowUp = true;
    if (followUpFilter !== 'all') {
      const due = lead.next_follow_up ? new Date(lead.next_follow_up) : null;
      if (followUpFilter === 'none') matchesFollowUp = !due;
      else if (!due) matchesFollowUp = false;
      else if (followUpFilter === 'overdue') matchesFollowUp = due < startOfToday();
      else matchesFollowUp =
        due >= startOfToday() && due <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    return matchesSearch && matchesStatus && matchesSource && matchesFollowUp;
  });

  const activeFilters =
    (statusFilter !== 'all' ? 1 : 0) +
    (sourceFilter !== 'all' ? 1 : 0) +
    (followUpFilter !== 'all' ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSourceFilter('all');
    setFollowUpFilter('all');
  };

  const overdueCount = leads.filter(
    (l) => l.next_follow_up && new Date(l.next_follow_up) < startOfToday(),
  ).length;

  const getInitials = (firstName: string, lastName?: string | null) => {
    return `${firstName[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };


  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Leads</h1>
          <p className="text-muted-foreground">Administra y da seguimiento a tus prospectos</p>
        </div>
        <LeadFormDialog
          trigger={
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Nuevo Lead
            </Button>
          }
        />
      </div>

      {/* Lead Score Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">🔥 Calientes</p>
                <p className="text-2xl font-bold text-red-600">{scoreStats.hot}</p>
              </div>
              <Flame className="h-8 w-8 text-red-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">🌤️ Tibios</p>
                <p className="text-2xl font-bold text-amber-600">{scoreStats.warm}</p>
              </div>
              <Thermometer className="h-8 w-8 text-amber-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">❄️ Fríos</p>
                <p className="text-2xl font-bold text-blue-600">{scoreStats.cold}</p>
              </div>
              <Snowflake className="h-8 w-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score Promedio</p>
                <p className="text-2xl font-bold">{scoreStats.avgScore}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar leads"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="md:w-44" aria-label="Filtrar por estado">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(LEAD_STATUS_CONFIG).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="md:w-44" aria-label="Filtrar por origen">
              <SelectValue placeholder="Origen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los orígenes</SelectItem>
              {sources.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={followUpFilter}
            onValueChange={(v) => setFollowUpFilter(v as FollowUpFilter)}
          >
            <SelectTrigger className="md:w-48" aria-label="Filtrar por seguimiento">
              <SelectValue placeholder="Seguimiento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el seguimiento</SelectItem>
              <SelectItem value="overdue">Atrasados ({overdueCount})</SelectItem>
              <SelectItem value="week">Próximos 7 días</SelectItem>
              <SelectItem value="none">Sin seguimiento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{filteredLeads.length} de {stats.total} leads</span>
          <Button
            size="sm"
            variant={sortByScore ? 'secondary' : 'ghost'}
            onClick={() => setSortByScore((v) => !v)}
          >
            {sortByScore ? 'Ordenado por score' : 'Ordenado por fecha'}
          </Button>
          {activeFilters > 0 && (
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4" /> Limpiar filtros ({activeFilters})
            </Button>
          )}
        </div>
      </div>


      {/* Lead Cards */}
      {filteredLeads.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sin leads</h3>
          <p className="text-muted-foreground mb-4">
            {activeFilters > 0 ? 'No se encontraron leads con estos filtros' : 'Agrega tu primer lead para comenzar'}
          </p>
          {activeFilters > 0 && (
            <Button variant="outline" onClick={clearFilters}>Limpiar filtros</Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => {
            const status = (lead.status || 'new') as LeadStatus;
            const config = LEAD_STATUS_CONFIG[status] || LEAD_STATUS_CONFIG.new;
            const due = lead.next_follow_up ? new Date(lead.next_follow_up) : null;
            const overdue = due ? due < startOfToday() : false;
            return (
              <Card
                key={lead.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedLead(lead)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedLead(lead);
                  }
                }}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(lead.first_name, lead.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">
                          {lead.first_name} {lead.last_name || ''}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">{lead.source || 'Sin fuente'}</p>
                      </div>
                    </div>
                    <Button 
                      size="icon" variant="ghost"
                      aria-label={`Eliminar lead ${lead.first_name}`}
                      className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('¿Eliminar este lead?')) deleteLead.mutate(lead.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${config.color} text-primary-foreground`}>
                      {config.label}
                    </Badge>
                    <LeadScoreBadge lead={lead} />
                    {overdue && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" /> Atrasado
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {lead.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                    {due && (
                      <div className={`flex items-center gap-2 ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                        <Clock className="h-3 w-3" />
                        <span>Seguimiento: {due.toLocaleDateString('es-CL')}</span>
                      </div>
                    )}
                  </div>

                  {(lead.budget_min || lead.budget_max) && (
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">Presupuesto:</p>
                      <p className="text-sm font-medium">
                        {lead.budget_min ? `$${(lead.budget_min / 1000000).toFixed(0)}M` : ''}
                        {lead.budget_min && lead.budget_max ? ' - ' : ''}
                        {lead.budget_max ? `$${(lead.budget_max / 1000000).toFixed(0)}M` : ''}
                      </p>
                    </div>
                  )}

                  {lead.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{lead.notes}</p>
                  )}

                  {/* Cambio rápido de estado */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={status}
                      onValueChange={(v) => updateLead.mutate({ id: lead.id, status: v })}
                    >
                      <SelectTrigger className="h-8 text-xs" aria-label={`Cambiar estado de ${lead.first_name}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LEAD_STATUS_CONFIG).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <LeadDetailSheet
        lead={selectedLead ? leads.find((l) => l.id === selectedLead.id) ?? selectedLead : null}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
      />
    </div>

  );
};

export default LeadManagement;
