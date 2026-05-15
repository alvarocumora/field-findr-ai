import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Download,
  Hash,
  Copy,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  User,
  FileBarChart,
  Link2,
  Bitcoin,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { sha256OfBlob, shortHash } from '@/lib/tasacionHash';
import { toast } from 'sonner';

interface PublicacionRow {
  id: string;
  comuna: string | null;
  region: string | null;
  direccion: string | null;
  rol: string | null;
  valor_uf: number | null;
  valor_clp: number | null;
  valor_m2_uf: number | null;
  superficie_m2: number | null;
  fecha_emision: string | null;
  tasador_nombre: string | null;
  lang: string | null;
  pdf_path: string;
  pdf_sha256: string;
  pdf_final_path: string | null;
  pdf_final_sha256: string | null;
  payload_json: any;
  version: number;
  revoked_at: string | null;
  revoked_reason: string | null;
  blockchain_anchor: any;
  created_at: string;
}

const fmtUF = (n: number | null | undefined) =>
  n != null ? `UF ${n.toLocaleString('es-CL', { maximumFractionDigits: 2 })}` : '—';
const fmtCLP = (n: number | null | undefined) =>
  n != null ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n) : '—';

const TasacionLive = () => {
  const { id } = useParams<{ id: string }>();
  const [row, setRow] = useState<PublicacionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [verifyState, setVerifyState] = useState<'idle' | 'checking' | 'match' | 'mismatch'>('idle');
  const [uploadedHash, setUploadedHash] = useState<string | null>(null);

  // OpenTimestamps live verification
  type OtsCheck = { url: string; status: 'confirmed' | 'pending' | 'error'; http?: number; error?: string; proof_bytes?: number };
  type OtsVerify = {
    anchored: boolean;
    aggregate?: 'confirmed' | 'pending' | 'unknown';
    confirmed_count?: number;
    pending_count?: number;
    error_count?: number;
    digest?: string;
    submitted_at?: string;
    checks?: OtsCheck[];
    verify_hint?: string;
  };
  const [ots, setOts] = useState<OtsVerify | null>(null);
  const [otsLoading, setOtsLoading] = useState(false);
  const [otsLastChecked, setOtsLastChecked] = useState<Date | null>(null);

  const runOtsVerify = async () => {
    if (!id) return;
    setOtsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-tasacion-ots', {
        body: { tasacionId: id },
      });
      if (error) throw error;
      setOts(data as OtsVerify);
      setOtsLastChecked(new Date());
    } catch (e: any) {
      toast.error('No se pudo verificar OpenTimestamps', { description: e.message });
    } finally {
      setOtsLoading(false);
    }
  };

  useEffect(() => {
    if (row?.blockchain_anchor && row.blockchain_anchor.protocol === 'opentimestamps') {
      runOtsVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row?.id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('tasaciones_publicadas')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!alive) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setRow(data as PublicacionRow);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const status: 'verified' | 'revoked' | 'notfound' | 'loading' = loading
    ? 'loading'
    : notFound
      ? 'notfound'
      : row?.revoked_at
        ? 'revoked'
        : 'verified';

  const downloadOriginal = async () => {
    if (!row) return;
    const path = row.pdf_final_path || row.pdf_path;
    const { data, error } = await supabase.storage.from('tasaciones').createSignedUrl(path, 3600);
    if (error || !data) {
      toast.error('No se pudo abrir el PDF');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const onVerifyFile = async (file: File) => {
    if (!row) return;
    setVerifyState('checking');
    const hash = await sha256OfBlob(file);
    setUploadedHash(hash);
    const expected = [row.pdf_sha256, row.pdf_final_sha256].filter(Boolean);
    setVerifyState(expected.includes(hash) ? 'match' : 'mismatch');
  };

  const copy = async (text: string, label = 'Copiado') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const title = useMemo(() => {
    if (!row) return 'Tasación · OFERTA TERRENOS';
    return `Tasación verificada · ${row.comuna ?? ''} · OFERTA TERRENOS`;
  }, [row]);

  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← OFERTA TERRENOS
          </Link>
          <Link to="/tasacion/validar" className="text-sm text-primary hover:underline">
            Validar otro documento
          </Link>
        </div>

        {/* Status header */}
        <Card className={
          status === 'verified'
            ? 'border-emerald-500/40 bg-emerald-500/5'
            : status === 'revoked'
              ? 'border-destructive/40 bg-destructive/10'
              : status === 'notfound'
                ? 'border-amber-500/40 bg-amber-500/5'
                : 'border-border'
        }>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              {status === 'loading' && <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />}
              {status === 'verified' && <ShieldCheck className="h-7 w-7 text-emerald-500" />}
              {status === 'revoked' && <ShieldAlert className="h-7 w-7 text-destructive" />}
              {status === 'notfound' && <ShieldAlert className="h-7 w-7 text-amber-500" />}
              <div>
                <CardTitle className="text-xl">
                  {status === 'loading' && 'Cargando…'}
                  {status === 'verified' && 'Tasación verificada'}
                  {status === 'revoked' && 'Tasación revocada'}
                  {status === 'notfound' && 'Documento no encontrado'}
                </CardTitle>
                {row && (
                  <p className="text-sm text-muted-foreground">
                    Emitida el {row.fecha_emision} · v{row.version}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          {row?.revoked_at && (
            <CardContent className="pt-0">
              <div className="text-sm">
                <strong>Motivo:</strong> {row.revoked_reason || '—'} ·{' '}
                <span className="text-muted-foreground">{new Date(row.revoked_at).toLocaleString('es-CL')}</span>
              </div>
            </CardContent>
          )}
        </Card>

        {row && (
          <>
            {/* Datos clave */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileBarChart className="h-4 w-4 text-primary" /> Datos clave
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="flex gap-2"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-muted-foreground text-xs">Predio</div>
                    <div>{row.direccion || '—'}, {row.comuna}, {row.region}</div>
                    {row.rol && <div className="text-xs text-muted-foreground">Rol SII: {row.rol}</div>}
                  </div>
                </div>
                <div className="flex gap-2"><User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-muted-foreground text-xs">Tasador</div>
                    <div>{row.tasador_nombre}</div>
                  </div>
                </div>
                <div className="flex gap-2"><Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-muted-foreground text-xs">Fecha de emisión</div>
                    <div>{row.fecha_emision}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-4 w-4 mt-0.5" />
                  <div>
                    <div className="text-muted-foreground text-xs">Superficie</div>
                    <div>{row.superficie_m2?.toLocaleString('es-CL')} m²</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Valor comercial */}
            <Card className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/30">
              <CardContent className="py-6 text-center space-y-1">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Valor comercial</div>
                <div className="text-4xl font-bold text-emerald-500">{fmtUF(row.valor_uf)}</div>
                <div className="text-sm text-muted-foreground">
                  ≈ {fmtCLP(row.valor_clp)} · {fmtUF(row.valor_m2_uf)}/m²
                </div>
              </CardContent>
            </Card>

            {/* Trazabilidad */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" /> Trazabilidad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">SHA-256 PDF original</div>
                    <button
                      onClick={() => copy(row.pdf_sha256, 'Hash original copiado')}
                      className="block w-full text-left text-[10px] font-mono bg-muted/50 rounded px-2 py-1 truncate hover:bg-muted"
                      title={row.pdf_sha256}
                    >
                      <Copy className="h-3 w-3 inline mr-1" />{shortHash(row.pdf_sha256, 12, 12)}
                    </button>
                  </div>
                  {row.pdf_final_sha256 && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">SHA-256 PDF final (con QR)</div>
                      <button
                        onClick={() => copy(row.pdf_final_sha256!, 'Hash final copiado')}
                        className="block w-full text-left text-[10px] font-mono bg-muted/50 rounded px-2 py-1 truncate hover:bg-muted"
                        title={row.pdf_final_sha256}
                      >
                        <Copy className="h-3 w-3 inline mr-1" />{shortHash(row.pdf_final_sha256, 12, 12)}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-xs">
                      <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Anclaje blockchain:</span>
                      {row.blockchain_anchor ? (
                        <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">
                          {row.blockchain_anchor.protocol === 'opentimestamps'
                            ? `OpenTimestamps · ${row.blockchain_anchor.network}`
                            : `Anclado en ${row.blockchain_anchor.network}`}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Sin anclar</Badge>
                      )}
                    </div>
                    <Button size="sm" variant="secondary" className="gap-2" onClick={downloadOriginal}>
                      <Download className="h-3.5 w-3.5" /> Descargar PDF
                    </Button>
                  </div>

                  {row.blockchain_anchor?.protocol === 'opentimestamps' && (
                    <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-2 text-[11px] space-y-1">
                      <div className="text-muted-foreground">
                        Enviado a {row.blockchain_anchor.ok_count}/{row.blockchain_anchor.calendars?.length} calendarios
                        OpenTimestamps el{' '}
                        {new Date(row.blockchain_anchor.submitted_at).toLocaleString()}.
                        El SHA-256 quedará incluido en un bloque Bitcoin (~horas).
                      </div>
                      <div className="font-mono text-[10px] break-all text-muted-foreground">
                        digest: {row.blockchain_anchor.digest}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Verificar archivo */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Verificar mi copia del PDF</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground text-xs">
                  Sube el archivo PDF que recibiste; calcularemos su huella SHA-256 localmente y la
                  compararemos con la registrada. Si coincide, el documento es auténtico.
                </p>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onVerifyFile(f);
                  }}
                />
                {verifyState === 'checking' && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Calculando huella…
                  </div>
                )}
                {verifyState === 'match' && (
                  <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4" /> Coincide. Documento auténtico.
                  </div>
                )}
                {verifyState === 'mismatch' && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                      <XCircle className="h-4 w-4" /> No coincide con esta tasación.
                    </div>
                    {uploadedHash && (
                      <div className="text-[10px] font-mono text-muted-foreground">
                        Tu archivo: {shortHash(uploadedHash, 12, 12)}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default TasacionLive;
