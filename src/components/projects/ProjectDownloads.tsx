import { useState } from 'react';
import { Download, FileText, Map as MapIcon, Table2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useStaticMapToken } from '@/hooks/useStaticMapToken';
import { useTrackEvent } from '@/hooks/useTrackEvent';
import { useAuth } from '@/hooks/useAuth';
import { LandingLeadForm } from '@/pages/landing/LandingLeadForm';
import {
  generateProjectDossierPdf,
  generateProjectMasterplanPdf,
  generateProjectPriceListPdf,
  exportProjectPriceListCsv,
  type KitLot,
  type KitProject,
} from '@/lib/pdf/projectKit';

type KitId = 'dossier' | 'precios' | 'plano' | 'csv';

interface Props {
  project: KitProject;
  lots: KitLot[];
  /** Dueño del proyecto: necesario para registrar el lead antes de descargar. */
  projectOwnerId?: string | null;
  /** En el panel no se pide contacto (el usuario ya es del equipo). */
  requireLead?: boolean;
  className?: string;
  title?: string;
  description?: string;
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
  className,
  title = 'Material del proyecto',
  description = 'Descarga el dossier, la lista de precios y el plano para revisarlos o compartirlos.',
}: Props) => {
  const { token } = useStaticMapToken();
  const { track } = useTrackEvent();
  const { user } = useAuth();
  const [busy, setBusy] = useState<KitId | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [pending, setPending] = useState<KitId | null>(null);

  const hasLead = () => {
    if (!requireLead || user) return true;
    try {
      return localStorage.getItem(LEAD_KEY(project.id)) === '1';
    } catch {
      return false;
    }
  };

  const run = async (id: KitId) => {
    setBusy(id);
    try {
      const opts = { mapboxToken: token };
      if (id === 'dossier') await generateProjectDossierPdf(project, lots, opts);
      if (id === 'precios') await generateProjectPriceListPdf(project, lots, opts);
      if (id === 'plano') await generateProjectMasterplanPdf(project, lots, opts);
      if (id === 'csv') exportProjectPriceListCsv(project, lots);
      track('project_material_download', { project_id: project.id, material: id });
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

  const items: { id: KitId; label: string; hint: string; icon: typeof FileText }[] = [
    { id: 'dossier', label: 'Dossier del proyecto', hint: 'PDF · resumen, plano y condiciones', icon: FileText },
    { id: 'precios', label: 'Lista de precios', hint: 'PDF · todas las parcelas', icon: Table2 },
    { id: 'plano', label: 'Plano del loteo', hint: 'PDF · cuadro de superficies', icon: MapIcon },
    { id: 'csv', label: 'Lista de precios (Excel)', hint: 'CSV · para trabajarlo aparte', icon: Download },
  ];

  return (
    <section className={className}>
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <p className="text-muted-foreground text-sm mt-1 mb-4">{description}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((it) => (
          <Card key={it.id} className="border-border/60 bg-card/95">
            <CardContent className="p-4 flex flex-col gap-3 h-full">
              <it.icon className="h-5 w-5 text-primary" aria-hidden />
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">{it.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{it.hint}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full min-h-10"
                disabled={busy !== null || lots.length === 0}
                onClick={() => request(it.id)}
              >
                {busy === it.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />Generando…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />Descargar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

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
