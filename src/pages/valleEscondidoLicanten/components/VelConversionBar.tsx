import { useState } from 'react';
import { CalendarDays, Map, MessageCircle } from 'lucide-react';
import VisitScheduleDialog from '@/components/visits/VisitScheduleDialog';
import { VEL_PROJECT } from '../data/project';
import { useVelLots } from '../data/useVelLots';
import { VEL_CONTACT, whatsappDigits } from '../data/commercial';

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export default function VelConversionBar() {
  const [visitOpen, setVisitOpen] = useState(false);
  const { available, isLive, isLoading, verifiedPriceFrom } = useVelLots();

  const wa = whatsappDigits(VEL_CONTACT.whatsapp);
  const waHref = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(
        `Hola, quiero información de ${VEL_PROJECT.name}.`,
      )}`
    : '';

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#07110b]/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:bottom-5 md:left-1/2 md:right-auto md:w-[min(880px,calc(100%-3rem))] md:-translate-x-1/2 md:rounded-full md:border md:border-white/15 md:shadow-2xl">
        <div className="mx-auto flex items-center gap-2 px-3 py-2.5 md:px-5">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--hue-bone)]/50">
              {verifiedPriceFrom !== null ? 'Parcelas desde · CLP' : 'Precio a consultar'}
            </p>
            <p className="truncate text-sm font-semibold text-[var(--hue-bone)] md:text-base">
              {verifiedPriceFrom !== null ? `${verifiedPriceFrom.toLocaleString('es-CL')}` : 'Consultar'}
              <span className="ml-2 font-normal text-[var(--hue-bone)]/55">
                · {isLoading ? 'Verificando…' : isLive ? `${available} disponibles` : 'Disponibilidad por confirmar'}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => scrollTo('lotes')}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 text-[11px] font-medium text-[var(--hue-bone)] transition hover:border-[var(--hue-amber)]/50 hover:bg-white/[0.08]"
          >
            <Map className="h-4 w-4" />
            <span className="hidden sm:inline">Ver lotes</span>
          </button>

          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 text-[11px] font-medium text-[var(--hue-bone)] transition hover:border-[var(--hue-amber)]/50 hover:bg-white/[0.08]"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => scrollTo('contacto')}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 text-[11px] font-medium text-[var(--hue-bone)] transition hover:border-[var(--hue-amber)]/50 hover:bg-white/[0.08]"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Consultar</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setVisitOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--hue-amber)]/55 bg-[var(--hue-amber)] px-4 text-[11px] font-semibold text-[#07110b] transition hover:brightness-110"
          >
            <CalendarDays className="h-4 w-4" />
            Agendar
          </button>
        </div>
      </div>

      <VisitScheduleDialog
        open={visitOpen}
        onOpenChange={setVisitOpen}
        projectId={VEL_PROJECT.id}
        projectName={VEL_PROJECT.name}
      />
    </>
  );
}
