import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, MapPin, Share2, Trash2, Eye, Scale, ImageOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useFavorites, useRemoveFavorite } from '@/hooks/useFavorites';
import { useCompare } from '@/hooks/useCompare';
import { formatArea, type Listing } from '@/hooks/useListings';
import { isPublishedFavorite, favoritePriceLabel } from '@/lib/buyer/favoriteView';
import { getShareUrl } from '@/lib/publicUrls';

/**
 * Private buyer workspace. A favorite must be a real, saved listing belonging
 * to the authenticated user; this view must never synthesize property data.
 */
const Favorites = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading, isError, refetch } = useFavorites();
  const removeFavorite = useRemoveFavorite();
  const { addToCompare, isInCompare, removeFromCompare, compareList } = useCompare();

  const favorites = useMemo(() => (data ?? []).map((record) => ({
    id: record.id,
    listingId: record.listing_id,
    savedAt: record.created_at,
    listing: record.listings as unknown as Listing | null,
  })), [data]);

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase('es');
    if (!query) return favorites;
    return favorites.filter(({ listing }) =>
      (listing?.title ?? 'Publicación no disponible').toLocaleLowerCase('es').includes(query) ||
      (listing?.location ?? '').toLocaleLowerCase('es').includes(query) ||
      (listing?.region ?? '').toLocaleLowerCase('es').includes(query)
    );
  }, [favorites, searchTerm]);

  const remove = (listingId: string) => {
    removeFromCompare(listingId);
    removeFavorite.mutate(listingId);
  };

  const share = async (listingId: string) => {
    try {
      await navigator.clipboard.writeText(getShareUrl(`/propiedad/${encodeURIComponent(listingId)}`));
      toast.success('Enlace de la propiedad copiado');
    } catch {
      toast.error('No se pudo copiar el enlace. Puedes abrir la ficha y compartir su URL.');
    }
  };

  return (
    <section aria-labelledby="favorites-title" className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Mi espacio · Comprador</p>
          <h1 id="favorites-title" className="mt-2 font-editorial text-3xl font-medium text-foreground sm:text-4xl">Terrenos guardados</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Revisa publicaciones reales, compara sus características o retira terrenos de tus favoritos.</p>
        </div>
        <Badge variant="secondary" className="gap-2 px-3 py-2 text-sm">
          <Heart className="h-4 w-4" aria-hidden="true" />{isLoading ? 'Cargando…' : `${favorites.length} guardados`}
        </Badge>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input aria-label="Buscar en favoritos" placeholder="Buscar por propiedad o ubicación…" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="min-h-11 pl-10" />
        </div>
        <Button asChild variant="outline" className="min-h-11 gap-2">
          <Link to="/comparar"><Scale className="h-4 w-4" aria-hidden="true" />Ver comparador ({compareList.length})</Link>
        </Button>
      </div>

      {isError ? (
        <div role="alert" className="space-y-4 rounded-2xl border border-destructive/30 bg-card p-7 text-center">
          <p className="font-medium">No pudimos cargar tus favoritos</p>
          <p className="text-sm text-muted-foreground">Los terrenos guardados siguen asociados a tu cuenta. Prueba nuevamente.</p>
          <Button variant="outline" onClick={() => void refetch()}><RefreshCw className="mr-2 h-4 w-4" />Reintentar</Button>
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map(({ id, listingId, savedAt, listing }) => {
            const published = isPublishedFavorite(listing);
            const selected = isInCompare(listingId);
            const price = favoritePriceLabel(listing);
            return (
              <Card key={id} className="overflow-hidden border-border bg-card">
                <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                  {published && listing?.images?.[0] ? (
                    <img src={listing.images[0]} alt={listing.title} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground"><ImageOff className="h-5 w-5" />{published ? 'Sin imagen publicada' : 'Publicación no disponible'}</div>
                  )}
                  <Badge className="absolute right-3 top-3 border border-border bg-card text-foreground" variant="outline">
                    {published ? 'Publicada' : 'No disponible'}
                  </Badge>
                </div>
                <CardContent className="space-y-4 p-5">
                  <div>
                    <h2 className="font-editorial text-xl font-medium text-foreground">{published && listing ? listing.title : 'Publicación no disponible'}</h2>
                    {published && listing && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {[listing.location, listing.region].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  {published && listing ? (
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-y border-border/60 py-3">
                      <span className="text-xl font-semibold text-primary">{price ?? 'Consultar precio'}</span>
                      <span className="text-sm text-muted-foreground">{formatArea(listing.area_m2, listing.area_ha)}</span>
                    </div>
                  ) : (
                    <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">La publicación fue retirada, desactivada o ya no es accesible. Puedes eliminarla de tus favoritos.</p>
                  )}
                  <p className="text-xs text-muted-foreground">Guardado el {new Date(savedAt).toLocaleDateString('es-CL')}</p>
                  <div className="flex flex-wrap gap-2">
                    {published && listing && (
                      <>
                        <Button asChild size="sm" className="min-h-10 flex-1 gap-2">
                          <Link to={`/propiedad/${listingId}`}><Eye className="h-4 w-4" />Ver ficha</Link>
                        </Button>
                        <Button size="sm" variant="outline" className="min-h-10 gap-2" onClick={() => selected ? removeFromCompare(listingId) : addToCompare(listing)}>
                          <Scale className="h-4 w-4" />{selected ? 'Quitar de comparación' : 'Comparar'}
                        </Button>
                        <Button type="button" size="icon" variant="outline" className="h-10 w-10" onClick={() => void share(listingId)} aria-label={`Compartir ${listing.title}`}>
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button type="button" size="icon" variant="outline" className="h-10 w-10 text-destructive hover:text-destructive" disabled={removeFavorite.isPending} onClick={() => remove(listingId)} aria-label="Eliminar de favoritos">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-border bg-card p-8 text-center sm:p-12">
          <Heart className="mx-auto mb-4 h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="font-editorial text-2xl font-medium">{searchTerm ? 'No hay coincidencias' : 'Todavía no guardaste terrenos'}</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            {searchTerm ? 'Prueba buscando por otro nombre o ubicación.' : 'Explora terrenos publicados y guarda tus opciones preferidas para compararlas desde aquí.'}
          </p>
          <Button asChild className="mt-5 min-h-11"><Link to="/explorar">Explorar terrenos</Link></Button>
        </Card>
      )}
    </section>
  );
};

export default Favorites;
