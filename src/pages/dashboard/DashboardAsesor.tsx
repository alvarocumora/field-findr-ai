import { useState } from 'react';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  Calendar,
  MessageSquare,
  Phone,
  Target,
  Clock,
  ChevronRight,
  Plus,
  Star,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import Layout from '@/components/Layout';

const DashboardAsesor = () => {
  // Placeholder data
  const stats = [
    { label: 'Leads Activos', value: '24', change: '+5', icon: Users, color: 'text-blue-500' },
    { label: 'Propiedades', value: '12', change: '+2', icon: Building2, color: 'text-emerald-500' },
    { label: 'Ventas del Mes', value: '$2.4M', change: '+18%', icon: DollarSign, color: 'text-purple-500' },
    { label: 'Citas Hoy', value: '3', change: '0', icon: Calendar, color: 'text-amber-500' },
  ];

  const leads = [
    { id: '1', name: 'Roberto Sánchez', interest: 'Parcela 5000m²', status: 'hot', lastContact: 'Hace 2 horas', budget: '$80M - $120M' },
    { id: '2', name: 'Patricia Muñoz', interest: 'Terreno Agrícola', status: 'warm', lastContact: 'Ayer', budget: '$200M+' },
    { id: '3', name: 'Fernando Lagos', interest: 'Sitio Industrial', status: 'cold', lastContact: 'Hace 3 días', budget: '$150M - $300M' },
  ];

  const appointments = [
    { id: '1', client: 'Roberto Sánchez', property: 'Parcela Las Condes', time: '10:00', type: 'visita' },
    { id: '2', client: 'Patricia Muñoz', property: 'Campo Agrícola Maule', time: '14:30', type: 'llamada' },
    { id: '3', client: 'Fernando Lagos', property: 'Sitio Industrial Pudahuel', time: '16:00', type: 'videollamada' },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      hot: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', label: 'Caliente' },
      warm: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', label: 'Tibio' },
      cold: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', label: 'Frío' },
    };
    return styles[status as keyof typeof styles] || styles.cold;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container py-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mi Dashboard</h1>
              <p className="text-muted-foreground mt-1">Gestiona tus leads, propiedades y citas</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="rounded-xl gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Lead
              </Button>
              <Button className="rounded-xl gap-2">
                <Building2 className="h-4 w-4" />
                Nueva Propiedad
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="border-border/40 bg-card/50 backdrop-blur">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <Badge variant="secondary" className="text-xs">
                        {stat.change}
                      </Badge>
                    </div>
                    <div className={`h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Leads Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Leads Recientes</h2>
                <Button variant="ghost" size="sm" className="text-primary gap-1">
                  Ver todos <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                {leads.map((lead) => {
                  const status = getStatusBadge(lead.status);
                  return (
                    <Card key={lead.id} className="border-border/40 hover:border-primary/30 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {lead.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-foreground truncate">{lead.name}</h4>
                              <Badge variant="outline" className={`${status.bg} ${status.text} ${status.border} text-xs`}>
                                {status.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{lead.interest}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {lead.budget}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {lead.lastContact}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Appointments Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Citas de Hoy</h2>
                <Button variant="ghost" size="sm" className="text-primary gap-1">
                  Calendario <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <Card className="border-border/40">
                <ScrollArea className="h-[360px]">
                  <div className="divide-y divide-border/40">
                    {appointments.map((apt) => (
                      <div key={apt.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Clock className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-foreground">{apt.time}</span>
                              <Badge variant="secondary" className="text-xs capitalize">
                                {apt.type}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-foreground truncate">{apt.client}</p>
                            <p className="text-xs text-muted-foreground truncate">{apt.property}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>

              {/* Goals Progress */}
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Meta del Mes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Ventas</span>
                      <span className="font-medium">$2.4M / $5M</span>
                    </div>
                    <Progress value={48} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Leads convertidos</span>
                      <span className="font-medium">7 / 15</span>
                    </div>
                    <Progress value={47} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardAsesor;
