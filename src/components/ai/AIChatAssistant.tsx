import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, User, Loader2, Trash2, Sparkles, TrendingUp, MapPin, DollarSign, Lightbulb } from 'lucide-react';
import { useAIChat } from '@/hooks/useAI';
import ReactMarkdown from 'react-markdown';

const SUGGESTED_QUESTIONS = [
  { text: '¿Qué tipo de terreno me recomiendas para inversión?', icon: TrendingUp },
  { text: '¿Cómo funciona el proceso de compra de parcelas?', icon: DollarSign },
  { text: '¿Qué debo saber sobre derechos de agua?', icon: Lightbulb },
  { text: '¿Cuáles son las mejores zonas para comprar?', icon: MapPin },
];

const QUICK_PROMPTS = [
  'Analizar ROI de una parcela',
  'Requisitos legales para subdivisión',
  'Comparar zonas de inversión',
  'Due diligence inmobiliario',
];

interface AIChatAssistantProps {
  propertyContext?: {
    title: string;
    location: string;
    price: number;
    area?: number;
  };
  className?: string;
}

export const AIChatAssistant = ({ propertyContext, className }: AIChatAssistantProps) => {
  const { messages, isLoading, sendMessage, clearMessages } = useAIChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Add property context if available
    let contextualMessage = input;
    if (propertyContext && messages.length === 0) {
      contextualMessage = `[Contexto: Estoy viendo "${propertyContext.title}" en ${propertyContext.location}, precio $${propertyContext.price.toLocaleString('es-CL')}${propertyContext.area ? `, ${propertyContext.area} m²` : ''}]\n\n${input}`;
    }
    
    sendMessage(contextualMessage);
    setInput('');
  };

  const handleSuggestion = (question: string) => {
    let contextualQuestion = question;
    if (propertyContext) {
      contextualQuestion = `Sobre la propiedad "${propertyContext.title}" en ${propertyContext.location}: ${question}`;
    }
    sendMessage(contextualQuestion);
  };

  return (
    <Card className={`h-[600px] flex flex-col ${className || ''}`}>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Asistente de Inversión IA</CardTitle>
              <p className="text-sm text-muted-foreground">Experto en terrenos y loteos de Chile</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={clearMessages} className="hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Property Context Badge */}
        {propertyContext && (
          <div className="mt-3 p-2 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Analizando propiedad:</p>
            <p className="text-sm font-medium line-clamp-1">{propertyContext.title}</p>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="relative mb-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl blur-xl -z-10" />
              </div>
              <h3 className="font-semibold mb-2 text-lg">¡Hola! Soy tu asesor de inversión</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Puedo ayudarte a analizar oportunidades, entender el mercado y optimizar tus decisiones de inversión en terrenos.
              </p>
              
              {/* Quick Prompts */}
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="cursor-pointer hover:bg-muted transition-colors py-1.5 px-3"
                    onClick={() => handleSuggestion(prompt)}
                  >
                    {prompt}
                  </Badge>
                ))}
              </div>
              
              {/* Suggested Questions */}
              <div className="grid gap-2 w-full max-w-sm">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-left justify-start h-auto py-2.5 px-4 rounded-xl hover:bg-primary/5 hover:border-primary/30"
                    onClick={() => handleSuggestion(q.text)}
                  >
                    <q.icon className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                    <span className="text-xs">{q.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5">
                        <Bot className="h-4 w-4 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-secondary">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5">
                      <Bot className="h-4 w-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Analizando...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSubmit} className="p-4 border-t bg-muted/30">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre inversión, mercado, due diligence..."
              disabled={isLoading}
              className="flex-1 rounded-xl bg-background"
            />
            <Button type="submit" disabled={!input.trim() || isLoading} className="rounded-xl px-4">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
