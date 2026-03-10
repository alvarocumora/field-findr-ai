import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { Bell, CheckCheck, Trash2, MessageSquare, CreditCard, FileText, Users, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  message: MessageSquare,
  reservation: FileText,
  payment: CreditCard,
  lead: Users,
  system: Bell,
  info: Bell,
};

const typeLabels: Record<string, string> = {
  message: 'Mensaje',
  reservation: 'Reserva',
  payment: 'Pago',
  lead: 'Lead',
  system: 'Sistema',
  info: 'Info',
};

const NotificationCenter = () => {
  const { data: notifications = [], unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [tab, setTab] = useState('all');

  const filtered = notifications.filter(n => {
    if (tab === 'all') return true;
    if (tab === 'unread') return !n.read;
    return n.type === tab;
  });

  const types = [...new Set(notifications.map(n => n.type))];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Centro de Notificaciones
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todas leídas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()} className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="unread">
            Sin leer
            {unreadCount > 0 && <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">{unreadCount}</Badge>}
          </TabsTrigger>
          {types.map(type => (
            <TabsTrigger key={type} value={type} className="gap-1">
              {typeLabels[type] || type}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No hay notificaciones{tab !== 'all' ? ' en esta categoría' : ''}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(notif => (
                <NotificationRow
                  key={notif.id}
                  notification={notif}
                  onMarkRead={() => markAsRead.mutate(notif.id)}
                  onDelete={() => deleteNotification.mutate(notif.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const NotificationRow = ({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: () => void;
  onDelete: () => void;
}) => {
  const Icon = typeIcons[notification.type] || Bell;

  return (
    <Card className={cn('transition-colors', !notification.read && 'border-primary/20 bg-primary/5')}>
      <CardContent className="p-4 flex items-start gap-3">
        <div className={cn(
          'p-2 rounded-lg flex-shrink-0 mt-0.5',
          !notification.read ? 'bg-primary/10' : 'bg-muted'
        )}>
          <Icon className={cn('h-4 w-4', !notification.read ? 'text-primary' : 'text-muted-foreground')} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={cn('text-sm', !notification.read && 'font-semibold')}>{notification.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!notification.read && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMarkRead} title="Marcar como leída">
                  <CheckCheck className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete} title="Eliminar">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="outline" className="text-[10px] py-0">{typeLabels[notification.type] || notification.type}</Badge>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
            </span>
          </div>
        </div>
        {notification.link && (
          <Button variant="ghost" size="sm" className="text-xs flex-shrink-0" asChild>
            <a href={notification.link}>Ver</a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;
