import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, MapPin, Map as MapIcon } from 'lucide-react';
import { useShowcaseProjects } from './CinematicShowcaseHero';
import { projectLandingPath } from '@/lib/landing/paths';

const clp = (v?: number) => (v ? `${v.toLocaleString('es-CL')} CLP` : 'Precio a consultar');

const InsigniaShowcase = () => {
  const reduced = useReducedMotion();
  const { data: projects = [] } = useShowcaseProjects();
  if (!projects.length) return null;
  const [lead, ...rest] = projects;

  return (
    <section className="relative py-16 md:py-24" aria-labelledby="insignia-title">
      <div className="container px-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Cartelera territorial</p>
        <h2 id="insignia-title" className="mt-3 max-w-3xl font-editorial text-3xl font-medium md:text-5xl">Conoce los proyectos y elige dónde explorar.</h2>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {[lead, ...rest].map((p, i) => (
            <motion.div
              key={p.id}
              initial={reduced ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: (i % 2) * 0.08 }}
              className={i === 0 ? 'lg:col-span-2' : ''}
            >
              <Link
                to={projectLandingPath(p)}
                className={`brand-border group relative block overflow-hidden rounded-3xl bg-card ${i === 0 ? 'aspect-[16/9] md:aspect-[21/9]' : 'aspect-[16/10]'}`}
              >
                {p.image ? (
                  <img src={p.image} alt={`Vista de ${p.name}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-105" />
                ) : <div className="absolute inset-0 grid-topo" />}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute left-4 top-4 flex gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/85 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur"><MapIcon className="h-3 w-3" aria-hidden="true" />Ficha y mapa</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-7">
                  <div>
                    <p className="flex items-center gap-1 text-xs text-foreground/75"><MapPin className="h-3 w-3" />{[p.city, p.region].filter(Boolean).join(', ') || 'Chile'}</p>
                    <h3 className={`mt-1 font-editorial font-medium text-foreground ${i === 0 ? 'text-3xl md:text-5xl' : 'text-2xl'}`}>{p.name}</h3>
                    <p className="mt-2 text-sm text-foreground/80">
                      <span className="font-semibold text-primary">{p.minPrice ? `Desde ${clp(p.minPrice)}` : clp()}</span>
                      <span className="mx-2 text-foreground/40">·</span>{p.inventoryReady ? `${p.available} de ${p.total} disponibles` : 'Disponibilidad por consultar'}
                    </p>
                  </div>
                  <span className="brand-gradient-btn grid h-11 w-11 shrink-0 place-items-center rounded-full transition-transform group-hover:rotate-45">
                    <ArrowUpRight className="h-5 w-5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InsigniaShowcase;
