import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, ArrowLeft, Inbox } from 'lucide-react';
import { useMessages, useThreadMessages, type Thread } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const Messages = () => {
  const { user } = useAuth();
  const { threads, isLoading, sendMessage, markThreadRead } = useMessages();
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: threadMessages = [] } = useThreadMessages(selectedThread?.thread_id || null);

  // Mark as read when opening a thread
  useEffect(() => {
    if (selectedThread && selectedThread.unread_count > 0) {
      markThreadRead.mutate(selectedThread.thread_id);
    }
  }, [selectedThread?.thread_id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [threadMessages.length]);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedThread || !user) return;
    sendMessage.mutate({
      threadId: selectedThread.thread_id,
      recipientId: selectedThread.other_user_id,
      content: newMessage.trim(),
      listingId: selectedThread.listing_id || undefined,
    });
    setNewMessage('');
  };

  const extractContactInfo = (content: string) => {
    const match = content.match(/^\[(.+?)\]/);
    if (match) return match[1];
    return null;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card className="glass border-border/50">
          <CardContent className="p-12 text-center text-muted-foreground">
            Cargando mensajes...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Mensajes</h1>
        {threads.length > 0 && (
          <Badge variant="secondary">{threads.length} conversaciones</Badge>
        )}
      </div>

      <div className="grid md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Thread List */}
        <Card className={cn("glass border-border/50 overflow-hidden", selectedThread && "hidden md:block")}>
          <CardHeader className="py-3 px-4 border-b border-border">
            <CardTitle className="text-sm font-medium">Conversaciones</CardTitle>
          </CardHeader>
          <ScrollArea className="h-[calc(100%-52px)]">
            {threads.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Inbox className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Sin mensajes aún</p>
                <p className="text-xs mt-1">Los mensajes de contacto aparecerán aquí</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {threads.map((thread) => {
                  const contactInfo = extractContactInfo(thread.last_message);
                  return (
                    <button
                      key={thread.thread_id}
                      onClick={() => setSelectedThread(thread)}
                      className={cn(
                        "w-full text-left p-3 hover:bg-muted/50 transition-colors",
                        selectedThread?.thread_id === thread.thread_id && "bg-primary/5",
                        thread.unread_count > 0 && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm truncate", thread.unread_count > 0 && "font-semibold")}>
                            {contactInfo || thread.other_user_id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {thread.last_message.replace(/^\[.+?\]\n\n/, '')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(thread.last_date), { addSuffix: true, locale: es })}
                          </span>
                          {thread.unread_count > 0 && (
                            <Badge className="bg-primary text-primary-foreground text-[10px] h-5 min-w-[20px] px-1.5">
                              {thread.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Message View */}
        <Card className={cn("glass border-border/50 overflow-hidden flex flex-col", !selectedThread && "hidden md:flex")}>
          {selectedThread ? (
            <>
              {/* Thread header */}
              <div className="p-3 border-b border-border flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-8 w-8"
                  onClick={() => setSelectedThread(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <p className="text-sm font-medium">
                    {extractContactInfo(threadMessages[0]?.content || '') || 'Conversación'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedThread.listing_id ? 'Consulta sobre propiedad' : 'Mensaje directo'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-3">
                  {threadMessages.map((msg) => {
                    const isMine = msg.sender_id === user?.id;
                    const cleanContent = msg.content.replace(/^\[.+?\]\n\n/, '');
                    return (
                      <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2.5",
                          isMine 
                            ? "bg-primary text-primary-foreground rounded-br-md" 
                            : "bg-muted rounded-bl-md"
                        )}>
                          <p className="text-sm whitespace-pre-wrap">{cleanContent}</p>
                          <p className={cn(
                            "text-[10px] mt-1",
                            isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {new Date(msg.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t border-border">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                  <Input
                    placeholder="Escribe tu respuesta..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim() || sendMessage.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Selecciona una conversación</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Messages;
