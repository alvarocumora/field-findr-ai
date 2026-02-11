import { cn } from '@/lib/utils';

interface LogoIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'monochrome' | 'inverted';
  animated?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const LogoIcon = ({ 
  className, 
  size = 'md',
  variant = 'default',
  animated = false
}: LogoIconProps) => {
  const isMonochrome = variant === 'monochrome';
  
  return (
    <div 
      className={cn(
        'relative flex items-center justify-center rounded-xl overflow-hidden',
        'transition-all duration-300 ease-out group',
        sizeClasses[size],
        className
      )}
      role="img"
      aria-label="Ofertaterrenos logo icon"
    >
      <svg 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          'w-full h-full relative z-10',
          'transition-transform duration-300',
          animated && 'group-hover:scale-105'
        )}
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isMonochrome ? 'currentColor' : '#22C55E'} />
            <stop offset="100%" stopColor={isMonochrome ? 'currentColor' : '#0EA5E9'} />
          </linearGradient>
        </defs>
        
        {/* Rounded square background */}
        <rect 
          x="2" y="2" width="44" height="44" rx="12" 
          fill={isMonochrome ? 'transparent' : 'url(#logoGrad)'}
          stroke={isMonochrome ? 'currentColor' : 'none'}
          strokeWidth={isMonochrome ? 2 : 0}
          className={isMonochrome ? 'text-foreground/30' : ''}
        />
        
        {/* Single clean terrain peak */}
        <path 
          d="M10 32L24 14L38 32H10Z" 
          fill={isMonochrome ? 'currentColor' : 'rgba(255,255,255,0.9)'}
          className={isMonochrome ? 'text-foreground/60' : ''}
        />
        
        {/* Horizon line */}
        <line 
          x1="8" y1="34" x2="40" y2="34" 
          stroke={isMonochrome ? 'currentColor' : 'rgba(255,255,255,0.7)'}
          strokeWidth="2.5" 
          strokeLinecap="round"
          className={isMonochrome ? 'text-foreground/50' : ''}
        />
      </svg>
    </div>
  );
};

export default LogoIcon;
