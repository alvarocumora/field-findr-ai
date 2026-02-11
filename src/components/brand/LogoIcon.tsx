import { cn } from '@/lib/utils';

interface LogoIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'monochrome' | 'inverted';
  animated?: boolean;
}

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const LogoIcon = ({ 
  className, 
  size = 'md',
  variant = 'default',
}: LogoIconProps) => {
  return (
    <span 
      className={cn(
        'font-bold tracking-tight font-heading',
        textSizeClasses[size],
        variant === 'monochrome' ? 'text-foreground/80' : 'text-foreground',
        className
      )}
      role="img"
      aria-label="Ofertaterrenos"
    >
      O<span className={cn(
        variant === 'monochrome' ? 'text-foreground/60' : 'text-primary'
      )}>t</span>
    </span>
  );
};

export default LogoIcon;
