import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  Sparkles, 
  X, 
  Send,
  Brain,
  TrendingUp,
  Target,
  Calculator
} from 'lucide-react';

const AIFloatingButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const aiTools = [
    {
      name: 'Recomendaciones IA',
      description: 'Encuentra propiedades que se ajusten a tu perfil',
      icon: Brain,
      href: '/ai-recommendations'
    },
    {
      name: 'Predictor de Precios',
      description: 'Estima el valor justo de cualquier terreno',
      icon: TrendingUp,
      href: '/price-predictor'
    },
    {
      name: 'Análisis de Riesgo',
      description: 'Evalúa la seguridad de tu inversión',
      icon: Target,
      href: '/risk-analysis'
    },
    {
      name: 'Calculadora ROI',
      description: 'Calcula el retorno de tu inversión',
      icon: Calculator,
      href: '/roi-calculator'
    }
  ];

  const handleSend = () => {
    if (message.trim()) {
      console.log('AI Query:', message);
      setMessage('');
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-medium bg-primary hover:bg-primary/90 z-50"
        size="icon"
      >
        <Sparkles className="h-6 w-6" />
      </Button>

      {/* AI Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Asistente IA
            </DialogTitle>
          </DialogHeader>

          {/* AI Tools Grid */}
          <div className="grid grid-cols-2 gap-3 py-4">
            {aiTools.map((tool) => (
              <a
                key={tool.name}
                href={tool.href}
                className="p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted transition-colors group"
              >
                <tool.icon className="h-5 w-5 text-primary mb-2" />
                <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {tool.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {tool.description}
                </p>
              </a>
            ))}
          </div>

          {/* Chat Input */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Input
              placeholder="Pregunta lo que necesites..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />
            <Button size="icon" onClick={handleSend} disabled={!message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIFloatingButton;
