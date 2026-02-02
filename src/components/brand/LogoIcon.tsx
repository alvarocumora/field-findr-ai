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
        sizeClasses[size],
        className
      )}
      role="img"
      aria-label="Ofertaterrenos logo icon"
    >
      {/* SVG Logo Mark - Geometric Hexagon */}
      <svg 
        viewBox="0 0 512 512" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          'w-full h-full relative z-10',
          'transition-transform duration-300',
          animated && 'group-hover:scale-105'
        )}
      >
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isMonochrome ? 'currentColor' : '#22C55E'} stopOpacity={isMonochrome ? 0.1 : 1}/>
            <stop offset="50%" stopColor={isMonochrome ? 'currentColor' : '#10B981'} stopOpacity={isMonochrome ? 0.1 : 1}/>
            <stop offset="100%" stopColor={isMonochrome ? 'currentColor' : '#0EA5E9'} stopOpacity={isMonochrome ? 0.1 : 1}/>
          </linearGradient>
          <linearGradient id="glowGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
          </linearGradient>
        </defs>
        
        {/* Background rounded square */}
        <rect 
          x="32" y="32" width="448" height="448" rx="96" 
          fill={isMonochrome ? 'transparent' : 'url(#bgGrad)'}
          stroke={isMonochrome ? 'currentColor' : 'none'}
          strokeWidth={isMonochrome ? 8 : 0}
          className={isMonochrome ? 'text-foreground/20' : ''}
        />
        
        {/* Inner glow */}
        {!isMonochrome && (
          <rect x="32" y="32" width="448" height="448" rx="96" fill="url(#glowGrad)"/>
        )}
        
        {/* Hexagon frame */}
        <path 
          d="M256 96L400 180V348L256 432L112 348V180L256 96Z" 
          fill="none" 
          stroke={isMonochrome ? 'currentColor' : 'rgba(255,255,255,0.9)'}
          strokeWidth="16"
          strokeLinejoin="round"
          className={isMonochrome ? 'text-foreground/60' : ''}
        />
        
        {/* Main terrain mountain */}
        <path 
          d="M160 320L256 180L352 320H160Z" 
          fill={isMonochrome ? 'currentColor' : 'rgba(255,255,255,0.85)'}
          className={isMonochrome ? 'text-foreground/50' : ''}
        />
        
        {/* Secondary peak */}
        <path 
          d="M200 320L280 220L360 320H200Z" 
          fill={isMonochrome ? 'currentColor' : 'rgba(255,255,255,0.5)'}
          className={isMonochrome ? 'text-foreground/25' : ''}
        />
        
        {/* Diamond center */}
        <path 
          d="M256 220L290 280H222L256 220Z" 
          fill={isMonochrome ? 'currentColor' : 'rgba(255,255,255,0.3)'}
          className={isMonochrome ? 'text-foreground/15' : ''}
        />
        
        {/* Base line */}
        <line 
          x1="140" y1="340" x2="372" y2="340" 
          stroke={isMonochrome ? 'currentColor' : 'rgba(255,255,255,0.95)'}
          strokeWidth="12" 
          strokeLinecap="round"
          className={isMonochrome ? 'text-foreground/70' : ''}
        />
        
        {/* Grid markers */}
        <line x1="200" y1="320" x2="200" y2="360" 
              stroke={isMonochrome ? 'currentColor' : 'rgba(255,255,255,0.6)'} 
              strokeWidth="8" strokeLinecap="round"
              className={isMonochrome ? 'text-foreground/40' : ''}/>
        <line x1="256" y1="320" x2="256" y2="370" 
              stroke={isMonochrome ? 'currentColor' : 'rgba(255,255,255,0.6)'} 
              strokeWidth="8" strokeLinecap="round"
              className={isMonochrome ? 'text-foreground/40' : ''}/>
        <line x1="312" y1="320" x2="312" y2="360" 
              stroke={isMonochrome ? 'currentColor' : 'rgba(255,255,255,0.6)'} 
              strokeWidth="8" strokeLinecap="round"
              className={isMonochrome ? 'text-foreground/40' : ''}/>
      </svg>
      
      {/* Animated shimmer overlay */}
      {animated && !isMonochrome && (
        <div className="absolute inset-0 logo-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
      )}
    </div>
  );
};

export default LogoIcon;
