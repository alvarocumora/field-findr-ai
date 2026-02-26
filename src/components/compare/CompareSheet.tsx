import { memo, useMemo } from 'react';
import { X, TrendingUp, Droplets, Zap, MapPin, Ruler, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCompare } from '@/hooks/useCompare';
import { formatPrice, formatArea, getListingTypeLabel, getPricePerM2, getLegalStatusLabel } from '@/hooks/useListings';
import { calculateInvestmentScore } from '@/lib/investmentScore';
import { cn } from '@/lib/utils';

const CompareSheet = memo(() => {
  const { compareList, removeFromCompare, isCompareOpen, setCompareOpen } = useCompare();

  const scores = useMemo(() => compareList.map(l => calculateInvestmentScore(l)), [compareList]);
  const bestScoreIdx = useMemo(() => {
    let best = -1, bestVal = -1;
    scores.forEach((s, i) => { if (s.score > bestVal) { bestVal = s.score; best = i; } });
    return best;
  }, [scores]);

  const rows: { label: string; icon: React.ReactNode; render: (l: typeof compareList[0], idx: number) => React.ReactNode }[] = [
    {
      label: 'Score Inversión',
      icon: <TrendingUp className="h-4 w-4" />,
      render: (_, idx) => {
        const s = scores[idx];
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={cn('text-lg font-bold', s.color)}>{s.score}</span>
              <Badge variant="outline" className={cn('text-[10px]', s.color)}>{s.label}</Badge>
            </div>
            <Progress value={s.score} className="h-1.5" />
          </div>
        );
      },
    },
    {
      label: 'Precio',
      icon: <span className="text-sm">$</span>,
      render: (l) => <span className="font-semibold text-sm">{formatPrice(l.price, l.currency)}</span>,
    },
    {
      label: 'Precio/m²',
      icon: <Ruler className="h-4 w-4" />,
      render: (l) => {
        const pm2 = getPricePerM2(l.price, l.area_m2);
        return <span className="text-sm">{pm2 ? `$${pm2.toLocaleString('es-CL')}/m²` : 'N/A'}</span>;
      },
    },
    {
      label: 'Superficie',
      icon: <Ruler className="h-4 w-4" />,
      render: (l) => <span className="text-sm">{formatArea(l.area_m2, l.area_ha)}</span>,
    },
    {
      label: 'Tipo',
      icon: <MapPin className="h-4 w-4" />,
      render: (l) => <Badge variant="outline" className="text-[10px]">{getListingTypeLabel(l.type)}</Badge>,
    },
    {
      label: 'Ubicación',
      icon: <MapPin className="h-4 w-4" />,
      render: (l) => <span className="text-xs text-muted-foreground">{l.city || l.region || l.location}</span>,
    },
    {
      label: 'Estado Legal',
      icon: <Shield className="h-4 w-4" />,
      render: (l) => {
        const s = getLegalStatusLabel(l.legal_status);
        return <Badge className={cn('text-[10px]', s.color)}>{s.label}</Badge>;
      },
    },
    {
      label: 'Subdivisión',
      icon: <CheckCircle2 className="h-4 w-4" />,
      render: (l) => l.subdivision_eligible
        ? <span className="flex items-center gap-1 text-emerald-500 text-sm"><CheckCircle2 className="h-3.5 w-3.5" /> Elegible</span>
        : <span className="flex items-center gap-1 text-muted-foreground text-sm"><XCircle className="h-3.5 w-3.5" /> No</span>,
    },
    {
      label: 'Agua',
      icon: <Droplets className="h-4 w-4" />,
      render: (l) => {
        const u = l.utilities as Record<string, boolean> | null;
        return u?.agua
          ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          : <XCircle className="h-4 w-4 text-muted-foreground/50" />;
      },
    },
    {
      label: 'Electricidad',
      icon: <Zap className="h-4 w-4" />,
      render: (l) => {
        const u = l.utilities as Record<string, boolean> | null;
        return u?.luz
          ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          : <XCircle className="h-4 w-4 text-muted-foreground/50" />;
      },
    },
  ];

  return (
    <Sheet open={isCompareOpen} onOpenChange={setCompareOpen}>
      <SheetContent side="bottom" className="h-[85vh] overflow-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Comparador Side-by-Side
          </SheetTitle>
        </SheetHeader>

        {compareList.length < 2 ? (
          <p className="text-center text-muted-foreground py-12">Selecciona al menos 2 propiedades para comparar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-background z-10 min-w-[140px] p-2" />
                  {compareList.map((l, idx) => (
                    <th key={l.id} className="min-w-[200px] p-2">
                      <div className={cn(
                        'relative rounded-xl overflow-hidden border',
                        idx === bestScoreIdx ? 'border-primary ring-2 ring-primary/20' : 'border-border/50'
                      )}>
                        {idx === bestScoreIdx && (
                          <Badge className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground text-[10px]">
                            ⭐ Mejor opción
                          </Badge>
                        )}
                        <img src={l.images[0] || '/placeholder.svg'} alt="" className="w-full h-28 object-cover" />
                        <button
                          onClick={() => removeFromCompare(l.id)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <div className="p-2">
                          <h4 className="text-xs font-semibold truncate">{l.title}</h4>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={row.label} className={cn(rIdx % 2 === 0 && 'bg-muted/20')}>
                    <td className="sticky left-0 bg-background z-10 p-3 border-r border-border/30">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        {row.icon}
                        {row.label}
                      </div>
                    </td>
                    {compareList.map((l, idx) => (
                      <td key={l.id} className="p-3 text-center">
                        {row.render(l, idx)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
});

CompareSheet.displayName = 'CompareSheet';
export default CompareSheet;
