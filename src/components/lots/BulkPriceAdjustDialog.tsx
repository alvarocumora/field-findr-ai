import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Loader2, TrendingUp } from 'lucide-react';
import { useAdjustLotPrices, type AdjustLotPricesData, type Lot } from '@/hooks/useLots';

interface Project {
  id: string;
  name: string;
}

interface BulkPriceAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  lots: Lot[];
  /** Preselected project (e.g. the active project filter). */
  defaultProjectId?: string;
}

type Mode = AdjustLotPricesData['mode'];

const MODE_CONFIG: Record<Mode, { label: string; hint: string; unit: string }> = {
  percent: { label: '% Porcentaje', hint: 'Sube o baja todos los precios en un porcentaje', unit: '%' },
  per_sqm: { label: '$ por m²', hint: 'Fija el precio como valor por m² × superficie', unit: '$/m²' },
  delta: { label: '± Monto fijo', hint: 'Suma o resta un monto fijo a cada precio', unit: '$' },
};

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

/**
 * Bulk price adjustment tool for a project's lots. Previews how many lots are
 * affected and an example before/after, then applies via the adjust_lot_prices
 * RPC in a single statement.
 */
const BulkPriceAdjustDialog = ({ open, onOpenChange, projects, lots, defaultProjectId }: BulkPriceAdjustDialogProps) => {
  const adjust = useAdjustLotPrices();
  const [projectId, setProjectId] = useState(defaultProjectId ?? '');
  const [mode, setMode] = useState<Mode>('percent');
  const [value, setValue] = useState('');
  const [onlyStatus, setOnlyStatus] = useState<string>('available');

  const numValue = Number(value);
  const hasValue = value !== '' && !Number.isNaN(numValue);

  const targetLots = useMemo(
    () =>
      lots.filter(
        (l) =>
          l.project_id === projectId &&
          (onlyStatus === 'all' || l.status === onlyStatus) &&
          (mode === 'per_sqm' || l.price !== null),
      ),
    [lots, projectId, onlyStatus, mode],
  );

  // Example preview using the first target lot with a price.
  const example = useMemo(() => {
    if (!hasValue) return null;
    const sample = targetLots.find((l) => (mode === 'per_sqm' ? Number(l.area) > 0 : l.price !== null));
    if (!sample) return null;
    const oldPrice = Number(sample.price ?? 0);
    const newPrice = Math.max(0, Math.round(
      mode === 'percent' ? oldPrice * (1 + numValue / 100)
        : mode === 'per_sqm' ? Number(sample.area ?? 0) * numValue
          : oldPrice + numValue,
    ));
    return { lotNumber: sample.lot_number, oldPrice, newPrice };
  }, [targetLots, hasValue, numValue, mode]);

  const valid =
    !!projectId &&
    hasValue &&
    targetLots.length > 0 &&
    (mode !== 'percent' || (numValue > -100 && numValue <= 500));

  const handleApply = () => {
    if (!valid) return;
    adjust.mutate(
      {
        projectId,
        mode,
        value: numValue,
        onlyStatus: onlyStatus === 'all' ? null : onlyStatus,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Ajuste masivo de precios
          </DialogTitle>
          <DialogDescription>
            Actualiza el precio de todos los lotes de un proyecto en una sola operación.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Proyecto</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Tipo de ajuste</Label>
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={(v) => v && setMode(v as Mode)}
              className="grid grid-cols-3"
            >
              {(Object.keys(MODE_CONFIG) as Mode[]).map((m) => (
                <ToggleGroupItem key={m} value={m} className="text-xs">
                  {MODE_CONFIG[m].label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">{MODE_CONFIG[mode].hint}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="adjust-value">Valor ({MODE_CONFIG[mode].unit})</Label>
              <Input
                id="adjust-value"
                type="number"
                placeholder={mode === 'percent' ? 'ej: 10 o -5' : 'ej: 25000'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Aplicar a</Label>
              <Select value={onlyStatus} onValueChange={setOnlyStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Solo disponibles</SelectItem>
                  <SelectItem value="reserved">Solo reservados</SelectItem>
                  <SelectItem value="all">Todos los lotes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {projectId && (
            <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lotes afectados</span>
                <span className="font-semibold tabular-nums">{targetLots.length}</span>
              </div>
              {example && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ejemplo (Lote {example.lotNumber})</span>
                  <span className="tabular-nums">
                    {formatCLP(example.oldPrice)} → <span className="font-semibold">{formatCLP(example.newPrice)}</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={!valid || adjust.isPending} className="gap-1.5">
            {adjust.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Aplicar a {targetLots.length} lote{targetLots.length === 1 ? '' : 's'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkPriceAdjustDialog;
