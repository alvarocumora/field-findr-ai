import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Home, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRole';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const NEW_USER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Paso único post-registro (p. ej. Google) para elegir comprador o asesor. */
export default function AccountTypeOnboarding() {
  const { user } = useAuth();
  const { data: roles, isSuccess: rolesLoaded } = useUserRoles();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isNew = !!user?.created_at && Date.now() - new Date(user.created_at).getTime() < NEW_USER_WINDOW_MS;
  const onlyBuyer = rolesLoaded && (roles ?? []).every((r) => r.role === 'buyer');

  const { data: profile } = useQuery({
    queryKey: ['account-type-chosen', user?.id],
    enabled: !!user && isNew && onlyBuyer,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('account_type_chosen_at')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
  });

  const open = !!user && isNew && onlyBuyer && !!profile && !profile.account_type_chosen_at && !dismissed;

  const choose = async (type: 'buyer' | 'agent') => {
    setSaving(true);
    const { error } = await supabase.rpc('choose_account_type', { _type: type });
    setSaving(false);
    if (error) {
      toast.error('No pudimos guardar tu elección. Intenta de nuevo.');
      return;
    }
    setDismissed(true);
    await qc.invalidateQueries({ queryKey: ['user-roles'] });
    await qc.invalidateQueries({ queryKey: ['account-type-chosen'] });
    navigate(type === 'agent' ? '/panel' : '/explorar');
  };

  const options = [
    { type: 'buyer' as const, icon: Home, title: 'Quiero comprar', text: 'Explorar parcelas, guardar favoritas y reservar.' },
    { type: 'agent' as const, icon: Briefcase, title: 'Vendo o intermedio', text: 'Publicar proyectos, gestionar clientes y comisiones.' },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && setDismissed(true)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>¿Qué buscas en OfertaTerrenos.com?</DialogTitle>
          <DialogDescription>Elige una opción para preparar tu panel. Podrás cambiar de vista después.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {options.map((o) => (
            <button
              key={o.type}
              disabled={saving}
              onClick={() => choose(o.type)}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary hover:bg-primary/5 disabled:opacity-50"
            >
              <o.icon className="mt-0.5 h-5 w-5 text-primary" />
              <span>
                <span className="block font-medium text-foreground">{o.title}</span>
                <span className="block text-sm text-muted-foreground">{o.text}</span>
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
