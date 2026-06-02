export default function PaFooter() {
  return (
    <footer className="border-t border-[var(--hue-bone)]/10 px-6 py-12 md:px-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="hue-eyebrow mb-2">OFERTA TERRENOS</div>
          <div className="serif text-2xl text-[var(--hue-bone)]">Playa Álvaro</div>
          <p className="mt-2 text-xs text-[var(--hue-bone)]/50 max-w-sm">
            Subdivisión costera DL 3.516 · Región de Los Lagos · Chile
          </p>
        </div>
        <div className="text-xs text-[var(--hue-bone)]/40">
          © {new Date().getFullYear()} OFERTA TERRENOS · Información preliminar. Precios y disponibilidad
          sujetos a confirmación de aprobaciones sectoriales y permisos vigentes.
        </div>
      </div>
    </footer>
  );
}
