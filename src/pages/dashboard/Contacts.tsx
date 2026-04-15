import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeads } from '@/hooks/useLeads';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, Plus, Phone, Mail, Users, Building2,
  Calendar, MessageSquare, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { LeadFormDialog } from '@/components/leads/LeadFormDialog';

const RELATIONSHIP_TYPES = [
  { key: 'landowner', label: 'Propietario', color: 'bg-emerald-500/15 text-emerald-600' },
  { key: 'broker', label: 'Corredor', color: 'bg-blue-500/15 text-blue-600' },
  { key: 'investor', label: 'Inversionista', color: 'bg-purple-500/15 text-purple-600' },
  { key: 'partner', label: 'Socio Estratégico', color: 'bg-amber-500/15 text-amber-600' },
];

const getRelationship = (source: string | null) => {
  if (!source) return RELATIONSHIP_TYPES[0];
  const lower = source.toLowerCase();
  if (lower.includes('broker') || lower.includes('corredor')) return RELATIONSHIP_TYPES[1];
  if (lower.includes('inver')) return RELATIONSHIP_TYPES[2];
  if (lower.includes('socio') || lower.includes('partner')) return RELATIONSHIP_TYPES[3];
  return RELATIONSHIP_TYPES[0];
};

const Contacts = () => {
  const { leads, isLoading } = useLeads();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (search) {
        const q = search.toLowerCase();
        if (!l.first_name.toLowerCase().includes(q) &&
            !(l.last_name || '').toLowerCase().includes(q) &&
            !(l.email || '').toLowerCase().includes(q)) return false;
      }
      if (typeFilter !== 'all') {
        const rel = getRelationship(l.source);
        if (rel.key !== typeFilter) return false;
      }
      return true;
    });
  }, [leads, search, typeFilter]);

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-96" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            CRM — Contactos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} contactos</p>
        </div>
        <LeadFormDialog
          trigger={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Contacto
            </Button>
          }
        />
      </div>

      {/* Filters */}
      <Card className="border-border/40">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar contacto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo de relación" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {RELATIONSHIP_TYPES.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">Contacto</TableHead>
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold">Teléfono</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Último contacto</TableHead>
                <TableHead className="font-semibold">Seguimiento</TableHead>
                <TableHead className="font-semibold text-center">Score</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Sin contactos</TableCell>
                </TableRow>
              )}
              {filtered.map(lead => {
                const rel = getRelationship(lead.source);
                const initials = `${lead.first_name[0]}${(lead.last_name || '')[0] || ''}`.toUpperCase();

                return (
                  <TableRow key={lead.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{lead.first_name} {lead.last_name || ''}</p>
                          {lead.notes && <p className="text-xs text-muted-foreground truncate max-w-[180px]">{lead.notes}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-xs', rel.color)}>{rel.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {lead.phone ? (
                        <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                           className="text-sm text-primary hover:underline flex items-center gap-1">
                          <Phone className="h-3 w-3" />{lead.phone}
                        </a>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {lead.email ? (
                        <a href={`mailto:${lead.email}`} className="text-sm hover:underline flex items-center gap-1">
                          <Mail className="h-3 w-3" />{lead.email}
                        </a>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true, locale: es })}
                    </TableCell>
                    <TableCell>
                      {lead.next_follow_up ? (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(lead.next_follow_up), { addSuffix: true, locale: es })}
                        </div>
                      ) : <span className="text-xs text-muted-foreground">Sin programar</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs font-bold">{lead.lead_score || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Contacts;
