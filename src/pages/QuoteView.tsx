import { Link, useParams } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Download, MapPin } from 'lucide-react';
import PublicLayout from '@/components/layouts/PublicLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePublicSalesQuote } from '@/hooks/usePublicSalesQuote';

const money = (value: number, currency: string) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);

const QuoteView = () => {
  const { token } = useParams();
  const { data: quote, isLoading } = usePublicSalesQuote(token);

  if (isLoading) return <PublicLayout><p className="py-24 text-center">Cargando cotización…</p></PublicLayout>;
  if (!quote) return <PublicLayout><p className="py-24 text-center">Cotización no encontrada o aún no enviada.</p></PublicLayout>;

  const inactiveStatus = ['expired', 'cancelled', 'rejected'].includes(quote.status);
  const inactive = inactiveStatus || new Date(quote.valid_until) < new Date();
  const statusLabel = inactive
    ? quote.status === 'cancelled' ? 'Cancelada' : quote.status === 'rejected' ? 'Rechazada' : 'Vencida'
    : quote.status === 'accepted' ? 'Aceptada' : 'Vigente';
  const authReturn = `/cotizacion/${token}`;

  return (
    <PublicLayout>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Card className="overflow-hidden">
          <div className="bg-primary p-6 text-primary-foreground">
            <p className="text-sm opacity-80">Cotización N° {quote.quote_number}</p>
            <h1 className="mt-1 text-2xl font-bold">{quote.project_name || 'OfertaTerrenos'}</h1>
            <p className="mt-1">Preparada para {quote.customer_name}</p>
          </div>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div><CardTitle>{quote.lot_label || 'Parcela seleccionada'}</CardTitle>{quote.lot_area && <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{quote.lot_area.toLocaleString('es-CL')} m²</p>}</div>
            <Badge variant={inactive ? 'destructive' : 'default'}>{statusLabel}</Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl bg-muted/50 p-5">
              <div className="flex justify-between text-sm text-muted-foreground"><span>Precio lista</span><span>{money(quote.list_price, quote.currency)}</span></div>
              {quote.discount_amount > 0 && <div className="mt-2 flex justify-between text-sm text-emerald-700"><span>Descuento</span><span>-{money(quote.discount_amount, quote.currency)}</span></div>}
              <div className="mt-4 flex justify-between border-t pt-4 text-xl font-bold"><span>Precio cotizado</span><span>{money(quote.quoted_price, quote.currency)}</span></div>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarClock className="h-4 w-4" />Válida hasta {new Date(quote.valid_until).toLocaleDateString('es-CL')}</p>
            {quote.notes && <p className="whitespace-pre-line text-sm text-muted-foreground">{quote.notes}</p>}
            {inactive && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">Esta cotización ya no admite nuevas visitas ni reservas.</p>}
            <div className="flex flex-wrap gap-2 print:hidden">
              {inactive ? (
                <>
                  <Button disabled><CalendarClock className="mr-2 h-4 w-4" />Solicitar visita</Button>
                  <Button variant="outline" disabled><CheckCircle2 className="mr-2 h-4 w-4" />Quiero reservar</Button>
                </>
              ) : (
                <>
                  <Button asChild><Link to={`/agendar?quote=${token}`}><CalendarClock className="mr-2 h-4 w-4" />Solicitar visita</Link></Button>
                  <Button variant="outline" asChild><Link to={`/auth?redirect=${encodeURIComponent(authReturn)}`}><CheckCircle2 className="mr-2 h-4 w-4" />Quiero reservar</Link></Button>
                </>
              )}
              <Button variant="ghost" onClick={() => window.print()}><Download className="mr-2 h-4 w-4" />Guardar PDF</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </PublicLayout>
  );
};
export default QuoteView;
