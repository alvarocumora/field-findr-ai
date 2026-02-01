import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Users, 
  FileText, 
  Map, 
  Calculator,
  BarChart3,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline';
  color?: string;
}

interface QuickActionsProps {
  actions?: QuickAction[];
  className?: string;
}

const defaultActions: QuickAction[] = [
  {
    id: 'new-property',
    label: 'Nueva Propiedad',
    icon: Plus,
    onClick: () => {},
    variant: 'default',
  },
  {
    id: 'new-lead',
    label: 'Nuevo Lead',
    icon: Users,
    onClick: () => {},
    variant: 'outline',
  },
  {
    id: 'new-document',
    label: 'Subir Documento',
    icon: FileText,
    onClick: () => {},
    variant: 'outline',
  },
  {
    id: 'view-map',
    label: 'Ver Mapa',
    icon: Map,
    onClick: () => {},
    variant: 'outline',
  },
  {
    id: 'calculator',
    label: 'Calculadoras',
    icon: Calculator,
    onClick: () => {},
    variant: 'outline',
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: BarChart3,
    onClick: () => {},
    variant: 'outline',
  },
];

export const QuickActions = ({ 
  actions = defaultActions,
  className 
}: QuickActionsProps) => {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant={action.variant || 'outline'}
                className={cn(
                  'h-auto py-3 px-3 flex-col gap-2 justify-start',
                  'opacity-0 animate-scale-in',
                  'hover:scale-[1.02] transition-transform',
                  action.variant === 'default' && 'bg-primary hover:bg-primary/90'
                )}
                style={{ 
                  animationDelay: `${index * 0.05}s`,
                  animationFillMode: 'forwards'
                }}
                onClick={action.onClick}
              >
                <Icon className={cn(
                  'h-5 w-5',
                  action.variant === 'default' ? 'text-primary-foreground' : 'text-muted-foreground'
                )} />
                <span className={cn(
                  'text-xs font-medium text-center leading-tight',
                  action.variant === 'default' ? 'text-primary-foreground' : ''
                )}>
                  {action.label}
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
