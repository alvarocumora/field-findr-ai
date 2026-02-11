import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'light' | 'dark' | 'monochrome';
  animated?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const textSizeClasses = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
};

const Logo = ({ 
  className, 
  size = 'md', 
  showText = true,
  variant = 'default',
  animated = false
}: LogoProps) => {
  const isMonochrome = variant === 'monochrome';
  
  return (
    <div 
      className={cn('flex items-center gap-2.5', className)}
      role="img"
      aria-label="Ofertaterrenos logo"
    >
      {/* Logo Icon */}
      <div className={cn(
        'relative flex items-center justify-center rounded-xl overflow-hidden',
        'transition-all duration-300 ease-out',
        isMonochrome 
          ? 'bg-foreground/10' 
          : 'bg-gradient-to-br from-primary to-accent',
        !isMonochrome && 'shadow-md shadow-primary/15',
        animated && 'logo-breathe',
        'group',
        sizeClasses[size]
      )}>
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            'w-[60%] h-[60%] relative z-10',
            'transition-transform duration-300',
            animated && 'group-hover:scale-105'
          )}
        >
          {/* Clean terrain peak */}
          <path 
            d="M4 24L16 8L28 24H4Z" 
            fill="currentColor"
            className={cn(
              isMonochrome ? 'text-foreground/60' : 'text-primary-foreground/90'
            )}
          />
          
          {/* Horizon line */}
          <path 
            d="M2 26H30" 
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className={cn(
              isMonochrome ? 'text-foreground/70' : 'text-primary-foreground'
            )}
          />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <span className={cn(
          'font-bold tracking-tight leading-none font-heading',
          textSizeClasses[size],
          variant === 'light' ? 'text-white' : 'text-foreground'
        )}>
          Oferta<span className={cn(
            isMonochrome ? 'text-foreground/60 font-medium' : 'text-primary font-medium'
          )}>terrenos</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
