import { Briefcase, Building2, Search, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AppContext, AppContextOption } from '@/lib/access/appContext';

const icons: Record<AppContext, typeof Search> = {
  buyer: Search,
  broker: Briefcase,
  empresa: Building2,
  plataforma: ShieldCheck,
};

const descriptions: Record<AppContext, string> = {
  buyer: 'Buscar, comparar, visitar, reservar y seguir la compra de tu terreno.',
  broker: 'Vender proyectos asignados, administrar tus links, red y comisiones.',
  empresa: 'Gestionar proyectos, inventario, CRM, reservas, ventas y equipo.',
  plataforma: 'Administrar organizaciones, suscripciones, marketplace y operación global.',
};

interface ContextChooserProps {
  options: AppContextOption[];
  onSelect: (context: AppContext) => void;
}

const ContextChooser = ({ options, onSelect }: ContextChooserProps) => (
  <main className="min-h-screen bg-background px-4 py-12">
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">OfertaTerrenos</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">¿Qué espacio quieres usar?</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
          Tu cuenta tiene más de un perfil. Elige el contexto de trabajo; podrás cambiarlo después desde el panel.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {options.map((option) => {
          const Icon = icons[option.id];
          return (
            <Card key={option.id} className="border-border/60 transition hover:border-primary/40">
              <CardContent className="flex h-full flex-col p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">{option.label}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{descriptions[option.id]}</p>
                <Button className="mt-5 w-full" onClick={() => onSelect(option.id)}>
                  Entrar como {option.shortLabel}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  </main>
);

export default ContextChooser;
