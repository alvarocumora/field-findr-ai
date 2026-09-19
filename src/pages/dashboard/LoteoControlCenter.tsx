import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Gauge,
  Grid3X3,
  Clock,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Wallet,
  CalendarClock,
  Building2,
  Tags,
  EyeOff,
  Users,
  CalendarCheck,
  BarChart3,
  MapPinned,
} from 'lucide-react';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useProjects } from '@/hooks/useProjects';
import { useLots } from '@/hooks/useLots';
import {
  useReservations,
  useExtendReservation,
  useExpireStaleReservations,
} from '@/hooks/useReservations';
import { useAgentCommissions } from '@/hooks/useAgentCommissions';
import ConvertToSaleDialog from '@/components/reservations/ConvertToSaleDialog';
import LotQuoteDialog from '@/components/lots/LotQuoteDialog';
import BulkPriceAdjustDialog from '@/components/lots/BulkPriceAdjustDialog';
import LoteoPlanPublishCard from '@/components/lots/LoteoPlanPublishCard';
import type { Lot } from '@/hooks/useLots';
import { Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const formatShort = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

const LOT_STATUS_STYLE: Record<string, string> = {
  available: 'bg-emerald-500/80 hover:bg-emerald-500',
  reserved: 'bg-amber-500/80 hover:bg-amber-500',
  sold: 'bg-sky-600/80 hover:bg-sky-600',
};

const COMMISSION_STATUS: Record<string, { label: string; className: string }> = {
  potential: { label: 'Potencial', className: 'bg-muted text-muted-foreground border-border' },
  reserved: { label: 'Reservada', className: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
  earned: { label: 'Devengada · aprobar', className: 'bg-violet-500/10 text-violet-700 border-violet-500/20' },
  approved: { label: 'Aprobada · pagar', className: 'bg-sky-500/10 text-sky-700 border-sky-500/20' },
  paid: { label: 'Pagada', className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
  cancelled: { label: 'Cancelada', className: 'bg-muted text-muted-foreground border-border' },
};

type LotWithListing = Lot & { listing_id?: string | null };

/**
 * Control de Loteo — per-project sales command center.
 * Unifies inventory, absorption/velocity, action-required reservations and
 * commissions for a single project (every other console is account-global).
 */
const LoteoControlCenter = () => {
  const queryClient = useQueryClient();
  const { projects, isLoading: projectsLoading } = useProjects();
  const [projectId, setProjectId] = useState<string>('');
  const [convertTarget, setConvertTarget] = useState<any>(null);
  const [quoteLot, setQuoteLot] = useState<Lot | null>(null);
  const [bulkPriceOpen, setBulkPriceOpen] = useState(false);

  const activeProjectId = projectId || projects[0]?.id || '';
  const activeProject = projects.find((p) => p.id === activeProjectId);

  const { lots, isLoading: lotsLoading } = useLots(activeProjectId || undefined);
  const { data: reservations = [], isLoading: resLoading } = useReservations(activeProjectId || undefined);
  const { data: commissions = [], isLoading: comLoading } = useAgentCommissions(activeProjectId || undefined);

  const extendReservation = useExtendReservation();
  const expireStale = useExpireStaleReservations();

  // One expiry sweep on mount so the "expiring soon" panel reflects reality.
  const sweptRef = useRef(false);
  useEffect(() => {
    if (!sweptRef.current) {
      sweptRef.current = true;
      expireStale.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = projectsLoading || lotsLoading;

  // ── KPIs ──
  const kpis = useMemo(() => {
    const available = lots.filter((l) => l.status === 'available');
    const reserved = lots.filter((l) => l.status === 'reserved');
    const sold = lots.filter((l) => l.status === 'sold');
    const soldPct = lots.length > 0 ? Math.round((sold.length / lots.length) * 100) : 0;

    const senasCollected = reservations
      .filter((r: any) => r.status === 'paid' || r.status === 'converted')
      .reduce((s: number, r: any) => s + Number(r.reservation_amount || 0), 0);
    const soldValue = sold.reduce((s, l) => s + Number(l.price || 0), 0);
    const inventoryValue = available.reduce((s, l) => s + Number(l.price || 0), 0);

    // Sales velocity: sold lots in the last 90 days → monthly rate.
    const cutoff = subDays(new Date(), 90);
    const recentSales = sold.filter((l) => l.sale_date && new Date(l.sale_date) > cutoff).length;
    const monthlyRate = recentSales / 3;
    const monthsToSellOut = monthlyRate > 0 ? Math.ceil(available.length / monthlyRate) : null;

    // #104 replaced legacy `pending` with an auditable earned → approved → paid lifecycle.
    // Only earned/approved are a real payable balance; potential/reserved are not yet due.
    const pendingCommissions = commissions
      .filter((c) => c.status === 'earned' || c.status === 'approved')
      .reduce((s, c) => s + Number(c.commission_amount || 0), 0);

    return {
      total: lots.length,
      available: available.length,
      reserved: reserved.length,
      sold: sold.length,
      soldPct,
      senasCollected,
      soldValue,
      inventoryValue,
      recentSales,
      monthlyRate,
      monthsToSellOut,
      pendingCommissions,
    };
  }, [lots, reservations, commissions]);

  // ── Action required ──
  const now = Date.now();
  const expiringSoon = useMemo(
    () =>
      (reservations as any[])
        .filter(
          (r) =>
            r.status === 'pending_payment' &&
            new Date(r.expires_at).getTime() > now &&
            new Date(r.expires_at).getTime() - now < 24 * 3600 * 1000,
        )
        .sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()),
    [reservations, now],
  );
  const readyToConvert = useMemo(
    () => (reservations as any[]).filter((r) => r.status === 'paid'),
    [reservations],
  );

  const inventoryAlerts = useMemo(() => {
    const sellableLots = lots.filter((lot) => lot.status !== 'sold');
    const withoutPrice = sellableLots.filter((lot) => Number(lot.price || 0) <= 0);
    const unpublished = sellableLots.filter((lot) => !Boolean((lot as LotWithListing).listing_id));
    return { withoutPrice, unpublished };
  }, [lots]);

  const commercialReadiness = useMemo(() => {
    const checks = [
      { label: 'Inventario cargado', ready: kpis.total > 0 },
      { label: 'Precios completos', ready: inventoryAlerts.withoutPrice.length === 0 },
      { label: 'Fichas publicadas', ready: inventoryAlerts.unpublished.length === 0 },
      { label: 'Stock disponible', ready: kpis.available > 0 },
    ];
    const score = Math.round((checks.filter((check) => check.ready).length / checks.length) * 100);
    return { checks, score };
  }, [inventoryAlerts, kpis.available, kpis.total]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
    queryClient.invalidateQueries({ queryKey: ['lots'] });
  };

  const sortedLots = useMemo(
    () =>
      [...lots].sort((a, b) =>
        String(a.lot_number).localeCompare(String(b.lot_number), 'es', { numeric: true }),
      ),
    [lots],
  );

  const openCommissionRows = commissions.filter((c) => c.status === 'earned' || c.status === 'approved');
  const otherCommissionRows = commissions.filter(
    (c) => c.status !== 'earned' && c.status !== 'approved' && c.status !== 'cancelled',
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sin proyectos</h2>
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          Crea un proyecto de loteo para usar el centro de control de ventas.
        </p>
        <Button asChild>
          <a href="/asesor/projects">Ir a Proyectos</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Gauge className="h-7 w-7 text-primary" />
            Control de Loteo
          </h1>
          <p className="text-muted-foreground">
            Centro de comando de ventas y reservas por proyecto
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkPriceOpen(true)}
            disabled={!activeProjectId}
            className="rounded-xl"
          >
            <Percent className="h-4 w-4 mr-1.5" />
            Ajustar precios
          </Button>
          <Select value={activeProjectId} onValueChange={setProjectId}>
            <SelectTrigger className="w-full sm:w-[260px] rounded-xl">
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Selecciona proyecto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Commercial readiness and shortcuts */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="grid gap-6 p-5 lg:grid-cols-[0.9fr_1.1fr] lg:p-6">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Preparación comercial</p>
                <h2 className="mt-1 text-xl font-bold">Proyecto listo para vender</h2>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold tabular-nums">{commercialReadiness.score}%</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">completitud</p>
              </div>
            </div>
            <Progress value={commercialReadiness.score} className="mt-4 h-2.5" />
            <div className="mt-4 flex flex-wrap gap-2">
              {commercialReadiness.checks.map((check) => (
                <Badge key={check.label} variant={check.ready ? 'default' : 'outline'} className="gap-1.5">
                  {check.ready ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {check.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Mapa', text: 'Inventario', to: '/panel/inventario', icon: MapPinned },
              { label: 'Leads', text: 'Seguimiento', to: '/asesor/leads', icon: Users },
              { label: 'Reservas', text: 'Operación', to: '/asesor/reservations', icon: CalendarCheck },
              { label: 'Reportes', text: 'Resultados', to: '/asesor/reports', icon: BarChart3 },
            ].map((action) => (
              <Button key={action.to} asChild variant="outline" className="h-auto min-h-24 flex-col items-start justify-between rounded-2xl bg-background/60 p-4 text-left">
                <Link to={action.to}>
                  <action.icon className="h-5 w-5 text-primary" />
                  <span className="w-full">
                    <span className="block text-sm font-semibold">{action.label}</span>
                    <span className="block text-[10px] font-normal text-muted-foreground">{action.text}</span>
                  </span>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Lotes', value: String(kpis.total), sub: `${kpis.available} disponibles`, icon: Grid3X3, color: 'text-primary' },
          { label: 'Vendidos', value: `${kpis.soldPct}%`, sub: `${kpis.sold} de ${kpis.total}`, icon: CheckCircle2, color: 'text-sky-500' },
          { label: 'Reservados', value: String(kpis.reserved), sub: 'en proceso', icon: Clock, color: 'text-amber-500' },
          { label: 'Señas cobradas', value: formatShort(kpis.senasCollected), sub: 'pagadas + convertidas', icon: Wallet, color: 'text-emerald-500' },
          { label: 'Ventas', value: formatShort(kpis.soldValue), sub: 'lotes vendidos', icon: DollarSign, color: 'text-emerald-600' },
          { label: 'Comisiones', value: formatShort(kpis.pendingCommissions), sub: 'devengadas + aprobadas', icon: TrendingUp, color: 'text-violet-500' },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className={cn('h-4 w-4', kpi.color)} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-xl font-bold tabular-nums">{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Inventory health */}
      <Card className={cn(
        'border-border/40',
        (expiringSoon.length + inventoryAlerts.withoutPrice.length + inventoryAlerts.unpublished.length) > 0 && 'border-amber-500/30',
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex flex-wrap items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Salud de inventario
            {(expiringSoon.length + inventoryAlerts.withoutPrice.length + inventoryAlerts.unpublished.length) > 0 && (
              <Badge variant="secondary" className="ml-1">
                {expiringSoon.length + inventoryAlerts.withoutPrice.length + inventoryAlerts.unpublished.length} alertas
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarClock className="h-4 w-4 text-amber-500" /> Reservas por vencer
                </div>
                <Badge variant={expiringSoon.length > 0 ? 'secondary' : 'outline'}>{expiringSoon.length}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Pendientes de pago con menos de 24 horas de vigencia.</p>
            </div>
            <button
              type="button"
              onClick={() => setBulkPriceOpen(true)}
              className="rounded-xl border p-4 text-left transition hover:bg-muted/40"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Tags className="h-4 w-4 text-rose-500" /> Parcelas sin precio
                </div>
                <Badge variant={inventoryAlerts.withoutPrice.length > 0 ? 'secondary' : 'outline'}>{inventoryAlerts.withoutPrice.length}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Disponibles o reservadas sin precio comercial. Click para ajustar precios.</p>
            </button>
            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <EyeOff className="h-4 w-4 text-sky-500" /> Sin ficha publicada
                </div>
                <Badge variant={inventoryAlerts.unpublished.length > 0 ? 'secondary' : 'outline'}>{inventoryAlerts.unpublished.length}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Parcelas activas sin listing público asociado en el marketplace.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Action required */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Acción requerida
              {(expiringSoon.length + readyToConvert.length) > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {expiringSoon.length + readyToConvert.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : expiringSoon.length === 0 && readyToConvert.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Sin pendientes urgentes. Las reservas por vencer y las ventas por cerrar aparecerán aquí.
              </p>
            ) : (
              <>
                {expiringSoon.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.buyer_name}</p>
                      <p className="text-xs text-amber-600">
                        <CalendarClock className="inline h-3 w-3 mr-1" />
                        Vence {formatDistanceToNow(new Date(r.expires_at), { addSuffix: true, locale: es })}
                        {' · '}{r.lots?.name || `Lote ${r.lots?.lot_number}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      disabled={extendReservation.isPending}
                      onClick={() =>
                        extendReservation.mutate(
                          { reservationId: r.id, hours: 48 },
                          { onSuccess: invalidate },
                        )
                      }
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      +48h
                    </Button>
                  </div>
                ))}
                {readyToConvert.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-sky-500/30 bg-sky-500/5 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.buyer_name}</p>
                      <p className="text-xs text-sky-600">
                        Seña pagada · {r.lots?.name || `Lote ${r.lots?.lot_number}`} · {formatCLP(Number(r.reservation_amount || 0))}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0"
                      onClick={() => setConvertTarget(r)}
                    >
                      <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                      Cerrar venta
                    </Button>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* Sales velocity */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Ritmo de ventas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Avance de venta</span>
                <span className="font-semibold tabular-nums">{kpis.soldPct}%</span>
              </div>
              <Progress value={kpis.soldPct} className="h-2.5" />
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                <span>{kpis.sold} vendidos · {kpis.reserved} reservados</span>
                <span>{kpis.available} disponibles</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-lg font-bold tabular-nums">{kpis.recentSales}</p>
                <p className="text-[11px] text-muted-foreground">ventas últimos 90d</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-lg font-bold tabular-nums">{kpis.monthlyRate.toFixed(1)}</p>
                <p className="text-[11px] text-muted-foreground">lotes/mes</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-lg font-bold tabular-nums">
                  {kpis.monthsToSellOut === null ? '—' : `${kpis.monthsToSellOut}m`}
                </p>
                <p className="text-[11px] text-muted-foreground">para agotar stock</p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Inventario disponible valorizado en{' '}
              <span className="font-semibold text-foreground">{formatCLP(kpis.inventoryValue)}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory chips */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-primary" />
            Inventario · {activeProject?.name}
            <span className="ml-auto flex items-center gap-3 text-[11px] font-normal text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/80" /> Disponible</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-amber-500/80" /> Reservado</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-sky-600/80" /> Vendido</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedLots.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Este proyecto aún no tiene lotes cargados.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {sortedLots.map((lot) => (
                <Tooltip key={lot.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setQuoteLot(lot)}
                      className={cn(
                        'inline-flex h-8 min-w-8 px-1.5 items-center justify-center rounded-md text-[11px] font-semibold text-white transition-colors',
                        LOT_STATUS_STYLE[lot.status ?? 'available'] ?? LOT_STATUS_STYLE.available,
                      )}
                    >
                      {lot.lot_number}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-semibold">{lot.name || `Lote ${lot.lot_number}`}</p>
                    <p>{Number(lot.area).toLocaleString('es-CL')} m² · {lot.price ? formatCLP(Number(lot.price)) : 'Sin precio'}</p>
                    {lot.status === 'sold' && lot.sale_date ? (
                      <p className="text-muted-foreground">
                        Vendido {format(new Date(lot.sale_date), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">Click para cotizar</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plano + publicación al marketplace */}
      <LoteoPlanPublishCard
        project={activeProject}
        lots={lots}
        onLotClick={(lot) => setQuoteLot(lot)}
      />

      {/* Commissions */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4 text-violet-500" />
            Comisiones del proyecto
            {openCommissionRows.length > 0 && (
              <Badge variant="secondary" className="ml-1">{openCommissionRows.length} por gestionar</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {comLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : commissions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Las comisiones se generan al cerrar una venta desde una reserva pagada.
            </p>
          ) : (
            <div className="divide-y divide-border/40">
              {[...openCommissionRows, ...otherCommissionRows].map((c) => {
                const status = COMMISSION_STATUS[c.status] ?? COMMISSION_STATUS.potential;
                return (
                  <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium tabular-nums">
                        {formatCLP(Number(c.commission_amount))}{' '}
                        <span className="text-xs text-muted-foreground font-normal">
                          ({c.commission_rate}% de {formatShort(Number(c.sale_amount))})
                        </span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(c.created_at), 'dd/MM/yyyy', { locale: es })}
                        {c.notes ? ` · ${c.notes}` : ''}
                      </p>
                    </div>
                    <Badge variant="outline" className={status.className}>
                      {status.label}
                      {c.status === 'paid' && c.paid_at ? ` · ${format(new Date(c.paid_at), 'dd/MM', { locale: es })}` : ''}
                    </Badge>
                  </div>
                );
              })}
              {openCommissionRows.length > 0 && (
                <p className="py-3 text-xs text-muted-foreground">
                  El pago de comisiones se controla desde Administración: devengada → aprobada → pagada. Este panel no permite auto-declarar pagos.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ConvertToSaleDialog
        open={!!convertTarget}
        onOpenChange={(open) => {
          if (!open) {
            setConvertTarget(null);
            invalidate();
          }
        }}
        reservation={convertTarget}
      />

      <LotQuoteDialog
        open={!!quoteLot}
        onOpenChange={(open) => !open && setQuoteLot(null)}
        lot={quoteLot}
        projectName={activeProject?.name ?? ''}
        projectLocation={[activeProject?.city, activeProject?.region].filter(Boolean).join(', ')}
        reservationDeposit={(activeProject as any)?.reservation_deposit ?? null}
      />

      <BulkPriceAdjustDialog
        open={bulkPriceOpen}
        onOpenChange={setBulkPriceOpen}
        projects={projects}
        lots={lots}
        defaultProjectId={activeProjectId}
      />
    </div>
  );
};

export default LoteoControlCenter;
