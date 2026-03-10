import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Scale, Ruler, DollarSign, MapPin, X, ArrowUpDown, Sparkles } from 'lucide-react';

interface Lot {
  id: string;
  lot_number: string;
  name?: string | null;
  area: number;
  price?: number | null;
  price_per_sqm?: number | null;
  status?: string | null;
  features?: any;
  description?: string | null;
}

interface LotComparatorInProjectProps {
  lots: Lot[];
}

const formatPrice = (price: number | null | undefined) => {
  if (!price) return '—';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(price);
};

const formatArea = (area: number) => new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(area);

export const LotComparatorInProject = ({ lots }: LotComparatorInProjectProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const availableLots = useMemo(() => lots.filter(l => l.status !== 'sold'), [lots]);
  const selectedLots = useMemo(() => selectedIds.map(id => lots.find(l => l.id === id)).filter(Boolean) as Lot[], [selectedIds, lots]);

  const toggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const metrics = useMemo(() => {
    if (selectedLots.length < 2) return null;
    const prices = selectedLots.filter(l => l.price).map(l => l.price!);
    const areas = selectedLots.map(l => Number(l.area));
    const pricesPerSqm = selectedLots.filter(l => l.price).map(l => l.price! / Number(l.area));
    return {
      bestPrice: prices.length > 0 ? Math.min(...prices) : null,
      bestPricePerSqm: pricesPerSqm.length > 0 ? Math.min(...pricesPerSqm) : null,
      largestArea: Math.max(...areas),
    };
  }, [selectedLots]);

  return (
    <div className="space-y-6">
      {/* Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Selecciona hasta 4 lotes para comparar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-64">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {availableLots.map(lot => (
                <label
                  key={lot.id}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    selectedIds.includes(lot.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <Checkbox
                    checked={selectedIds.includes(lot.id)}
                    onCheckedChange={() => toggle(lot.id)}
                    disabled={!selectedIds.includes(lot.id) && selectedIds.length >= 4}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">Lote {lot.lot_number}</p>
                    <p className="text-xs text-muted-foreground">{formatArea(Number(lot.area))} m²</p>
                  </div>
                </label>
              ))}
            </div>
          </ScrollArea>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="secondary">{selectedIds.length} seleccionados</Badge>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="text-xs gap-1">
                <X className="h-3 w-3" /> Limpiar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Table */}
      {selectedLots.length >= 2 && metrics && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-primary" />
              Comparación
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Atributo</th>
                  {selectedLots.map(lot => (
                    <th key={lot.id} className="text-center py-2 px-3 font-semibold text-foreground">
                      Lote {lot.lot_number}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <CompareRow
                  label="Superficie"
                  icon={<Ruler className="h-4 w-4 text-muted-foreground" />}
                  values={selectedLots.map(l => ({
                    text: `${formatArea(Number(l.area))} m²`,
                    isBest: Number(l.area) === metrics.largestArea,
                  }))}
                />
                <CompareRow
                  label="Precio"
                  icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                  values={selectedLots.map(l => ({
                    text: formatPrice(l.price),
                    isBest: l.price != null && l.price === metrics.bestPrice,
                  }))}
                />
                <CompareRow
                  label="Precio/m²"
                  icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                  values={selectedLots.map(l => {
                    const ppsqm = l.price ? l.price / Number(l.area) : null;
                    return {
                      text: ppsqm ? formatPrice(Math.round(ppsqm)) : '—',
                      isBest: ppsqm != null && Math.round(ppsqm) === Math.round(metrics.bestPricePerSqm || 0),
                    };
                  })}
                />
                <CompareRow
                  label="Estado"
                  icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
                  values={selectedLots.map(l => ({
                    text: l.status === 'available' ? 'Disponible' : l.status === 'reserved' ? 'Reservado' : l.status || '—',
                    isBest: l.status === 'available',
                  }))}
                />
                {selectedLots.some(l => l.description) && (
                  <CompareRow
                    label="Descripción"
                    icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}
                    values={selectedLots.map(l => ({
                      text: l.description || '—',
                      isBest: false,
                    }))}
                  />
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {selectedLots.length < 2 && (
        <div className="text-center py-12 text-muted-foreground">
          <Scale className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Selecciona al menos 2 lotes para comparar sus características lado a lado.</p>
        </div>
      )}
    </div>
  );
};

const CompareRow = ({ label, icon, values }: {
  label: string;
  icon: React.ReactNode;
  values: { text: string; isBest: boolean }[];
}) => (
  <tr>
    <td className="py-3 pr-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium text-foreground">{label}</span>
      </div>
    </td>
    {values.map((v, i) => (
      <td key={i} className="py-3 px-3 text-center">
        <span className={v.isBest ? 'font-semibold text-primary' : 'text-foreground'}>
          {v.text}
        </span>
        {v.isBest && <Badge variant="outline" className="ml-1 text-[10px] text-primary border-primary/30">Mejor</Badge>}
      </td>
    ))}
  </tr>
);

export default LotComparatorInProject;
