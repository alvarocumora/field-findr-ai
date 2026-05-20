import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Lock } from 'lucide-react';

const LINKS = [
  { href: '#proyecto', label: 'Proyecto' },
  { href: '#plano', label: 'Plano' },
  { href: '#ubicacion', label: 'Ubicación' },
  { href: '#legal', label: 'Marco Legal' },
  { href: '#contacto', label: 'Contacto' },
];

export default function FveNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fve-no-print fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[hsl(var(--fve-offwhite))]/95 backdrop-blur border-b border-black/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5">
          <span
            className="inline-block w-2.5 h-2.5 rotate-45"
            style={{ background: 'hsl(var(--fve-gold))' }}
          />
          <span
            className={`font-serif-fve text-lg tracking-tight ${
              scrolled ? 'text-[hsl(var(--fve-charcoal))]' : 'text-white'
            }`}
          >
            Forestal Valle Escondido
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${
                scrolled
                  ? 'text-[hsl(var(--fve-charcoal))]/80 hover:text-[hsl(var(--fve-forest))]'
                  : 'text-white/85 hover:text-white'
              }`}
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/forestal-valle-escondido/investors"
            className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] border px-3 py-1.5 transition-colors ${
              scrolled
                ? 'border-[hsl(var(--fve-charcoal))]/30 text-[hsl(var(--fve-charcoal))] hover:bg-[hsl(var(--fve-charcoal))] hover:text-white'
                : 'border-white/40 text-white hover:bg-white hover:text-[hsl(var(--fve-forest))]'
            }`}
          >
            <Lock className="w-3 h-3" /> Acceso Inversionistas
          </Link>
        </nav>

        <button
          className={`md:hidden p-2 ${scrolled ? 'text-[hsl(var(--fve-charcoal))]' : 'text-white'}`}
          onClick={() => setOpen((v) => !v)}
          aria-label="Menú"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[hsl(var(--fve-offwhite))] border-t border-black/5">
          <div className="px-6 py-4 flex flex-col gap-3">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-base text-[hsl(var(--fve-charcoal))] py-2 border-b border-black/5"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/forestal-valle-escondido/investors"
              className="mt-2 inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] border border-[hsl(var(--fve-charcoal))]/30 px-3 py-2 self-start"
            >
              <Lock className="w-3.5 h-3.5" /> Acceso Inversionistas
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
