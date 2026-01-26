import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, Plus, Phone, Mail, Calendar, MapPin, 
  MoreVertical, MessageSquare, Clock, DollarSign,
  User, Filter, ArrowUpDown
} from 'lucide-react';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'interested' | 'negotiating' | 'converted' | 'lost';
  source: string;
  interestedIn: string;
  budget: { min: number; max: number };
  lastContact: Date;
  nextFollowUp?: Date;
  notes: string;
  createdAt: Date;
}

const DEMO_LEADS: Lead[] = [
  {
    id: '1',
    firstName: 'María',
    lastName: 'González',
    email: 'maria.gonzalez@email.com',
    phone: '+56 9 1234 5678',
    status: 'interested',
    source: 'Portal Inmobiliario',
    interestedIn: 'Parcela en Casablanca',
    budget: { min: 80000000, max: 120000000 },
    lastContact: new Date('2024-01-20'),
    nextFollowUp: new Date('2024-01-27'),
    notes: 'Busca parcela para casa de fin de semana. Prioriza vista y tranquilidad.',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    email: 'carlos.r@empresa.cl',
    phone: '+56 9 8765 4321',
    status: 'negotiating',
    source: 'Referido',
    interestedIn: 'Lote A-3 Premium',
    budget: { min: 100000000, max: 150000000 },
    lastContact: new Date('2024-01-22'),
    notes: 'Empresario. Interesado en invertir. Puede cerrar rápido si le gusta.',
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '3',
    firstName: 'Ana',
    lastName: 'Martínez',
    email: 'ana.martinez@gmail.com',
    phone: '+56 9 5555 1234',
    status: 'new',
    source: 'Redes Sociales',
    interestedIn: 'General',
    budget: { min: 50000000, max: 80000000 },
    lastContact: new Date('2024-01-24'),
    notes: 'Primer contacto. Está evaluando opciones.',
    createdAt: new Date('2024-01-24'),
  },
];

const STATUS_CONFIG = {
  new: { label: 'Nuevo', color: 'bg-blue-500' },
  contacted: { label: 'Contactado', color: 'bg-purple-500' },
  interested: { label: 'Interesado', color: 'bg-green-500' },
  negotiating: { label: 'Negociando', color: 'bg-yellow-500' },
  converted: { label: 'Convertido', color: 'bg-emerald-600' },
  lost: { label: 'Perdido', color: 'bg-red-500' },
};

export const EnhancedCRM = () => {
  const [leads, setLeads] = useState<Lead[]>(DEMO_LEADS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = () => {
    return leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();

  const LeadCard = ({ lead }: { lead: Lead }) => (
    <Card 
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => {
        setSelectedLead(lead);
        setIsDialogOpen(true);
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarFallback>
              {lead.firstName[0]}{lead.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium truncate">{lead.firstName} {lead.lastName}</h4>
              <Badge className={`${STATUS_CONFIG[lead.status].color} text-white`}>
                {STATUS_CONFIG[lead.status].label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">{lead.interestedIn}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                ${(lead.budget.min / 1000000).toFixed(0)}-${(lead.budget.max / 1000000).toFixed(0)}M
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lead.lastContact.toLocaleDateString('es-CL')}
              </span>
            </div>
          </div>
        </div>
        {lead.nextFollowUp && (
          <div className="mt-3 p-2 bg-muted rounded-lg flex items-center gap-2 text-xs">
            <Calendar className="h-3 w-3 text-primary" />
            Seguimiento: {lead.nextFollowUp.toLocaleDateString('es-CL')}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">CRM de Leads</h2>
          <p className="text-muted-foreground">Gestiona tus contactos y seguimiento</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Lead
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <Card 
            key={key}
            className={`cursor-pointer transition-colors ${statusFilter === key ? 'border-primary' : ''}`}
            onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
          >
            <CardContent className="p-3 text-center">
              <div className={`w-3 h-3 rounded-full ${config.color} mx-auto mb-1`} />
              <p className="text-2xl font-bold">{statusCounts[key] || 0}</p>
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
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leads Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredLeads.map(lead => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>

      {/* Lead Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedLead && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-lg">
                      {selectedLead.firstName[0]}{selectedLead.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle>
                      {selectedLead.firstName} {selectedLead.lastName}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">{selectedLead.source}</p>
                  </div>
                  <Badge className={`ml-auto ${STATUS_CONFIG[selectedLead.status].color} text-white`}>
                    {STATUS_CONFIG[selectedLead.status].label}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="grid gap-6 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedLead.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedLead.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedLead.interestedIn}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      ${(selectedLead.budget.min / 1000000).toFixed(0)}M - ${(selectedLead.budget.max / 1000000).toFixed(0)}M
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Notas</Label>
                  <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-lg">
                    {selectedLead.notes}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Phone className="h-4 w-4 mr-2" />
                    Llamar
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    WhatsApp
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
