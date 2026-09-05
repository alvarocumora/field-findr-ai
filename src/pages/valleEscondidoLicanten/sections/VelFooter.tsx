import { Link } from 'react-router-dom';
import { VEL_PROJECT } from '../data/project';

export default function VelFooter() {
  return (
    <footer className="border-t border-white/5 px-6 py-12 md:px-16">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <div className="hue-eyebrow">OFERTA TERRENOS</div>
          <div className="serif mt-2 text-2xl font-light text-[var(--hue-bone)]">
            {VEL_PROJECT.name}
          </div>
          <p className="mt-2 text-[12px] text-[var(--hue-bone)]/55">
            {VEL_PROJECT.city} · {VEL_PROJECT.region} · Chile
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-[12px] uppercase tracking-[0.14em] text-[var(--hue-bone)]/60">
          <Link to="/" className="hover:text-[var(--hue-bone)]">Inicio</Link>
          <Link to="/explorar" className="hover:text-[var(--hue-bone)]">Explorar</Link>
          <Link to={`/proyecto/${VEL_PROJECT.id}`} className="hover:text-[var(--hue-bone)]">
            Proyecto en marketplace
          </Link>
          <Link to={`/proyecto/${VEL_PROJECT.id}/experiencia`} className="hover:text-[var(--hue-bone)]">
            Recorrido virtual
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl border-t border-white/5 pt-4 text-[11px] text-[var(--hue-bone)]/40">
        © {new Date().getFullYear()} OFERTA TERRENOS. Subdivisión rural DL 3.516 ·{' '}
        {VEL_PROJECT.registro}
      </div>
    </footer>
  );
}
