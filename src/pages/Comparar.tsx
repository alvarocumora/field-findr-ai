import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '@/components/layouts/PublicLayout';
import { useCompare } from '@/hooks/useCompare';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { formatPrice, formatArea, getListingTypeLabel, getLegalStatusLabel } from '@/hooks/useListings';
import { X, ArrowLeft, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const COMPARE_ROWS = [
  { key: 'price', label: 'Precio' },
  { key: 'type', label: 'Tipo' },
  { key: 'area', label: 'Superficie' },
  { key: 'ppm2', label: 'Precio / m²' },
  { key: 'location', label: 'Ubicación' },
  { key: 'region', label: 'Región' },
  { key: 'zoning', label: 'Zonificación' },
  { key: 'legal', label: 'Estado Legal' },
  { key: 'subdivision', label: 'Subdivisión' },
  { key: 'tags', label: 'Características' },
];

const Comparar = () => {
  const { compareList: items, removeFromCompare: removeItem, clearCompare: clearAll } = useCompare();

  const rows = useMemo(() => {
    return COMPARE_ROWS.map(row => ({
      ...row,
      values: items.map(listing => {
        switch (row.key) {
          case 'price': return formatPrice(listing.price, listing.currency);
          case 'type': return getListingTypeLabel(listing.type);
          case 'area': return formatArea(listing.area_m2, listing.area_ha);
          case 'ppm2': return listing.area_m2 ? formatPrice(Math.round(listing.price / listing.area_m2)) + '/m²' : 'N/A';
          case 'location': return listing.location;
          case 'region': return listing.region || 'N/A';
          case 'zoning': return listing.zoning || 'N/A';
          case 'legal': return getLegalStatusLabel(listing.legal_status).label;
          case 'subdivision': return listing.subdivision_eligible ? 'Apto' : 'No apto';
          case 'tags': return listing.tags.slice(0, 3).join(', ') || 'N/A';
          default: return '';
        }
      }),
    }));
  }, [items]);

  if (items.length === 0) {
    return (
      <PublicLayout>
        <div className="container px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Comparador de Terrenos</h1>
          <p className="text-muted-foreground mb-6">No has agregado propiedades para comparar.</p>
          <Button asChild>
            <Link to="/explorar">Explorar propiedades</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/explorar"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Comparar Terrenos</h1>
              <p className="text-sm text-muted-foreground">{items.length} propiedades seleccionadas</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Limpiar todo
          </Button>
        </div>

        {/* Property Images Row */}
        <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `200px repeat(${items.length}, 1fr)` }}>
          <div />
          {items.map((listing) => (
            <Card key={listing.id} className="glass border-border/50 overflow-hidden relative group">
              <button
                onClick={() => removeItem(listing.id)}
                className="absolute top-2 right-2 z-10 p-1 rounded-full bg-background/80 hover:bg-destructive/80 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={listing.images[0] || '/placeholder.svg'}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <Link to={`/propiedad/${listing.id}`} className="text-sm font-semibold text-foreground hover:text-primary line-clamp-2">
                  {listing.title}
                </Link>
                <p className="text-lg font-bold text-primary mt-1">{formatPrice(listing.price, listing.currency)}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <Card className="glass border-border/50 overflow-hidden">
          <Table>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={row.key} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                  <TableCell className="font-medium text-muted-foreground w-[200px]">{row.label}</TableCell>
                  {row.values.map((val, j) => (
                    <TableCell key={j} className="text-foreground font-medium">
                      {val}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default Comparar;
