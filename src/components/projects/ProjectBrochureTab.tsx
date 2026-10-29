import type { Project } from '@/hooks/useProjects';
import type { PublicLot } from '@/lib/lots/publicLotTypes';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Download, Percent, Calendar, CreditCard, Landmark,
  CheckCircle2, MapPin, Layers, DollarSign, Maximize2, Truck,
  Sparkles, FileText, Eye
} from 'lucide-react';
import { generateProjectBrochurePDF, type BrochureAIContent } from '@/lib/brochurePdfGenerator';
import { useBrochureGenerator } from '@/hooks/useBrochureGenerator';
import { ProjectDownloads } from '@/components/projects/ProjectDownloads';
import { parseLandingConfig } from '@/lib/landing/config';
import { toast } from 'sonner';

interface CommercialConditions {
  min_down_payment_pct?: number;
  max_term_months?: number;
  interest_rate?: number;
  payment_methods?: string[];
  includes_urbanization?: boolean;
  delivery_date?: string;
  notes?: string;
}

interface Props {
  project: Project;
  lots: PublicLot[];
}

const formatPrice = (price: number | null) => {
  if (!price) return 'Consultar';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(price);
};

const formatArea = (area: number) => new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(area);

export const ProjectBrochureTab = ({ project, lots }: Props) => {
  const conditions: CommercialConditions = (project.commercial_conditions as CommercialConditions) || {};
  const hasConditions = conditions.min_down_payment_pct || conditions.max_term_months || conditions.interest_rate;
  const { aiContent, isLoading, generateBrochureContent, clearContent } = useBrochureGenerator();
  const [showPreview, setShowPreview] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const cfg = parseLandingConfig(project.landing_config);
  const spatial = project.landing_config && typeof project.landing_config === 'object' && !Array.isArray(project.landing_config)
    ? (project.landing_config as Record<string, unknown>).spatial ?? null
    : null;

  const available = lots.filter(l => l.status === 'available');
  const prices = available.filter(l => Number.isFinite(Number(l.price)) && Number(l.price) > 0).map(l => Number(l.price));
  const areas = lots.map(l => Number(l.area)).filter(a => a > 0);
  const priceMin = prices.length > 0 ? Math.min(...prices) : null;
  const priceMax = prices.length > 0 ? Math.max(...prices) : null;
  const areaMin = areas.length > 0 ? Math.min(...areas) : null;
  const areaMax = areas.length > 0 ? Math.max(...areas) : null;

  const handleGenerateAI = async () => {
    const result = await generateBrochureContent({
      name: project.name,
      description: project.description,
      location: [project.city, project.region].filter(Boolean).join(', '),
      region: project.region || '',
      city: project.city,
      totalLots: lots.length,
      availableLots: available.length,
      priceMin: priceMin ?? undefined,
      priceMax: priceMax ?? undefined,
      areaMin: areaMin ?? undefined,
      areaMax: areaMax ?? undefined,
      conditions: hasConditions ? conditions : undefined,
    });
    if (result) setShowPreview(true);
  };

  const downloadBrochure = async (premium: boolean) => {
    if (pdfBusy) return;
    setPdfBusy(true);
    try {
      await generateProjectBrochurePDF({ project, lots, conditions, aiContent: premium ? aiContent || undefined : undefined });
    } catch {
      toast.error('No pudimos generar el PDF. Intenta nuevamente.');
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Kit de material del proyecto (mismo que ve el cliente) */}
      <ProjectDownloads
        project={{
          id: project.id,
          name: project.name,
          slug: project.slug ?? null,
          description: project.description ?? null,
          location: project.city ?? project.location ?? null,
          region: project.region ?? null,
          latitude: project.latitude ?? null,
          longitude: project.longitude ?? null,
          images: [cfg.hero.image, ...cfg.gallery, ...(Array.isArray(project.images) ? project.images : [])].filter(Boolean),
          conditions,
          highlights: cfg.highlights,
          contact: cfg.contact,
          spatial,
        }}
        lots={lots}
        requireLead={false}
        showLotSheets
        title="Material descargable"
        description="El mismo kit que se ofrece en la página pública del proyecto, listo para enviar a un cliente."
      />

      {/* Commercial Conditions */}
      {hasConditions ? (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Condiciones Comerciales
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              {conditions.min_down_payment_pct != null && (
                <div className="rounded-lg border bg-muted/30 p-4 text-center">
                  <Percent className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{conditions.min_down_payment_pct}%</p>
                  <p className="text-xs text-muted-foreground">Pie mínimo</p>
                </div>
              )}
              {conditions.max_term_months != null && (
                <div className="rounded-lg border bg-muted/30 p-4 text-center">
                  <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{conditions.max_term_months} <span className="text-sm font-normal">meses</span></p>
                  <p className="text-xs text-muted-foreground">Plazo máximo</p>
                </div>
              )}
              {conditions.interest_rate != null && (
                <div className="rounded-lg border bg-muted/30 p-4 text-center">
                  <Landmark className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{conditions.interest_rate}%</p>
                  <p className="text-xs text-muted-foreground">Tasa mensual</p>
                </div>
              )}
            </div>

            {conditions.payment_methods && conditions.payment_methods.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-muted-foreground mb-1.5">Métodos de pago:</p>
                <div className="flex flex-wrap gap-2">
                  {conditions.payment_methods.map(m => (
                    <Badge key={m} variant="secondary" className="capitalize">{m}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-sm">
              {conditions.includes_urbanization && (
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Urbanización incluida
                </span>
              )}
              {conditions.delivery_date && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Truck className="h-4 w-4" /> Entrega: {new Date(conditions.delivery_date).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                </span>
              )}
            </div>

            {conditions.notes && (
              <p className="mt-3 text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                {conditions.notes}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Las condiciones comerciales no han sido configuradas aún.</p>
          </CardContent>
        </Card>
      )}

      {/* Project Summary */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Resumen del Proyecto
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">{lots.length}</p>
                <p className="text-xs text-muted-foreground">Lotes totales ({available.length} disponibles)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">
                  {priceMin ? formatPrice(priceMin) : '—'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {priceMax && priceMin !== priceMax ? `Hasta ${formatPrice(priceMax)}` : 'Precio'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Maximize2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">
                  {areaMin ? `${formatArea(areaMin)} m²` : '—'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {areaMax && areaMin !== areaMax ? `Hasta ${formatArea(areaMax)} m²` : 'Superficie'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">{project.city || '—'}</p>
                <p className="text-xs text-muted-foreground">{project.region || 'Ubicación'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Content Preview */}
      {isLoading && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span className="text-sm font-medium">Generando contenido con IA...</span>
            </div>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-16 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {aiContent && showPreview && !isLoading && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Preview del Contenido IA
              </h3>
              <Button variant="ghost" size="sm" onClick={() => { clearContent(); setShowPreview(false); }}>
                Descartar
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Titular</p>
                <p className="text-lg font-bold text-foreground">{aiContent.headline}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Elevator Pitch</p>
                <p className="text-sm text-muted-foreground">{aiContent.elevatorPitch}</p>
              </div>

              {aiContent.pillars.map((p, i) => (
                <div key={i} className="border-l-2 border-primary/40 pl-3">
                  <p className="text-sm font-semibold">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.text}</p>
                </div>
              ))}

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Proyección de Inversión</p>
                <p className="text-sm text-muted-foreground">{aiContent.investmentProjection}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {!aiContent ? (
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={handleGenerateAI}
            disabled={isLoading}
          >
            <Sparkles className="h-5 w-5" />
            {isLoading ? 'Generando...' : 'Generar Brochure Premium con IA'}
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => void downloadBrochure(true)}
            disabled={pdfBusy}
          >
            <Download className="h-5 w-5" />
            {pdfBusy ? 'Generando PDF…' : 'Descargar Brochure Premium PDF'}
          </Button>
        )}

        <Button
          variant="outline"
          size="lg"
          className="w-full gap-2"
          onClick={() => void downloadBrochure(false)}
          disabled={pdfBusy}
        >
          <FileText className="h-5 w-5" />
          {pdfBusy ? 'Generando PDF…' : 'Descargar Brochure Básico'}
        </Button>
      </div>
    </div>
  );
};
