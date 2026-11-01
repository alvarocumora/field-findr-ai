import { useEffect, useState } from 'react';
import { CircleDollarSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCommissionRules, useSetProjectCommission } from '@/hooks/useAdminCommissions';
import { fixedProjectRule } from '@/lib/commissions/fixedProjectRule';
import { parseClpInput } from '@/lib/commissions/clpInput';

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const MAX_CLP = 100_000_000;

interface ProjectCommissionCardProps {
  projectId: string;
  /** Dueño del proyecto, commissions.write o admin. La base vuelve a validarlo. */
  canEdit: boolean;
}

/**
 * Comisión fija por venta y por captación del proyecto. Es la que usa
 * register_sale al convertir una reserva en venta y la que ven los brokers en
 * su panel y kit de venta.
 */
const ProjectCommissionCard = ({ projectId, canEdit }: ProjectCommissionCardProps) => {
  const rules = useCommissionRules();
  const save = useSetProjectCommission();
  const current = fixedProjectRule(rules.data ?? [], projectId);
  const currentSale = current?.seller ?? null;
  const currentCapture = current?.captador ?? null;

  const [sale, setSale] = useState('');
  const [capture, setCapture] = useState('');

  // Rellena el formulario con los montos guardados (y tras guardar).
  useEffect(() => {
    setSale(currentSale !== null ? String(currentSale) : '');
    setCapture(currentCapture !== null ? String(currentCapture) : '');
  }, [currentSale, currentCapture]);

  const saleAmount = parseClpInput(sale);
  const captureParsed = capture.trim() === '' ? 0 : parseClpInput(capture);
  const captureAmount = captureParsed ?? 0;
  const captureTooHigh = saleAmount !== null && captureAmount > saleAmount;
  const valid = saleAmount !== null && captureParsed !== null && saleAmount <= MAX_CLP && captureAmount <= MAX_CLP && !captureTooHigh;
  const changed = currentSale === null || saleAmount !== currentSale || captureAmount !== (currentCapture ?? 0);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleDollarSign className="h-5 w-5" />
          Comisiones
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Comisión total en pesos por lote vendido. Si otro vendedor captó al cliente, el captador recibe su parte y
          quien cierra el resto; si capta y cierra el mismo, recibe el total. Se aplica a las ventas que se registren
          desde que la guardas.
        </p>
      </CardHeader>
      <CardContent>
        {rules.isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando comisión…</p>
        ) : canEdit ? (
          <form
            className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (!valid || saleAmount === null) return;
              save.mutate({ projectId, saleAmount, captureAmount });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="commission-sale">Total por venta (CLP)</Label>
              <Input
                id="commission-sale"
                inputMode="numeric"
                placeholder="Ej: 1.200.000"
                value={sale}
                onChange={(e) => setSale(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Lo que se paga en total por lote vendido.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="commission-capture">Parte del captador (CLP)</Label>
              <Input
                id="commission-capture"
                inputMode="numeric"
                placeholder="Ej: 500.000"
                value={capture}
                onChange={(e) => setCapture(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Sale del total. Quien cierra recibe {saleAmount !== null && !captureTooHigh ? formatCLP(saleAmount - captureAmount) : 'el resto'}.
              </p>
            </div>
            <Button type="submit" disabled={!valid || !changed || save.isPending} className="gap-1.5">
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </Button>
            {((sale.trim() !== '' && saleAmount === null) || captureParsed === null) && (
              <p className="text-xs text-destructive sm:col-span-3">Escribe montos en pesos sin decimales, por ejemplo 1.200.000.</p>
            )}
            {captureTooHigh && (
              <p className="text-xs text-destructive sm:col-span-3">La parte del captador no puede ser mayor que el total.</p>
            )}
            {(saleAmount ?? 0) > MAX_CLP || captureAmount > MAX_CLP ? (
              <p className="text-xs text-destructive sm:col-span-3">El máximo es {formatCLP(MAX_CLP)}.</p>
            ) : null}
          </form>
        ) : current ? (
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Total por venta</span><span className="font-medium tabular-nums">{formatCLP(current.seller)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Parte del captador</span><span className="font-medium tabular-nums">{current.captador === null ? 'Sin monto fijo' : formatCLP(current.captador)}</span></div>
            <div className="flex justify-between gap-4 sm:col-span-2"><span className="text-muted-foreground">Quien cierra (si otro captó)</span><span className="font-medium tabular-nums">{formatCLP(Math.max(0, current.seller - (current.captador ?? 0)))}</span></div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Este proyecto aún no tiene comisión fija. Solo el dueño del proyecto puede fijarla.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectCommissionCard;
