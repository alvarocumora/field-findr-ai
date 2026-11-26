import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { commercialOfferInquiryUrl, getProjectCommercialOffer } from '@/lib/projects/commercialOffers';

export function ProjectCommercialOffer({ slug, base }: { slug?: string | null; base: string }) {
  const [params] = useSearchParams();
  const offer = getProjectCommercialOffer(slug);
  if (!offer) return null;
  return (
    <div className="space-y-3 border-y border-border py-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">Oferta comercial · CLP</p>
      {offer.prices.map(({ priceClp, areaM2 }) => (
        <p key={priceClp} className="text-base font-semibold text-primary">
          {areaM2 ? `${areaM2.toLocaleString('es-CL')} m² · ` : 'Desde '}
          ${priceClp.toLocaleString('es-CL')} CLP
        </p>
      ))}
      {offer.liquidation && (
        <div className="space-y-2 border-l-2 border-primary pl-3">
          <p className="text-sm font-semibold">Liquidación · {offer.liquidation.count} parcelas con pendiente</p>
          <p className="text-lg font-semibold text-primary">${offer.liquidation.priceClp.toLocaleString('es-CL')} CLP cada una</p>
          <Button asChild variant="outline" className="h-auto min-h-11 whitespace-normal">
            <Link to={commercialOfferInquiryUrl(base, params, true)}>Consultar liquidación<ArrowUpRight className="shrink-0" aria-hidden="true" /></Link>
          </Button>
        </div>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">Sujeto a disponibilidad y confirmación del lote. La cotización y la reserva utilizan el precio publicado de la parcela seleccionada.</p>
      <Button asChild variant="outline" className="h-auto min-h-11 whitespace-normal">
        <Link to={commercialOfferInquiryUrl(base, params)}>Consultar oferta<ArrowUpRight className="shrink-0" aria-hidden="true" /></Link>
      </Button>
    </div>
  );
}