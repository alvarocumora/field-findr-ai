import { useState, useRef, DragEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Target,
  UserPlus,
  Search,
  GripVertical,
  ArrowUpRight,
  Clock,
  Loader2,
} from 'lucide-react';
import { useLeads, LeadStatus, LEAD_STATUS_CONFIG } from '@/hooks/useLeads';
import { LeadFormDialog } from '@/components/leads/LeadFormDialog';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const PIPELINE_COLUMNS: { status: LeadStatus; label: string; accent: string }[] = [
  { status: 'new', label: 'Nuevos', accent: 'border-t-blue-500' },
  { status: 'contacted', label: 'Contactados', accent: 'border-t-purple-500' },
  { status: 'interested', label: 'Interesados', accent: 'border-t-emerald-500' },
  { status: 'negotiating', label: 'Negociando', accent: 'border-t-amber-500' },
  { status: 'converted', label: 'Convertidos', accent: 'border-t-green-600' },
  { status: 'lost', label: 'Perdidos', accent: 'border-t-red-500' },
];

const CRMSystem = () => {
  const { leads, isLoading, stats, updateLead } = useLeads();
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const filteredLeads = leads.filter(lead => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      lead.first_name?.toLowerCase().includes(q) ||
      lead.last_name?.toLowerCase().includes(q) ||
      lead.email?.toLowerCase().includes(q) ||
      lead.phone?.toLowerCase().includes(q)
    );
  });

  const getColumnLeads = (status: LeadStatus) =>
    filteredLeads.filter(l => (l.status || 'new') === status);

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

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: DragEvent, newStatus: LeadStatus) => {
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

  const totalBudget = leads.reduce((sum, l) => sum + (l.budget_max || 0), 0);
  const convertedCount = stats.statusCounts.converted || 0;
  const conversionRate = leads.length > 0 ? Math.round((convertedCount / leads.length) * 100) : 0;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline de Ventas</h1>
          <p className="text-sm text-muted-foreground">Arrastra los leads entre columnas para actualizar su estado</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-[220px] rounded-xl"
            />
          </div>
          <LeadFormDialog
            trigger={
              <Button className="rounded-xl gap-2">
                <UserPlus className="h-4 w-4" />
                Nuevo Lead
              </Button>
            }
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads', value: stats.total, icon: Users, color: 'text-primary' },
          { label: 'Conversión', value: `${conversionRate}%`, icon: Target, color: 'text-green-500' },
          { label: 'Pipeline', value: totalBudget >= 1e9 ? `$${(totalBudget / 1e9).toFixed(1)}B` : `$${(totalBudget / 1e6).toFixed(0)}M`, icon: DollarSign, color: 'text-amber-500' },
          { label: 'Seguimiento', value: stats.thisWeek, icon: Clock, color: 'text-purple-500' },
        ].map((s, i) => (
          <Card key={i} className="border-border/40">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[400px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-6 gap-3 min-w-[1100px]">
            {PIPELINE_COLUMNS.map(col => {
              const columnLeads = getColumnLeads(col.status);
              const isDragOver = dragOverColumn === col.status;

              return (
                <div
                  key={col.status}
                  className={`rounded-xl border-t-4 ${col.accent} bg-muted/30 border border-border/40 transition-all ${
                    isDragOver ? 'ring-2 ring-primary/40 bg-primary/5' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, col.status)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.status)}
                >
                  {/* Column Header */}
                  <div className="px-3 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                      <Badge variant="secondary" className="text-xs h-5 px-1.5 rounded-md">
                        {columnLeads.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="px-2 pb-2 space-y-2 min-h-[200px]">
                    {columnLeads.length === 0 && (
                      <div className="flex items-center justify-center h-24 text-xs text-muted-foreground border border-dashed border-border/50 rounded-lg">
                        Sin leads
                      </div>
                    )}
                    {columnLeads.map(lead => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onDragEnd={handleDragEnd}
                        className={`group bg-card rounded-lg border border-border/50 p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 hover:shadow-sm transition-all ${
                          draggedLeadId === lead.id ? 'opacity-40 scale-95' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-sm font-medium text-foreground truncate">
                              {lead.first_name} {lead.last_name || ''}
                            </p>
                          </div>
                        </div>

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
                              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1 text-green-600 hover:text-green-500 font-medium"
                              onClick={e => e.stopPropagation()}
                            >
                              WA
                            </a>
                          </div>
                        )}

                        {(lead.budget_min || lead.budget_max) && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                            <DollarSign className="h-3 w-3 shrink-0" />
                            <span>
                              {lead.budget_min ? `$${(Number(lead.budget_min) / 1e6).toFixed(0)}M` : ''}
                              {lead.budget_min && lead.budget_max ? ' - ' : ''}
                              {lead.budget_max ? `$${(Number(lead.budget_max) / 1e6).toFixed(0)}M` : ''}
                            </span>
                          </div>
                        )}

                        {lead.next_follow_up && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-600 mt-2">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>
                              {formatDistanceToNow(new Date(lead.next_follow_up), { addSuffix: true, locale: es })}
                            </span>
                          </div>
                        )}

                        {lead.source && (
                          <Badge variant="outline" className="mt-2 text-[10px] h-4 px-1.5">
                            {lead.source}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMSystem;
