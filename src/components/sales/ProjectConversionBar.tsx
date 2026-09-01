import { Button } from '@/components/ui/button';
import { CalendarDays, MessageCircle, Map } from 'lucide-react';

interface ProjectConversionBarProps {
  priceFrom?: number | null;
  availableLots?: number;
  whatsapp?: string;
  projectName: string;
  onLead: () => void;
  onSeeLots: () => void;
}

/**
 * Barra sticky de conversión para mobile: precio desde + acciones clave.
 * Se oculta en escritorio (allí los CTA viven en el hero y las secciones).
 */
export const ProjectConversionBar = ({
  priceFrom, availableLots, whatsapp, projectName, onLead, onSeeLots,
}: ProjectConversionBarProps) => {
  const waHref = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Hola, quiero información de ${projectName}.`,
      )}`
    : undefined;

  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Desde</p>
          <p className="truncate text-sm font-bold text-foreground">
            {priceFrom ? `$${Math.round(priceFrom).toLocaleString('es-CL')}` : 'Consultar'}
            {availableLots ? (
              <span className="ml-1 font-normal text-muted-foreground">· {availableLots} disp.</span>
            ) : null}
          </p>
        </div>
        <Button size="icon" variant="outline" className="min-h-11 min-w-11" aria-label="Ver lotes disponibles" onClick={onSeeLots}>
          <Map className="h-5 w-5" />
        </Button>
        {waHref && (
          <Button asChild size="icon" variant="outline" className="min-h-11 min-w-11" aria-label="Hablar con un asesor por WhatsApp">
            <a href={waHref} target="_blank" rel="noreferrer"><MessageCircle className="h-5 w-5" /></a>
          </Button>
        )}
        <Button className="min-h-11" onClick={onLead}>
          <CalendarDays className="h-4 w-4 mr-1.5" />Agendar
        </Button>
      </div>
    </div>
  );
};

export default ProjectConversionBar;
