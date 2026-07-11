import { Button } from '@/components/ui/button';
import { Store, ExternalLink, X, Loader2 } from 'lucide-react';
import { usePublishLotListing } from '@/hooks/usePublishLotListing';
import type { LotForListing, ProjectForListing } from '@/lib/marketplace/lotToListing';

type LotWithId = LotForListing & { id: string; status?: string | null; listing_id?: string | null };

/**
 * Owner-only control to publish a project lot as a marketplace listing (card),
 * or open / withdraw the existing publication. Guards on a price being set.
 */
export const PublishLotButton = ({ lot, project }: { lot: LotWithId; project: ProjectForListing }) => {
  const { publish, unpublish } = usePublishLotListing();
  const listingId = lot.listing_id ?? null;
  const hasPrice = Number(lot.price) > 0;

  if (listingId) {
    return (
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
        <p className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
          <Store className="h-3.5 w-3.5" /> Publicado en el marketplace
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1 gap-1.5">
            <a href={`/propiedad/${listingId}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" /> Ver publicación
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            disabled={unpublish.isPending}
            onClick={() => unpublish.mutate({ lotId: lot.id, listingId })}
          >
            {unpublish.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            Retirar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Button
        variant="outline"
        className="w-full gap-2"
        disabled={!hasPrice || publish.isPending}
        onClick={() => publish.mutate({ lot, project })}
      >
        {publish.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
        {publish.isPending ? 'Publicando…' : 'Publicar en marketplace'}
      </Button>
      {!hasPrice && (
        <p className="text-[11px] text-muted-foreground text-center">Asigna un precio al lote para publicarlo.</p>
      )}
    </div>
  );
};
