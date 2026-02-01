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
  const isInverted = variant === 'inverted';
  
  return (
    <div 
      className={cn(
        'relative flex items-center justify-center rounded-xl overflow-hidden',
        'transition-all duration-300 ease-out group',
        isMonochrome 
          ? 'bg-foreground/10' 
          : isInverted
          ? 'bg-white/10 backdrop-blur-sm'
          : 'bg-gradient-to-br from-primary via-emerald-500 to-accent',
        !isMonochrome && !isInverted && 'shadow-lg shadow-primary/25',
        animated && 'logo-breathe',
        sizeClasses[size],
        className
      )}
      role="img"
      aria-label="Ofertaterrenos logo icon"
    >
      {/* Animated shimmer overlay */}
      {animated && !isMonochrome && (
        <div className="absolute inset-0 logo-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      
      {/* SVG Logo Mark */}
      <svg 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          'w-[58%] h-[58%] relative z-10',
          'transition-transform duration-300',
          animated && 'group-hover:scale-105'
        )}
      >
        {/* Background terrain layers */}
        <path 
          d="M3 23L10 14L16 18L22 11L29 23H3Z" 
          fill="currentColor"
          className={cn(
            isMonochrome ? 'text-foreground/20' : 
            isInverted ? 'text-white/25' : 'text-primary-foreground/25'
          )}
        />
        
        {/* Main terrain peak */}
        <path 
          d="M5 22L16 7L27 22H5Z" 
          fill="currentColor"
          className={cn(
            isMonochrome ? 'text-foreground/60' : 
            isInverted ? 'text-white/90' : 'text-primary-foreground/90'
          )}
        />
        
        {/* Inner tech diamond */}
        <path 
          d="M16 11L21 18H11L16 11Z" 
          fill="currentColor"
          className={cn(
            isMonochrome ? 'text-foreground/30' : 
            isInverted ? 'text-white/35' : 'text-primary-foreground/35'
          )}
        />
        
        {/* Diamond highlight */}
        <path 
          d="M16 13L18.5 17H13.5L16 13Z" 
          fill="currentColor"
          className={cn(
            isMonochrome ? 'text-foreground/15' : 
            isInverted ? 'text-white/20' : 'text-primary-foreground/20'
          )}
        />
        
        {/* Horizon line */}
        <path 
          d="M2 24H30" 
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={cn(
            isMonochrome ? 'text-foreground/80' : 
            isInverted ? 'text-white' : 'text-primary-foreground'
          )}
        />
        
        {/* Parcel division indicators */}
        <path 
          d="M9 22V26M16 22V28M23 22V26" 
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={cn(
            isMonochrome ? 'text-foreground/50' : 
            isInverted ? 'text-white/60' : 'text-primary-foreground/60'
          )}
        />
        
        {/* Corner accent dots */}
        <circle 
          cx="5" cy="26" r="1" 
          fill="currentColor"
          className={cn(
            isMonochrome ? 'text-foreground/40' : 
            isInverted ? 'text-white/50' : 'text-primary-foreground/50'
          )}
        />
        <circle 
          cx="27" cy="26" r="1" 
          fill="currentColor"
          className={cn(
            isMonochrome ? 'text-foreground/40' : 
            isInverted ? 'text-white/50' : 'text-primary-foreground/50'
          )}
        />
      </svg>
      
      {/* Subtle glow effect */}
      {!isMonochrome && (
        <div className={cn(
          'absolute inset-0 rounded-xl',
          'bg-gradient-to-t from-transparent via-transparent to-white/15',
          'opacity-100 transition-opacity duration-300'
        )} />
      )}
    </div>
  );
};

export default LogoIcon;
