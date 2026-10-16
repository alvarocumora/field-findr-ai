import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useUserRole';
import { useTourScenes } from '@/hooks/useTourScenes';
import { TourViewer360 } from '@/components/tour/TourViewer360';
import { TourEditor } from '@/components/tour/TourEditor';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pencil, Eye } from 'lucide-react';
import { CAONE_PROJECT } from '../data/project';
import reference1 from '@/assets/caone/potensic/hualane-vuelo-1.png.asset.json';
import reference2 from '@/assets/caone/potensic/hualane-vuelo-2.png.asset.json';

interface Props {
  lots: { id: string; lot_number: string; status: string | null }[];
  onLotClick: (id: string) => void;
}

export function CaonePanoramaTour({ lots, onLotClick }: Props) {
  const { scenes, isLoading } = useTourScenes(CAONE_PROJECT.id);
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const [editing, setEditing] = useState(false);
  const [sceneId, setSceneId] = useState('');
  const selected = scenes.find(scene => scene.id === sceneId) ?? scenes[0];
  const canEdit = isAdmin || (!!user && selected?.user_id === user.id);
  if (isLoading) return <p className="py-10 text-muted-foreground">Cargando panorámicas…</p>;
  if (!selected) return null;

  return <div className="space-y-3 bg-background text-foreground">
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 pt-3">
      <Badge variant="outline">Alineación visual · aproximada</Badge>
      {canEdit && <Button size="sm" variant="outline" onClick={() => setEditing(value => !value)}>
        {editing ? <Eye className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
        {editing ? 'Ver tour' : 'Marcar parcelas'}
      </Button>}
    </div>
    {editing && canEdit ? <div className="space-y-3 p-3">
      <Select value={selected.id} onValueChange={setSceneId}>
        <SelectTrigger aria-label="Panorámica a editar"><SelectValue /></SelectTrigger>
        <SelectContent>{scenes.map(scene => <SelectItem key={scene.id} value={scene.id}>{scene.name}</SelectItem>)}</SelectContent>
      </Select>
      <TourEditor key={selected.id} scene={selected} allScenes={scenes} lots={lots} projectId={CAONE_PROJECT.id} />
      <div className="grid gap-3 md:grid-cols-2">
        {[reference1, reference2].map((reference, index) => <figure key={reference.asset_id} className="min-w-0">
          <a href={reference.url} target="_blank" rel="noreferrer"><img className="w-full rounded-lg" src={reference.url} alt={`Referencia del vuelo ${index + 1}`} /></a>
          <figcaption className="mt-1 text-xs text-muted-foreground">Referencia de vuelo {index + 1} · sin coordenadas GPS</figcaption>
        </figure>)}
      </div>
    </div> : <TourViewer360 scenes={scenes} lots={lots} onLotClick={onLotClick} showCompass={false} />}
  </div>;
}