import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Plan {
  key: 'featured-7' | 'featured-30' | 'featured-90';
  days: number;
  amount: number;
  label: string;
  hint?: string;
}

const PLANS: Plan[] = [
  { key: 'featured-7', days: 7, amount: 19990, label: '7 días', hint: 'Prueba corta' },
  { key: 'featured-30', days: 30, amount: 59990, label: '30 días', hint: 'Recomendado' },
  { key: 'featured-90', days: 90, amount: 149990, label: '90 días', hint: 'Máxima visibilidad' },
];

const fmt = (n: number) => `$${n.toLocaleString('es-CL')} CLP`;

interface Props {
  projectId: string;
  projectName?: string;
  featured?: boolean;
  featuredUntil?: string | null;
  size?: 'sm' | 'default';
}

/**
 * Botón "Destacar en la home" para el dueño del proyecto.
 * Cobra vía MercadoPago (edge function `create-featured-checkout`) y redirige
 * al `init_point`. Cuando MP confirma el pago, el webhook activa `featured=true`
 * por la duración pagada y lo registra en `featured_history`.
 */
export default function FeatureProjectButton({
  projectId,
  projectName,
  featured,
  featuredUntil,
  size = 'sm',
}: Props) {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<Plan['key']>('featured-30');
  const [loading, setLoading] = useState(false);

  const activeUntil = featuredUntil ? new Date(featuredUntil) : null;
  const stillActive = featured && activeUntil && activeUntil.getTime() > Date.now();

  const startCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-featured-checkout', {
        body: { project_id: projectId, plan },
      });
      if (error) throw error;
      const url = (data as any)?.init_point || (data as any)?.sandbox_init_point;
      if (!url) throw new Error('No se recibió URL de pago');
      window.location.href = url;
    } catch (e: any) {
      console.error('checkout error', e);
      toast.error(e?.message ?? 'No se pudo iniciar el pago');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={stillActive ? 'outline' : 'default'} size={size} className="gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          {stillActive ? 'Extender destacado' : 'Destacar en la home'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Destacar {projectName ?? 'proyecto'}
          </DialogTitle>
          <DialogDescription>
            Aparece en la sección "Proyectos destacados" del home con etiqueta ámbar.
            {stillActive && activeUntil && (
              <span className="block mt-1 text-xs">
                Actualmente destacado hasta{' '}
                <strong>{activeUntil.toLocaleDateString('es-CL')}</strong>. Un pago nuevo suma días al total.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={plan} onValueChange={(v) => setPlan(v as Plan['key'])} className="space-y-2">
          {PLANS.map((p) => (
            <label
              key={p.key}
              htmlFor={p.key}
              className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:border-primary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem id={p.key} value={p.key} />
                <div>
                  <div className="font-medium text-sm">{p.label}</div>
                  {p.hint && (
                    <Badge variant="secondary" className="text-[10px] mt-0.5">
                      {p.hint}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{fmt(p.amount)}</div>
                <div className="text-[11px] text-muted-foreground">
                  {(p.amount / p.days).toLocaleString('es-CL', { maximumFractionDigits: 0 })} /día
                </div>
              </div>
            </label>
          ))}
        </RadioGroup>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={startCheckout} disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Redirigiendo…' : 'Pagar con Mercado Pago'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
