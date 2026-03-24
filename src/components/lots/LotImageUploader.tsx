import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LotImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export const LotImageUploader = ({
  images,
  onChange,
  maxImages = 5,
}: LotImageUploaderProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !user?.id) return;

      const remaining = maxImages - images.length;
      if (remaining <= 0) {
        toast.error(`Máximo ${maxImages} imágenes por lote`);
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remaining);
      setUploading(true);

      try {
        const uploadedUrls: string[] = [];

        for (const file of filesToUpload) {
          if (!file.type.startsWith('image/')) continue;
          if (file.size > 5 * 1024 * 1024) {
            toast.error(`${file.name} excede 5MB`);
            continue;
          }

          const ext = file.name.split('.').pop();
          const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

          const { error } = await supabase.storage
            .from('lot-images')
            .upload(path, file, { cacheControl: '3600', upsert: false });

          if (error) {
            toast.error(`Error subiendo ${file.name}`);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('lot-images')
            .getPublicUrl(path);

          uploadedUrls.push(urlData.publicUrl);
        }

        if (uploadedUrls.length > 0) {
          onChange([...images, ...uploadedUrls]);
          toast.success(`${uploadedUrls.length} imagen(es) subida(s)`);
        }
      } catch {
        toast.error('Error al subir imágenes');
      } finally {
        setUploading(false);
        e.target.value = '';
      }
    },
    [images, onChange, user, maxImages]
  );

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4" />
        Fotos del Lote ({images.length}/{maxImages})
      </Label>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-border">
              <img
                src={url}
                alt={`Foto ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(i)}
              >
                <X className="h-3 w-3" />
              </Button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {images.length < maxImages && (
        <label
          className={cn(
            'flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer',
            'hover:border-primary/50 hover:bg-muted/30 transition-colors',
            uploading && 'pointer-events-none opacity-50'
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground">
            {uploading ? 'Subiendo...' : 'Arrastra o haz clic para subir fotos'}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
};
