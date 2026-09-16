import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, ChevronDown, MapPin, ShoppingCart } from 'lucide-react';
import VisitScheduleDialog from '@/components/visits/VisitScheduleDialog';
import { VEL_PROJECT } from '../data/project';
import { useVelLots } from '../data/useVelLots';
import heroImg from '@/assets/valle-escondido-licanten/vel-valle.jpg';

export default function VelHero() {
  const [visitOpen, setVisitOpen] = useState(false);
  const { lots } = useVelLots();

  const commercial = useMemo(() => {
    const available = lots.filter((lot) => lot.status === 'available');
    const priced = available.filter((lot) => lot.price_clp > 0);
    return {
      availableLots: available.length,
      priceFrom:
        priced.length > 0
          ? Math.min(...priced.map((lot) => lot.price_clp))
          : VEL_PROJECT.priceFromClp,
    };
  }, [lots]);

  return (
    <section className="relative h-screen min-h-[680px] w-full overflow-hidden">
      <motion.div
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/95" />
      <div className="hue-fog" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-transparent to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-between px-6 py-12 md:px-16 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="flex items-center justify-between gap-4"
        >
          <div className="hue-eyebrow">OFERTA TERRENOS · presenta</div>
          <div className="hue-pill hidden md:inline-flex">
            <MapPin className="h-3 w-3" /> Licantén · Región del Maule
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl"
        >
          <h1 className="serif text-[clamp(2.8rem,8.5vw,7rem)] leading-[0.94] tracking-tight text-[var(--hue-bone)]">
            Valle Escondido
            <span className="block italic text-[var(--hue-bone)]/70">Licantén</span>
          </h1>
          <div className="hue-divider my-6 max-w-md" />
          <p className="serif text-[clamp(1.2rem,3vw,1.9rem)] italic font-light text-[var(--hue-bone)]/85">
            {VEL_PROJECT.totalLots} parcelas sobre {VEL_PROJECT.totalAreaHa} hectáreas, a pocos minutos de Licantén
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--hue-bone)]/70 md:text-base">
            Acceso por carretera asfaltada y conexión directa por la ruta principal hacia Lago Vichuquén.
          </p>
          <p className="mt-6 inline-flex items-baseline gap-3 rounded-sm border border-[var(--hue-amber)]/40 bg-[var(--hue-amber)]/10 px-5 py-3">
            <span className="text-[10px] uppercase tracking-[0.28em] text-[var(--hue-bone)]/70">Parcelas desde</span>
            <span className="serif text-[clamp(1.5rem,4vw,2.4rem)] font-light leading-none text-[var(--hue-bone)]">
              ${commercial.priceFrom.toLocaleString('es-CL')}
            </span>
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <a href="#masterplan" className="hue-pill transition hover:bg-white/10">Ver plano interactivo</a>
            <button type="button" onClick={() => setVisitOpen(true)} className="hue-pill transition hover:bg-white/10">
              <CalendarCheck className="h-3.5 w-3.5" /> Agendar visita
            </button>
            <a href="#lotes" className="hue-pill transition hover:bg-white/10">
              <ShoppingCart className="h-3.5 w-3.5" /> Reservar parcela
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 1.2 }}
          className="flex items-end justify-between"
        >
          <div className="grid grid-cols-3 gap-6 text-[var(--hue-bone)] md:gap-10">
            {[
              ['Superficie', `${VEL_PROJECT.totalAreaHa} ha`],
              ['Parcelas', String(VEL_PROJECT.totalLots)],
              ['Disponibles', String(commercial.availableLots)],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="serif text-3xl font-light md:text-4xl">{v}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.28em] text-[var(--hue-bone)]/55">{k}</div>
              </div>
            ))}
          </div>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity }}
            className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[var(--hue-bone)]/60 md:flex"
          >
            Explora <ChevronDown className="h-3 w-3" />
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-3 right-4 z-10 rounded-sm bg-black/50 px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-white/60">Imagen referencial</div>

      <VisitScheduleDialog
        open={visitOpen}
        onOpenChange={setVisitOpen}
        projectId={VEL_PROJECT.id}
        projectName={VEL_PROJECT.name}
      />
    </section>
  );
}
