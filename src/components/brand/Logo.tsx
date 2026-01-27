import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'light' | 'dark';
}

const sizeClasses = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
  xl: 'h-14 w-14',
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
  variant = 'default' 
}: LogoProps) => {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {/* Logo Icon */}
      <div className={cn(
        'relative flex items-center justify-center rounded-xl',
        'bg-gradient-to-br from-primary via-emerald-500 to-accent',
        'shadow-lg shadow-primary/25',
        sizeClasses[size]
      )}>
        {/* SVG Logo Mark - Parcela/Terreno + Tech Diamond */}
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-[60%] h-[60%]"
        >
          {/* Base land/terrain shape */}
          <path 
            d="M4 22L16 6L28 22H4Z" 
            fill="currentColor"
            className="text-primary-foreground/90"
          />
          {/* Inner diamond - tech element */}
          <path 
            d="M16 10L22 18H10L16 10Z" 
            fill="currentColor"
            className="text-primary-foreground/40"
          />
          {/* Horizon line */}
          <path 
            d="M2 24H30" 
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-primary-foreground"
          />
          {/* Small parcels indicator */}
          <path 
            d="M8 22V26M16 22V28M24 22V26" 
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="text-primary-foreground/60"
          />
        </svg>
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/10" />
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            'font-bold tracking-tight leading-none',
            textSizeClasses[size],
            variant === 'light' ? 'text-white' : 'text-foreground'
          )}>
            Oferta<span className="text-primary">terrenos</span>
          </span>
          {size !== 'sm' && (
            <span className={cn(
              'text-[10px] uppercase tracking-widest font-medium',
              variant === 'light' ? 'text-white/60' : 'text-muted-foreground'
            )}>
              Proptech Chile
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
