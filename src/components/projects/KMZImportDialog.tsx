import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  Upload, FileArchive, Map, Check, AlertCircle, 
  Loader2, Layers, Image as ImageIcon, X, RefreshCw, PlusCircle
} from 'lucide-react';
import { parseKMZFile, parseKMLFile } from '@/lib/kmz';
import { importProjectSpatialSource } from '@/lib/kmz/projectSpatialImport';
import type { ParsedKMZ, KMLPlacemark } from '@/lib/kmz/types';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface KMZImportDialogProps {
  projectId: string;
  projectName: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface ExistingLot {
  id: string;
  lot_number: string;
  name: string | null;
  area: number;
  status: string | null;
}

interface LotMatchResult {
  placemark: KMLPlacemark;
  existingLot: ExistingLot | null;
  matchedBy: 'lot_number' | 'name' | null;
  lotNumber: string;
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
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [existingLots, setExistingLots] = useState<ExistingLot[]>([]);
  const [matchResults, setMatchResults] = useState<LotMatchResult[]>([]);
  const [masterPlanFile, setMasterPlanFile] = useState<File | null>(null);
  const [masterPlanPreview, setMasterPlanPreview] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [basePrice, setBasePrice] = useState<number>(15000000);
  const [pricePerSqm, setPricePerSqm] = useState<number>(3000);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [importStats, setImportStats] = useState({ updated: 0, created: 0 });

  // Fetch existing lots when dialog opens
  useEffect(() => {
    const fetchExistingLots = async () => {
      const { data } = await supabase
        .from('lots')
        .select('id, lot_number, name, area, status')
        .eq('project_id', projectId);
      
      if (data) {
        setExistingLots(data);
      }
    };
    fetchExistingLots();
  }, [projectId]);

  // Match placemarks with existing lots
  useEffect(() => {
    if (!parsedData) return;

    const results: LotMatchResult[] = parsedData.placemarks.map(placemark => {
      // Extract lot number from placemark name
      const lotNumber = placemark.name.match(/\d+/)?.[0] || '';
      
      // Try to match by lot_number first
      let existingLot = existingLots.find(lot => lot.lot_number === lotNumber);
      let matchedBy: 'lot_number' | 'name' | null = existingLot ? 'lot_number' : null;
      
      // If no match by lot_number, try by name
      if (!existingLot) {
        existingLot = existingLots.find(lot => 
          lot.name?.toLowerCase() === placemark.name.toLowerCase()
        );
        matchedBy = existingLot ? 'name' : null;
      }

      return {
        placemark,
        existingLot: existingLot || null,
        matchedBy,
        lotNumber,
      };
    });

    setMatchResults(results);
  }, [parsedData, existingLots]);

  const handleKMZUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSourceFile(file);
    
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
      setSourceFile(null);
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
    if (!parsedData || !sourceFile || !user?.id) return;

    setStep('importing');
    setImportProgress(15);

    try {
      const result = await importProjectSpatialSource({
        projectId,
        userId: user.id,
        file: sourceFile,
        pricing: { basePrice, pricePerSqm },
        updateExisting,
      });

      if (masterPlanFile) {
        setImportProgress(85);
        const ext = masterPlanFile.name.split('.').pop()?.toLowerCase() || 'png';
        const path = `${user.id}/projects/${projectId}/masterplan-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('property-images')
          .upload(path, masterPlanFile, { upsert: true, contentType: masterPlanFile.type || undefined });
        if (upErr) {
          toast.error(`No se pudo guardar el masterplan: ${upErr.message}`);
        } else {
          const url = supabase.storage.from('property-images').getPublicUrl(path).data.publicUrl;
          const { error: pErr } = await supabase.from('projects').update({ master_plan_url: url } as never).eq('id', projectId);
          if (pErr) toast.error(`Masterplan subido pero no vinculado: ${pErr.message}`);
        }
      }

      setImportProgress(100);
      setImportStats({ updated: result.updated, created: result.inserted });
      setStep('complete');

      const parts = [
        result.updated ? `${result.updated} actualizados` : '',
        result.inserted ? `${result.inserted} creados` : '',
        result.roads ? `${result.roads} caminos/servidumbres` : '',
      ].filter(Boolean);

      toast.success(`Spatial Engine: ${parts.join(' · ') || 'fuente sincronizada'}`);
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
                <p className="text-sm text-muted-foreground">Lotes en KMZ</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <RefreshCw className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                <p className="text-2xl font-bold">{matchResults.filter(m => m.existingLot).length}</p>
                <p className="text-sm text-muted-foreground">Coincidencias</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <PlusCircle className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-2xl font-bold">{matchResults.filter(m => !m.existingLot).length}</p>
                <p className="text-sm text-muted-foreground">Nuevos lotes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Map className="h-8 w-8 mx-auto text-sky-500 mb-2" />
                <p className="text-sm font-medium">Centro</p>
                <p className="text-xs text-muted-foreground">
                  {parsedData.center.lat.toFixed(4)}, {parsedData.center.lng.toFixed(4)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Match Summary */}
          {existingLots.length > 0 && (
            <Alert>
              <RefreshCw className="h-4 w-4" />
              <AlertDescription>
                Se encontraron <strong>{matchResults.filter(m => m.existingLot).length}</strong> lotes que ya existen en la base de datos. 
                Sus polígonos serán actualizados sin crear duplicados.
              </AlertDescription>
            </Alert>
          )}

          {/* Detected lots preview */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">Lotes detectados:</p>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {matchResults.slice(0, 20).map((match, i) => (
                  <Badge 
                    key={i} 
                    variant={match.existingLot ? "default" : "secondary"} 
                    className={`text-xs ${match.existingLot ? 'bg-amber-500/20 text-amber-700 border-amber-500/30' : ''}`}
                  >
                    {match.existingLot && <RefreshCw className="h-3 w-3 mr-1" />}
                    {match.placemark.name} ({match.placemark.area?.toLocaleString() || '?'} m²)
                  </Badge>
                ))}
                {matchResults.length > 20 && (
                  <Badge variant="outline">+{matchResults.length - 20} más</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('upload')}>Atrás</Button>
            <Button onClick={() => setStep('configure')}>Continuar</Button>
          </div>
        </div>
      )}

      {/* Configure Step */}
      {step === 'configure' && parsedData && (
        <div className="space-y-6">
          {/* Update existing toggle */}
          {matchResults.filter(m => m.existingLot).length > 0 && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-primary" />
                      <span className="font-medium">Actualizar lotes existentes</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {matchResults.filter(m => m.existingLot).length} lotes coinciden con registros existentes. 
                      Se actualizarán sus polígonos y coordenadas.
                    </p>
                  </div>
                  <Switch
                    checked={updateExisting}
                    onCheckedChange={setUpdateExisting}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Pricing Config - only for new lots */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  Precios (solo lotes nuevos)
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label>Precio base (CLP)</Label>
                    <Input
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(parseInt(e.target.value) || 0)}
                      disabled={matchResults.filter(m => !m.existingLot).length === 0}
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
                      disabled={matchResults.filter(m => !m.existingLot).length === 0}
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

          {/* Import summary */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="text-sm">
              <p>
                <span className="font-medium">{matchResults.filter(m => m.existingLot && updateExisting).length}</span> lotes se actualizarán
                {' • '}
                <span className="font-medium">{matchResults.filter(m => !m.existingLot).length}</span> lotes nuevos se crearán
              </p>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('preview')}>Atrás</Button>
            <Button onClick={handleImport} className="gap-2">
              <Upload className="h-4 w-4" />
              {updateExisting && matchResults.filter(m => m.existingLot).length > 0 
                ? 'Actualizar e Importar' 
                : `Importar ${matchResults.filter(m => !m.existingLot).length} Lotes`}
            </Button>
          </div>
        </div>
      )}

      {/* Importing Step */}
      {step === 'importing' && (
        <div className="py-8 text-center space-y-4">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
          <h3 className="text-lg font-semibold">Procesando lotes...</h3>
          <Progress value={importProgress} className="max-w-md mx-auto" />
          <p className="text-sm text-muted-foreground">{Math.round(importProgress)}% completado</p>
        </div>
      )}

      {/* Complete Step */}
      {step === 'complete' && (
        <div className="py-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold">¡Importación completada!</h3>
          <div className="space-y-1 text-muted-foreground">
            {importStats.updated > 0 && (
              <p className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 text-amber-500" />
                {importStats.updated} lotes actualizados con polígonos
              </p>
            )}
            {importStats.created > 0 && (
              <p className="flex items-center justify-center gap-2">
                <PlusCircle className="h-4 w-4 text-emerald-500" />
                {importStats.created} lotes nuevos creados
              </p>
            )}
          </div>
          <Button onClick={onComplete} className="mt-4">
            Ver Proyecto
          </Button>
        </div>
      )}
    </div>
  );
};
