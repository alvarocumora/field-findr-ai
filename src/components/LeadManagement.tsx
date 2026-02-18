import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, Search, Phone, Mail, Calendar, 
  TrendingUp, UserPlus, MessageSquare, Clock, Loader2, Trash2, Flame, Thermometer, Snowflake
} from 'lucide-react';
import { useLeads, LEAD_STATUS_CONFIG, LeadStatus } from '@/hooks/useLeads';
import { LeadFormDialog } from '@/components/leads/LeadFormDialog';
import { useLeadScoring } from '@/hooks/useLeadScoring';
import LeadScoreBadge from '@/components/leads/LeadScoreBadge';

const LeadManagement = () => {
  const { leads, isLoading, stats, deleteLead } = useLeads();
  const { scoredLeads, stats: scoreStats } = useLeadScoring(leads);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortByScore, setSortByScore] = useState(true);

  const sourceLeads = sortByScore ? scoredLeads : leads;
  const filteredLeads = sourceLeads.filter(lead => {
    const name = `${lead.first_name} ${lead.last_name || ''}`.toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) ||
                          (lead.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(LEAD_STATUS_CONFIG).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lead Cards */}
      {filteredLeads.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sin leads</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'No se encontraron leads' : 'Agrega tu primer lead para comenzar'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => {
            const status = (lead.status || 'new') as LeadStatus;
            const config = LEAD_STATUS_CONFIG[status] || LEAD_STATUS_CONFIG.new;
            return (
              <Card key={lead.id} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30">
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
                      size="icon" variant="ghost" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100"
                      onClick={() => {
                        if (confirm('¿Eliminar este lead?')) deleteLead.mutate(lead.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${config.color} text-white`}>
                      {config.label}
                    </Badge>
                    <LeadScoreBadge lead={lead} />
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
                    {lead.next_follow_up && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Seguimiento: {new Date(lead.next_follow_up).toLocaleDateString('es-CL')}</span>
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LeadManagement;
