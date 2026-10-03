import velValle from '@/assets/valle-escondido-licanten/vel-valle.jpg';
import valleHualane from '@/assets/covers/valle-hualane.jpg';
import brisasCaone from '@/assets/covers/brisas-de-caone.jpg';
import exploraPark from '@/assets/covers/explora-park.jpg';

/** Portadas de respaldo para proyectos sin fotos propias en la base de datos (por slug o id). */
const COVERS: Record<string, string> = {
  'valle-escondido-licanten': velValle,
  'b4363fda-e99f-400d-ae95-2cbc8244b770': velValle,
  'parcelas-caone-hualane': valleHualane,
  '761e73ed-cc0d-5605-a06a-4a4348523b4b': valleHualane,
  'brisas-de-caone': brisasCaone,
  'e0d83d66-c7be-4c94-a017-3ad331d74699': brisasCaone,
  'explora-park': exploraPark,
  '6e6f62be-a81a-4374-a3ef-cf296bd638d0': exploraPark,
};

const isRealImage = (u?: string | null) => !!u && !u.includes('placeholder');

/** Devuelve las imágenes del proyecto o, si no tiene, su portada de respaldo. */
export function projectImages(p: { id?: string; slug?: string | null; images?: string[] | null }): string[] {
  const real = (p.images ?? []).filter(isRealImage);
  if (real.length) return real;
  const fallback = (p.slug && COVERS[p.slug]) || (p.id && COVERS[p.id]);
  return fallback ? [fallback] : [];
}
