import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Users, 
  FileText,
  DollarSign,
  Calendar,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Activity {
  id: string;
  type: 'sale' | 'lead' | 'meeting' | 'document' | 'payment' | 'alert';
  title: string;
  description?: string;
  project?: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error' | 'info';
}

interface ActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
  className?: string;
}

const getActivityIcon = (type: Activity['type']): LucideIcon => {
  switch (type) {
    case 'sale': return DollarSign;
    case 'lead': return Users;
    case 'meeting': return Calendar;
    case 'document': return FileText;
    case 'payment': return DollarSign;
    case 'alert': return AlertCircle;
    default: return Clock;
  }
};

const getStatusStyles = (status: Activity['status']) => {
  switch (status) {
    case 'success':
      return {
        icon: CheckCircle,
        bg: 'bg-green-500/10',
        text: 'text-green-600',
        border: 'border-green-500/20'
      };
    case 'error':
      return {
        icon: AlertCircle,
        bg: 'bg-red-500/10',
        text: 'text-red-600',
        border: 'border-red-500/20'
      };
    case 'warning':
      return {
        icon: Clock,
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-600',
        border: 'border-yellow-500/20'
      };
    default:
      return {
        icon: AlertCircle,
        bg: 'bg-blue-500/10',
        text: 'text-blue-600',
        border: 'border-blue-500/20'
      };
  }
};

const ActivityItem = ({ activity, index }: { activity: Activity; index: number }) => {
  const statusStyles = getStatusStyles(activity.status);
  const StatusIcon = statusStyles.icon;
  const ActivityIcon = getActivityIcon(activity.type);
  
  const timeAgo = formatDistanceToNow(activity.timestamp, { 
    addSuffix: true,
    locale: es 
  });
  
  return (
    <div 
      className={cn(
        'activity-item opacity-0 animate-slide-in-right',
      )}
      style={{ 
        animationDelay: `${index * 0.08}s`,
        animationFillMode: 'forwards'
      }}
    >
      <div className={cn(
        'flex items-center justify-center w-9 h-9 rounded-lg shrink-0',
        statusStyles.bg
      )}>
        <ActivityIcon className={cn('h-4 w-4', statusStyles.text)} />
      </div>
      
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm leading-tight line-clamp-1">
            {activity.title}
          </p>
          <StatusIcon className={cn('h-4 w-4 shrink-0', statusStyles.text)} />
        </div>
        
        {activity.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {activity.description}
          </p>
        )}
        
        <div className="flex items-center gap-2">
          {activity.project && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {activity.project}
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground">
            {timeAgo}
          </span>
        </div>
      </div>
    </div>
  );
};

export const ActivityFeed = ({ 
  activities, 
  maxItems = 5,
  className 
}: ActivityFeedProps) => {
  const displayedActivities = activities.slice(0, maxItems);
  
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Actividad Reciente</CardTitle>
          {activities.length > maxItems && (
            <Badge variant="secondary" className="text-xs">
              +{activities.length - maxItems} más
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        {displayedActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No hay actividad reciente
          </div>
        ) : (
          displayedActivities.map((activity, index) => (
            <ActivityItem 
              key={activity.id} 
              activity={activity} 
              index={index}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
