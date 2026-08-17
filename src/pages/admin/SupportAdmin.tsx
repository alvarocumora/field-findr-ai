import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Headphones, UserCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAllTickets, useUpdateTicket, type SupportTicket } from '@/hooks/useSupportTickets';
import {
  SUPPORT_CATEGORIES, TICKET_STATUSES, TICKET_PRIORITIES,
  categoryLabel, statusLabel, priorityLabel,
} from '@/lib/support/helpCenter';
import TicketThread from '@/components/support/TicketThread';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  open: 'default',
  in_progress: 'secondary',
  waiting_user: 'destructive',
  resolved: 'outline',
  closed: 'outline',
};

const SupportAdmin = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: tickets, isLoading } = useAllTickets({ status, category });
  const update = useUpdateTicket();

  const current: SupportTicket | undefined = tickets?.find((t) => t.id === activeId);

  const counts = (s: string) => tickets?.filter((t) => t.status === s).length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Headphones className="h-6 w-6 text-primary" aria-hidden="true" />
          Soporte y tickets
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Bandeja de brokers: asigna responsables, cambia estados y deja notas internas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Abiertos', value: counts('open') },
          { label: 'En curso', value: counts('in_progress') },
          { label: 'Esperando al broker', value: counts('waiting_user') },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-bold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">Bandeja</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[190px]" aria-label="Filtrar por estado">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {TICKET_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[190px]" aria-label="Filtrar por categoría">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {SUPPORT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (tickets?.length ?? 0) === 0 ? (
            <p className="py-10 text-center text-muted-foreground">Sin tickets para este filtro.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asunto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Asignado</TableHead>
                    <TableHead>Actividad</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets!.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium max-w-[240px] truncate">{t.subject}</TableCell>
                      <TableCell>{categoryLabel(t.category)}</TableCell>
                      <TableCell>{priorityLabel(t.priority)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[t.status] ?? 'outline'}>{statusLabel(t.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {t.assigned_to
                          ? t.assigned_to === user?.id ? 'Tú' : `${t.assigned_to.slice(0, 8)}…`
                          : 'Sin asignar'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(t.last_message_at).toLocaleString('es-CL')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setActiveId(t.id)}>
                          Abrir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!activeId} onOpenChange={(o) => !o && setActiveId(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {current && (
            <>
              <SheetHeader>
                <SheetTitle>{current.subject}</SheetTitle>
                <SheetDescription>
                  {categoryLabel(current.category)} · creado el{' '}
                  {new Date(current.created_at).toLocaleDateString('es-CL')}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">Estado</label>
                  <Select
                    value={current.status}
                    onValueChange={(v) => update.mutate({ id: current.id, patch: { status: v } })}
                  >
                    <SelectTrigger aria-label="Cambiar estado"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TICKET_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Prioridad</label>
                  <Select
                    value={current.priority}
                    onValueChange={(v) => update.mutate({ id: current.id, patch: { priority: v } })}
                  >
                    <SelectTrigger aria-label="Cambiar prioridad"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TICKET_PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-3">
                {current.assigned_to === user?.id ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => update.mutate({ id: current.id, patch: { assigned_to: null } })}
                  >
                    <UserCheck className="h-4 w-4" aria-hidden="true" /> Liberar asignación
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => update.mutate({ id: current.id, patch: { assigned_to: user?.id ?? null } })}
                  >
                    <UserCheck className="h-4 w-4" aria-hidden="true" /> Asignármelo
                  </Button>
                )}
              </div>

              <div className="mt-6">
                <TicketThread ticket={current} allowInternal />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SupportAdmin;
