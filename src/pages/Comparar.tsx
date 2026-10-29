import { CompareSelectionStatus } from '@/components/compare/CompareSelectionStatus';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Scale, X } from 'lucide-react';
import PublicLayout from '@/components/layouts/PublicLayout';
import { useCompare } from '@/hooks/useCompare';
import { formatPrice, formatArea, getListingTypeLabel, getLegalStatusLabel } from '@/hooks/useListings';
import { formatPricePerM2, hasMixedCurrencies } from '@/lib/priceCurrency';
import { Button } from '@/components/ui/button';

const COMPARE_ROWS = [
  { key: 'price', label: 'Precio publicado' },
  { key: 'ppm2', label: 'Precio / m²' },
  { key: 'area', label: 'Superficie' },
  { key: 'type', label: 'Tipo' },
  { key: 'location', label: 'Ubicación' },
  { key: 'region', label: 'Región' },
  { key: 'zoning', label: 'Zonificación' },
  { key: 'legal', label: 'Estado legal' },
  { key: 'subdivision', label: 'Subdivisión' },
  { key: 'tags', label: 'Características' },
] as const;

const Comparar = () => {
  const { compareList: items, removeFromCompare: removeItem, clearCompare: clearAll, selectionCount, isRefreshing, refreshError } = useCompare();
  const mixedCurrencies = useMemo(() => hasMixedCurrencies(items), [items]);
  const columns = items.length + 1;

  const rows = useMemo(() => COMPARE_ROWS.map(row => ({
    ...row,
    values: items.map(listing => {
      switch (row.key) {
        case 'price': return typeof listing.price === 'number' && listing.price > 0 ? formatPrice(listing.price, listing.currency) : 'Consultar';
        case 'ppm2': return formatPricePerM2(listing.price, listing.area_m2, listing.currency) ?? 'No informado';
        case 'type': return getListingTypeLabel(listing.type);
        case 'area': return formatArea(listing.area_m2, listing.area_ha);
        case 'location': return listing.location;
        case 'region': return listing.region || 'No informado';
        case 'zoning': return listing.zoning || 'No informado';
        case 'legal': return getLegalStatusLabel(listing.legal_status).label;
        case 'subdivision': return listing.subdivision_eligible ? 'Apto' : 'No apto';
        case 'tags': return listing.tags.slice(0, 3).join(', ') || 'No informado';
      }
    }),
  })), [items]);

  return (
    <PublicLayout>
      <section className="container max-w-7xl px-4 py-8 md:py-12" aria-labelledby="compare-title">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <Link to="/explorar" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-primary focus-ring">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a explorar
            </Link>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Decisión territorial</p>
            <h1 id="compare-title" className="mt-2 font-editorial text-3xl font-medium text-foreground sm:text-5xl">Compara terrenos con contexto</h1>
            <p className="mt-3 text-sm text-muted-foreground">{selectionCount} de 4 propiedades seleccionadas. Contrasta superficie, ubicación y antecedentes publicados.</p>
          </div>
          {selectionCount > 0 && <Button variant="outline" onClick={clearAll} className="min-h-11">Limpiar comparación</Button>}
        </div>

        <CompareSelectionStatus />
        {selectionCount > 0 && (isRefreshing || refreshError || items.length === 0) ? null : items.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <Scale className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden="true" />
            <p className="mb-4 text-muted-foreground">Todavía no seleccionaste propiedades. Agrégalas desde el explorador.</p>
            <Button asChild><Link to="/explorar">Explorar propiedades</Link></Button>
          </div>
        ) : (
          <>
            {mixedCurrencies && (
              <div role="note" className="mb-5 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground">
                <strong>Monedas distintas (CLP y UF).</strong> Mostramos los importes originales; no convertimos monedas ni declaramos una propiedad más barata sin una tasa verificada.
              </div>
            )}
            <p className="mb-2 text-xs text-muted-foreground md:hidden">Desliza horizontalmente para ver todas las propiedades y sus atributos.</p>
            <div className="max-w-full overflow-x-auto rounded-2xl border border-border bg-card" role="region" aria-label="Comparación de propiedades, deslizable horizontalmente" tabIndex={0}>
              <table className="w-full min-w-[700px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="sticky left-0 z-20 w-36 min-w-36 bg-card p-3 text-left align-bottom font-medium text-muted-foreground sm:w-44 sm:min-w-44">Atributo</th>
                    {items.map(listing => (
                      <th key={listing.id} scope="col" className="min-w-44 w-52 border-l border-border/50 p-3 text-left align-top">
                        <div className="relative overflow-hidden rounded-xl border border-border bg-background">
                          <button type="button" onClick={() => removeItem(listing.id)} aria-label={`Quitar ${listing.title} de la comparación`} className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-card text-foreground shadow-sm hover:text-destructive">
                            <X className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <img src={listing.images[0] || '/placeholder.svg'} alt={`Imagen de ${listing.title}`} className="h-28 w-full object-cover" loading="lazy" />
                          <div className="p-3">
                            <Link className="line-clamp-2 font-medium text-foreground hover:text-primary focus-ring" to={`/propiedad/${listing.id}`}>{listing.title}</Link>
                            <p className="mt-2 font-semibold text-primary">{formatPrice(listing.price, listing.currency)}</p>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.key} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                      <th scope="row" className="sticky left-0 z-10 w-36 min-w-36 border-t border-border/50 bg-background p-3 text-left font-medium text-muted-foreground sm:w-44 sm:min-w-44">{row.label}</th>
                      {row.values.map((value, j) => (
                        <td key={items[j].id} className="min-w-44 border-l border-t border-border/50 p-3 font-medium text-foreground">{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Datos según cada publicación. Superficies, precios y antecedentes legales deben confirmarse con el propietario antes de reservar. El comparador no constituye tasación ni oferta contractual.</p>
          </>
        )}
      </section>
    </PublicLayout>
  );
};

export default Comparar;
