import { Card, CardContent } from '@/components/ui/card';

const clp = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

interface LotFinancialSummaryProps {
  price: number | null | undefined;
  area?: number | null;
  /** Pie sugerido (fracción). Solo presentación, sin lógica financiera. */
  downPaymentRate?: number;
  className?: string;
}

/**
 * Bloque financiero de presentación para una parcela: precio, precio/m²,
 * pie sugerido y saldo estimado. No calcula intereses ni cuotas: son cifras
 * referenciales derivadas del precio publicado.
 */
export const LotFinancialSummary = ({
  price,
  area,
  downPaymentRate = 0.2,
  className,
}: LotFinancialSummaryProps) => {
  if (!price || price <= 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Precio a consultar con el equipo comercial.
          </p>
        </CardContent>
      </Card>
    );
  }

  const down = price * downPaymentRate;
  const rest = price - down;
  const perM2 = area && area > 0 ? price / area : null;

  const rows = [
    { label: 'Precio', value: clp(price), strong: true },
    ...(perM2 ? [{ label: 'Precio por m²', value: clp(perM2) }] : []),
    { label: `Pie sugerido ${Math.round(downPaymentRate * 100)}%`, value: clp(down) },
    { label: 'Saldo estimado', value: clp(rest) },
  ];

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-3">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">{r.label}</span>
            <span
              className={
                r.strong
                  ? 'text-lg font-bold text-foreground tabular-nums'
                  : 'text-sm font-medium text-foreground tabular-nums'
              }
            >
              {r.value}
            </span>
          </div>
        ))}
        <p className="pt-1 text-[11px] leading-snug text-muted-foreground">
          Cifras referenciales de presentación. Las condiciones finales se acuerdan con el
          equipo comercial del proyecto.
        </p>
      </CardContent>
    </Card>
  );
};

export default LotFinancialSummary;
