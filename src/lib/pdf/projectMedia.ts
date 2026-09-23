import valle from '@/assets/valle-escondido-licanten/vel-valle.jpg';
import camino from '@/assets/valle-escondido-licanten/vel-camino.jpg';
import lago from '@/assets/valle-escondido-licanten/vel-lago.jpg';
import atardecer from '@/assets/valle-escondido-licanten/vel-atardecer.jpg';

/** Existing landing artwork, explicitly illustrative until real photography is uploaded. */
export const referenceProjectMedia = (slug?: string | null): { src: string; caption: string }[] =>
  slug === 'valle-escondido-licanten' ? [
    { src: valle, caption: 'Paisaje del valle · imagen referencial' },
    { src: camino, caption: 'Camino arbolado · imagen referencial' },
    { src: lago, caption: 'Entorno del lago · imagen referencial' },
    { src: atardecer, caption: 'Atardecer · imagen referencial' },
  ] : [];
