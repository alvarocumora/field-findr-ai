import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { LifeBuoy, BookOpen, Inbox } from 'lucide-react';
import { useMyTickets, type SupportTicket } from '@/hooks/useSupportTickets';
import { categoryLabel, statusLabel, priorityLabel } from '@/lib/support/helpCenter';
import NewTicketDialog from '@/components/support/NewTicketDialog';
import TicketThread from '@/components/support/TicketThread';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  open: 'default',
  in_progress: 'secondary',
  waiting_user: 'destructive',
  resolved: 'outline',
  closed: 'outline',
};

const SupportTickets = () => {
  const { data: tickets, isLoading } = useMyTickets();
  const [active, setActive] = useState<SupportTicket | null>(null);

  const current = tickets?.find((t) => t.id === active?.id) ?? active;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-primary" aria-hidden="true" />
            Soporte
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Consultas de comisiones, proyectos, publicaciones y pagos con historial completo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/ayuda">
              <BookOpen className="h-4 w-4" aria-hidden="true" /> Centro de ayuda
            </Link>
          </Button>
          <NewTicketDialog triggerLabel="Nuevo ticket" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mis tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <Skeleton className="h-24 w-full" />}
          {!isLoading && (tickets?.length ?? 0) === 0 && (
            <div className="py-10 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-3 opacity-60" aria-hidden="true" />
              Todavía no has abierto tickets.
            </div>
          )}
          {tickets?.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t)}
              className="w-full text-left rounded-lg border border-border/60 p-4 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{t.subject}</p>
                <Badge variant={STATUS_VARIANT[t.status] ?? 'outline'}>{statusLabel(t.status)}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-[10px]">{categoryLabel(t.category)}</Badge>
                <span>Prioridad {priorityLabel(t.priority).toLowerCase()}</span>
                <span>·</span>
                <span>Última actividad {new Date(t.last_message_at).toLocaleString('es-CL')}</span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {current && (
            <>
              <SheetHeader>
                <SheetTitle>{current.subject}</SheetTitle>
                <SheetDescription>
                  {categoryLabel(current.category)} · {statusLabel(current.status)}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <TicketThread ticket={current} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SupportTickets;
