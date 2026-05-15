import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  FileText,
  Hash,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { sha256OfBlob, shortHash } from '@/lib/tasacionHash';

type LookupResult =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'found'; id: string; revoked: boolean; comuna: string | null; valor_uf: number | null; tasador: string | null; fecha: string | null; matched: string }
  | { kind: 'notfound' };

const TasacionValidator = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [byCodeState, setByCodeState] = useState<LookupResult>({ kind: 'idle' });
  const [byFileState, setByFileState] = useState<LookupResult>({ kind: 'idle' });
  const [uploadedHash, setUploadedHash] = useState<string | null>(null);

  const checkByCode = async () => {
    const id = code.trim();
    if (!id) return;
    setByCodeState({ kind: 'checking' });
    const { data, error } = await supabase
      .from('tasaciones_publicadas')
      .select('id,comuna,valor_uf,tasador_nombre,fecha_emision,revoked_at')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) {
      setByCodeState({ kind: 'notfound' });
      return;
    }
    setByCodeState({
      kind: 'found',
      id: data.id,
      revoked: !!data.revoked_at,
      comuna: data.comuna,
      valor_uf: data.valor_uf,
      tasador: data.tasador_nombre,
      fecha: data.fecha_emision,
      matched: 'id',
    });
  };

  const checkByFile = async (file: File) => {
    setByFileState({ kind: 'checking' });
    const hash = await sha256OfBlob(file);
    setUploadedHash(hash);
    const { data, error } = await supabase.rpc('find_tasacion_by_hash', { _hash: hash });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) {
      setByFileState({ kind: 'notfound' });
      return;
    }
    setByFileState({
      kind: 'found',
      id: row.id,
      revoked: !!row.revoked_at,
      comuna: row.comuna,
      valor_uf: row.valor_uf,
      tasador: row.tasador_nombre,
      fecha: row.fecha_emision,
      matched: row.matched_field,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Validador de Tasaciones</h1>
          <p className="text-sm text-muted-foreground">
            Verifica la autenticidad de un informe de tasación emitido en OFERTA TERRENOS.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Validar</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="file">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file" className="gap-2">
                  <FileText className="h-4 w-4" /> Por archivo PDF
                </TabsTrigger>
                <TabsTrigger value="code" className="gap-2">
                  <Hash className="h-4 w-4" /> Por código / ID
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-3 pt-4">
                <p className="text-xs text-muted-foreground">
                  Sube el PDF que recibiste. Calculamos su huella SHA-256 en tu navegador y
                  buscamos coincidencia en el registro público.
                </p>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) checkByFile(f);
                  }}
                />
                {uploadedHash && (
                  <div className="text-[10px] font-mono text-muted-foreground">
                    SHA-256 del archivo: {shortHash(uploadedHash, 12, 12)}
                  </div>
                )}
                <ResultBlock state={byFileState} onOpen={(id) => navigate(`/tasacion/v/${id}`)} />
              </TabsContent>

              <TabsContent value="code" className="space-y-3 pt-4">
                <p className="text-xs text-muted-foreground">
                  Pega el ID público de la tasación (suele aparecer junto al QR del informe).
                </p>
                <div className="flex gap-2">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="00000000-0000-0000-0000-000000000000"
                    className="font-mono text-xs"
                  />
                  <Button onClick={checkByCode} disabled={!code.trim()}>
                    Validar
                  </Button>
                </div>
                <ResultBlock state={byCodeState} onOpen={(id) => navigate(`/tasacion/v/${id}`)} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Volver a OFERTA TERRENOS
          </Link>
        </div>
      </div>
    </div>
  );
};

const ResultBlock = ({ state, onOpen }: { state: LookupResult; onOpen: (id: string) => void }) => {
  if (state.kind === 'idle') return null;
  if (state.kind === 'checking') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Comprobando registro…
      </div>
    );
  }
  if (state.kind === 'notfound') {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-destructive" />
        <span>No coincide con ningún informe emitido.</span>
      </div>
    );
  }
  return (
    <div className={`rounded-md border p-3 text-sm space-y-2 ${state.revoked ? 'border-destructive/40 bg-destructive/10' : 'border-emerald-500/40 bg-emerald-500/5'}`}>
      <div className="flex items-center gap-2 font-medium">
        {state.revoked ? (
          <><ShieldAlert className="h-4 w-4 text-destructive" /> Documento revocado</>
        ) : (
          <><ShieldCheck className="h-4 w-4 text-emerald-500" /> Documento auténtico</>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        {state.comuna && <>Predio en {state.comuna} · </>}
        {state.fecha && <>Emitido {state.fecha} · </>}
        {state.tasador && <>Tasador: {state.tasador}</>}
      </div>
      {state.valor_uf != null && (
        <div className="text-xs">Valor: <strong>UF {state.valor_uf.toLocaleString('es-CL')}</strong></div>
      )}
      <Button size="sm" variant="default" className="gap-2" onClick={() => onOpen(state.id)}>
        Ver tasación completa <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

export default TasacionValidator;
