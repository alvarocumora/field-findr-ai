import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Sparkles, History, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ProjectRow = {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  status: string;
  featured: boolean;
  featured_until: string | null;
};

type HistoryRow = {
  id: string;
  project_id: string;
  action: 'activated' | 'deactivated' | 'extended' | 'expired';
  previous_featured: boolean | null;
  new_featured: boolean;
  previous_until: string | null;
  new_until: string | null;
  notes: string | null;
  changed_by: string | null;
  created_at: string;
};

const actionColor: Record<HistoryRow['action'], string> = {
  activated: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  extended: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  deactivated: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  expired: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
};

const actionLabel: Record<HistoryRow['action'], string> = {
  activated: 'Activado',
  extended: 'Extendido',
  deactivated: 'Desactivado',
  expired: 'Vencido',
};

export default function FeaturedManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [untilByProject, setUntilByProject] = useState<Record<string, Date | undefined>>({});

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['admin-featured-projects', search],
    queryFn: async () => {
      let q = supabase
        .from('projects')
        .select('id,name,city,region,status,featured,featured_until')
        .order('featured', { ascending: false })
        .order('name', { ascending: true })
        .limit(100);
      if (search.trim()) q = q.ilike('name', `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ProjectRow[];
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ['admin-featured-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('featured_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as HistoryRow[];
    },
  });

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? id.slice(0, 8);

  const setFeatured = useMutation({
    mutationFn: async (args: { projectId: string; active: boolean; until: Date | null; notes: string | null }) => {
      const { error } = await supabase.rpc('admin_set_project_featured', {
        p_project_id: args.projectId,
        p_active: args.active,
        p_until: args.until ? args.until.toISOString() : null,
        p_notes: args.notes && args.notes.trim() ? args.notes.trim() : null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      toast.success(vars.active ? 'Proyecto destacado activado' : 'Destacado desactivado');
      queryClient.invalidateQueries({ queryKey: ['admin-featured-projects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-featured-history'] });
      queryClient.invalidateQueries({ queryKey: ['featured-projects-landing'] });
      setNotes((prev) => ({ ...prev, [vars.projectId]: '' }));
    },
    onError: (e: any) => toast.error(e?.message ?? 'No se pudo actualizar'),
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-500" />
          Proyectos destacados
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Activa el slot patrocinado en la home, define la fecha de término y revisa el historial de cambios.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de destacados</CardTitle>
          <CardDescription>
            Cada cambio queda registrado con el administrador que lo realizó.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar proyecto por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />

          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando proyectos...
            </div>
          ) : projects.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Sin proyectos.</p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Destacado</TableHead>
                    <TableHead>Vence</TableHead>
                    <TableHead>Fecha término</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => {
                    const currentUntil = p.featured_until ? new Date(p.featured_until) : null;
                    const pendingUntil = untilByProject[p.id] ?? currentUntil ?? undefined;
                    const isExpired =
                      p.featured && currentUntil ? currentUntil.getTime() < Date.now() : false;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {[p.city, p.region].filter(Boolean).join(', ') || '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={p.featured}
                            disabled={setFeatured.isPending}
                            onCheckedChange={(checked) => {
                              setFeatured.mutate({
                                projectId: p.id,
                                active: checked,
                                until: checked ? pendingUntil ?? null : null,
                                notes: notes[p.id] ?? null,
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {p.featured && currentUntil ? (
                            <Badge
                              variant="outline"
                              className={cn(isExpired && 'border-red-500/50 text-red-500')}
                            >
                              {format(currentUntil, "dd MMM yyyy", { locale: es })}
                              {isExpired && ' (vencido)'}
                            </Badge>
                          ) : p.featured ? (
                            <span className="text-xs text-muted-foreground">Sin límite</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  'justify-start text-left font-normal w-[160px]',
                                  !pendingUntil && 'text-muted-foreground',
                                )}
                              >
                                <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                                {pendingUntil
                                  ? format(pendingUntil, 'dd MMM yyyy', { locale: es })
                                  : 'Elegir fecha'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={pendingUntil}
                                onSelect={(d) =>
                                  setUntilByProject((prev) => ({ ...prev, [p.id]: d ?? undefined }))
                                }
                                disabled={(d) => d < new Date(new Date().toDateString())}
                                initialFocus
                                className={cn('p-3 pointer-events-auto')}
                              />
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell>
                          <Textarea
                            placeholder="Nota (opcional)"
                            value={notes[p.id] ?? ''}
                            onChange={(e) =>
                              setNotes((prev) => ({ ...prev, [p.id]: e.target.value }))
                            }
                            className="min-h-[38px] h-[38px] text-xs w-[160px]"
                          />
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {p.featured && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!pendingUntil || setFeatured.isPending}
                              onClick={() =>
                                setFeatured.mutate({
                                  projectId: p.id,
                                  active: true,
                                  until: pendingUntil ?? null,
                                  notes: notes[p.id] ?? null,
                                })
                              }
                            >
                              Extender
                            </Button>
                          )}
                          {!p.featured && (
                            <Button
                              size="sm"
                              disabled={setFeatured.isPending}
                              onClick={() =>
                                setFeatured.mutate({
                                  projectId: p.id,
                                  active: true,
                                  until: pendingUntil ?? null,
                                  notes: notes[p.id] ?? null,
                                })
                              }
                            >
                              Activar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de cambios
          </CardTitle>
          <CardDescription>Últimos 50 eventos registrados.</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Aún no hay cambios registrados.</p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Vencimiento nuevo</TableHead>
                    <TableHead>Nota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(h.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell className="text-sm">{projectName(h.project_id)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-xs', actionColor[h.action])}>
                          {actionLabel[h.action]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {h.new_until ? format(new Date(h.new_until), 'dd MMM yyyy', { locale: es }) : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate">
                        {h.notes ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
