import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'light' | 'dark' | 'monochrome';
  animated?: boolean;
}

const textSizeClasses = {
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
  return (
    <div 
      className={cn('flex items-center', className)}
      role="img"
      aria-label="Ofertaterrenos logo"
    >
      <span className={cn(
        'font-bold tracking-tight leading-none font-heading',
        textSizeClasses[size],
        variant === 'light' ? 'text-white' : 'text-foreground'
      )}>
        Oferta<span className={cn(
          variant === 'monochrome' ? 'text-foreground/60 font-medium' : 'text-primary font-medium'
        )}>terrenos</span>
      </span>
    </div>
  );
};

export default Logo;
