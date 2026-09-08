import { cn } from '@/lib/utils';
import markUrl from '@/assets/brand/ot-symbol.svg';

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
  showText = true,
  variant = 'default',
  animated: _animated = false
}: LogoProps) => {
  const isMono = variant === 'monochrome';

  return (
    <div 
      className={cn('flex items-center gap-2.5', className)}
      role="img"
      aria-label="Ofertaterrenos logo"
    >
      <img src={markUrl} alt="" className={cn('shrink-0', size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-7 w-7' : size === 'lg' ? 'h-9 w-9' : 'h-11 w-11')} />
      {showText && (
        <span className={cn('flex items-baseline font-bold leading-none font-heading uppercase', sizeClasses[size])}>
          <span className={variant === 'light' ? 'text-foreground' : 'text-foreground'}>OFERTA</span>
          <span className={cn('ml-[0.16em]', isMono ? 'text-foreground/60' : 'gradient-text-hero')}>TERRENOS</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
