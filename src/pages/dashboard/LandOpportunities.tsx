import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useListings } from '@/hooks/useListings';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, LayoutGrid, List, MapPin, TrendingUp,
  Eye, FileText, AlertTriangle, Star, ChevronRight, Layers,
  Target, Clock, Building2, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PIPELINE_STAGES = [
  { key: 'captured', label: 'Capturado', color: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  { key: 'pre_evaluation', label: 'Pre-evaluación', color: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  { key: 'legal_review', label: 'Revisión Legal', color: 'bg-purple-500/15 text-purple-600 border-purple-500/30' },
  { key: 'negotiation', label: 'Negociación', color: 'bg-orange-500/15 text-orange-600 border-orange-500/30' },
  { key: 'closed', label: 'Cerrado', color: 'bg-green-500/15 text-green-600 border-green-500/30' },
  { key: 'discarded', label: 'Descartado', color: 'bg-red-500/15 text-red-500 border-red-500/30' },
];

const LEGAL_STATUSES = [
  { key: 'pending', label: 'Pendiente', color: 'bg-yellow-500/15 text-yellow-600' },
  { key: 'reviewing', label: 'En Revisión', color: 'bg-blue-500/15 text-blue-600' },
  { key: 'verified', label: 'Verificado', color: 'bg-green-500/15 text-green-600' },
  { key: 'rejected', label: 'Rechazado', color: 'bg-red-500/15 text-red-500' },
];

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

const getRiskLevel = (listing: any): { label: string; color: string } => {
  const score = getAIScore(listing);
  if (score >= 80) return { label: 'Bajo', color: 'text-green-500' };
  if (score >= 60) return { label: 'Medio', color: 'text-amber-500' };
  return { label: 'Alto', color: 'text-red-500' };
};

const getPipelineStage = (listing: any) => {
  if (listing.status === 'sold') return PIPELINE_STAGES[4];
  if (listing.legal_status === 'verified') return PIPELINE_STAGES[2];
  if (listing.featured) return PIPELINE_STAGES[1];
  return PIPELINE_STAGES[0];
};

const formatPrice = (price: number, currency = 'CLP') => {
  if (currency === 'UF') return `UF ${price.toLocaleString('es-CL')}`;
  if (price >= 1_000_000_000) return `$${(price / 1_000_000_000).toFixed(1)}B`;
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(0)}M`;
  return `$${price.toLocaleString('es-CL')}`;
};

const formatArea = (m2: number | null, ha: number | null) => {
  if (ha && ha >= 1) return `${ha.toLocaleString('es-CL')} ha`;
  if (m2) return `${m2.toLocaleString('es-CL')} m²`;
  return '—';
};

const LandOpportunities = () => {
  const navigate = useNavigate();
  const { data: listings, isLoading } = useListings();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'table' | 'card'>('table');
  const [regionFilter, setRegionFilter] = useState('all');
  const [legalFilter, setLegalFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = useMemo(() => {
    if (!listings) return [];
    return listings.filter(l => {
      if (search) {
        const q = search.toLowerCase();
        if (!l.title.toLowerCase().includes(q) &&
            !(l.location || '').toLowerCase().includes(q) &&
            !(l.region || '').toLowerCase().includes(q)) return false;
      }
      if (regionFilter !== 'all' && l.region !== regionFilter) return false;
      if (legalFilter !== 'all' && l.legal_status !== legalFilter) return false;
      if (typeFilter !== 'all' && l.type !== typeFilter) return false;
      return true;
    });
  }, [listings, search, regionFilter, legalFilter, typeFilter]);

  const regions = useMemo(() => {
    if (!listings) return [];
    return [...new Set(listings.map(l => l.region).filter(Boolean))].sort();
  }, [listings]);

  const types = useMemo(() => {
    if (!listings) return [];
    return [...new Set(listings.map(l => l.type).filter(Boolean))].sort();
  }, [listings]);

  // KPIs
  const kpis = useMemo(() => {
    const total = filtered.length;
    const highPriority = filtered.filter(l => getAIScore(l) >= 75).length;
    const underReview = filtered.filter(l => l.legal_status === 'reviewing').length;
    const verified = filtered.filter(l => l.legal_status === 'verified').length;
    return { total, highPriority, underReview, verified };
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Land Opportunities
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} oportunidades encontradas
          </p>
        </div>
        <Button className="gap-2" onClick={() => navigate('/publish')}>
          <Plus className="h-4 w-4" />
          Nueva Oportunidad
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Oportunidades', value: kpis.total, icon: Layers, iconColor: 'text-primary' },
          { label: 'Alta Prioridad', value: kpis.highPriority, icon: Star, iconColor: 'text-amber-500' },
          { label: 'En Revisión', value: kpis.underReview, icon: Eye, iconColor: 'text-blue-500' },
          { label: 'Verificadas', value: kpis.verified, icon: Target, iconColor: 'text-green-500' },
        ].map((kpi, i) => (
          <Card key={i} className="border-border/40">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center', kpi.iconColor)}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-xl font-bold text-foreground">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-border/40">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, ubicación o región..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Región" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las regiones</SelectItem>
                {regions.map(r => <SelectItem key={r} value={r!}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={legalFilter} onValueChange={setLegalFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado Legal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo</SelectItem>
                {LEGAL_STATUSES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex border border-border rounded-lg overflow-hidden">
              <Button
                variant={view === 'table' ? 'default' : 'ghost'}
                size="icon"
                className="rounded-none h-9 w-9"
                onClick={() => setView('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'card' ? 'default' : 'ghost'}
                size="icon"
                className="rounded-none h-9 w-9"
                onClick={() => setView('card')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {view === 'table' ? (
        <Card className="border-border/40 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold">Propiedad</TableHead>
                  <TableHead className="font-semibold">Región / Comuna</TableHead>
                  <TableHead className="font-semibold">Superficie</TableHead>
                  <TableHead className="font-semibold">Precio</TableHead>
                  <TableHead className="font-semibold">Estado Legal</TableHead>
                  <TableHead className="font-semibold text-center">AI Score</TableHead>
                  <TableHead className="font-semibold">Pipeline</TableHead>
                  <TableHead className="font-semibold text-center">Riesgo</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      No se encontraron oportunidades con esos filtros
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(listing => {
                  const score = getAIScore(listing);
                  const risk = getRiskLevel(listing);
                  const stage = getPipelineStage(listing);
                  const legal = LEGAL_STATUSES.find(s => s.key === listing.legal_status) || LEGAL_STATUSES[0];

                  return (
                    <TableRow
                      key={listing.id}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => navigate(`/asesor/opportunity/${listing.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-[200px]">
                          {listing.images?.[0] ? (
                            <img src={listing.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{listing.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{listing.type}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[150px]">{listing.region || listing.location}</span>
                        </div>
                        {listing.city && <p className="text-xs text-muted-foreground mt-0.5">{listing.city}</p>}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{formatArea(listing.area_m2, listing.area_ha)}</TableCell>
                      <TableCell className="text-sm font-semibold text-foreground">
                        {formatPrice(listing.price, listing.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-xs', legal.color)}>
                          {legal.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className={cn(
                            'h-2 w-2 rounded-full',
                            score >= 75 ? 'bg-green-500' : score >= 55 ? 'bg-amber-500' : 'bg-red-500'
                          )} />
                          <span className="text-sm font-bold">{score}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-xs', stage.color)}>
                          {stage.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn('text-xs font-medium', risk.color)}>{risk.label}</span>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(listing => {
            const score = getAIScore(listing);
            const risk = getRiskLevel(listing);
            const stage = getPipelineStage(listing);
            const legal = LEGAL_STATUSES.find(s => s.key === listing.legal_status) || LEGAL_STATUSES[0];
            const u = listing.utilities as Record<string, boolean> | null;

            return (
              <Card
                key={listing.id}
                className="border-border/40 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer overflow-hidden group"
                onClick={() => navigate(`/propiedad/${listing.id}`)}
              >
                {/* Image */}
                <div className="relative h-40 bg-muted overflow-hidden">
                  {listing.images?.[0] ? (
                    <img src={listing.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <Badge className="bg-background/90 text-foreground backdrop-blur text-xs font-bold">
                      AI {score}
                    </Badge>
                    <Badge variant="outline" className={cn('backdrop-blur text-xs', stage.color)}>
                      {stage.label}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground truncate">{listing.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      {listing.region || listing.location}
                      {listing.city && ` · ${listing.city}`}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Superficie</p>
                      <p className="font-medium">{formatArea(listing.area_m2, listing.area_ha)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Precio</p>
                      <p className="font-semibold text-primary">{formatPrice(listing.price, listing.currency)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <Badge variant="outline" className={cn('text-xs', legal.color)}>{legal.label}</Badge>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {u?.water && <span title="Agua">💧</span>}
                      {u?.electricity && <span title="Electricidad">⚡</span>}
                      {u?.road && <span title="Camino">🛣️</span>}
                      <span className={cn('font-medium', risk.color)}>Riesgo {risk.label}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              No se encontraron oportunidades con esos filtros
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LandOpportunities;
