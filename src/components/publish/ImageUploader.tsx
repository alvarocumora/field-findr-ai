import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  userId?: string;
  maxImages?: number;
}

const ImageUploader = ({ 
  images, 
  onImagesChange, 
  userId,
  maxImages = 10 
}: ImageUploaderProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para subir imágenes",
        variant: "destructive",
      });
      return null;
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedTypes = ['jpg', 'jpeg', 'png', 'webp'];
    
    if (!fileExt || !allowedTypes.includes(fileExt)) {
      toast({
        title: "Formato no válido",
        description: "Solo se permiten imágenes JPG, PNG o WebP",
        variant: "destructive",
      });
      return null;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El tamaño máximo es 5MB",
        variant: "destructive",
      });
      return null;
    }

    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('property-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('property-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    
    if (fileArray.length > remainingSlots) {
      toast({
        title: "Límite de imágenes",
        description: `Solo puedes agregar ${remainingSlots} imagen(es) más`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const url = await uploadFile(fileArray[i]);
      if (url) {
        uploadedUrls.push(url);
      }
      setUploadProgress(((i + 1) / fileArray.length) * 100);
    }

    if (uploadedUrls.length > 0) {
      onImagesChange([...images, ...uploadedUrls]);
      toast({
        title: "Imágenes subidas",
        description: `${uploadedUrls.length} imagen(es) subida(s) correctamente`,
      });
    }

    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [images, maxImages]);

  const handleRemoveImage = async (index: number) => {
    const imageUrl = images[index];
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);

    // Optionally delete from storage
    try {
      const path = imageUrl.split('/property-images/')[1];
      if (path) {
        await supabase.storage.from('property-images').remove([path]);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${dragActive 
            ? 'border-primary bg-primary/10' 
            : 'border-white/20 hover:border-primary/50'
          }
          ${isUploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />

        {isUploading ? (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
            <p className="text-foreground font-medium">Subiendo imágenes...</p>
            <Progress value={uploadProgress} className="max-w-xs mx-auto" />
          </div>
        ) : (
          <>
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2 text-foreground">
              Arrastra fotos aquí
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              o haz clic para seleccionar archivos (máx. 5MB cada una)
            </p>
            <Button type="button" variant="outline" className="glass border-white/10">
              <ImageIcon className="h-4 w-4 mr-2" />
              Seleccionar fotos
            </Button>
          </>
        )}
      </div>

      {/* Images Preview */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {images.length}/{maxImages} imágenes · Arrastra para reordenar
          </p>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((img, idx) => (
              <div 
                key={img} 
                className={`
                  relative aspect-square rounded-lg overflow-hidden group
                  ${idx === 0 ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                `}
              >
                <img 
                  src={img} 
                  alt={`Imagen ${idx + 1}`} 
                  className="w-full h-full object-cover"
                />
                {idx === 0 && (
                  <span className="absolute top-2 left-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Principal
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveImage(idx, 0);
                      }}
                      className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs"
                    >
                      ★
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(idx);
                    }}
                    className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Sube fotos de calidad. La primera será la imagen destacada.
      </p>
    </div>
  );
};

export default ImageUploader;
