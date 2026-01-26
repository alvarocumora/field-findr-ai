import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, Plus, Phone, Mail, Calendar, MapPin, 
  MessageSquare, Clock, DollarSign,
  Filter, Loader2, Users
} from 'lucide-react';
import { useLeads, Lead, LeadStatus, LEAD_STATUS_CONFIG } from '@/hooks/useLeads';
import { useProjects } from '@/hooks/useProjects';

export const EnhancedCRM = () => {
  const { leads, isLoading, createLead, updateLead, stats } = useLeads();
  const { projects } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    source: '',
    notes: '',
    budget_min: 0,
    budget_max: 0,
    project_id: '',
  });

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      `${lead.first_name} ${lead.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateLead = async () => {
    if (!newLead.first_name) return;
    
    await createLead.mutateAsync({
      first_name: newLead.first_name,
      last_name: newLead.last_name || null,
      email: newLead.email || null,
      phone: newLead.phone || null,
      source: newLead.source || null,
      notes: newLead.notes || null,
      budget_min: newLead.budget_min || null,
      budget_max: newLead.budget_max || null,
      project_id: newLead.project_id || null,
      status: 'new',
    });
    
    setIsAddOpen(false);
    setNewLead({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      source: '',
      notes: '',
      budget_min: 0,
      budget_max: 0,
      project_id: '',
    });
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    await updateLead.mutateAsync({ id: leadId, status: newStatus });
  };

  const LeadCard = ({ lead }: { lead: Lead }) => {
    const status = (lead.status || 'new') as LeadStatus;
    const statusConfig = LEAD_STATUS_CONFIG[status] || LEAD_STATUS_CONFIG.new;
    
    return (
      <Card 
        className="cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => {
          setSelectedLead(lead);
          setIsDetailOpen(true);
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar>
              <AvatarFallback>
                {lead.first_name[0]}{(lead.last_name || '')[0] || ''}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium truncate">{lead.first_name} {lead.last_name || ''}</h4>
                <Badge className={`${statusConfig.color} text-white`}>
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">{lead.email || 'Sin email'}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {(lead.budget_min || lead.budget_max) && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${((lead.budget_min || 0) / 1000000).toFixed(0)}-${((lead.budget_max || 0) / 1000000).toFixed(0)}M
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(lead.created_at).toLocaleDateString('es-CL')}
                </span>
              </div>
            </div>
          </div>
          {lead.next_follow_up && (
            <div className="mt-3 p-2 bg-muted rounded-lg flex items-center gap-2 text-xs">
              <Calendar className="h-3 w-3 text-primary" />
              Seguimiento: {new Date(lead.next_follow_up).toLocaleDateString('es-CL')}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">CRM de Leads</h2>
          <p className="text-muted-foreground">Gestiona tus contactos y seguimiento</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Lead
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {Object.entries(LEAD_STATUS_CONFIG).map(([key, config]) => (
          <Card 
            key={key}
            className={`cursor-pointer transition-colors ${statusFilter === key ? 'border-primary' : ''}`}
            onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
          >
            <CardContent className="p-3 text-center">
              <div className={`w-3 h-3 rounded-full ${config.color} mx-auto mb-1`} />
              <p className="text-2xl font-bold">{stats.statusCounts[key as LeadStatus] || 0}</p>
              <p className="text-xs text-muted-foreground">{config.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(LEAD_STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty State */}
      {filteredLeads.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay leads</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'No se encontraron leads con ese criterio' : 'Agrega tu primer lead para comenzar'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Lead
            </Button>
          )}
        </Card>
      )}

      {/* Leads Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredLeads.map(lead => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>

      {/* Add Lead Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Lead</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={newLead.first_name}
                  onChange={(e) => setNewLead(l => ({ ...l, first_name: e.target.value }))}
                  placeholder="Nombre"
                />
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input
                  value={newLead.last_name}
                  onChange={(e) => setNewLead(l => ({ ...l, last_name: e.target.value }))}
                  placeholder="Apellido"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead(l => ({ ...l, email: e.target.value }))}
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={newLead.phone}
                  onChange={(e) => setNewLead(l => ({ ...l, phone: e.target.value }))}
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Presupuesto Mín</Label>
                <Input
                  type="number"
                  value={newLead.budget_min || ''}
                  onChange={(e) => setNewLead(l => ({ ...l, budget_min: parseInt(e.target.value) || 0 }))}
                  placeholder="50000000"
                />
              </div>
              <div className="space-y-2">
                <Label>Presupuesto Máx</Label>
                <Input
                  type="number"
                  value={newLead.budget_max || ''}
                  onChange={(e) => setNewLead(l => ({ ...l, budget_max: parseInt(e.target.value) || 0 }))}
                  placeholder="100000000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fuente</Label>
              <Select
                value={newLead.source}
                onValueChange={(v) => setNewLead(l => ({ ...l, source: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar fuente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Portal Inmobiliario">Portal Inmobiliario</SelectItem>
                  <SelectItem value="Redes Sociales">Redes Sociales</SelectItem>
                  <SelectItem value="Referido">Referido</SelectItem>
                  <SelectItem value="Página Web">Página Web</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {projects.length > 0 && (
              <div className="space-y-2">
                <Label>Proyecto de interés</Label>
                <Select
                  value={newLead.project_id}
                  onValueChange={(v) => setNewLead(l => ({ ...l, project_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={newLead.notes}
                onChange={(e) => setNewLead(l => ({ ...l, notes: e.target.value }))}
                placeholder="Notas adicionales..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleCreateLead}
              disabled={!newLead.first_name || createLead.isPending}
            >
              {createLead.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          {selectedLead && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-lg">
                      {selectedLead.first_name[0]}{(selectedLead.last_name || '')[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle>
                      {selectedLead.first_name} {selectedLead.last_name || ''}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">{selectedLead.source || 'Sin fuente'}</p>
                  </div>
                  <Select
                    value={selectedLead.status || 'new'}
                    onValueChange={(v) => handleStatusChange(selectedLead.id, v)}
                  >
                    <SelectTrigger className="w-40 ml-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEAD_STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </DialogHeader>

              <div className="grid gap-6 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedLead.email || 'Sin email'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedLead.phone || 'Sin teléfono'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {projects.find(p => p.id === selectedLead.project_id)?.name || 'Sin proyecto'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      ${((selectedLead.budget_min || 0) / 1000000).toFixed(0)}M - ${((selectedLead.budget_max || 0) / 1000000).toFixed(0)}M
                    </span>
                  </div>
                </div>

                {selectedLead.notes && (
                  <div>
                    <Label className="text-sm font-medium">Notas</Label>
                    <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-lg">
                      {selectedLead.notes}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button className="flex-1" asChild>
                    <a href={`tel:${selectedLead.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Llamar
                    </a>
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={`mailto:${selectedLead.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </a>
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={`https://wa.me/${(selectedLead.phone || '').replace(/\D/g, '')}`} target="_blank">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      WhatsApp
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
