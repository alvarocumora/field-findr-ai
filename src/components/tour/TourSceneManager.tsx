import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Upload, GripVertical, Image, Eye } from 'lucide-react';
import { useTourScenes, type TourScene } from '@/hooks/useTourScenes';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface TourSceneManagerProps {
  projectId: string;
  onPreviewScene?: (sceneIndex: number) => void;
}

export function TourSceneManager({ projectId, onPreviewScene }: TourSceneManagerProps) {
  const { scenes, isLoading, addScene, deleteScene } = useTourScenes(projectId);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async () => {
    if (!selectedFile || !newName.trim()) {
      toast.error('Nombre y panorámica son requeridos');
      return;
    }
    setUploading(true);
    try {
      await addScene.mutateAsync({
        name: newName.trim(),
        file: selectedFile,
        description: newDescription.trim() || undefined,
      });
      setShowAddDialog(false);
      setNewName('');
      setNewDescription('');
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (scene: TourScene) => {
    if (!confirm(`¿Eliminar escena "${scene.name}"?`)) return;
    await deleteScene.mutateAsync(scene.id);
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Escenas del Tour 360
          </CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Agregar Escena
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Escena 360</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nombre</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ej: Vista aérea norte"
                  />
                </div>
                <div>
                  <Label>Descripción (opcional)</Label>
                  <Textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Descripción de la escena..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Panorámica 360° (equirrectangular)</Label>
                  <div className="mt-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <Button
                      variant="outline"
                      className="w-full gap-2 h-20 border-dashed"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-5 w-5" />
                      {selectedFile ? selectedFile.name : 'Seleccionar imagen panorámica'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Imagen equirrectangular (ratio 2:1). Resolución recomendada: 8192×4096 px.
                    </p>
                  </div>
                </div>
                <Button onClick={handleAdd} disabled={uploading || !selectedFile || !newName.trim()} className="w-full">
                  {uploading ? 'Subiendo...' : 'Agregar Escena'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando escenas...</p>
        ) : scenes.length === 0 ? (
          <div className="text-center py-8">
            <Image className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No hay escenas aún. Agrega panorámicas 360° para crear el tour virtual.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {scenes.map((scene, idx) => (
              <div
                key={scene.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 hover:border-primary/30 transition-colors"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                <div className="w-16 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                  {scene.thumbnail_url || scene.panorama_url ? (
                    <img
                      src={scene.thumbnail_url || scene.panorama_url}
                      alt={scene.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{scene.name}</p>
                  <div className="flex gap-1.5 mt-0.5">
                    {scene.hotspots.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {scene.hotspots.length} hotspots
                      </Badge>
                    )}
                    {scene.polygon_overlays.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {scene.polygon_overlays.length} polígonos
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {onPreviewScene && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onPreviewScene(idx)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(scene)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
