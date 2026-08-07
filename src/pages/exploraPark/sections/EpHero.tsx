import { motion } from 'framer-motion';
import { ChevronDown, MapPin } from 'lucide-react';
import { EXPLORA_PARK_PROJECT } from '../data/project';
import heroAsset from '@/assets/explora-camino.jpg.asset.json';
import logoAsset from '@/assets/explora-logo.png.asset.json';

const heroImg = heroAsset.url;
const exploraLogo = logoAsset.url;

const HERO_IMG = heroImg;


export default function EpHero() {
  return (
    <section className="relative h-screen min-h-[680px] w-full overflow-hidden">
      <motion.div
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_IMG})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/95" />
      <div className="hue-fog" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-transparent to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-between px-6 py-12 md:px-16 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <img
              src={exploraLogo}
              alt="Logotipo de Explora Park"
              className="h-9 w-auto md:h-12"
              loading="eager"
            />
            <div className="hue-eyebrow">OFERTA TERRENOS · presenta</div>
          </div>

          <div className="hue-pill hidden md:inline-flex">
            <MapPin className="h-3 w-3" /> Hualañé · Región del Maule
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl"
        >
          <h1 className="serif text-[clamp(3.2rem,10vw,8.5rem)] leading-[0.92] tracking-tight text-[var(--hue-bone)]">
            Explora Park
          </h1>
          <div className="hue-divider my-6 max-w-md" />
          <p className="serif text-[clamp(1.3rem,3vw,2rem)] italic text-[var(--hue-bone)]/85 font-light">
            {EXPLORA_PARK_PROJECT.totalLots} parcelas en el corazón del Maule
          </p>
          <p className="mt-6 inline-flex items-baseline gap-3 rounded-sm border border-[var(--hue-amber)]/40 bg-[var(--hue-amber)]/10 px-5 py-3">
            <span className="text-[10px] tracking-[0.28em] uppercase text-[var(--hue-bone)]/70">
              Parcelas desde
            </span>
            <span className="serif text-[clamp(1.6rem,4vw,2.6rem)] font-light leading-none text-[var(--hue-bone)]">
              ${EXPLORA_PARK_PROJECT.priceFromClp.toLocaleString('es-CL')}
            </span>
          </p>
          <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-[var(--hue-bone)]/70">
            {EXPLORA_PARK_PROJECT.totalAreaHa} hectáreas subdivididas en parcelas rurales de
            ~{Math.round(EXPLORA_PARK_PROJECT.avgAreaM2)} m² con acceso directo, vistas al valle y
            entorno agrícola consolidado en Hualañé.
          </p>


          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#masterplan"
              className="hue-pill hover:bg-white/8 transition"
            >
              Ver masterplan interactivo
            </a>
            <a
              href="#lotes"
              className="hue-pill hover:bg-white/8 transition"
            >
              Explorar {EXPLORA_PARK_PROJECT.availableLots} parcelas disponibles
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 1.5 }}
          className="flex items-end justify-between"
        >
          <div className="grid grid-cols-3 gap-6 md:gap-10 text-[var(--hue-bone)]">
            {[
              ['Superficie', `${EXPLORA_PARK_PROJECT.totalAreaHa} ha`],
              ['Parcelas', EXPLORA_PARK_PROJECT.totalLots.toLocaleString('es-CL')],
              ['Disponibles', EXPLORA_PARK_PROJECT.availableLots.toLocaleString('es-CL')],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="serif text-3xl md:text-4xl font-light">{v}</div>
                <div className="mt-1 text-[10px] tracking-[0.28em] uppercase text-[var(--hue-bone)]/55">
                  {k}
                </div>
              </div>
            ))}
          </div>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity }}
            className="hidden md:flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase text-[var(--hue-bone)]/60"
          >
            Explora <ChevronDown className="h-3 w-3" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
