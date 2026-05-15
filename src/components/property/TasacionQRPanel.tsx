import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Loader2,
  Copy,
  ExternalLink,
  Download,
  QrCode as QrIcon,
  Hash,
  Link2,
  Anchor,
  Bitcoin,
} from 'lucide-react';
import { toast } from 'sonner';
import { publishTasacion, downloadDataUrl, downloadText, type PublishResult } from '@/lib/tasacionPublish';
import type { TasacionData } from '@/lib/tasacionPdfGenerator';
import { shortHash } from '@/lib/tasacionHash';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  buildPdfData: () => TasacionData;
  listingId?: string | null;
}

const TasacionQRPanel = ({ buildPdfData, listingId }: Props) => {
  const [loading, setLoading] = useState(false);
  const [anchoring, setAnchoring] = useState(false);
  const [anchor, setAnchor] = useState<any | null>(null);
  const [result, setResult] = useState<PublishResult | null>(null);

  const onPublish = async () => {
    setLoading(true);
    try {
      const data = buildPdfData();
      const r = await publishTasacion(data, { listingId });
      setResult(r);
      try { await navigator.clipboard.writeText(r.validatorUrl); } catch {}
      toast.success('Tasación publicada', {
        description: 'Link copiado al portapapeles. El PDF final ya incluye el QR.',
      });
    } catch (err: any) {
      toast.error('No se pudo publicar', { description: err.message ?? 'Error desconocido' });
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado`);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const downloadFinalPdf = async () => {
    if (!result) return;
    const { data, error } = await supabase.storage
      .from('tasaciones')
      .createSignedUrl(result.pdfFinalPath, 3600);
    if (error || !data) {
      toast.error('No se pudo descargar el PDF');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const onAnchor = async () => {
    if (!result) return;
    setAnchoring(true);
    try {
      const { data, error } = await supabase.functions.invoke('anchor-tasacion', {
        body: { tasacionId: result.id, hashField: 'pdf_final_sha256' },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error ?? 'No se pudo anclar');
      setAnchor(data.anchor);
      const ok = data.anchor?.ok_count ?? 0;
      toast.success('Anclado a Bitcoin (OpenTimestamps)', {
        description: `${ok}/${data.anchor?.calendars?.length ?? 0} calendarios confirmaron la recepción.`,
      });
    } catch (err: any) {
      toast.error('No se pudo anclar', { description: err.message ?? 'Error desconocido' });
    } finally {
      setAnchoring(false);
    }
  };

  return (
    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          <div>
            <div className="font-semibold text-sm">Publicación verificable + QR</div>
            <p className="text-xs text-muted-foreground">
              Crea un registro inmutable, embute el QR en el PDF final y genera un link público de validación.
            </p>
          </div>
        </div>
        <Button onClick={onPublish} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {loading ? 'Publicando…' : 'Publicar y generar QR'}
        </Button>
      </div>

      {result && (
        <div className="grid gap-4 md:grid-cols-[160px_1fr] pt-2 border-t border-emerald-500/20">
          <div className="flex flex-col items-center gap-2">
            <img
              src={result.qrDataUrl}
              alt="QR de validación"
              className="w-40 h-40 rounded-md bg-white p-2 border border-border"
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                onClick={() => downloadDataUrl(result.qrDataUrl, `tasacion_${result.id}.png`)}
              >
                <Download className="h-3 w-3" /> PNG
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                onClick={() => downloadText(result.qrSvg, `tasacion_${result.id}.svg`)}
              >
                <Download className="h-3 w-3" /> SVG
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
                <ShieldCheck className="h-3 w-3 mr-1" /> Publicado · v{result.version}
              </Badge>
              {anchor ? (
                <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px]">
                  <Bitcoin className="h-3 w-3 mr-1" /> OTS · {anchor.ok_count}/{anchor.calendars?.length} calendars
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">Sin anclar a Bitcoin</Badge>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Link2 className="h-3 w-3" /> URL pública
              </label>
              <div className="flex gap-1">
                <Input readOnly value={result.validatorUrl} className="h-8 text-xs font-mono" onFocus={(e) => e.currentTarget.select()} />
                <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => copyText(result.validatorUrl, 'Link')}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => window.open(result.validatorUrl, '_blank', 'noopener,noreferrer')}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3" /> SHA-256 PDF original
                </label>
                <button
                  onClick={() => copyText(result.pdfSha256, 'Hash original')}
                  className="block w-full text-left text-[10px] font-mono bg-muted/50 rounded px-2 py-1 truncate hover:bg-muted"
                  title={result.pdfSha256}
                >
                  {shortHash(result.pdfSha256, 12, 12)}
                </button>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3" /> SHA-256 PDF final (con QR)
                </label>
                <button
                  onClick={() => copyText(result.pdfFinalSha256, 'Hash final')}
                  className="block w-full text-left text-[10px] font-mono bg-muted/50 rounded px-2 py-1 truncate hover:bg-muted"
                  title={result.pdfFinalSha256}
                >
                  {shortHash(result.pdfFinalSha256, 12, 12)}
                </button>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="secondary" className="gap-2" onClick={downloadFinalPdf}>
                <Download className="h-3.5 w-3.5" /> Descargar PDF final con QR
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => window.open('/tasacion/validar', '_blank', 'noopener,noreferrer')}
              >
                <QrIcon className="h-3.5 w-3.5" /> Ir al validador
              </Button>
              <Button
                size="sm"
                className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                onClick={onAnchor}
                disabled={anchoring || !!anchor}
                title="Envía el SHA-256 a calendarios OpenTimestamps. Sin costo, sin claves; la atestación Bitcoin llega en horas."
              >
                {anchoring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Anchor className="h-3.5 w-3.5" />}
                {anchor ? 'Anclado a Bitcoin' : anchoring ? 'Anclando…' : 'Anclar a Bitcoin (OTS)'}
              </Button>
            </div>

            {anchor && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2 space-y-1 text-[11px]">
                <div className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                  <Bitcoin className="h-3 w-3" /> OpenTimestamps · pendiente de bloque Bitcoin
                </div>
                <div className="text-muted-foreground">
                  Enviado: {new Date(anchor.submitted_at).toLocaleString()}
                </div>
                <ul className="space-y-0.5">
                  {anchor.calendars?.map((c: any) => (
                    <li key={c.url} className="flex items-center gap-1 font-mono text-[10px]">
                      <span className={c.ok ? 'text-emerald-500' : 'text-red-500'}>●</span>
                      <span className="truncate">{c.url}</span>
                      {!c.ok && <span className="text-red-500">— {c.error}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasacionQRPanel;
