import { toast } from 'sonner';
import { ArrowLeft, BadgeCheck, Boxes, Code2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import PublicLayout from '@/components/layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VisualScenarioViewer } from '@/components/visual-scenarios';
import { MOCK_PROPERTY_ID, getMockVisualScenariosByPropertyId } from '@/data/mockVisualScenarios';
import type { VisualScenario } from '@/types/visualScenario';

const VisualScenariosDemo = () => {
  const scenarios = getMockVisualScenariosByPropertyId(MOCK_PROPERTY_ID);

  const handleAnalyze = (scenario: VisualScenario) => {
    toast.info('Análisis IA pendiente de integración', {
      description: `Escenario seleccionado: ${scenario.title}`,
    });
  };

  const handleExportPdf = (scenario: VisualScenario) => {
    toast.info('PDF pendiente de integración', {
      description: `Ficha solicitada: ${scenario.title}`,
    });
  };

  return (
    <PublicLayout showFooter={false}>
      <div className="container px-4 py-8 lg:py-12">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Button variant="ghost" asChild className="mb-4 w-fit px-0 text-muted-foreground hover:text-foreground">
              <Link to="/tools">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a herramientas
              </Link>
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                Demo interna
              </Badge>
              <Badge variant="secondary">Sprint 3.1</Badge>
            </div>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Visual Scenario Viewer
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Previsualización controlada del viewer de escenarios visuales usando mock data. Esta ruta permite validar diseño, estados, métricas y disclaimers antes de integrar la ficha real de propiedad.
            </p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-border/70 bg-card/80">
            <CardContent className="flex items-start gap-3 p-5">
              <Boxes className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Escenarios mock</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Carga datos controlados sin tocar Supabase ni producción.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="flex items-start gap-3 p-5">
              <BadgeCheck className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Estados seguros</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Diferencia borrador, conceptual, revisión, aprobado y archivado.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="flex items-start gap-3 p-5">
              <Code2 className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Sin integración crítica</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Aún no conecta ficha real, PDF, IA productiva ni render GLB.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <VisualScenarioViewer
          scenarios={scenarios}
          title="Demo de escenarios sobre terreno"
          onAnalyze={handleAnalyze}
          onExportPdf={handleExportPdf}
        />

        <Card className="mt-8 border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-foreground">Próxima integración</p>
              <p className="mt-1 text-sm text-muted-foreground">
                El siguiente paso es integrar este viewer en `PropertyDetail` solo cuando una propiedad tenga escenarios disponibles.
              </p>
            </div>
            <Button variant="outline" disabled>
              <Sparkles className="mr-2 h-4 w-4" />
              IA real pendiente
            </Button>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default VisualScenariosDemo;
