import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'light' | 'dark' | 'monochrome';
  animated?: boolean;
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

const Logo = ({ 
  className, 
  size = 'md', 
  showText: _showText = true,
  variant = 'default',
  animated: _animated = false
}: LogoProps) => {
  const isLight = variant === 'light';
  const isMono = variant === 'monochrome';

  return (
    <div 
      className={cn('flex items-center', className)}
      role="img"
      aria-label="Ofertaterrenos logo"
    >
      <span className={cn(
        'font-bold tracking-tight leading-none font-heading uppercase',
        sizeClasses[size],
        isLight ? 'text-white' : 'text-foreground'
      )}>
        OFERTA
      </span>
      <span className={cn(
        'font-bold tracking-tight leading-none font-heading uppercase ml-[0.15em]',
        sizeClasses[size],
        isMono ? 'text-foreground/60' : 'gradient-text-hero'
      )}>
        TERRENOS
      </span>
    </div>
  );
};

export default Logo;
