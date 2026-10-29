import { getErrorMessage } from '@/lib/errorMessage';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Search, Building2, MapPin, DollarSign, Ruler, Home, AlertTriangle, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface SIIData {
  rol: string;
  comuna: string | null;
  direccion: string | null;
  avaluoFiscal: number | null;
  superficieTerreno: number | null;
  superficieConstruida: number | null;
  destinacion: string | null;
  materialPredominante: string | null;
  anoConstruccion: number | null;
  tipoPropiedad: string | null;
  source: 'sii_scraping' | 'demo';
  timestamp: string;
}

const formatCLP = (v: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);

const SIILookupPanel = () => {
  const [rol, setRol] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SIIData | null>(null);
  const [useDemoData, setUseDemoData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!rol.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('sii-lookup', {
        body: { rol: rol.trim(), useDemoData },
      });

      if (fnError) throw fnError;
      if (!result?.success) throw new Error(result?.error || 'Error en la consulta');

      setData(result.data);
      toast.success('Datos obtenidos', {
        description: result.data.source === 'demo' ? 'Usando datos de demostración' : 'Datos del SII',
      });
    } catch (err: unknown) {
      setError( getErrorMessage(err) || 'Error consultando datos');
      toast.error('Error', { description: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Consulta Catastral SII
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label htmlFor="rol" className="text-sm">Número de Rol (SII)</Label>
              <Input
                id="rol"
                placeholder="Ej: 1234-56"
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="mt-1.5"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || !rol.trim()} className="gap-2">
              <Search className="h-4 w-4" />
              Consultar
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={useDemoData} onCheckedChange={setUseDemoData} id="demo-mode" />
            <Label htmlFor="demo-mode" className="text-xs text-muted-foreground cursor-pointer">
              Usar datos de demostración
            </Label>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-6 w-48" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Rol {data.rol}</CardTitle>
              <Badge variant={data.source === 'sii_scraping' ? 'default' : 'secondary'}>
                {data.source === 'sii_scraping' ? 'SII Real' : 'Demo'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.comuna && (
                <InfoField icon={<Building2 className="h-4 w-4" />} label="Comuna" value={data.comuna} />
              )}
              {data.direccion && (
                <InfoField icon={<MapPin className="h-4 w-4" />} label="Dirección" value={data.direccion} />
              )}
              {data.avaluoFiscal != null && (
                <InfoField icon={<DollarSign className="h-4 w-4" />} label="Avalúo Fiscal" value={formatCLP(data.avaluoFiscal)} highlight />
              )}
              {data.superficieTerreno != null && (
                <InfoField icon={<Ruler className="h-4 w-4" />} label="Superficie Terreno" value={`${data.superficieTerreno.toLocaleString('es-CL')} m²`} />
              )}
              {data.superficieConstruida != null && (
                <InfoField icon={<Ruler className="h-4 w-4" />} label="Superficie Construida" value={`${data.superficieConstruida.toLocaleString('es-CL')} m²`} />
              )}
              {data.destinacion && (
                <InfoField icon={<Home className="h-4 w-4" />} label="Destinación" value={data.destinacion} />
              )}
              {data.tipoPropiedad && (
                <InfoField icon={<Home className="h-4 w-4" />} label="Tipo" value={data.tipoPropiedad} />
              )}
              {data.materialPredominante && (
                <InfoField icon={<Building2 className="h-4 w-4" />} label="Material" value={data.materialPredominante} />
              )}
              {data.anoConstruccion != null && (
                <InfoField icon={<Building2 className="h-4 w-4" />} label="Año Construcción" value={String(data.anoConstruccion)} />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Última consulta: {new Date(data.timestamp).toLocaleString('es-CL')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const InfoField = ({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) => (
  <div className={`p-3 rounded-lg border ${highlight ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'}`}>
    <div className="flex items-center gap-1.5 mb-1">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <p className={`text-sm font-medium ${highlight ? 'text-primary' : ''}`}>{value}</p>
  </div>
);

export default SIILookupPanel;
