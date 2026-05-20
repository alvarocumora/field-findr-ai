export default function FveFooter() {
  return (
    <footer
      className="fve-no-print py-12"
      style={{ background: 'hsl(var(--fve-charcoal))', color: 'hsl(var(--fve-offwhite))' }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid md:grid-cols-12 gap-8 mb-10">
          <div className="md:col-span-6">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="inline-block w-2.5 h-2.5 rotate-45" style={{ background: 'hsl(var(--fve-gold))' }} />
              <span className="font-serif-fve text-lg">Forestal Valle Escondido SpA</span>
            </div>
            <p className="text-sm text-white/60 font-mono">RUT 77.123.456-K</p>
            <p className="text-sm text-white/60 mt-1">StartupLab, Piso 3 · Santiago de Chile</p>
            <p className="text-xs text-white/45 mt-4">
              Parte del grupo <span className="text-white/70">Inversiones Bioenergy SpA</span> (RUT 76.987.654-3).
            </p>
          </div>
          <div className="md:col-span-3">
            <div className="text-xs uppercase tracking-[0.22em] text-white/45 mb-3">Información</div>
            <ul className="space-y-2 text-sm text-white/75">
              <li><a href="#proyecto" className="hover:text-white">Proyecto</a></li>
              <li><a href="#plano" className="hover:text-white">Plano maestro</a></li>
              <li><a href="#legal" className="hover:text-white">Marco legal</a></li>
              <li><a href="#contacto" className="hover:text-white">Contacto</a></li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <div className="text-xs uppercase tracking-[0.22em] text-white/45 mb-3">Legal</div>
            <ul className="space-y-2 text-sm text-white/75">
              <li><a href="#" className="hover:text-white">Política de privacidad</a></li>
              <li><a href="#" className="hover:text-white">Términos y condiciones</a></li>
              <li>
                <a
                  href="https://www.bcn.cl/leychile/navegar?idNorma=7155"
                  target="_blank" rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  DL 3.516 (Ley Chile)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row md:justify-between gap-3 text-xs text-white/45">
          <p>© {new Date().getFullYear()} Forestal Valle Escondido SpA. Todos los derechos reservados.</p>
          <p>Sitio operado en alianza con <span className="text-white/65">ofertaterrenos.cl</span></p>
        </div>
      </div>
    </footer>
  );
}
