import { useState } from 'react';
import { Download, Lock, FileSpreadsheet, Package, FileJson, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  PARTIDAS, FACILIDAD_TOTAL_CLP_M, FACILIDAD_TOTAL_EUR,
  type UsoFondosItem,
} from '../data/usoFondos';
import DocRequestModal from './DocRequestModal';

const fmtClp = (m: number) => `CLP $ ${m.toLocaleString('de-DE')}M`;
const fmtEur = (m: number) =>
  `EUR ${Math.round((m * 1_000_000) / 1040).toLocaleString('de-DE')}`;

const NAT_COLOR: Record<UsoFondosItem['naturaleza'], string> = {
  CAPEX: '#1F3D2B',
  OPEX: '#5B6E2A',
  PIPELINE: '#8A6E2F',
  RESERVA: '#4A3B66',
};

// SHA-256 generados en build con `sha256sum` sobre /public/dd-luc/uso-fondos/*
const BUNDLE_FILES = {
  zip: {
    label: 'ZIP completo',
    url: '/dd-luc/uso-fondos/uso-fondos-respaldos.zip',
    sha256: '559f5fd49a084616fc2045fe1823ac2ea9f73ec188b98bdb5222d6a12677587c',
    filename: 'uso-fondos-respaldos.zip',
  },
  csv: {
    label: 'CSV trazabilidad',
    url: '/dd-luc/uso-fondos/uso-fondos-trazabilidad.csv',
    sha256: 'd34a1d11be6073c71a8b2ddb8f44f472c0813021588ad4441e22e93d05253f3d',
    filename: 'uso-fondos-trazabilidad.csv',
  },
  json: {
    label: 'JSON manifest',
    url: '/dd-luc/uso-fondos/uso-fondos-manifest.json',
    sha256: 'be0b734e77e3d508dc31b4b3051cef803558cf1385149eb6ded423f2a58b1ad7',
    filename: 'uso-fondos-manifest.json',
  },
} as const;

type BundleKey = keyof typeof BUNDLE_FILES;

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function downloadAndVerify(key: BundleKey, setBusy: (k: BundleKey | null) => void) {
  const meta = BUNDLE_FILES[key];
  setBusy(key);
  const toastId = toast.loading(`Verificando integridad · ${meta.label}…`);
  try {
    const res = await fetch(meta.url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    const digest = await sha256Hex(buf);
    if (digest !== meta.sha256) {
      toast.error('Checksum no coincide · descarga abortada', {
        id: toastId,
        description: `esperado ${meta.sha256.slice(0, 12)}… · recibido ${digest.slice(0, 12)}…`,
      });
      return;
    }
    const blob = new Blob([buf]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = meta.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Integridad verificada · ${meta.label}`, {
      id: toastId,
      description: `SHA-256 ${meta.sha256.slice(0, 16)}… · ${(buf.byteLength / 1024).toFixed(1)} KB`,
      duration: 5000,
    });
  } catch (e: any) {
    toast.error('No se pudo descargar el archivo', {
      id: toastId,
      description: e?.message ?? 'error de red',
    });
  } finally {
    setBusy(null);
  }
}


export default function FveUsoFondos() {
  const [open, setOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [busy, setBusy] = useState<BundleKey | null>(null);

  const totalItems = PARTIDAS.reduce((s, p) => s + p.items.length, 0);


  return (
    <section
      id="uso-fondos"
      className="fve-section py-24 md:py-32"
      style={{ background: 'white' }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="grid md:grid-cols-12 gap-10 mb-12">
          <div className="md:col-span-5">
            <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--fve-gold))] mb-4">
              07 · Uso de Fondos · Respaldos de Gasto
            </p>
            <h2 className="font-serif-fve text-4xl md:text-5xl leading-tight">
              Cada peso de la facilidad, respaldado por una ficha auditable.
            </h2>
          </div>
          <div className="md:col-span-6 md:col-start-7 text-[hsl(var(--fve-charcoal))]/75 text-base md:text-lg leading-relaxed">
            <p>
              La facilidad de <strong>EUR {FACILIDAD_TOTAL_EUR.toLocaleString('de-DE')}</strong>
              {' '}(referencial <strong>{fmtClp(FACILIDAD_TOTAL_CLP_M)}</strong>) se descompone
              en <strong>{PARTIDAS.length} macro-partidas</strong> y <strong>{totalItems} líneas
              de gasto individuales</strong>. Cada línea cuenta con una ficha PDF que detalla
              supuestos, unidades de costo, proveedores referenciales y los documentos originales
              (cotizaciones, contratos, presupuestos) que se aportan bajo NDA.
            </p>
          </div>
        </div>

        {/* Bundle downloads */}
        <div className="mb-10 border border-[hsl(var(--fve-forest-deep))]/15 bg-[hsl(var(--fve-forest-deep))]/[0.03] p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--fve-gold))] mb-1.5">
              Data room · descarga consolidada
            </p>
            <p className="font-serif-fve text-lg text-[hsl(var(--fve-forest-deep))] leading-snug">
              ZIP con las {totalItems} fichas PDF + manifiesto JSON/CSV de trazabilidad
            </p>
            <p className="text-xs text-[hsl(var(--fve-charcoal))]/60 mt-1">
              Equivalencias CLP↔EUR (FX 1.040), mapeo LUC, % facilidad y respaldos por línea.
            </p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--fve-charcoal))]/45 mt-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" />
              Verificación SHA-256 al descargar · checksums en CHECKSUMS.txt
            </p>
          </div>
          <div className="flex flex-wrap gap-2 fve-no-print">
            {(['zip', 'csv', 'json'] as BundleKey[]).map((k) => {
              const meta = BUNDLE_FILES[k];
              const Icon = k === 'zip' ? Package : k === 'csv' ? FileSpreadsheet : FileJson;
              const isPrimary = k === 'zip';
              const isBusy = busy === k;
              return (
                <button
                  key={k}
                  type="button"
                  disabled={isBusy}
                  onClick={() => downloadAndVerify(k, setBusy)}
                  title={`SHA-256: ${meta.sha256}`}
                  className={
                    isPrimary
                      ? 'inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] px-4 py-2.5 font-medium disabled:opacity-60'
                      : 'inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] px-4 py-2.5 border border-[hsl(var(--fve-forest-deep))]/30 text-[hsl(var(--fve-forest-deep))] hover:bg-[hsl(var(--fve-forest))] hover:text-white hover:border-[hsl(var(--fve-forest))] transition-colors disabled:opacity-60'
                  }
                  style={isPrimary ? { background: 'hsl(var(--fve-forest-deep))', color: 'white' } : undefined}
                >
                  {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                  {isBusy ? 'Verificando…' : meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Partida summary cards */}
        <div className="grid md:grid-cols-4 gap-3 mb-10">
          {PARTIDAS.map((p) => (
            <div
              key={p.numero}
              className="border border-black/10 bg-white p-5"
              style={{ borderTop: `3px solid ${NAT_COLOR[p.naturaleza]}` }}
            >
              <p
                className="text-[10px] uppercase tracking-[0.18em] font-medium mb-2"
                style={{ color: NAT_COLOR[p.naturaleza] }}
              >
                Partida {p.numero} · {p.naturaleza}
              </p>
              <h3 className="font-serif-fve text-lg text-[hsl(var(--fve-forest-deep))] leading-tight mb-3">
                {p.nombre}
              </h3>
              <p className="font-mono text-2xl text-[hsl(var(--fve-charcoal))] mb-1">
                {fmtClp(p.monto_clp_m)}
              </p>
              <p className="text-xs text-[hsl(var(--fve-charcoal))]/60">
                {p.pct}% · {p.items.length} líneas de gasto
              </p>
            </div>
          ))}
        </div>

        {/* Accordion by partida */}
        <Accordion type="multiple" defaultValue={['p-1']} className="space-y-3">
          {PARTIDAS.map((p) => (
            <AccordionItem
              key={p.numero}
              value={`p-${p.numero}`}
              className="border border-black/10 bg-white px-5"
            >
              <AccordionTrigger className="hover:no-underline py-5">
                <div className="flex items-baseline gap-4 text-left flex-wrap">
                  <span
                    className="text-[10px] uppercase tracking-[0.18em] font-medium px-2 py-0.5"
                    style={{
                      background: NAT_COLOR[p.naturaleza],
                      color: '#E8D89A',
                    }}
                  >
                    {p.naturaleza}
                  </span>
                  <span className="font-serif-fve text-lg md:text-xl text-[hsl(var(--fve-forest-deep))]">
                    Partida {p.numero} · {p.nombre}
                  </span>
                  <span className="font-mono text-sm text-[hsl(var(--fve-charcoal))]/60">
                    {fmtClp(p.monto_clp_m)} · {p.pct}%
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-[hsl(var(--fve-charcoal))]/70 mb-4 max-w-3xl">
                  {p.descripcion}
                </p>
                <ul className="divide-y divide-black/8 -mx-2">
                  {p.items.map((it) => (
                    <li
                      key={it.numero}
                      className="py-4 px-2 grid md:grid-cols-12 gap-4 items-start"
                    >
                      <div className="md:col-span-1">
                        <span className="font-mono text-xs text-[hsl(var(--fve-charcoal))]/45">
                          UF {String(it.numero).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="md:col-span-6">
                        <h4 className="font-serif-fve text-base text-[hsl(var(--fve-forest-deep))] mb-1">
                          {it.concepto}
                        </h4>
                        <p className="text-xs text-[hsl(var(--fve-charcoal))]/65 leading-relaxed line-clamp-2">
                          {it.descripcion}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--fve-charcoal))]/45 mt-1.5">
                          LUC · items {it.luc.join(', ')}
                        </p>
                      </div>
                      <div className="md:col-span-2 md:text-right">
                        <p className="font-mono text-sm text-[hsl(var(--fve-charcoal))]">
                          {fmtClp(it.monto_clp_m)}
                        </p>
                        <p className="text-[11px] text-[hsl(var(--fve-charcoal))]/50">
                          {fmtEur(it.monto_clp_m)} · {it.pct.toFixed(1)}%
                        </p>
                      </div>
                      <div className="md:col-span-3 md:text-right fve-no-print flex md:flex-col gap-2 md:items-end">
                        <a
                          href={it.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] px-3 py-1.5 font-medium"
                          style={{ background: 'hsl(var(--fve-forest))', color: 'white' }}
                        >
                          <Download className="w-3.5 h-3.5" /> Ficha
                        </a>
                        <button
                          onClick={() => {
                            setDocTitle(`Respaldo UF-${it.numero.toString().padStart(2,'0')} · ${it.concepto}`);
                            setOpen(true);
                          }}
                          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] px-3 py-1.5 border border-[hsl(var(--fve-charcoal))]/25 hover:bg-[hsl(var(--fve-forest))] hover:text-white hover:border-[hsl(var(--fve-forest))] transition-colors"
                        >
                          <Lock className="w-3.5 h-3.5" /> Originales
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-black/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-[hsl(var(--fve-charcoal))]/55">
          <span className="flex items-center gap-2">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Total trazable: {fmtClp(FACILIDAD_TOTAL_CLP_M)} = {totalItems} fichas de respaldo (100%)
          </span>
          <span>Cierre, modelo financiero y Gantt: ver bloque Due Diligence · ir@ofertaterrenos.cl</span>
        </div>
      </div>

      <DocRequestModal open={open} onOpenChange={setOpen} docTitle={docTitle} />
    </section>
  );
}
