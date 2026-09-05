import { Droplets, Waves, TreePine, Sun, Tractor, Home, Mountain } from 'lucide-react';

/**
 * Accesos rápidos por uso / estilo de vida.
 *
 * Los portales líderes de terrenos entran por el uso ("con agua", "orilla de
 * lago", "para cabaña") antes que por filtros numéricos. Cada chip activa las
 * etiquetas equivalentes ya existentes en las publicaciones.
 */
export const LIFESTYLE_CHIPS: { key: string; label: string; icon: typeof Droplets; tags: string[] }[] = [
  { key: 'agua', label: 'Con agua', icon: Droplets, tags: ['agua', 'con-agua', 'pozo', 'derechos-de-agua'] },
  { key: 'lago', label: 'Orilla de lago', icon: Waves, tags: ['lago', 'orilla-lago', 'lacustre'] },
  { key: 'playa', label: 'Cerca de playa', icon: Sun, tags: ['playa', 'costa', 'mar', 'costero'] },
  { key: 'bosque', label: 'Con bosque', icon: TreePine, tags: ['bosque', 'nativo', 'forestal'] },
  { key: 'agricola', label: 'Agrícola', icon: Tractor, tags: ['agricola', 'agrícola', 'cultivo', 'frutal'] },
  { key: 'cabana', label: 'Para cabaña', icon: Home, tags: ['cabana', 'cabaña', 'habitacional', 'residencial'] },
  { key: 'vista', label: 'Con vista', icon: Mountain, tags: ['vista', 'mirador', 'panoramica'] },
];

interface Props {
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  className?: string;
}

const LifestyleChips = ({ selectedTags, onToggleTag, className }: Props) => (
  <div
    className={`flex gap-2 overflow-x-auto px-3 py-2 scrollbar-none ${className ?? ''}`}
    role="group"
    aria-label="Buscar por uso del terreno"
  >
    {LIFESTYLE_CHIPS.map((c) => {
      const active = c.tags.some((t) => selectedTags.includes(t));
      return (
        <button
          key={c.key}
          type="button"
          aria-pressed={active}
          onClick={() =>
            (active ? c.tags.filter((t) => selectedTags.includes(t)) : c.tags).forEach((t) => onToggleTag(t))
          }
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            active
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border/60 bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          <c.icon className="h-3.5 w-3.5" aria-hidden />
          {c.label}
        </button>
      );
    })}
  </div>
);

export default LifestyleChips;
