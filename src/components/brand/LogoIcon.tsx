import { cn } from '@/lib/utils';
import markUrl from '@/assets/brand/ot-symbol.svg';

interface LogoIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'monochrome' | 'inverted';
  animated?: boolean;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-12 w-12',
};

const LogoIcon = ({ 
  className, 
  size = 'md',
  variant: _variant = 'default',
}: LogoIconProps) => {
  return (
    <img
      src={markUrl}
      alt="Ofertaterrenos"
      className={cn(sizeClasses[size], className)}
      role="img"
    />
  );
};

export default LogoIcon;
