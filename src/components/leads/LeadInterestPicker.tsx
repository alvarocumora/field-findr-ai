import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Lead } from '@/hooks/useLeads';

type Props = {
  lead: Lead;
  onChange: (patch: { project_id?: string | null; lot_id?: string | null }) => void;
};

const STATUS_LABEL: Record<string, string> = {
  available: 'disponible', reserved: 'reservado', sold: 'vendido',
};

/** Proyecto y lote de interés del cliente (usa los proyectos y lotes que el vendedor ya puede ver). */
export function LeadInterestPicker({ lead, onChange }: Props) {
  const l = lead as Lead & { project_id?: string | null; lot_id?: string | null };
  const { data: projects = [] } = useQuery({
    queryKey: ['lead-interest-projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('id, name, slug').order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: lots = [] } = useQuery({
    queryKey: ['lead-interest-lots', l.project_id],
    enabled: !!l.project_id,
    queryFn: async () => {
      const { data, error } = await supabase.from('lots')
        .select('id, lot_number, status').eq('project_id', l.project_id!);
      if (error) throw error;
      return (data ?? []).sort((a, b) =>
        String(a.lot_number).localeCompare(String(b.lot_number), 'es', { numeric: true }));
    },
  });
  const project = projects.find((p) => p.id === l.project_id);
  const lot = lots.find((x) => x.id === l.lot_id);
  const href = project
    ? `${project.slug ? `/p/${project.slug}` : `/proyecto/${project.id}`}${lot ? `?lote=${lot.lot_number}` : ''}`
    : null;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="lead-project">Proyecto de interés</Label>
        <Select value={l.project_id ?? 'none'}
          onValueChange={(v) => onChange({ project_id: v === 'none' ? null : v, lot_id: null })}>
          <SelectTrigger id="lead-project"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin proyecto</SelectItem>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {l.project_id && (
        <div className="space-y-2">
          <Label htmlFor="lead-lot">Lote de interés</Label>
          <Select value={l.lot_id ?? 'none'}
            onValueChange={(v) => onChange({ lot_id: v === 'none' ? null : v })}>
            <SelectTrigger id="lead-lot"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin lote</SelectItem>
              {lots.map((x) => (
                <SelectItem key={x.id} value={x.id}>
                  Lote {x.lot_number} · {STATUS_LABEL[x.status ?? ''] ?? x.status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {href && (
        <Link to={href} className="text-sm font-medium text-primary underline underline-offset-4">
          {lot ? `Ver lote ${lot.lot_number} y cotizar` : 'Ver ficha del proyecto'}
        </Link>
      )}
    </div>
  );
}
