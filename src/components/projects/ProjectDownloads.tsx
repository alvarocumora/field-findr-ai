import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, FileText, Map as MapIcon, Table2, Loader2, Eye, FileSpreadsheet, Files, MousePointerClick } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useStaticMapToken } from '@/hooks/useStaticMapToken';
import { useTrackEvent } from '@/hooks/useTrackEvent';
import { useAuth } from '@/hooks/useAuth';
import { useSentinelImagery } from '@/hooks/useSentinelImagery';
import { useBrokerByInviteCode } from '@/hooks/useBrokers';
import { LandingLeadForm } from '@/pages/landing/LandingLeadForm';
import {
  generateProjectDossierPdf,
  generateProjectMasterplanPdf,
  generateProjectPriceListPdf,
  exportProjectPriceListCsv,
  generateProjectLotSheetsPdf,
  type KitLot,
  type KitProject,
} from '@/lib/pdf/projectKit';
import type { LandingFichaPdf } from '@/lib/landing/config';

type KitId = 'dossier' | 'precios' | 'plano' | 'csv' | 'fichas' | 'preview' | 'ficha';

interface Props {
  project: KitProject;
  lots: KitLot[];
  /** Dueño del proyecto: necesario para registrar el lead antes de descargar. */
  projectOwnerId?: string | null;
  /** En el panel no se pide contacto (el usuario ya es del equipo). */
  requireLead?: boolean;
  /** Añade el compendio con una ficha por parcela (uso comercial interno). */
  showLotSheets?: boolean;
  className?: string;
  title?: string;
  description?: string;
  /** Ficha interactiva publicada por el equipo (landing_config.ficha_pdf). */
  fichaPdf?: LandingFichaPdf | null;
}

const LEAD_KEY = (projectId: string) => `ot_material_lead_${projectId}`;

/**
 * Bloque único "Material del proyecto": dossier, lista de precios (PDF/CSV) y
 * plano. Se usa igual en la landing genérica, en las landings a medida y en el
 * panel. En la web pública pide contacto una vez y el lead entra al CRM.
 */
export const ProjectDownloads = ({
  project,
  lots,
  projectOwnerId,
  requireLead = true,
  showLotSheets = false,
  className,
  title = 'Material del proyecto',
  description = 'Descarga el dossier, la lista de precios y el plano para revisarlos o compartirlos.',
  fichaPdf = null,
}: Props) => {
  const token = useStaticMapToken();
  const sentinelQuery = useSentinelImagery({
    lots,
    center: project.latitude != null && project.longitude != null
      ? { lat: Number(project.latitude), lng: Number(project.longitude) }
      : null,
    enabled: lots.length > 0,
    maxCloudCover: 35,
    lookbackDays: 90,
  });
  const { track } = useTrackEvent();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');
  const { data: refBroker } = useBrokerByInviteCode(refCode);
  const [busy, setBusy] = useState<KitId | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [pending, setPending] = useState<KitId | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const hasLead = () => {
    if (!requireLead || user) return true;
    try {
      return localStorage.getItem(LEAD_KEY(project.id)) === '1';
    } catch {
      return false;
    }
  };

  const run = async (id: KitId) => {
    if (busy) return;
    if (id === 'ficha') {
      if (!fichaPdf) return;
      const a = document.createElement('a');
      a.href = fichaPdf.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.download = `Ficha-${project.slug || project.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      track('project_material_download', { project_id: project.id, material: 'ficha_pdf' });
      return;
    }
    setBusy(id);
    try {
      const needsSatellite = id === 'preview' || id === 'dossier' || id === 'plano' || id === 'fichas';
      const currentSentinel = needsSatellite
        ? sentinelQuery.data ?? (await sentinelQuery.refetch()).data ?? null
        : sentinelQuery.data ?? null;
      const opts = {
        mapboxToken: token,
        sentinelImagery: currentSentinel,
        broker: refBroker
          ? { name: refBroker.display_name, phone: refBroker.phone, email: refBroker.email, company_name: refBroker.company_name }
          : null,
      };
      if (id === 'preview') {
        const blob = await generateProjectDossierPdf(project, lots, { ...opts, output: 'blob' });
        if (blob) setPreviewUrl(URL.createObjectURL(blob));
      }
      if (id === 'dossier') await generateProjectDossierPdf(project, lots, opts);
      if (id === 'precios') await generateProjectPriceListPdf(project, lots, opts);
      if (id === 'plano') await generateProjectMasterplanPdf(project, lots, opts);
      if (id === 'csv') exportProjectPriceListCsv(project, lots);
      if (id === 'fichas') await generateProjectLotSheetsPdf(project, lots, opts);
      if (id !== 'preview') track('project_material_download', { project_id: project.id, material: id });
    } catch (e) {
      console.error('project material download failed', e);
      toast.error('No pudimos generar el documento. Intenta nuevamente.');
    } finally {
      setBusy(null);
    }
  };

  const request = (id: KitId) => {
    if (!hasLead() && projectOwnerId) {
      setPending(id);
      setGateOpen(true);
      return;
    }
    void run(id);
  };

  const available = lots.filter((l) => l.status === 'available').length;
  const disabled = busy !== null || lots.length === 0;

  const others: { id: KitId; label: string; hint: string; format: string; icon: typeof FileText }[] = [
    { id: 'precios', label: 'Lista de precios', hint: `Las ${lots.length} parcelas y su estado`, format: 'PDF', icon: Table2 },
    { id: 'plano', label: 'Plano del loteo', hint: 'Plano y cuadro de superficies', format: 'PDF', icon: MapIcon },
    { id: 'csv', label: 'Precios para Excel', hint: 'Para filtrar o trabajar aparte', format: 'CSV', icon: FileSpreadsheet },
    ...(showLotSheets
      ? [{ id: 'fichas' as KitId, label: 'Fichas de parcelas', hint: 'Una ficha por parcela', format: 'PDF', icon: Files }]
      : []),
  ];

  return (
    <section className={className}>
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <p className="text-muted-foreground text-sm mt-1 mb-4">{description}</p>
      <div className="space-y-3">
        {fichaPdf && (
          <div className="rounded-2xl border border-primary/40 bg-primary/10 p-5 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <MousePointerClick className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Ficha interactiva · PDF</p>
                <h3 className="text-lg font-bold leading-tight text-foreground">{fichaPdf.label}</h3>
                <p className="text-sm text-muted-foreground">
                  Plano con enlaces a cada lote, precios, fotos, kit de casa y botones para reservar o escribir por WhatsApp.
                  {fichaPdf.updatedAt ? ` Precios al ${fichaPdf.updatedAt.split('-').reverse().join('-')}.` : ''}
                </p>
              </div>
            </div>
            <Button className="min-h-11 md:w-48 shrink-0" disabled={busy !== null} onClick={() => request('ficha')}>
              <Download className="h-4 w-4 mr-2" />Descargar ficha
            </Button>
          </div>
        )}
        {/* Dossier: la pieza principal para enviar a un cliente */}
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-5 flex flex-col md:flex-row md:items-center gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <FileText className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Recomendado para enviar</p>
                <h3 className="text-lg font-bold leading-tight text-foreground">Dossier del proyecto</h3>
              </div>
            </div>
            <ul className="mt-3 grid gap-x-5 gap-y-1 text-sm text-muted-foreground sm:grid-cols-2">
              <li>• Portada con precio desde</li>
              <li>• Plano por estado de parcela</li>
              <li>• {available > 0 ? `Las ${available} parcelas disponibles` : 'Parcelas y precios'}</li>
              <li>• Cómo comprar y agendar reunión</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row md:flex-col md:w-48 shrink-0">
            <Button className="min-h-11 flex-1 md:flex-none" disabled={disabled} onClick={() => request('dossier')}>
              {busy === 'dossier'
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generando…</>
                : <><Download className="h-4 w-4 mr-2" />Descargar dossier</>}
            </Button>
            <Button variant="outline" className="min-h-11 flex-1 md:flex-none" disabled={disabled} onClick={() => request('preview')}>
              {busy === 'preview' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
              Vista previa
            </Button>
          </div>
        </div>

        {/* Resto del kit: tarjetas compactas iguales; toda la tarjeta descarga */}
        <div className="grid gap-3 sm:grid-cols-2">
          {others.map((it) => (
            <button
              key={it.id}
              type="button"
              disabled={disabled}
              onClick={() => request(it.id)}
              aria-label={`Descargar ${it.label} (${it.format})`}
              className="group flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card/95 p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                <it.icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">{it.label}</span>
                  <span className="rounded border border-border/70 px-1 text-[10px] font-semibold tracking-wide text-muted-foreground">{it.format}</span>
                </span>
                <span className="block text-xs text-muted-foreground">{it.hint}</span>
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors group-hover:border-primary/50 group-hover:text-primary">
                {busy === it.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={Boolean(previewUrl)} onOpenChange={open => { if (!open) setPreviewUrl(null); }}>
        <DialogContent className="max-w-5xl h-[90dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Dossier · {project.name}</DialogTitle>
            <DialogDescription>Revisa las imágenes y usa los botones del PDF para abrir la ficha online o contactar al equipo.</DialogDescription>
          </DialogHeader>
          {previewUrl && <>
            <iframe title={`Vista previa del dossier de ${project.name}`} src={previewUrl} className="w-full flex-1 min-h-0 rounded border" />
            <p className="text-xs text-muted-foreground">Si tu navegador no muestra el PDF, descárgalo para abrirlo.</p>
            <Button asChild><a href={previewUrl} download={`Dossier-${project.slug || project.id}.pdf`} onClick={() => track('project_material_download', { project_id: project.id, material: 'dossier' })}><Download className="h-4 w-4 mr-2" />Descargar este PDF</a></Button>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={gateOpen} onOpenChange={setGateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Déjanos tus datos y descarga</DialogTitle>
            <DialogDescription>
              Te enviamos el material y un asesor queda disponible para responder tus dudas de {project.name}.
            </DialogDescription>
          </DialogHeader>
          {projectOwnerId && (
            <LandingLeadForm
              projectId={project.id}
              projectOwnerId={projectOwnerId}
              projectSlug={project.slug ?? project.id}
              onSuccess={() => {
                try {
                  localStorage.setItem(LEAD_KEY(project.id), '1');
                } catch {
                  /* almacenamiento no disponible */
                }
                setGateOpen(false);
                if (pending) void run(pending);
                setPending(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ProjectDownloads;
