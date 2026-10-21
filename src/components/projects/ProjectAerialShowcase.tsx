import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  images: string[];
  projectName: string;
  onOpenMap: () => void;
}

/**
 * Recorrido aéreo para proyectos con fotos de dron pero sin panorámicas 360.
 * Las fotos planas no se proyectan en el visor esférico (se deformarían):
 * se muestran como recorrido fotográfico real, con acceso al plano.
 */
export function ProjectAerialShowcase({ images, projectName, onOpenMap }: Props) {
  const [idx, setIdx] = useState(0);
  const count = images.length;
  const go = (d: number) => setIdx(i => (i + d + count) % count);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || count < 2) return;
    const t = window.setInterval(() => setIdx(i => (i + 1) % count), 6000);
    return () => window.clearInterval(t);
  }, [count]);

  if (count === 0) return null;

  return (
    <div className="space-y-3">
      <div
        className="relative h-[300px] sm:h-[420px] lg:h-[540px] overflow-hidden rounded-2xl border bg-muted"
        onKeyDown={(e) => { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); }}
        tabIndex={0}
        aria-roledescription="carrusel"
        aria-label={`Recorrido aéreo de ${projectName}`}
      >
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`${projectName} · vista aérea ${i + 1} de ${count}`}
            loading={i === 0 ? 'eager' : 'lazy'}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 motion-reduce:transition-none ${i === idx ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-foreground/70 to-transparent" />
        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow">
          <Plane className="h-3.5 w-3.5" aria-hidden="true" /> {/dron|drone/i.test(images[idx] ?? '') ? 'Recorrido aéreo · foto real de dron' : 'Recorrido del terreno · foto real'}
        </div>
        {count > 1 && (
          <>
            <Button type="button" size="icon" variant="secondary" aria-label="Foto anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full" onClick={() => go(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button type="button" size="icon" variant="secondary" aria-label="Foto siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full" onClick={() => go(1)}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
          <span className="rounded-md bg-background/90 px-2 py-1 text-xs text-foreground">{idx + 1} / {count}</span>
          <Button type="button" size="sm" onClick={onOpenMap}>Ver parcelas en el plano</Button>
        </div>
      </div>
      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button key={src} type="button" onClick={() => setIdx(i)} aria-label={`Ver foto ${i + 1}`}
              aria-current={i === idx}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${i === idx ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}>
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
