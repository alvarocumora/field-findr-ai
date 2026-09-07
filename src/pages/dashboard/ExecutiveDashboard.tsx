import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCopy,
  FileText,
  Map,
  MessageCircle,
  Search,
  Send,
  ShoppingCart,
  UserRound,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjects } from '@/hooks/useProjects';
import { Lot, useLots } from '@/hooks/useLots';
import { useLeads } from '@/hooks/useLeads';
import { useCreateReservation, useReservations } from '@/hooks/useReservations';
import { useActiveSalesQuotesCount, useCreateSalesQuote, useMarkSalesQuoteSent, useSalesQuotes } from '@/hooks/useSalesQuotes';
import { formatPriceLatam } from '@/lib/latam';
import { toast } from 'sonner';

const ExecutiveDashboard = () => {
  const { projects } = useProjects();
  const { lots, isLoading } = useLots();
  const { leads = [] } = useLeads();
  const { data: reservations = [] } = useReservations();
  const { data: salesQuotes = [] } = useSalesQuotes(20);
  const { data: activeSalesQuotesCount = 0 } = useActiveSalesQuotesCount();
  const createReservation = useCreateReservation();
  const createQuote = useCreateSalesQuote();
  const markQuoteSent = useMarkSalesQuoteSent();
  const [searchParams, setSearchParams] = useSearchParams();

  const [projectId, setProjectId] = useState('all');
  const [search, setSearch] = useState('');
  const [quoteLot, setQuoteLot] = useState<Lot | null>(null);
  const [reserveLot, setReserveLot] = useState<Lot | null>(null);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [quote, setQuote] = useState({ customer: '', email: '', phone: '', discount: '0', validDays: '7' });
  const [reserve, setReserve] = useState({ name: '', email: '', phone: '', amount: '100000' });

  const updateQuote = (values: Partial<typeof quote>) => {
    setSavedQuoteId(null);
    setQuote((current) => ({ ...current, ...values }));
  };

  const projectById = useMemo(
    () => new globalThis.Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const lotById = useMemo(
    () => new globalThis.Map(lots.map((lot) => [lot.id, lot])),
    [lots],
  );

  useEffect(() => {
    const lotId = searchParams.get('lot');
    const action = searchParams.get('action');
    if (!lotId || !action || lots.length === 0) return;

    const lot = lots.find((item) => item.id === lotId);
    if (!lot) return;

    if (action === 'quote') {
      setQuoteLot(lot);
      setSavedQuoteId(null);
      setQuote({ customer: '', email: '', phone: '', discount: '0', validDays: '7' });
    } else if (action === 'reserve') {
      setReserveLot(lot);
    } else {
      return;
    }

    setProjectId(lot.project_id);
    setSearchParams({}, { replace: true });
  }, [lots, searchParams, setSearchParams]);

  const visibleLots = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return lots
      .filter((lot) => lot.status === 'available')
      .filter((lot) => projectId === 'all' || lot.project_id === projectId)
      .filter((lot) => {
        if (!needle) return true;
        const project = projectById.get(lot.project_id);
        return [lot.lot_number, lot.name, project?.name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));
      });
  }, [lots, projectId, search, projectById]);

  const stats = useMemo(() => ({
    available: lots.filter((lot) => lot.status === 'available').length,
    reserved: lots.filter((lot) => lot.status === 'reserved').length,
    sold: lots.filter((lot) => lot.status === 'sold').length,
    activeReservations: (reservations as any[]).filter((r) => ['pending_payment', 'paid'].includes(r.status)).length,
    quotes: activeSalesQuotesCount,
    leads: leads.length,
  }), [lots, reservations, activeSalesQuotesCount, leads]);

  const formatMoney = (value: number | string | null | undefined) =>
    formatPriceLatam(Number(value || 0), 'CLP');

  const quoteTotal = quoteLot
    ? Math.max(0, Number(quoteLot.price || 0) - Number(quote.discount || 0))
    : 0;

  const quoteText = quoteLot
    ? [
        'Cotización OfertaTerrenos',
        quote.customer ? `Cliente: ${quote.customer}` : null,
        `Proyecto: ${projectById.get(quoteLot.project_id)?.name || 'Proyecto'}`,
        `Parcela: ${quoteLot.name || `Lote ${quoteLot.lot_number}`}`,
        quoteLot.area ? `Superficie: ${Number(quoteLot.area).toLocaleString('es-CL')} m²` : null,
        `Precio lista: ${formatMoney(quoteLot.price)}`,
        Number(quote.discount) > 0 ? `Descuento: ${formatMoney(quote.discount)}` : null,
        `Precio cotizado: ${formatMoney(quoteTotal)}`,
        `Vigencia: ${quote.validDays || 7} días`,
        '',
        'Cotización sujeta a disponibilidad de la parcela.',
      ].filter(Boolean).join('\n')
    : '';

  const ensureQuote = async () => {
    if (savedQuoteId) return savedQuoteId;
    if (!quoteLot) throw new Error('Selecciona una parcela.');
    if (!quote.customer.trim()) {
      toast.error('Ingresa el nombre del cliente antes de guardar o enviar');
      throw new Error('Cliente requerido');
    }

    const listPrice = Number(quoteLot.price || 0);
    const discount = Math.max(0, Number(quote.discount || 0));
    const validDays = Math.max(1, Number(quote.validDays || 7));
    if (discount > listPrice) {
      toast.error('El descuento no puede superar el precio de lista');
      throw new Error('Descuento inválido');
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    const saved = await createQuote.mutateAsync({
      project_id: quoteLot.project_id,
      lot_id: quoteLot.id,
      customer_name: quote.customer,
      customer_email: quote.email || null,
      customer_phone: quote.phone || null,
      list_price: listPrice,
      discount_amount: discount,
      quoted_price: listPrice - discount,
      valid_until: validUntil.toISOString(),
      notes: 'Cotización creada desde Sales Executive OS',
    });

    setSavedQuoteId(saved.id);
    toast.success('Cotización guardada');
    return saved.id;
  };

  const copyQuote = async () => {
    try {
      await ensureQuote();
      await navigator.clipboard.writeText(quoteText);
      toast.success('Cotización copiada y registrada');
    } catch (error) {
      if ((error as Error).message !== 'Cliente requerido' && (error as Error).message !== 'Descuento inválido') {
        toast.error((error as Error).message);
      }
    }
  };

  const sendWhatsApp = async () => {
    const popup = window.open('about:blank', '_blank');
    if (popup) popup.opener = null;

    try {
      const id = await ensureQuote();
      await markQuoteSent.mutateAsync(id);
      const phone = quote.phone.replace(/\D/g, '');
      const target = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(quoteText)}` : `https://wa.me/?text=${encodeURIComponent(quoteText)}`;
      if (popup) popup.location.href = target;
      else window.location.href = target;
      toast.success('Cotización marcada como enviada');
    } catch (error) {
      popup?.close();
      if ((error as Error).message !== 'Cliente requerido' && (error as Error).message !== 'Descuento inválido') {
        toast.error((error as Error).message);
      }
    }
  };

  const sendEmail = async () => {
    try {
      const id = await ensureQuote();
      await markQuoteSent.mutateAsync(id);
      const subject = quoteLot ? `Cotización ${quoteLot.name || `Lote ${quoteLot.lot_number}`}` : 'Cotización OfertaTerrenos';
      window.location.href = `mailto:${encodeURIComponent(quote.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(quoteText)}`;
      toast.success('Cotización marcada como enviada');
    } catch (error) {
      if ((error as Error).message !== 'Cliente requerido' && (error as Error).message !== 'Descuento inválido') {
        toast.error((error as Error).message);
      }
    }
  };

  const submitReservation = async () => {
    if (!reserveLot || !reserve.name.trim() || !reserve.email.trim()) {
      toast.error('Completa nombre y email del comprador');
      return;
    }

    const result = await createReservation.mutateAsync({
      lot_id: reserveLot.id,
      buyer_name: reserve.name.trim(),
      buyer_email: reserve.email.trim(),
      buyer_phone: reserve.phone.trim() || undefined,
      reservation_amount: Number(reserve.amount || 0) || undefined,
      notes: 'Reserva iniciada por ejecutivo desde Dashboard Ejecutivo',
    });

    setReserveLot(null);
    setReserve({ name: '', email: '', phone: '', amount: '100000' });
    if (result.payment_url) {
      window.open(result.payment_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="outline" className="mb-2">Sales Executive OS</Badge>
          <h1 className="text-2xl font-bold text-foreground">Cockpit de ventas</h1>
          <p className="text-sm text-muted-foreground">
            Disponibilidad, cotización, reserva y visita desde un solo flujo comercial.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link to="/panel/inventario"><Map className="mr-2 h-4 w-4" />Masterplan</Link></Button>
          <Button variant="outline" asChild><Link to="/asesor/reservations"><ShoppingCart className="mr-2 h-4 w-4" />Reservas</Link></Button>
          <Button asChild><Link to="/asesor/visitas"><CalendarClock className="mr-2 h-4 w-4" />Agendar visita</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          ['Disponibles', stats.available, 'Listas para ofrecer'],
          ['Reservadas', stats.reserved, 'En negociación'],
          ['Vendidas', stats.sold, 'Cierres'],
          ['Reservas activas', stats.activeReservations, 'Pendientes/pagadas'],
          ['Cotizaciones', stats.quotes, 'Borrador/enviadas'],
          ['Leads', stats.leads, 'CRM comercial'],
        ].map(([label, value, sub]) => (
          <Card key={String(label)}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-[11px] text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: '/asesor/leads', icon: UserRound, title: 'Clientes y leads', text: 'Seguimiento y próximos contactos' },
          { to: '/asesor/reservations', icon: ShoppingCart, title: 'Reservas', text: 'Pagos, vencimientos y conversión' },
          { to: '/asesor/visitas', icon: CalendarClock, title: 'Visitas', text: 'Agenda y resultados en terreno' },
          { to: '/asesor/pipeline', icon: CheckCircle2, title: 'Pipeline', text: 'Proceso comercial hasta el cierre' },
        ].map((action) => (
          <Link key={action.to} to={action.to} className="block">
            <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/20">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="rounded-lg bg-primary/10 p-2 text-primary"><action.icon className="h-4 w-4" /></div>
                <div><p className="font-medium">{action.title}</p><p className="text-xs text-muted-foreground">{action.text}</p></div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Parcelas disponibles</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Selecciona una parcela y ejecuta la siguiente acción de venta.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Proyecto" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proyectos</SelectItem>
                  {projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9 sm:w-64" placeholder="Buscar lote o proyecto" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Cargando inventario…</p>
          ) : visibleLots.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No hay parcelas disponibles para estos filtros.</p>
          ) : (
            <div className="divide-y rounded-xl border">
              {visibleLots.slice(0, 30).map((lot) => (
                <div key={lot.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{lot.name || `Lote ${lot.lot_number}`}</p>
                      <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">Disponible</Badge>
                      <span className="text-xs text-muted-foreground">{projectById.get(lot.project_id)?.name}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                      <span>{Number(lot.area || 0).toLocaleString('es-CL')} m²</span>
                      <span className="font-medium text-foreground">{formatMoney(lot.price)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setQuoteLot(lot); setSavedQuoteId(null); setQuote({ customer: '', email: '', phone: '', discount: '0', validDays: '7' }); }}>
                      <FileText className="mr-1.5 h-4 w-4" />Cotizar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setReserveLot(lot)}>
                      <ShoppingCart className="mr-1.5 h-4 w-4" />Reservar
                    </Button>
                    <Button size="sm" asChild>
                      <Link to={`/asesor/visitas?project=${encodeURIComponent(lot.project_id)}&lot=${encodeURIComponent(lot.id)}`}>
                        <CalendarClock className="mr-1.5 h-4 w-4" />Visita
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card id="cotizaciones">
        <CardHeader>
          <CardTitle>Cotizaciones recientes</CardTitle>
          <p className="text-sm text-muted-foreground">Historial comercial guardado por ejecutivo, cliente y parcela.</p>
        </CardHeader>
        <CardContent>
          {salesQuotes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay cotizaciones guardadas.</p>
          ) : (
            <div className="divide-y rounded-xl border">
              {salesQuotes.slice(0, 8).map((item) => {
                const lot = lotById.get(item.lot_id);
                return (
                  <div key={item.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">Cotización N° {item.quote_number} · {item.customer_name}</p>
                        <Badge variant={item.status === 'sent' ? 'default' : 'outline'}>{item.status === 'sent' ? 'Enviada' : item.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {projectById.get(item.project_id)?.name || 'Proyecto'} · {lot?.name || (lot ? `Lote ${lot.lot_number}` : 'Parcela')} · vence {new Date(item.valid_until).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3"><p className="font-semibold">{formatMoney(item.quoted_price)}</p><Button size="sm" variant="outline" asChild><Link to={`/cotizacion/${item.public_token}`} target="_blank">Abrir link</Link></Button></div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!quoteLot} onOpenChange={(open) => { if (!open) { setQuoteLot(null); setSavedQuoteId(null); } }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Cotización rápida</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Cliente *</Label><Input value={quote.customer} onChange={(e) => updateQuote({ customer: e.target.value })} placeholder="Nombre cliente" /></div>
            <div><Label>WhatsApp</Label><Input value={quote.phone} onChange={(e) => updateQuote({ phone: e.target.value })} placeholder="569…" /></div>
            <div className="sm:col-span-2"><Label>Email</Label><Input type="email" value={quote.email} onChange={(e) => updateQuote({ email: e.target.value })} placeholder="cliente@email.com" /></div>
            <div><Label>Descuento ($)</Label><Input type="number" min="0" value={quote.discount} onChange={(e) => updateQuote({ discount: e.target.value })} /></div>
            <div><Label>Vigencia (días)</Label><Input type="number" min="1" value={quote.validDays} onChange={(e) => updateQuote({ validDays: e.target.value })} /></div>
            <div className="sm:col-span-2 rounded-xl bg-muted/50 p-4 text-sm whitespace-pre-line">{quoteText}</div>
            {savedQuoteId && <p className="sm:col-span-2 text-xs text-emerald-700">Cotización registrada. Los envíos reutilizan este mismo registro.</p>}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={copyQuote} disabled={createQuote.isPending}><ClipboardCopy className="mr-2 h-4 w-4" />Guardar y copiar</Button>
            <Button variant="outline" onClick={sendEmail} disabled={createQuote.isPending || markQuoteSent.isPending}><Send className="mr-2 h-4 w-4" />Email</Button>
            <Button onClick={sendWhatsApp} disabled={createQuote.isPending || markQuoteSent.isPending}><MessageCircle className="mr-2 h-4 w-4" />WhatsApp</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reserveLot} onOpenChange={(open) => !open && setReserveLot(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Reservar {reserveLot?.name || (reserveLot ? `Lote ${reserveLot.lot_number}` : '')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Comprador *</Label><Input value={reserve.name} onChange={(e) => setReserve((r) => ({ ...r, name: e.target.value }))} /></div>
            <div><Label>Email *</Label><Input type="email" value={reserve.email} onChange={(e) => setReserve((r) => ({ ...r, email: e.target.value }))} /></div>
            <div><Label>Teléfono</Label><Input value={reserve.phone} onChange={(e) => setReserve((r) => ({ ...r, phone: e.target.value }))} /></div>
            <div className="sm:col-span-2"><Label>Monto de reserva</Label><Input type="number" min="0" value={reserve.amount} onChange={(e) => setReserve((r) => ({ ...r, amount: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button onClick={submitReservation} disabled={createReservation.isPending}>
              {createReservation.isPending ? 'Creando reserva…' : 'Crear reserva'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExecutiveDashboard;
