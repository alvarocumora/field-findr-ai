import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Search, Box, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GLBAsset {
  name: string;
  url: string;
  category: string;
  thumbnail?: string;
}

interface AssetCatalogProps {
  onSelectAsset: (asset: GLBAsset) => void;
  uploadedAssets: GLBAsset[];
  onAssetsChange: (assets: GLBAsset[]) => void;
}

const ASSET_CATEGORIES = [
  { id: 'all', label: 'Todos', icon: '📦' },
  { id: 'casas', label: 'Casas', icon: '🏠' },
  { id: 'vehiculos', label: 'Vehículos', icon: '🚗' },
  { id: 'vegetacion', label: 'Vegetación', icon: '🌳' },
  { id: 'mobiliario', label: 'Mobiliario', icon: '🪑' },
  { id: 'otros', label: 'Otros', icon: '📎' },
];

export const AssetCatalog = ({ onSelectAsset, uploadedAssets, onAssetsChange }: AssetCatalogProps) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['glb', 'gltf'].includes(ext || '')) {
      toast.error('Solo se permiten archivos GLB o GLTF');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('El archivo no puede superar 50MB');
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('3d-assets')
        .upload(fileName, file, { contentType: 'model/gltf-binary' });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('3d-assets').getPublicUrl(data.path);
      
      const newAsset: GLBAsset = {
        name: file.name.replace(/\.(glb|gltf)$/i, ''),
        url: urlData.publicUrl,
        category: 'otros',
      };

      onAssetsChange([...uploadedAssets, newAsset]);
      toast.success(`Modelo "${newAsset.name}" subido correctamente`);
    } catch (err: any) {
      toast.error(`Error al subir: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [uploadedAssets, onAssetsChange]);

  const filtered = uploadedAssets.filter(a => {
    if (activeCategory !== 'all' && a.category !== activeCategory) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 px-1">
        <Package className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold text-foreground">Modelos 3D (GLB)</span>
      </div>

      {/* Search */}
      <div className="relative px-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar modelo..."
          className="h-7 text-[10px] pl-7"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-0.5 px-1 flex-wrap">
        {ASSET_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-1.5 py-0.5 rounded text-[9px] transition-colors ${
              activeCategory === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Asset grid */}
      <ScrollArea className="h-[120px]">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-1 px-1">
            {filtered.map((asset, i) => (
              <button
                key={i}
                onClick={() => onSelectAsset(asset)}
                className="flex flex-col items-center p-2 rounded-md hover:bg-accent/50 transition-colors border border-border/30 bg-card"
                title={asset.name}
              >
                <Box className="h-5 w-5 text-muted-foreground mb-1" />
                <span className="text-[9px] text-muted-foreground line-clamp-1 w-full text-center">
                  {asset.name}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-4 text-muted-foreground">
            <Box className="h-6 w-6 mb-1 opacity-40" />
            <span className="text-[10px]">Sin modelos</span>
          </div>
        )}
      </ScrollArea>

      {/* Upload button */}
      <div className="px-1">
        <label className="w-full">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-[10px]"
            disabled={uploading}
            asChild
          >
            <span>
              <Upload className="h-3 w-3 mr-1" />
              {uploading ? 'Subiendo...' : 'Subir modelo GLB'}
            </span>
          </Button>
          <input
            type="file"
            accept=".glb,.gltf"
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
};
