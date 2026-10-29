import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sparkles, Search, TrendingUp, Calculator, FileText } from 'lucide-react';

const tools = [
  { name: 'Búsqueda asistida', tab: 'smart-search', icon: Search },
  { name: 'Estimación de precio', tab: 'price-predictor', icon: TrendingUp },
  { name: 'Calculadoras', tab: 'calculators', icon: Calculator },
  { name: 'Catastro SII', tab: 'sii', icon: FileText },
];

export default function AIFloatingButton() {
  const [open, setOpen] = useState(false);
  return <>
    <Button type="button" aria-label="Abrir herramientas" onClick={() => setOpen(true)}
      className="fixed right-4 md:right-6 bottom-safe-nav h-14 w-14 rounded-full shadow-medium bg-primary hover:bg-primary/90"
      style={{ zIndex: 'var(--z-fab)' }} size="icon"><Sparkles className="h-6 w-6" aria-hidden="true" /></Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Herramientas para decidir</DialogTitle></DialogHeader>
        <DialogDescription>Abre la herramienta que necesitas para evaluar tu búsqueda.</DialogDescription>
        <div className="grid grid-cols-2 gap-3">
          {tools.map(tool => <Link key={tool.tab} to={`/tools?tab=${tool.tab}`} onClick={() => setOpen(false)}
            className="rounded-lg border border-border p-4 focus-ring hover:bg-muted">
            <tool.icon className="h-5 w-5 mb-2 text-primary" aria-hidden="true" /><span className="text-sm font-medium">{tool.name}</span>
          </Link>)}
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
