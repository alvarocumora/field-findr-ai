import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Search, Box, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { type ParcelaObjectType } from './useParcelaState';

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
  onAddPrimitive?: (type: ParcelaObjectType) => void;
}

interface BuiltInAsset {
  name: string;
  icon: string;
  type: ParcelaObjectType;
  category: string;
}

const BUILT_IN_ASSETS: BuiltInAsset[] = [
  // Industrial / Packing (priorizadas para listings industriales)
  { name: 'Galpón Packing', icon: '🏭', type: 'galpon_packing', category: 'industrial' },
  { name: 'Andén Carga', icon: '🚛', type: 'anden_carga', category: 'industrial' },
  { name: 'Cámara Frío', icon: '❄️', type: 'camara_frio', category: 'industrial' },
  { name: 'Oficinas', icon: '🏢', type: 'oficinas_industrial', category: 'industrial' },
  { name: 'Estac. Camiones', icon: '🅿️', type: 'estacionamiento_camiones', category: 'industrial' },
  { name: 'Área Maniobras', icon: '🔄', type: 'area_maniobras', category: 'industrial' },
  { name: 'Báscula', icon: '⚖️', type: 'bascula', category: 'industrial' },
  { name: 'Portería', icon: '🛂', type: 'porteria', category: 'industrial' },
  { name: 'Cerco Industrial', icon: '🚧', type: 'cerco_industrial', category: 'industrial' },
  // Casas
  { name: 'Casa Moderna', icon: '🏠', type: 'casa_moderna', category: 'casas' },
  { name: 'Cabaña', icon: '🛖', type: 'cabana', category: 'casas' },
  { name: 'Tiny House', icon: '🏡', type: 'tiny_house', category: 'casas' },
  { name: 'Casa 50m²', icon: '🏘️', type: 'casa_50', category: 'casas' },
  // Vegetación
  { name: 'Pino', icon: '🌲', type: 'arbol_pino', category: 'vegetacion' },
  { name: 'Arbusto', icon: '🌳', type: 'arbusto', category: 'vegetacion' },
  { name: 'Jardín Zen', icon: '🌿', type: 'jardin_zen', category: 'vegetacion' },
  { name: 'Césped', icon: '🟩', type: 'cesped', category: 'vegetacion' },
  // Mobiliario
  { name: 'Piscina', icon: '🏊', type: 'piscina', category: 'mobiliario' },
  { name: 'Quincho', icon: '🍖', type: 'quincho', category: 'mobiliario' },
  { name: 'Terraza', icon: '☂️', type: 'deck', category: 'mobiliario' },
  { name: 'Pérgola', icon: '🏛️', type: 'pergola', category: 'mobiliario' },
  { name: 'Fogata', icon: '🔥', type: 'fogata', category: 'mobiliario' },
  // Infraestructura
  { name: 'Cerca', icon: '🪵', type: 'cerco', category: 'infraestructura' },
  { name: 'Camino', icon: '🛤️', type: 'camino', category: 'infraestructura' },
  { name: 'Panel Solar', icon: '☀️', type: 'panel_solar', category: 'infraestructura' },
  { name: 'Bodega', icon: '🏗️', type: 'bodega', category: 'infraestructura' },
  { name: 'Estacionamiento', icon: '🅿️', type: 'estacionamiento', category: 'infraestructura' },
];

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: '📦' },
  { id: 'industrial', label: 'Industrial', icon: '🏭' },
  { id: 'casas', label: 'Casas', icon: '🏠' },
  { id: 'vegetacion', label: 'Vegetación', icon: '🌳' },
  { id: 'mobiliario', label: 'Mobiliario', icon: '🪑' },
  { id: 'infraestructura', label: 'Infra', icon: '🔧' },
  { id: 'custom', label: 'Subidos', icon: '📎' },
];

export const AssetCatalog = ({ onSelectAsset, uploadedAssets, onAssetsChange, onAddPrimitive }: AssetCatalogProps) => {
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
        category: 'custom',
      };
      onAssetsChange([...uploadedAssets, newAsset]);
      toast.success(`Modelo "${newAsset.name}" subido`);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [uploadedAssets, onAssetsChange]);

  const filteredBuiltIn = BUILT_IN_ASSETS.filter(a => {
    if (activeCategory !== 'all' && activeCategory !== 'custom' && a.category !== activeCategory) return false;
    if (activeCategory === 'custom') return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredCustom = uploadedAssets.filter(a => {
    if (activeCategory !== 'all' && activeCategory !== 'custom') return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 px-1">
        <Package className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold text-foreground">Catálogo 3D</span>
      </div>

      <div className="relative px-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar modelo..."
          className="h-7 text-[10px] pl-7"
        />
      </div>

      <div className="flex gap-0.5 px-1 flex-wrap">
        {CATEGORIES.map(cat => (
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

      <ScrollArea className="h-[140px]">
        <div className="grid grid-cols-2 gap-1 px-1">
          {/* Built-in primitives */}
          {filteredBuiltIn.map((asset) => (
            <button
              key={asset.type}
              onClick={() => onAddPrimitive?.(asset.type)}
              className="flex flex-col items-center p-1.5 rounded-md hover:bg-accent/50 transition-colors border border-border/30 bg-card"
              title={asset.name}
            >
              <span className="text-lg leading-none">{asset.icon}</span>
              <span className="text-[8px] text-muted-foreground line-clamp-1 w-full text-center mt-0.5">
                {asset.name}
              </span>
            </button>
          ))}

          {/* Custom uploaded GLB */}
          {filteredCustom.map((asset, i) => (
            <button
              key={`custom-${i}`}
              onClick={() => onSelectAsset(asset)}
              className="flex flex-col items-center p-1.5 rounded-md hover:bg-accent/50 transition-colors border border-primary/20 bg-primary/5"
              title={asset.name}
            >
              <Box className="h-4 w-4 text-primary" />
              <span className="text-[8px] text-muted-foreground line-clamp-1 w-full text-center mt-0.5">
                {asset.name}
              </span>
            </button>
          ))}
        </div>

        {filteredBuiltIn.length === 0 && filteredCustom.length === 0 && (
          <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
            <Box className="h-5 w-5 mb-1 opacity-40" />
            <span className="text-[10px]">Sin resultados</span>
          </div>
        )}
      </ScrollArea>

      <div className="px-1">
        <label className="w-full">
          <Button variant="outline" size="sm" className="w-full h-7 text-[10px]" disabled={uploading} asChild>
            <span>
              <Upload className="h-3 w-3 mr-1" />
              {uploading ? 'Subiendo...' : 'Subir modelo GLB'}
            </span>
          </Button>
          <input type="file" accept=".glb,.gltf" onChange={handleUpload} className="hidden" />
        </label>
      </div>
    </div>
  );
};
