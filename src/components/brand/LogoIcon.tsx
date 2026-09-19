import { cn } from '@/lib/utils';

interface LogoIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'monochrome' | 'inverted';
  animated?: boolean;
}

const sizeClasses = {
  sm: 'text-[11px]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-base',
};

const LogoIcon = ({ 
  className, 
  size = 'md',
  variant = 'default',
}: LogoIconProps) => {
  const monochrome = variant === 'monochrome';

  return (
    <span
      className={cn(
        'inline-flex min-w-0 items-baseline whitespace-nowrap font-heading font-bold leading-none',
        sizeClasses[size],
        className,
      )}
      role="img"
      aria-label="OfertaTerrenos.com"
    >
      <span className="text-foreground">Oferta</span>
      <span className={cn(monochrome ? 'text-foreground' : 'gradient-text-hero')}>Terrenos</span>
      <span className="text-[0.58em] font-semibold text-muted-foreground">.com</span>
    </span>
  );
};

export default LogoIcon;
