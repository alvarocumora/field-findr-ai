import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, CheckCheck, MessageSquare, CreditCard, FileText, Users } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useMessages } from '@/hooks/useMessages';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
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

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { data: notifications = [], unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { totalUnread: unreadMessages } = useMessages();

  const totalBadge = unreadCount + unreadMessages;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground focus-ring">
          <Bell className="h-5 w-5" />
          {totalBadge > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] bg-destructive text-destructive-foreground border-2 border-background">
              {totalBadge > 99 ? '99+' : totalBadge}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h4 className="font-semibold text-sm">Notificaciones</h4>
          <div className="flex items-center gap-2">
            {unreadMessages > 0 && (
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs" onClick={() => setOpen(false)}>
                <Link to="/asesor/messages">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {unreadMessages} msg
                </Link>
              </Button>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => markAllAsRead.mutate()}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Leer todo
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No tienes notificaciones
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.slice(0, 20).map((notif) => {
                const Icon = typeIcons[notif.type] || Bell;
                return (
                  <div
                    key={notif.id}
                    className={cn(
                      "flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer",
                      !notif.read && "bg-primary/5"
                    )}
                    onClick={() => {
                      if (!notif.read) markAsRead.mutate(notif.id);
                      if (notif.link) {
                        setOpen(false);
                        window.location.href = notif.link;
                      }
                    }}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg flex-shrink-0 mt-0.5",
                      !notif.read ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Icon className={cn("h-4 w-4", !notif.read ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm leading-tight", !notif.read && "font-medium")}>
                        {notif.title}
                      </p>
                      {notif.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
