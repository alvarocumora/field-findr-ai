import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Shield, FileText, MapPin, Droplet, TrendingDown, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const RiskAnalysis = () => {
  const [parcelId, setParcelId] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnalyze = () => {
    // Simulación de análisis de riesgos
    setAnalysis({
      overallScore: 72,
      riskLevel: "Medio",
      categories: [
        {
          name: "Riesgos Legales",
          score: 85,
          level: "Bajo",
          risks: [
            { item: "Título de propiedad", status: "ok", description: "Título saneado y al día" },
            { item: "Gravámenes", status: "ok", description: "Sin hipotecas ni gravámenes" },
            { item: "Servidumbres", status: "warning", description: "Servidumbre de paso declarada" },
            { item: "Litigios pendientes", status: "ok", description: "Sin litigios" },
          ],
        },
        {
          name: "Riesgos Ambientales",
          score: 65,
          level: "Medio",
          risks: [
            { item: "Zona de inundación", status: "warning", description: "Riesgo medio según DGA" },
            { item: "Contaminación del suelo", status: "ok", description: "Sin antecedentes de contaminación" },
            { item: "Áreas protegidas", status: "error", description: "Colinda con área de protección forestal" },
            { item: "Riesgo sísmico", status: "warning", description: "Zona sísmica moderada" },
          ],
        },
        {
          name: "Riesgos de Mercado",
          score: 70,
          level: "Medio",
          risks: [
            { item: "Sobreoferta local", status: "warning", description: "20% más oferta que hace 1 año" },
            { item: "Demanda proyectada", status: "ok", description: "Demanda estable en la zona" },
            { item: "Competencia", status: "ok", description: "3 proyectos similares en 10km" },
            { item: "Plusvalía histórica", status: "ok", description: "+15% en últimos 3 años" },
          ],
        },
        {
          name: "Riesgos de Desarrollo",
          score: 60,
          level: "Alto",
          risks: [
            { item: "Permisos de construcción", status: "warning", description: "Proceso puede tomar 6-12 meses" },
            { item: "Zonificación", status: "error", description: "Requiere cambio de uso de suelo" },
            { item: "Servicios básicos", status: "warning", description: "Agua y luz a 2km de distancia" },
            { item: "Accesibilidad", status: "ok", description: "Camino de grava en buenas condiciones" },
          ],
        },
      ],
      recommendations: [
        {
          priority: "alta",
          title: "Gestionar cambio de uso de suelo",
          description: "Iniciar trámites ante la DOM para cambio de zonificación de agrícola a residencial",
          estimatedCost: "$2.500.000",
          estimatedTime: "8-12 meses",
        },
        {
          priority: "alta",
          title: "Estudio de impacto ambiental",
          description: "Realizar EIA detallado por colindancia con área protegida",
          estimatedCost: "$5.000.000",
          estimatedTime: "3-4 meses",
        },
        {
          priority: "media",
          title: "Regularizar servidumbre de paso",
          description: "Registrar formalmente la servidumbre en el Conservador de Bienes Raíces",
          estimatedCost: "$800.000",
          estimatedTime: "1-2 meses",
        },
        {
          priority: "media",
          title: "Estudio de factibilidad de servicios",
          description: "Solicitar factibilidad de agua potable y electricidad",
          estimatedCost: "$1.200.000",
          estimatedTime: "2-3 meses",
        },
      ],
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Bajo":
        return "text-green-600";
      case "Medio":
        return "text-orange-600";
      case "Alto":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "alta":
        return <Badge variant="destructive">Alta Prioridad</Badge>;
      case "media":
        return <Badge variant="secondary">Media Prioridad</Badge>;
      case "baja":
        return <Badge variant="outline">Baja Prioridad</Badge>;
      default:
        return <Badge>Prioridad</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Análisis de Riesgo</h1>
          <p className="text-muted-foreground">Evaluación integral de riesgos de inversión en terrenos</p>
        </div>
        <Badge variant="secondary" className="text-lg">
          <Shield className="mr-2 h-4 w-4" />
          IA Analítica
        </Badge>
      </div>

      {/* Formulario de Búsqueda */}
      <Card className="p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="parcelId">ID de Parcela o ROL SII</Label>
            <Input
              id="parcelId"
              placeholder="Ej: P-2024-001 o 1234-5678"
              value={parcelId}
              onChange={(e) => setParcelId(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAnalyze} size="lg">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Analizar Riesgos
            </Button>
          </div>
        </div>
      </Card>

      {analysis ? (
        <>
          {/* Score General */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">Score de Riesgo Global</h2>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary">{analysis.overallScore}/100</div>
                <div className={`text-lg font-semibold ${getRiskColor(analysis.riskLevel)}`}>
                  Riesgo {analysis.riskLevel}
                </div>
              </div>
            </div>
            <Progress value={analysis.overallScore} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              Puntuación basada en análisis de {analysis.categories.length} categorías de riesgo
            </p>
          </Card>

          {/* Categorías de Riesgo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analysis.categories.map((category: any, index: number) => (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">{category.name}</h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{category.score}/100</div>
                    <div className={`text-sm font-semibold ${getRiskColor(category.level)}`}>
                      {category.level}
                    </div>
                  </div>
                </div>
                <Progress value={category.score} className="h-2 mb-4" />
                <div className="space-y-3">
                  {category.risks.map((risk: any, riskIndex: number) => (
                    <div key={riskIndex} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      {getStatusIcon(risk.status)}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{risk.item}</p>
                        <p className="text-xs text-muted-foreground">{risk.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Recomendaciones */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Plan de Mitigación de Riesgos</h2>
            <p className="text-muted-foreground mb-6">
              Acciones recomendadas para reducir los riesgos identificados, ordenadas por prioridad
            </p>
            <div className="space-y-4">
              {analysis.recommendations.map((rec: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getPriorityBadge(rec.priority)}
                        <h3 className="font-semibold text-foreground">{rec.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Costo estimado:</span>
                      <span className="font-semibold">{rec.estimatedCost}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Tiempo:</span>
                      <span className="font-semibold">{rec.estimatedTime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Comparación con Otras Propiedades */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Comparación de Riesgo</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Esta propiedad</span>
                <div className="flex items-center gap-2">
                  <Progress value={analysis.overallScore} className="w-32 h-2" />
                  <span className="font-semibold w-12 text-right">{analysis.overallScore}</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm text-muted-foreground">Promedio del mercado</span>
                <div className="flex items-center gap-2">
                  <Progress value={68} className="w-32 h-2" />
                  <span className="font-semibold w-12 text-right text-muted-foreground">68</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm text-muted-foreground">Propiedades similares</span>
                <div className="flex items-center gap-2">
                  <Progress value={75} className="w-32 h-2" />
                  <span className="font-semibold w-12 text-right text-muted-foreground">75</span>
                </div>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Shield className="h-20 w-20 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">Ingrese el ID de la parcela para comenzar</h3>
            <p className="text-muted-foreground max-w-md">
              Nuestro sistema analizará múltiples factores de riesgo y generará un informe detallado con recomendaciones
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RiskAnalysis;
