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
  <main className="theme-rural min-h-screen bg-background px-4 py-12 sm:py-20">
    <div className="mx-auto max-w-5xl space-y-10">
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Rural Finder · Espacios de trabajo</p>
        <h1 className="mt-3 font-editorial text-4xl font-medium tracking-tight text-foreground sm:text-5xl">Elige tu espacio de trabajo</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
          Accede a las herramientas disponibles para tu cuenta. Puedes cambiar de espacio cuando lo necesites.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2" aria-label="Espacios disponibles para tu cuenta">
        {options.map((option) => {
          const Icon = icons[option.id];
          return (
            <Card key={option.id} className="group border-border bg-card shadow-sm transition-colors hover:border-primary/50 focus-within:border-primary/60">
              <CardContent className="flex h-full flex-col p-6 sm:p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 font-editorial text-2xl font-medium text-foreground">{option.label}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{descriptions[option.id]}</p>
                <Button className="mt-6 w-full min-h-11 focus-ring" onClick={() => onSelect(option.id)}>
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
