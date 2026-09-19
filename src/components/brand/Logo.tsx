import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'light' | 'dark' | 'monochrome';
  animated?: boolean;
}

const sizeClasses = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

const Logo = ({ 
  className, 
  size = 'md', 
  showText = true,
  variant = 'default',
  animated: _animated = false
}: LogoProps) => {
  const isMono = variant === 'monochrome';

  return (
    <div 
      className={cn('inline-flex min-w-0 items-baseline', className)}
      role="img"
      aria-label="OfertaTerrenos.com"
    >
      {showText && (
        <span className={cn('flex min-w-0 items-baseline whitespace-nowrap font-heading font-bold leading-none', sizeClasses[size])}>
          <span className="text-foreground">Oferta</span>
          <span className={cn(isMono ? 'text-foreground' : 'gradient-text-hero')}>Terrenos</span>
          <span className="text-[0.58em] font-semibold text-muted-foreground">.com</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
