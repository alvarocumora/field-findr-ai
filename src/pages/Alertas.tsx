import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PublicLayout from '@/components/layouts/PublicLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, Trash2, Search, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import type { Json } from '@/integrations/supabase/types';

interface SavedSearch {
  id: string;
  name: string;
  filters: Json;
  notifications_enabled: boolean;
  created_at: string;
}

const Alertas = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: searches = [], isLoading } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SavedSearch[];
    },
    enabled: !!user,
  });

  const toggleNotification = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('saved_searches')
        .update({ notifications_enabled: enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
  });

  const deleteSearch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('saved_searches').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      toast({ title: 'Búsqueda eliminada' });
    },
  });

  const formatFilters = (filters: Json): string => {
    if (!filters || typeof filters !== 'object' || Array.isArray(filters)) return 'Sin filtros';
    const parts: string[] = [];
    const f = filters as Record<string, Json>;
    if (f.type && Array.isArray(f.type) && f.type.length > 0) parts.push(`Tipo: ${(f.type as string[]).join(', ')}`);
    if (f.region && Array.isArray(f.region) && f.region.length > 0) parts.push(`Región: ${(f.region as string[]).join(', ')}`);
    if (f.priceMin || f.priceMax) parts.push(`Precio: $${f.priceMin || 0} - $${f.priceMax || '∞'}`);
    return parts.length > 0 ? parts.join(' · ') : 'Todos los terrenos';
  };

  if (!user) {
    return (
      <PublicLayout>
        <div className="container px-4 py-16 text-center">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Mis Alertas</h1>
          <p className="text-muted-foreground mb-6">Inicia sesión para gestionar tus búsquedas guardadas y alertas.</p>
          <Button asChild>
            <Link to="/auth">Iniciar sesión</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container px-4 py-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mis Alertas</h1>
            <p className="text-sm text-muted-foreground">
              Recibe notificaciones cuando aparezcan nuevas propiedades que coincidan con tus criterios.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/explorar">
              <Search className="h-4 w-4 mr-2" />
              Nueva búsqueda
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="glass animate-pulse">
                <CardContent className="p-4 h-20" />
              </Card>
            ))}
          </div>
        ) : searches.length === 0 ? (
          <Card className="glass border-border/50">
            <CardContent className="p-8 text-center">
              <BellOff className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Sin alertas configuradas</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ve al explorador, aplica filtros y guarda tu búsqueda para recibir alertas automáticas.
              </p>
              <Button asChild>
                <Link to="/explorar">Explorar terrenos</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {searches.map((search) => (
              <Card key={search.id} className="glass border-border/50">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                      <h3 className="font-semibold text-foreground truncate">{search.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatFilters(search.filters)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Creada {new Date(search.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={search.notifications_enabled}
                        onCheckedChange={(enabled) => toggleNotification.mutate({ id: search.id, enabled })}
                      />
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {search.notifications_enabled ? 'Activa' : 'Pausada'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteSearch.mutate(search.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

export default Alertas;
