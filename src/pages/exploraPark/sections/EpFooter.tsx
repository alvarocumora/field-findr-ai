import { Link } from 'react-router-dom';

export default function EpFooter() {
  return (
    <footer className="border-t border-white/5 px-6 py-12 md:px-16">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <div className="hue-eyebrow">OFERTA TERRENOS</div>
          <div className="serif mt-2 text-2xl font-light text-[var(--hue-bone)]">Explora Park</div>
          <p className="mt-2 text-[12px] text-[var(--hue-bone)]/55">
            Hualañé · Región del Maule · Chile
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-[12px] tracking-[0.14em] uppercase text-[var(--hue-bone)]/60">
          <Link to="/" className="hover:text-[var(--hue-bone)]">Inicio</Link>
          <Link to="/explorar" className="hover:text-[var(--hue-bone)]">Explorar</Link>
          <Link to="/proyecto/6e6f62be-a81a-4374-a3ef-cf296bd638d0" className="hover:text-[var(--hue-bone)]">
            Proyecto en marketplace
          </Link>
          <Link to="/contacto" className="hover:text-[var(--hue-bone)]">Contacto</Link>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl border-t border-white/5 pt-4 text-[11px] text-[var(--hue-bone)]/40">
        © {new Date().getFullYear()} OFERTA TERRENOS. Subdivisión rural DL 3.516.
      </div>
    </footer>
  );
}
