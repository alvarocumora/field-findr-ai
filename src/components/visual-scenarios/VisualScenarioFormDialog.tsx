import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  VISUAL_SCENARIO_STATUS_OPTIONS,
  VISUAL_SCENARIO_TYPE_OPTIONS,
} from '@/config/visualScenarios';
import type { VisualScenarioEditorInput } from '@/hooks/useVisualScenarios';
import { uploadVisualScenarioAsset } from '@/lib/visualScenarios';
import type { VisualScenario } from '@/types/visualScenario';

interface VisualScenarioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenario?: VisualScenario | null;
  onSubmit: (input: VisualScenarioEditorInput) => Promise<void> | void;
  isSubmitting?: boolean;
}

const defaultInput: VisualScenarioEditorInput = {
  propertyId: '',
  type: 'industrial_packing',
  status: 'draft',
  title: '',
  subtitle: '',
  description: '',
  baseImageUrl: '',
  overlayImageUrl: '',
  thumbnailUrl: '',
  tags: [],
  estimatedCapex: undefined,
  estimatedRevenue: undefined,
};

const parseTags = (value: string) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const formatTags = (tags?: string[]) => tags?.join(', ') ?? '';

const VisualScenarioFormDialog = ({
  open,
  onOpenChange,
  scenario,
  onSubmit,
  isSubmitting = false,
}: VisualScenarioFormDialogProps) => {
  const initialInput = useMemo<VisualScenarioEditorInput>(() => {
    if (!scenario) return defaultInput;

    return {
      propertyId: scenario.propertyId,
      type: scenario.type,
      status: scenario.status,
      title: scenario.title,
      subtitle: scenario.subtitle ?? '',
      description: scenario.description ?? '',
      baseImageUrl: scenario.assets?.baseImageUrl ?? '',
      overlayImageUrl: scenario.assets?.overlayImageUrl ?? '',
      thumbnailUrl: scenario.assets?.thumbnailUrl ?? '',
      tags: scenario.tags ?? [],
      estimatedCapex: scenario.estimatedCapex,
      estimatedRevenue: scenario.estimatedRevenue,
    };
  }, [scenario]);

  const [input, setInput] = useState<VisualScenarioEditorInput>(initialInput);
  const [tagText, setTagText] = useState(formatTags(initialInput.tags));
  const [isUploadingBase, setIsUploadingBase] = useState(false);
  const [isUploadingOverlay, setIsUploadingOverlay] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

  useEffect(() => {
    if (!open) return;
    setInput(initialInput);
    setTagText(formatTags(initialInput.tags));
  }, [initialInput, open]);

  const update = <K extends keyof VisualScenarioEditorInput>(key: K, value: VisualScenarioEditorInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  const handleUpload = async (
    file: File | undefined,
    folder: 'base' | 'overlay' | 'thumbnail',
  ) => {
    if (!file) return;
    if (!input.propertyId.trim()) {
      toast.error('Ingresa el Property ID antes de subir imágenes');
      return;
    }

    const setUploading =
      folder === 'base'
        ? setIsUploadingBase
        : folder === 'overlay'
          ? setIsUploadingOverlay
          : setIsUploadingThumbnail;

    try {
      setUploading(true);
      const { publicUrl } = await uploadVisualScenarioAsset({
        propertyId: input.propertyId,
        file,
        folder,
      });

      if (folder === 'base') update('baseImageUrl', publicUrl);
      if (folder === 'overlay') update('overlayImageUrl', publicUrl);
      if (folder === 'thumbnail') update('thumbnailUrl', publicUrl);

      toast.success('Imagen subida correctamente');
    } catch (error) {
      console.error('Visual scenario asset upload error:', error);
      toast.error('No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    const payload: VisualScenarioEditorInput = {
      ...input,
      propertyId: input.propertyId.trim(),
      title: input.title.trim(),
      tags: parseTags(tagText),
      estimatedCapex: input.estimatedCapex || undefined,
      estimatedRevenue: input.estimatedRevenue || undefined,
    };

    await onSubmit(payload);
  };

  const canSubmit = input.propertyId.trim() && input.title.trim();
  const isBusy = isSubmitting || isUploadingBase || isUploadingOverlay || isUploadingThumbnail;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{scenario ? 'Editar escenario visual' : 'Crear escenario visual'}</DialogTitle>
          <DialogDescription>
            Completa los campos básicos del escenario. Métricas, supuestos, GLB y análisis IA se gestionarán en sprints posteriores.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Property ID</label>
            <Input
              value={input.propertyId}
              onChange={(event) => update('propertyId', event.target.value)}
              placeholder="UUID de la propiedad/listing"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={input.type} onValueChange={(value) => update('type', value as VisualScenarioEditorInput['type'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {VISUAL_SCENARIO_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.type} value={option.type}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={input.status} onValueChange={(value) => update('status', value as VisualScenarioEditorInput['status'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {VISUAL_SCENARIO_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.status} value={option.status}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Título</label>
            <Input
              value={input.title}
              onChange={(event) => update('title', event.target.value)}
              placeholder="Ej: Packing frutícola con cámaras de frío"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Subtítulo</label>
            <Input
              value={input.subtitle ?? ''}
              onChange={(event) => update('subtitle', event.target.value)}
              placeholder="Resumen corto del escenario"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Descripción</label>
            <Textarea
              value={input.description ?? ''}
              onChange={(event) => update('description', event.target.value)}
              placeholder="Descripción conceptual del escenario"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Imagen base URL</label>
              <Input value={input.baseImageUrl ?? ''} onChange={(event) => update('baseImageUrl', event.target.value)} />
              <Input
                type="file"
                accept="image/*"
                disabled={isUploadingBase}
                onChange={(event) => handleUpload(event.target.files?.[0], 'base')}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Overlay URL</label>
              <Input value={input.overlayImageUrl ?? ''} onChange={(event) => update('overlayImageUrl', event.target.value)} />
              <Input
                type="file"
                accept="image/*"
                disabled={isUploadingOverlay}
                onChange={(event) => handleUpload(event.target.files?.[0], 'overlay')}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Thumbnail URL</label>
              <Input value={input.thumbnailUrl ?? ''} onChange={(event) => update('thumbnailUrl', event.target.value)} />
              <Input
                type="file"
                accept="image/*"
                disabled={isUploadingThumbnail}
                onChange={(event) => handleUpload(event.target.files?.[0], 'thumbnail')}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">CAPEX referencial</label>
              <Input
                type="number"
                value={input.estimatedCapex ?? ''}
                onChange={(event) => update('estimatedCapex', event.target.value ? Number(event.target.value) : undefined)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Revenue referencial</label>
              <Input
                type="number"
                value={input.estimatedRevenue ?? ''}
                onChange={(event) => update('estimatedRevenue', event.target.value ? Number(event.target.value) : undefined)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Tags</label>
            <Input
              value={tagText}
              onChange={(event) => setTagText(event.target.value)}
              placeholder="Industrial, Packing, Conceptual"
            />
            <p className="text-xs text-muted-foreground">Separar tags por coma.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isBusy}>
            {isBusy ? 'Procesando...' : scenario ? 'Guardar cambios' : 'Crear escenario'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VisualScenarioFormDialog;
