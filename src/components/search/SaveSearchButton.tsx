import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { readExploreSearch } from '@/lib/explore/searchState';
import { canNotifySearch, savedSearchFilters } from '@/lib/explore/savedSearch';
import { buildAuthRedirect } from '@/lib/access/authReturn';
import { getErrorMessage } from '@/lib/errorMessage';
import { toast } from 'sonner';

export function SaveSearchButton({ partial = false }: { partial?: boolean }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('Mi búsqueda de terrenos');
  const [notify, setNotify] = useState(false);
  const [draftId, setDraftId] = useState(() => crypto.randomUUID());
  const state = readExploreSearch(params);
  const supportsNotifications = canNotifySearch(state) && !partial;
  const loginParams = new URLSearchParams(params);
  loginParams.set('saveSearch', '1');
  useEffect(() => {
    if (!user || params.get('saveSearch') !== '1') return;
    setOpen(true);
    setParams(current => { const next = new URLSearchParams(current); next.delete('saveSearch'); return next; }, { replace: true });
  }, [user, params, setParams]);
  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Inicia sesión para guardar la búsqueda');
      const { error } = await supabase.from('saved_searches').upsert({
        id: draftId, user_id: user.id, name: name.trim(), filters: savedSearchFilters(state), notifications_enabled: supportsNotifications && notify,
      }, { onConflict: 'id' });
      if (error) throw error;
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['saved-searches'] });
      void client.invalidateQueries({ queryKey: ['buyer-saved-searches'] });
      toast.success('Búsqueda guardada'); setDraftId(crypto.randomUUID()); setOpen(false);
    },
  });
  return <>
    <Button type="button" variant="ghost" className="w-full text-primary" onClick={() => setOpen(true)}><Bell className="mr-2 h-4 w-4" aria-hidden="true" />Guardar búsqueda</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent>
      <DialogHeader><DialogTitle>Guardar esta búsqueda</DialogTitle><DialogDescription>Retoma tus filtros desde Mis búsquedas.</DialogDescription></DialogHeader>
      {!user ? <Button asChild><Link to={buildAuthRedirect('/explorar', `?${loginParams}`)}>Iniciar sesión para guardar</Link></Button> :
        <form className="space-y-4" onSubmit={event => { event.preventDefault(); if (name.trim() && !save.isPending) save.mutate(); }}>
          <Label htmlFor="saved-search-name">Nombre de la búsqueda</Label><Input id="saved-search-name" value={name} maxLength={100} required onChange={event => setName(event.target.value)} />
          {partial && <p className="text-sm text-muted-foreground">El área dibujada y los refinamientos de publicaciones cargadas no se guardan. Se guardan los filtros del buscador.</p>}
          {supportsNotifications ? <label className="flex items-center gap-2 text-sm"><Checkbox checked={notify} onCheckedChange={checked => setNotify(checked === true)} />Quiero recibir novedades de esta búsqueda</label> : <p className="text-sm text-muted-foreground">Puedes guardar y retomar estos filtros. Los avisos automáticos para esta combinación todavía no están disponibles.</p>}
          {save.error && <p role="alert" className="text-sm text-destructive">No se pudo guardar: {getErrorMessage(save.error)}. Puedes reintentarlo.</p>}
          <div className="flex gap-2"><Button type="submit" disabled={save.isPending || !name.trim()}>{save.isPending ? 'Guardando…' : 'Guardar búsqueda'}</Button><Button type="button" variant="outline" asChild><Link to="/alertas">Mis búsquedas</Link></Button></div>
        </form>}
    </DialogContent></Dialog>
  </>;
}
