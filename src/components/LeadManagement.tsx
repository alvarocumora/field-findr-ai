import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, Plus, Search, Phone, Mail, Calendar, 
  TrendingUp, UserPlus, MessageSquare, MoreVertical, Clock
} from 'lucide-react';
import Layout from './Layout';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  source: string;
  interestedIn: string;
  lastContact: string;
  notes: string;
  score: number;
}

const mockLeads: Lead[] = [
  { id: '1', name: 'Carlos Mendoza', email: 'carlos@email.com', phone: '+56 9 1234 5678', status: 'qualified', source: 'Portal Web', interestedIn: 'Lote A-001', lastContact: '2024-01-15', notes: 'Interesado en financiamiento', score: 85 },
  { id: '2', name: 'María González', email: 'maria@email.com', phone: '+56 9 8765 4321', status: 'proposal', source: 'Referido', interestedIn: 'Lote B-002', lastContact: '2024-01-14', notes: 'Solicita visita presencial', score: 92 },
  { id: '3', name: 'Juan Pérez', email: 'juan@email.com', phone: '+56 9 5555 1234', status: 'new', source: 'Facebook Ads', interestedIn: 'Proyecto Norte', lastContact: '2024-01-16', notes: 'Primer contacto', score: 45 },
  { id: '4', name: 'Ana Silva', email: 'ana@email.com', phone: '+56 9 7777 8888', status: 'negotiation', source: 'Google Ads', interestedIn: 'Lote A-003', lastContact: '2024-01-13', notes: 'Negociando precio', score: 88 },
  { id: '5', name: 'Pedro Rojas', email: 'pedro@email.com', phone: '+56 9 3333 2222', status: 'contacted', source: 'Portal Web', interestedIn: 'Lote B-001', lastContact: '2024-01-12', notes: 'Esperando documentos', score: 65 },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'Nuevo', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  contacted: { label: 'Contactado', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  qualified: { label: 'Calificado', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  proposal: { label: 'Propuesta', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  negotiation: { label: 'Negociación', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  closed_won: { label: 'Cerrado ✓', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  closed_lost: { label: 'Perdido', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

const LeadManagement = () => {
  const [leads] = useState<Lead[]>(mockLeads);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    inProgress: leads.filter(l => ['contacted', 'qualified', 'proposal', 'negotiation'].includes(l.status)).length,
    closed: leads.filter(l => l.status === 'closed_won').length,
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Leads</h1>
            <p className="text-muted-foreground">Administra y da seguimiento a tus prospectos</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Nuevo Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Lead</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre Completo</Label>
                    <Input placeholder="Juan Pérez" />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input placeholder="+56 9 1234 5678" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="email@ejemplo.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fuente</Label>
                    <Select defaultValue="web">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="web">Portal Web</SelectItem>
                        <SelectItem value="referral">Referido</SelectItem>
                        <SelectItem value="facebook">Facebook Ads</SelectItem>
                        <SelectItem value="google">Google Ads</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Interesado en</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a-001">Lote A-001</SelectItem>
                        <SelectItem value="a-002">Lote A-002</SelectItem>
                        <SelectItem value="b-001">Lote B-001</SelectItem>
                        <SelectItem value="general">Consulta General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea placeholder="Información adicional sobre el lead..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
                <Button onClick={() => setShowAddDialog(false)}>Guardar Lead</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Nuevos</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
                </div>
                <UserPlus className="h-8 w-8 text-blue-500/60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En Proceso</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-500/60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cerrados</p>
                  <p className="text-2xl font-bold text-green-600">{stats.closed}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
              {Object.entries(statusConfig).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lead Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(lead.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{lead.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{lead.source}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${getScoreColor(lead.score)}`}>
                      {lead.score}
                    </span>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Badge className={statusConfig[lead.status].color}>
                  {statusConfig[lead.status].label}
                </Badge>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{lead.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Último contacto: {new Date(lead.lastContact).toLocaleDateString('es-CL')}</span>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">Interesado en:</p>
                  <p className="text-sm font-medium">{lead.interestedIn}</p>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1">
                    <Phone className="h-3 w-3" />
                    Llamar
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Mensaje
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1">
                    <Calendar className="h-3 w-3" />
                    Agendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default LeadManagement;
