import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Lock, MessagesSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTicketMessages, useSendTicketMessage, type SupportTicket } from '@/hooks/useSupportTickets';

interface Props {
  ticket: SupportTicket;
  /** Habilita las notas internas (solo para administradores). */
  allowInternal?: boolean;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export const TicketThread = ({ ticket, allowInternal = false }: Props) => {
  const { user } = useAuth();
  const { data: messages, isLoading } = useTicketMessages(ticket.id);
  const send = useSendTicketMessage();
  const [body, setBody] = useState('');
  const [internal, setInternal] = useState(false);

  const closed = ticket.status === 'closed';

  const handleSend = () => {
    if (body.trim().length < 2) return;
    send.mutate(
      { ticketId: ticket.id, body, isInternal: allowInternal && internal },
      { onSuccess: () => setBody('') },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground mb-1">Descripción inicial · {fmt(ticket.created_at)}</p>
        <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
      </div>

      <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
        {isLoading && <Skeleton className="h-20 w-full" />}
        {!isLoading && (messages?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <MessagesSquare className="h-4 w-4" aria-hidden="true" />
            Aún no hay respuestas en esta conversación.
          </p>
        )}
        {messages?.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={[
                  'max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
                  m.is_internal
                    ? 'bg-amber-500/10 border border-amber-500/40'
                    : mine
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted',
                ].join(' ')}
              >
                {m.is_internal && (
                  <Badge variant="outline" className="mb-1 gap-1 text-[10px]">
                    <Lock className="h-3 w-3" aria-hidden="true" /> Nota interna
                  </Badge>
                )}
                <p>{m.body}</p>
                <p className={`mt-1 text-[10px] ${mine && !m.is_internal ? 'opacity-70' : 'text-muted-foreground'}`}>
                  {mine ? 'Tú' : 'Equipo'} · {fmt(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {closed ? (
        <p className="text-sm text-muted-foreground">Este ticket está cerrado. Abre uno nuevo si necesitas ayuda.</p>
      ) : (
        <div className="space-y-2">
          <label htmlFor={`reply-${ticket.id}`} className="sr-only">
            Escribe tu respuesta
          </label>
          <Textarea
            id={`reply-${ticket.id}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={internal ? 'Nota interna (no visible para el broker)…' : 'Escribe tu respuesta…'}
            rows={3}
            maxLength={4000}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            {allowInternal ? (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={internal}
                  onChange={(e) => setInternal(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Nota interna
              </label>
            ) : <span />}
            <Button onClick={handleSend} disabled={send.isPending || body.trim().length < 2} className="gap-2">
              <Send className="h-4 w-4" aria-hidden="true" />
              Enviar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketThread;
