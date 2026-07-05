import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Users, 
  FolderKanban,
  Map, 
  Calculator,
  BarChart3,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  route: string;
  variant?: 'default' | 'secondary' | 'outline';
}

interface QuickActionsProps {
  className?: string;
  isAdmin?: boolean;
}

const agentActions: QuickAction[] = [
  { id: 'new-project', label: 'Nuevo Proyecto', icon: Plus, route: '/asesor/projects', variant: 'default' },
  { id: 'leads', label: 'CRM Leads', icon: Users, route: '/asesor/leads', variant: 'outline' },
  { id: 'projects', label: 'Mis Proyectos', icon: FolderKanban, route: '/asesor/projects', variant: 'outline' },
  { id: 'view-map', label: 'Explorar Mapa', icon: Map, route: '/explorar', variant: 'outline' },
  { id: 'calculator', label: 'Analytics', icon: Calculator, route: '/asesor/analytics', variant: 'outline' },
  { id: 'reports', label: 'Reportes', icon: BarChart3, route: '/asesor/reports', variant: 'outline' },
];

const adminActions: QuickAction[] = [
  { id: 'approvals', label: 'Aprobaciones', icon: Plus, route: '/admin/approvals', variant: 'default' },
  { id: 'users', label: 'Usuarios', icon: Users, route: '/admin/users', variant: 'outline' },
  { id: 'agents', label: 'Asesores', icon: FolderKanban, route: '/admin/agents', variant: 'outline' },
  { id: 'audit', label: 'Auditoría', icon: Map, route: '/admin/audit', variant: 'outline' },
  { id: 'financial', label: 'Financiero', icon: Calculator, route: '/admin/financial', variant: 'outline' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, route: '/admin/analytics', variant: 'outline' },
];

export const QuickActions = ({ className, isAdmin = false }: QuickActionsProps) => {
  const navigate = useNavigate();
  const actions = isAdmin ? adminActions : agentActions;

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
                onClick={() => navigate(action.route)}
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
