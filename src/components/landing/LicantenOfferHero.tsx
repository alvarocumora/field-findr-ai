import { Link } from 'react-router-dom';
import { ArrowUpRight, Calculator, MapPin, House } from 'lucide-react';
import { Button } from '@/components/ui/button';
import drone from '@/assets/valle-escondido-licanten/drone/vel-dron-2.jpg.asset.json';
import { LICANTEN_PATH } from '@/lib/easyCredit';

export default function LicantenOfferHero() {
  return (
    <section aria-labelledby="licanten-offer-title" className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      <img src={drone.url} alt="Vista aérea real de Valle Escondido, Licantén" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      <div className="licanten-offer-overlay absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20">
        <p className="mb-5 flex items-center gap-2 text-xs font-medium uppercase"><MapPin className="h-4 w-4" aria-hidden="true" />Región del Maule · Chile</p>
        <h2 id="licanten-offer-title" className="max-w-2xl font-editorial text-4xl leading-tight sm:text-5xl md:text-6xl">VALLE ESCONDIDO <span className="block text-2xl sm:text-3xl">· LICANTÉN</span></h2>
        <p className="mt-6 text-2xl font-semibold sm:text-3xl">Parcelas desde $19.990.000 <span className="text-sm font-normal">CLP</span></p>
        <div className="my-6 flex max-w-xl gap-3 border-y border-primary-foreground/35 py-5">
          <House className="mt-1 h-6 w-6 shrink-0" aria-hidden="true" />
          <div><p className="text-lg leading-snug">Incluye kit de casa Modular Box de 36 m² sin costo adicional</p><p className="mt-2 text-xs">Kit básico de materiales, no vivienda terminada. Entrega 45–60 días después de escriturar.</p></div>
        </div>
        <p className="max-w-lg text-base">Entre bosques y cerca de las playas de Iloca y Duao</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="secondary" size="lg"><Link to={LICANTEN_PATH}>Ver parcelas<ArrowUpRight aria-hidden="true" /></Link></Button>
          <Button asChild variant="outline" size="lg" className="border-primary-foreground/50 bg-primary/40 text-primary-foreground hover:bg-primary hover:text-primary-foreground"><a href="#simula-tu-cuota"><Calculator aria-hidden="true" />Simular cuota</a></Button>
        </div>
      </div>
    </section>
  );
}