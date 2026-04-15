import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import {
  ArrowLeft, MapPin, Ruler, DollarSign, Shield, Zap, Droplets,
  Route, Trees, Building2, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, FileText, Users, MessageSquare, Lightbulb, Target,
  Phone, Mail, Calendar, ChevronRight, Layers, Star, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { OpportunityDocuments } from '@/components/opportunities/OpportunityDocuments';

const getAIScore = (listing: any): number => {
  let score = 50;
  if (listing.area_m2 && listing.area_m2 > 5000) score += 10;
  if (listing.featured) score += 15;
  const u = listing.utilities as Record<string, boolean> | null;
  if (u?.water) score += 8;
  if (u?.electricity) score += 7;
  if (u?.road) score += 5;
  if (listing.zoning) score += 5;
  return Math.min(score, 100);
};

const getRiskLevel = (score: number) => {
  if (score >= 80) return { label: 'Bajo', color: 'text-green-500', bg: 'bg-green-500/15' };
  if (score >= 60) return { label: 'Medio', color: 'text-amber-500', bg: 'bg-amber-500/15' };
  return { label: 'Alto', color: 'text-red-500', bg: 'bg-red-500/15' };
};

const getNextAction = (listing: any): { action: string; icon: typeof CheckCircle2; priority: string } => {
  const u = listing.utilities as Record<string, boolean> | null;
  if (listing.legal_status === 'pending') return { action: 'Verificar estado legal del terreno', icon: Shield, priority: 'Alta' };
  if (!u?.water && !u?.electricity) return { action: 'Evaluar factibilidad de servicios básicos', icon: Zap, priority: 'Alta' };
  if (!listing.zoning) return { action: 'Confirmar zonificación y uso de suelo', icon: Layers, priority: 'Media' };
  if (!listing.description) return { action: 'Completar descripción comercial', icon: FileText, priority: 'Baja' };
  return { action: 'Programar visita a terreno', icon: Calendar, priority: 'Media' };
};

const OpportunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState('');

  const { data: listing, isLoading } = useQuery({
    queryKey: ['opportunity-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: relatedLeads = [] } = useQuery({
    queryKey: ['opportunity-leads', id, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('leads')
        .select('id, first_name, last_name, phone, email, status, lead_score')
        .eq('user_id', user.id)
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Oportunidad no encontrada</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/asesor/opportunities')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
      </div>
    );
  }

  const aiScore = getAIScore(listing);
  const risk = getRiskLevel(aiScore);
  const nextAction = getNextAction(listing);
  const utilities = listing.utilities as Record<string, boolean> | null;
  const NextIcon = nextAction.icon;

  const formatPrice = (price: number) => {
    if (price >= 1e9) return `$${(price / 1e9).toFixed(1)}B`;
    if (price >= 1e6) return `$${(price / 1e6).toFixed(0)}M`;
    return `$${price.toLocaleString('es-CL')}`;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/asesor/opportunities')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{listing.title}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{listing.city || listing.region || listing.location}</span>
              {listing.rol && <Badge variant="outline" className="text-xs">ROL: {listing.rol}</Badge>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold', risk.bg, risk.color)}>
            <AlertTriangle className="h-3.5 w-3.5" />
            Riesgo {risk.label}
          </div>
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold',
            aiScore >= 75 ? 'bg-emerald-500/15 text-emerald-500' :
            aiScore >= 55 ? 'bg-blue-500/15 text-blue-500' : 'bg-amber-500/15 text-amber-500'
          )}>
            <TrendingUp className="h-3.5 w-3.5" />
            AI Score: {aiScore}
          </div>
        </div>
      </div>

      {/* Next Recommended Action */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Próxima acción recomendada</p>
              <p className="text-sm font-medium flex items-center gap-2">
                <NextIcon className="h-3.5 w-3.5" />
                {nextAction.action}
              </p>
            </div>
          </div>
          <Badge variant={nextAction.priority === 'Alta' ? 'destructive' : 'secondary'} className="text-xs">
            Prioridad {nextAction.priority}
          </Badge>
        </CardContent>
      </Card>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Precio Estimado', value: formatPrice(listing.price), icon: DollarSign, color: 'text-green-500' },
          { label: 'Superficie', value: listing.area_ha ? `${listing.area_ha} ha` : listing.area_m2 ? `${listing.area_m2.toLocaleString()} m²` : 'N/D', icon: Ruler, color: 'text-blue-500' },
          { label: 'Estado Legal', value: listing.legal_status === 'verified' ? 'Verificado' : listing.legal_status === 'reviewing' ? 'En Revisión' : 'Pendiente', icon: Shield, color: listing.legal_status === 'verified' ? 'text-green-500' : 'text-amber-500' },
          { label: 'Zonificación', value: listing.zoning || 'Sin definir', icon: Layers, color: 'text-purple-500' },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className={cn('h-4 w-4', kpi.color)} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-lg font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="commercial">Potencial</TabsTrigger>
          <TabsTrigger value="infrastructure">Infraestructura</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="contacts">Contactos</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Título', value: listing.title },
                  { label: 'Ubicación', value: `${listing.city || ''}, ${listing.region || ''}` },
                  { label: 'Dirección', value: listing.address || 'No especificada' },
                  { label: 'Tipo', value: listing.type },
                  { label: 'ROL Catastral', value: listing.rol || 'No registrado' },
                  { label: 'País', value: listing.country || 'Chile' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-right max-w-[60%] truncate">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" /> Métricas de Evaluación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">AI Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', aiScore >= 75 ? 'bg-emerald-500' : aiScore >= 55 ? 'bg-blue-500' : 'bg-amber-500')}
                        style={{ width: `${aiScore}%` }}
                      />
                    </div>
                    <span className="font-bold">{aiScore}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Riesgo</span>
                  <span className={cn('font-medium', risk.color)}>{risk.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precio/m²</span>
                  <span className="font-medium">
                    {listing.area_m2 ? `$${Math.round(listing.price / listing.area_m2).toLocaleString('es-CL')}` : 'N/D'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vistas</span>
                  <span className="font-medium">{listing.views_count || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subdivisible</span>
                  <span className="font-medium">{listing.subdivision_eligible ? 'Sí' : 'No'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Publicado</span>
                  <span className="font-medium">
                    {listing.created_at ? format(new Date(listing.created_at), 'dd MMM yyyy', { locale: es }) : 'N/D'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {listing.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{listing.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Images */}
          {listing.images && listing.images.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Galería</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {listing.images.slice(0, 8).map((img: string, i: number) => (
                    <img key={i} src={img} alt={`${listing.title} ${i+1}`} className="rounded-lg aspect-video object-cover w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Commercial Potential Tab */}
        <TabsContent value="commercial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" /> Potencial Comercial
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const uses: { label: string; fit: string }[] = [];
                  const area = listing.area_m2 || 0;
                  if (area > 50000) uses.push({ label: 'Desarrollo Inmobiliario', fit: 'Excelente' });
                  if (area > 10000) uses.push({ label: 'Parcelas de Agrado', fit: 'Alto' });
                  if (listing.zoning?.includes('agri') || area > 20000) uses.push({ label: 'Uso Agrícola', fit: 'Medio' });
                  if (utilities?.road) uses.push({ label: 'Uso Comercial/Logístico', fit: 'Medio' });
                  if (uses.length === 0) uses.push({ label: 'Inversión a Largo Plazo', fit: 'Medio' });
                  return uses.map((use, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span>{use.label}</span>
                      <Badge variant="outline" className={cn('text-xs',
                        use.fit === 'Excelente' ? 'border-green-500 text-green-500' :
                        use.fit === 'Alto' ? 'border-blue-500 text-blue-500' : 'border-amber-500 text-amber-500'
                      )}>
                        {use.fit}
                      </Badge>
                    </div>
                  ));
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" /> Proyección de Valor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precio Actual</span>
                  <span className="font-bold">{formatPrice(listing.price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimación 3 años (+15%)</span>
                  <span className="font-medium text-green-500">{formatPrice(Math.round(listing.price * 1.15))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimación 5 años (+30%)</span>
                  <span className="font-medium text-green-500">{formatPrice(Math.round(listing.price * 1.3))}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 italic">
                  *Proyecciones estimadas basadas en tendencias promedio del mercado local.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Infrastructure Tab */}
        <TabsContent value="infrastructure" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Disponibilidad de Servicios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Agua', available: !!utilities?.water, icon: Droplets },
                  { label: 'Electricidad', available: !!utilities?.electricity, icon: Zap },
                  { label: 'Acceso Vial', available: !!utilities?.road, icon: Route },
                  { label: 'Alcantarillado', available: !!utilities?.sewer, icon: Building2 },
                ].map((svc, i) => (
                  <div key={i} className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border',
                    svc.available ? 'border-green-500/30 bg-green-500/5' : 'border-muted bg-muted/30'
                  )}>
                    <svc.icon className={cn('h-4 w-4', svc.available ? 'text-green-500' : 'text-muted-foreground')} />
                    <span className="text-sm font-medium">{svc.label}</span>
                    {svc.available ? (
                      <CheckCircle2 className="h-4 w-4 ml-auto text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 ml-auto text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Información Faltante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { label: 'ROL catastral', missing: !listing.rol },
                  { label: 'Zonificación', missing: !listing.zoning },
                  { label: 'Coordenadas GPS', missing: !listing.lat || !listing.lng },
                  { label: 'Descripción', missing: !listing.description },
                  { label: 'Imágenes', missing: !listing.images || listing.images.length === 0 },
                ].filter(i => i.missing).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-amber-500 bg-amber-500/5 rounded-md px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>Falta: {item.label}</span>
                  </div>
                ))}
                {[!listing.rol, !listing.zoning, !listing.lat, !listing.description, !listing.images?.length].every(v => !v) && (
                  <div className="flex items-center gap-2 text-sm text-green-500 bg-green-500/5 rounded-md px-3 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Toda la información está completa</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <OpportunityDocuments listingId={id!} />
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Contactos Relacionados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {relatedLeads.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>No hay contactos vinculados</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/asesor/contacts')}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Agregar Contacto
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {relatedLeads.map(lead => (
                    <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {lead.first_name[0]}{lead.last_name?.[0] || ''}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{lead.first_name} {lead.last_name}</p>
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {lead.phone && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <a href={`tel:${lead.phone}`}><Phone className="h-3.5 w-3.5" /></a>
                          </Button>
                        )}
                        {lead.email && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <a href={`mailto:${lead.email}`}><Mail className="h-3.5 w-3.5" /></a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" /> Notas y Observaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Escribe tus notas sobre esta oportunidad..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="min-h-[120px] resize-none"
              />
              <div className="flex justify-end">
                <Button size="sm" disabled={!notes.trim()}>
                  Guardar Nota
                </Button>
              </div>
              <div className="border-t pt-3 mt-3">
                <p className="text-xs text-muted-foreground">Historial de notas</p>
                <div className="mt-2 space-y-2">
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Sin notas previas
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OpportunityDetail;
