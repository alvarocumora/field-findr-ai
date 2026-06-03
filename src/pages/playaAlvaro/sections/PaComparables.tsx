import RealListingsSection from '@/components/RealListingsSection';

export default function PaComparables() {
  return (
    <div className="bg-[var(--hue-forest,#0a2540)]/60 border-y border-white/10">
      <RealListingsSection
        title="Comparables reales en la zona costera"
        subtitle="Terrenos publicados ahora mismo en portales de Chile — referencia de mercado para Playa Álvaro"
        defaultCountry="Chile"
        limit={9}
        showCountryFilter={false}
        compact
      />
    </div>
  );
}
