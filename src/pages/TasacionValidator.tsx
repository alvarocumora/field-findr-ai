import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  FileText,
  Hash,
  ArrowRight,
  Copy,
  Check,
  Download,
  ExternalLink,
  Link2,
  MessageCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { sha256OfBlob, shortHash } from '@/lib/tasacionHash';
import {
  findPublicAppraisalById,
  findPublicAppraisalByHash,
} from '@/lib/tasacionPublicRegistry';
import { toast } from 'sonner';
import { getCanonicalUrl, getShareUrl } from '@/lib/publicUrls';

type Found = {
  kind: 'found';
  id: string;
  revoked: boolean;
  comuna: string | null;
  valor_uf: number | null;
  tasador: string | null;
  fecha: string | null;
  matched: string;
  pdf_path: string | null;
  pdf_final_path: string | null;
  pdf_sha256: string | null;
  pdf_final_sha256: string | null;
  revoked_reason?: string | null;
};
type LookupResult =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | Found
  | { kind: 'notfound' };


const toFound = (data: any, matched: string): Found => ({
  kind: 'found',
  id: data.id,
  revoked: !!data.revoked_at,
  revoked_reason: data.revoked_reason ?? null,
  comuna: data.comuna,
  valor_uf: data.valor_uf,
  tasador: data.tasador_nombre,
  fecha: data.fecha_emision,
  matched,
  pdf_path: data.pdf_path ?? null,
  pdf_final_path: data.pdf_final_path ?? null,
  pdf_sha256: data.pdf_sha256 ?? null,
  pdf_final_sha256: data.pdf_final_sha256 ?? null,
});

const pdfUrlFor = (path: string) =>
  supabase.storage.from('tasaciones').getPublicUrl(path).data.publicUrl;

const TasacionValidator = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [byCodeState, setByCodeState] = useState<LookupResult>({ kind: 'idle' });
  const [byFileState, setByFileState] = useState<LookupResult>({ kind: 'idle' });
  const [uploadedHash, setUploadedHash] = useState<string | null>(null);

  const staticToFound = (rec: ReturnType<typeof findPublicAppraisalById>, matched: string): Found => ({
    kind: 'found',
    id: rec!.id,
    revoked: false,
    revoked_reason: null,
    comuna: rec!.comuna,
    valor_uf: rec!.valor_uf,
    tasador: rec!.tasador_nombre,
    fecha: rec!.fecha_emision,
    matched,
    pdf_path: null,
    pdf_final_path: null,
    pdf_sha256: rec!.pdf_sha256[0] ?? null,
    pdf_final_sha256: rec!.pdf_sha256[1] ?? null,
  });

  const checkByCode = async () => {
    const id = code.trim();
    if (!id) return;
    setByCodeState({ kind: 'checking' });
    const { data, error } = await supabase.rpc('get_tasacion_by_id', { p_id: id });
    const row = Array.isArray(data) ? data[0] : data;
    if (row && !error) {
      setByCodeState(toFound(row, 'id'));
      return;
    }
    const rec = findPublicAppraisalById(id);
    if (rec) {
      setByCodeState(staticToFound(rec, 'id (registro público)'));
      return;
    }
    setByCodeState({ kind: 'notfound' });
  };

  const checkByFile = async (file: File) => {
    setByFileState({ kind: 'checking' });
    const hash = await sha256OfBlob(file);
    setUploadedHash(hash);
    // 1) Try RPC first (covers payload + firma hashes)
    const { data: rpcData } = await supabase.rpc('find_tasacion_by_hash', { _hash: hash });
    const rpcRow = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (rpcRow?.id) {
      const { data: fullData } = await supabase.rpc('get_tasacion_by_id', { p_id: rpcRow.id });
      const full = Array.isArray(fullData) ? fullData[0] : fullData;
      if (full) {
        setByFileState(toFound(full, rpcRow.matched_field ?? 'pdf'));
        return;
      }
    }
    // 2) Fallback: static public registry (demo / shipped PDFs)
    const staticRec = findPublicAppraisalByHash(hash);
    if (staticRec) {
      setByFileState(staticToFound(staticRec, 'pdf (registro público)'));
      return;
    }
    setByFileState({ kind: 'notfound' });
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
                  buscamos coincidencia exacta en el registro público.
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
                  <HashRow label="SHA-256 del archivo" hash={uploadedHash} />
                )}
                <ResultBlock
                  state={byFileState}
                  uploadedHash={uploadedHash}
                  onOpen={(id) => navigate(`/tasacion/v/${id}`)}
                />
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
                    onKeyDown={(e) => e.key === 'Enter' && checkByCode()}
                  />
                  <Button onClick={checkByCode} disabled={!code.trim()}>
                    Validar
                  </Button>
                </div>
                <ResultBlock
                  state={byCodeState}
                  onOpen={(id) => navigate(`/tasacion/v/${id}`)}
                />
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

const CopyButton = ({ value, label = 'hash' }: { value: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="h-6 w-6 shrink-0"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success(`${label} copiado`);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error('No se pudo copiar');
        }
      }}
      aria-label={`Copiar ${label}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
};

const HashRow = ({ label, hash }: { label: string; hash: string }) => (
  <div className="rounded-md border bg-muted/30 px-2.5 py-1.5 flex items-center gap-2">
    <div className="flex-1 min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-[11px] truncate" title={hash}>
        {shortHash(hash, 14, 14)}
      </div>
    </div>
    <CopyButton value={hash} label="Hash" />
  </div>
);

const ResultBlock = ({
  state,
  uploadedHash,
  onOpen,
}: {
  state: LookupResult;
  uploadedHash?: string | null;
  onOpen: (id: string) => void;
}) => {
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
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-destructive">
          <ShieldAlert className="h-5 w-5" /> No verificado
        </div>
        <p className="text-xs text-muted-foreground">
          No encontramos ningún informe que coincida con este archivo o ID en el registro
          público. Si lo recibiste de un agente, pídele el link público oficial
          (<code>/tasacion/v/…</code>).
        </p>
      </div>
    );
  }

  const ok = !state.revoked;
  const refHash = state.pdf_final_sha256 || state.pdf_sha256 || null;
  const pdfPath = state.pdf_final_path || state.pdf_path;
  const pdfUrl = pdfPath ? pdfUrlFor(pdfPath) : null;
  const hashesMatch =
    uploadedHash && refHash ? uploadedHash.toLowerCase() === refHash.toLowerCase() : null;

  return (
    <div
      className={`rounded-lg border p-4 space-y-3 ${
        ok
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : 'border-destructive/40 bg-destructive/10'
      }`}
    >
      {/* Status header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {ok ? (
            <>
              <div className="h-9 w-9 rounded-full bg-emerald-500/15 text-emerald-500 inline-flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Documento verificado
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Coincidencia en registro público · {state.matched === 'id' ? 'por ID' : 'por hash del PDF'}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="h-9 w-9 rounded-full bg-destructive/15 text-destructive inline-flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-destructive">Documento revocado</div>
                <div className="text-[11px] text-muted-foreground">
                  {state.revoked_reason || 'Este informe ya no es válido.'}
                </div>
              </div>
            </>
          )}
        </div>
        {hashesMatch !== null && (
          <Badge
            variant="outline"
            className={
              hashesMatch
                ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                : 'border-amber-500/40 text-amber-600 dark:text-amber-400'
            }
          >
            {hashesMatch ? 'Hash idéntico' : 'Hash difiere'}
          </Badge>
        )}
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {state.comuna && (
          <Field label="Comuna" value={state.comuna} />
        )}
        {state.fecha && <Field label="Emitido" value={state.fecha} />}
        {state.tasador && <Field label="Tasador" value={state.tasador} />}
        {state.valor_uf != null && (
          <Field label="Valor" value={`UF ${state.valor_uf.toLocaleString('es-CL')}`} />
        )}
      </div>

      {/* Hashes */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 rounded-md border bg-background/60 px-2.5 py-1.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              ID del informe
            </div>
            <div className="font-mono text-[11px] truncate" title={state.id}>
              {state.id}
            </div>
          </div>
          <CopyButton value={state.id} label="ID" />
        </div>
        {refHash && <HashRow label="SHA-256 registrado" hash={refHash} />}
      </div>

      {/* Actions */}
      {(() => {
        const publicPath = `/tasacion/v/${state.id}`;
        const publicUrl =
          getCanonicalUrl(publicPath);
        return (
          <>
            <div className="rounded-md border bg-background/60 px-2.5 py-1.5 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Link público verificable
                </div>
                <div className="font-mono text-[11px] truncate" title={publicUrl}>
                  {publicUrl}
                </div>
              </div>
              <CopyButton value={publicUrl} label="Link" />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {pdfUrl && (
                <Button size="sm" variant="default" className="gap-2" asChild>
                  <a href={pdfUrl} download target="_blank" rel="noreferrer">
                    <Download className="h-3.5 w-3.5" /> Descargar PDF oficial
                  </a>
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                className="gap-2"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(publicUrl);
                    toast.success('Link público copiado');
                  } catch {
                    toast.error('No se pudo copiar el link');
                  }
                }}
              >
                <Link2 className="h-3.5 w-3.5" /> Copiar link
              </Button>
              {(() => {
                const lines = [
                  'Hola 👋 Te comparto una tasación verificable de OFERTA TERRENOS.',
                  state.comuna ? `📍 ${state.comuna}` : null,
                  state.valor_uf != null
                    ? `💼 Valor: UF ${state.valor_uf.toLocaleString('es-CL')}`
                    : null,
                  state.fecha ? `📅 Emitido: ${state.fecha}` : null,
                  '',
                  `🔐 Valida aquí: ${publicUrl}`,
                ].filter(Boolean);
                const waUrl = `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
                return (
                  <Button
                    size="sm"
                    className="gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white"
                    asChild
                  >
                    <a href={waUrl} target="_blank" rel="noreferrer">
                      <MessageCircle className="h-3.5 w-3.5" /> Compartir por WhatsApp
                    </a>
                  </Button>
                );
              })()}
              <Button size="sm" variant="outline" className="gap-2" onClick={() => onOpen(state.id)}>
                Ver página pública <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="gap-2" asChild>
                <a href={publicPath} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir en nueva pestaña
                </a>
              </Button>
            </div>
          </>
        );
      })()}
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md border bg-background/60 px-2.5 py-1.5">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-sm font-medium truncate" title={value}>
      {value}
    </div>
  </div>
);

export default TasacionValidator;
