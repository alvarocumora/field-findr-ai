import { Box, Building2, Factory } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LayoutType } from './layouts';

interface Props {
  value: LayoutType;
  onChange: (v: LayoutType) => void;
}

const HeroLayoutToggle = ({ value, onChange }: Props) => {
  const opts: { id: LayoutType; label: string; icon: typeof Box }[] = [
    { id: 'packing', label: 'Packing industrial', icon: Factory },
    { id: 'conjunto', label: 'Conjunto habitacional', icon: Building2 },
  ];
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-background/70 backdrop-blur-md border border-border/60 p-1 shadow-lg">
      {opts.map((o) => {
        const Icon = o.icon;
        const active = value === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300',
              active
                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{o.label}</span>
            <span className="sm:hidden">{o.id === 'packing' ? 'Packing' : 'Conjunto'}</span>
          </button>
        );
      })}
    </div>
  );
};

export default HeroLayoutToggle;
