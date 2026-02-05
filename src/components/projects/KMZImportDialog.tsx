import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, FileArchive, Map, Check, AlertCircle, 
  Loader2, Layers, Image as ImageIcon, X
} from 'lucide-react';
import { parseKMZFile, parseKMLFile, ParsedKMZ, KMLPlacemark } from '@/lib/kmzParser';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface KMZImportDialogProps {
  projectId: string;
  projectName: string;
  onComplete: () => void;
  onCancel: () => void;
}

type ImportStep = 'upload' | 'preview' | 'configure' | 'importing' | 'complete';

export const KMZImportDialog = ({ 
  projectId, 
  projectName,
  onComplete, 
  onCancel 
}: KMZImportDialogProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<ImportStep>('upload');
  const [parsedData, setParsedData] = useState<ParsedKMZ | null>(null);
  const [masterPlanFile, setMasterPlanFile] = useState<File | null>(null);
  const [masterPlanPreview, setMasterPlanPreview] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [basePrice, setBasePrice] = useState<number>(15000000);
  const [pricePerSqm, setPricePerSqm] = useState<number>(3000);

  const handleKMZUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    
    try {
      let result: ParsedKMZ;
      
      if (file.name.endsWith('.kmz')) {
        result = await parseKMZFile(file);
      } else if (file.name.endsWith('.kml')) {
        result = await parseKMLFile(file);
      } else {
        throw new Error('Formato no soportado. Use archivos KMZ o KML.');
      }

      if (result.placemarks.length === 0) {
        throw new Error('No se encontraron polígonos en el archivo.');
      }

      setParsedData(result);
      setStep('preview');
    } catch (err: any) {
      setError(err.message || 'Error al procesar el archivo');
    }
  }, []);

  const handleMasterPlanUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen (JPG, PNG, etc.)');
      return;
    }

    setMasterPlanFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setMasterPlanPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleImport = async () => {
    if (!parsedData || !user?.id) return;

    setStep('importing');
    setImportProgress(0);

    try {
      const totalSteps = parsedData.placemarks.length + 2; // lots + project update + optional image
      let completed = 0;

      // Update project with center coordinates
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          latitude: parsedData.center.lat,
          longitude: parsedData.center.lng,
          total_lots: parsedData.placemarks.length,
          available_lots: parsedData.placemarks.length,
        })
        .eq('id', projectId);

      if (projectError) throw projectError;
      completed++;
      setImportProgress((completed / totalSteps) * 100);

      // Upload master plan if provided
      if (masterPlanFile) {
        const fileName = `${projectId}/masterplan.${masterPlanFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, masterPlanFile, { upsert: true });

        if (uploadError) {
          console.warn('Error uploading master plan:', uploadError);
        }
      }
      completed++;
      setImportProgress((completed / totalSteps) * 100);

      // Create lots
      for (let i = 0; i < parsedData.placemarks.length; i++) {
        const placemark = parsedData.placemarks[i];
        const area = placemark.area || 5000;
        const calculatedPrice = basePrice + (area * pricePerSqm / 1000);
        
        // Extract lot number from name or use index
        const lotNumber = placemark.name.match(/\d+/)?.[0] || String(i + 1);
        
        // Calculate centroid for lat/lng
        const centroid = placemark.coordinates.reduce(
          (acc, [lng, lat]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }),
          { lat: 0, lng: 0 }
        );
        const numCoords = placemark.coordinates.length;

        const { error: lotError } = await supabase
          .from('lots')
          .insert({
            project_id: projectId,
            user_id: user.id,
            lot_number: lotNumber,
            name: placemark.name,
            description: placemark.description,
            area: area,
            price: Math.round(calculatedPrice),
            price_per_sqm: pricePerSqm,
            status: 'available',
            latitude: centroid.lat / numCoords,
            longitude: centroid.lng / numCoords,
            polygon: {
              type: 'Polygon',
              coordinates: [placemark.coordinates],
            },
          });

        if (lotError) {
          console.error('Error creating lot:', lotError);
        }

        completed++;
        setImportProgress((completed / totalSteps) * 100);
      }

      setStep('complete');
      toast.success(`${parsedData.placemarks.length} lotes importados correctamente`);
    } catch (err: any) {
      setError(err.message || 'Error durante la importación');
      setStep('configure');
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-6">
        {['Cargar KMZ', 'Vista Previa', 'Configurar', 'Importar'].map((label, idx) => {
          const stepNames: ImportStep[] = ['upload', 'preview', 'configure', 'importing'];
          const currentIdx = stepNames.indexOf(step);
          const isActive = idx === currentIdx || (step === 'complete' && idx === 3);
          const isCompleted = idx < currentIdx || step === 'complete';

          return (
            <div key={label} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                isCompleted ? 'bg-green-500 text-white' :
                isActive ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              }`}>
                {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
              </div>
              <span className={`ml-2 text-sm hidden sm:inline ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                {label}
              </span>
              {idx < 3 && <div className="flex-1 h-px bg-border mx-4" />}
            </div>
          );
        })}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Step */}
      {step === 'upload' && (
        <div className="space-y-6">
          <Card className="border-dashed border-2 hover:border-primary transition-colors">
            <CardContent className="p-8 text-center">
              <input
                type="file"
                accept=".kmz,.kml"
                onChange={handleKMZUpload}
                className="hidden"
                id="kmz-upload"
              />
              <label htmlFor="kmz-upload" className="cursor-pointer block">
                <FileArchive className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Cargar archivo KMZ/KML</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Arrastra o haz clic para seleccionar el archivo con los polígonos de los lotes
                </p>
                <Button type="button" variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Seleccionar archivo
                </Button>
              </label>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === 'preview' && parsedData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Layers className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{parsedData.placemarks.length}</p>
                <p className="text-sm text-muted-foreground">Lotes detectados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Map className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-sm font-medium">Centro</p>
                <p className="text-xs text-muted-foreground">
                  {parsedData.center.lat.toFixed(4)}, {parsedData.center.lng.toFixed(4)}
                </p>
              </CardContent>
            </Card>
            <Card className="col-span-2">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-2">Primeros lotes detectados:</p>
                <div className="flex flex-wrap gap-1">
                  {parsedData.placemarks.slice(0, 10).map((p, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {p.name} ({p.area?.toLocaleString() || '?'} m²)
                    </Badge>
                  ))}
                  {parsedData.placemarks.length > 10 && (
                    <Badge variant="outline">+{parsedData.placemarks.length - 10} más</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('upload')}>Atrás</Button>
            <Button onClick={() => setStep('configure')}>Continuar</Button>
          </div>
        </div>
      )}

      {/* Configure Step */}
      {step === 'configure' && parsedData && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pricing Config */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  Configuración de Precios
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label>Precio base (CLP)</Label>
                    <Input
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Precio mínimo para lotes pequeños
                    </p>
                  </div>
                  <div>
                    <Label>Precio por m² (CLP)</Label>
                    <Input
                      type="number"
                      value={pricePerSqm}
                      onChange={(e) => setPricePerSqm(parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Se suma al precio base según área
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Master Plan Upload */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Master Plan (opcional)
                </h3>
                
                {masterPlanPreview ? (
                  <div className="relative">
                    <img 
                      src={masterPlanPreview} 
                      alt="Master Plan" 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => {
                        setMasterPlanFile(null);
                        setMasterPlanPreview(null);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMasterPlanUpload}
                      className="hidden"
                      id="masterplan-upload"
                    />
                    <label 
                      htmlFor="masterplan-upload" 
                      className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
                    >
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Subir imagen del plano</p>
                      </div>
                    </label>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('preview')}>Atrás</Button>
            <Button onClick={handleImport} className="gap-2">
              <Upload className="h-4 w-4" />
              Importar {parsedData.placemarks.length} Lotes
            </Button>
          </div>
        </div>
      )}

      {/* Importing Step */}
      {step === 'importing' && (
        <div className="py-8 text-center space-y-4">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
          <h3 className="text-lg font-semibold">Importando lotes...</h3>
          <Progress value={importProgress} className="max-w-md mx-auto" />
          <p className="text-sm text-muted-foreground">{Math.round(importProgress)}% completado</p>
        </div>
      )}

      {/* Complete Step */}
      {step === 'complete' && parsedData && (
        <div className="py-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold">¡Importación completada!</h3>
          <p className="text-muted-foreground">
            Se importaron {parsedData.placemarks.length} lotes al proyecto "{projectName}"
          </p>
          <Button onClick={onComplete} className="mt-4">
            Ver Proyecto
          </Button>
        </div>
      )}
    </div>
  );
};
