import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  X,
  MapPin,
  Building2,
  Droplets,
  Leaf,
  Mountain,
  AlertTriangle,
  Zap,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Download,
  Share2,
  Sparkles,
  Lock,
} from 'lucide-react';
import { 
  LandDataReport, 
  generateDemoLandData 
} from '@/services/landDataService';
import { cn } from '@/lib/utils';

interface LandDataPanelProps {
  lat: number;
  lng: number;
  onClose: () => void;
  isOpen: boolean;
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'none':
    case 'low':
      return 'text-green-500 bg-green-500/10';
    case 'medium':
      return 'text-yellow-500 bg-yellow-500/10';
    case 'high':
    case 'critical':
      return 'text-red-500 bg-red-500/10';
    default:
      return 'text-muted-foreground bg-muted';
  }
};

const getRiskLabel = (risk: string) => {
  const labels: Record<string, string> = {
    none: 'Sin riesgo',
    low: 'Bajo',
    medium: 'Medio',
    high: 'Alto',
    critical: 'Crítico',
  };
  return labels[risk] || risk;
};

const StatusIcon = ({ status }: { status: boolean | 'unknown' }) => {
  if (status === true) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === false) return <XCircle className="h-4 w-4 text-red-500" />;
  return <AlertCircle className="h-4 w-4 text-yellow-500" />;
};

const LandDataPanel = ({ lat, lng, onClose, isOpen }: LandDataPanelProps) => {
  const [data, setData] = useState<LandDataReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && lat && lng) {
      setIsLoading(true);
      // Simulate API call with demo data
      setTimeout(() => {
        const demoData = generateDemoLandData(lat, lng);
        setData(demoData);
        setIsLoading(false);
      }, 1200);
    }
  }, [lat, lng, isOpen]);

  if (!isOpen) return null;

  const calculateOverallScore = () => {
    if (!data) return 0;
    let score = 100;
    
    // Risk deductions
    const riskPenalties: Record<string, number> = {
      none: 0, low: 5, medium: 15, high: 30, critical: 50
    };
    score -= riskPenalties[data.riskAssessment?.overallRisk || 'low'] || 0;
    
    // Environmental restrictions
    if (data.environmentalRestrictions?.protectedArea) score -= 30;
    if (data.environmentalRestrictions?.wetland) score -= 20;
    
    // Mining overlap
    if (data.miningConcessions?.overlapsProperty) score -= 25;
    
    // Infrastructure bonuses
    if (data.infrastructure?.electricity) score += 5;
    if (data.infrastructure?.water) score += 5;
    if (data.infrastructure?.pavedRoad) score += 5;
    
    // Water rights bonus
    if (data.waterRights?.hasWaterRights) score += 10;
    
    return Math.max(0, Math.min(100, score));
  };

  const score = calculateOverallScore();

  return (
    <Card className="fixed right-4 top-20 bottom-4 w-96 z-50 shadow-2xl bg-background/95 backdrop-blur-xl border-white/10 flex flex-col animate-in slide-in-from-right-10 duration-300">
      <CardHeader className="border-b border-white/10 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Análisis del Terreno</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lat.toFixed(6)}, {lng.toFixed(6)}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1">
        <CardContent className="p-4 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : data ? (
            <>
              {/* LandScore Overview */}
              <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="font-semibold">LandScore™</span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-lg font-bold px-3",
                      score >= 70 ? "border-green-500 text-green-500" :
                      score >= 50 ? "border-yellow-500 text-yellow-500" :
                      "border-red-500 text-red-500"
                    )}
                  >
                    {score}/100
                  </Badge>
                </div>
                <Progress value={score} className="h-2 mb-3" />
                <p className="text-xs text-muted-foreground">
                  Evaluación integral basada en viabilidad legal, técnica, ambiental y comercial.
                </p>
              </div>

              {/* Tabs Navigation */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 h-auto">
                  <TabsTrigger value="overview" className="text-xs py-2">
                    General
                  </TabsTrigger>
                  <TabsTrigger value="legal" className="text-xs py-2">
                    Legal
                  </TabsTrigger>
                  <TabsTrigger value="environment" className="text-xs py-2">
                    Ambiente
                  </TabsTrigger>
                  <TabsTrigger value="risk" className="text-xs py-2">
                    Riesgos
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 mt-4">
                  {/* Zoning */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Building2 className="h-4 w-4 text-primary" />
                      Zonificación
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Zona:</span>
                        <Badge variant="secondary">{data.zoning?.zone}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Altura máx:</span>
                        <span>{data.zoning?.maxHeight}m</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Coef. edificación:</span>
                        <span>{data.zoning?.buildingCoefficient}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground">Usos permitidos:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {data.zoning?.allowedUses.map((use, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {use}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Water Rights */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Droplets className="h-4 w-4 text-cyan-500" />
                      Derechos de Agua
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tiene derechos:</span>
                        <StatusIcon status={data.waterRights?.hasWaterRights || false} />
                      </div>
                      {data.waterRights?.hasWaterRights && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tipo:</span>
                            <span className="capitalize">{data.waterRights.type}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Caudal:</span>
                            <span>{data.waterRights.volume} L/s</span>
                          </div>
                        </>
                      )}
                      {data.waterRights?.scarcityZone && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Zona de escasez hídrica
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Infrastructure */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      Infraestructura
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <StatusIcon status={data.infrastructure?.electricity || false} />
                        <span className="text-muted-foreground">Electricidad</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <StatusIcon status={data.infrastructure?.water || false} />
                        <span className="text-muted-foreground">Agua potable</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <StatusIcon status={data.infrastructure?.sewage || false} />
                        <span className="text-muted-foreground">Alcantarillado</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <StatusIcon status={data.infrastructure?.pavedRoad || false} />
                        <span className="text-muted-foreground">Camino pavimentado</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <StatusIcon status={data.infrastructure?.internet || false} />
                        <span className="text-muted-foreground">Internet</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <StatusIcon status={data.infrastructure?.naturalGas || false} />
                        <span className="text-muted-foreground">Gas natural</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Legal Tab */}
                <TabsContent value="legal" className="space-y-4 mt-4">
                  {/* Cadastral Data */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-pink-500" />
                      Datos Catastrales
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">ROL:</span>
                        <span className="font-mono">{data.cadastral?.rol}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Comuna:</span>
                        <span>{data.cadastral?.comuna}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Superficie inscrita:</span>
                        <span>{data.cadastral?.surfaceRegistered?.toLocaleString()} m²</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avalúo fiscal:</span>
                        <span className="font-medium">
                          ${data.cadastral?.fiscalAppraisal?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Estado dominio:</span>
                        <Badge 
                          variant={data.cadastral?.ownershipStatus === 'clear' ? 'secondary' : 'destructive'}
                        >
                          {data.cadastral?.ownershipStatus === 'clear' ? 'Limpio' : 'Con gravámenes'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Mining Concessions */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Mountain className="h-4 w-4 text-purple-500" />
                      Concesiones Mineras
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Superpone propiedad:</span>
                        <StatusIcon status={!data.miningConcessions?.overlapsProperty} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Concesiones cercanas:</span>
                        <span>{data.miningConcessions?.activeConcessions}</span>
                      </div>
                      {data.miningConcessions?.nearestConcessionDistance && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Distancia mínima:</span>
                          <span>{(data.miningConcessions.nearestConcessionDistance / 1000).toFixed(1)} km</span>
                        </div>
                      )}
                      {data.miningConcessions?.environmentalLiabilities > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {data.miningConcessions.environmentalLiabilities} pasivos ambientales
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Premium Feature Teaser */}
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Informe Completo</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Accede a estudio de títulos, historial de transacciones y certificados oficiales.
                    </p>
                    <Button size="sm" className="w-full">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Desbloquear con Premium
                    </Button>
                  </div>
                </TabsContent>

                {/* Environment Tab */}
                <TabsContent value="environment" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Leaf className="h-4 w-4 text-green-500" />
                      Restricciones Ambientales
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Área protegida:</span>
                        <StatusIcon status={!data.environmentalRestrictions?.protectedArea} />
                      </div>
                      {data.environmentalRestrictions?.protectedAreaName && (
                        <Badge variant="destructive" className="text-xs">
                          {data.environmentalRestrictions.protectedAreaName}
                        </Badge>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Humedal:</span>
                        <StatusIcon status={!data.environmentalRestrictions?.wetland} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Sitio prioritario:</span>
                        <StatusIcon status={!data.environmentalRestrictions?.prioritySite} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Bosque nativo:</span>
                        <StatusIcon status={!data.environmentalRestrictions?.nativeForest} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Valor biodiversidad:</span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            data.environmentalRestrictions?.biodiversityValue === 'high' && 'border-red-500 text-red-500',
                            data.environmentalRestrictions?.biodiversityValue === 'medium' && 'border-yellow-500 text-yellow-500',
                            data.environmentalRestrictions?.biodiversityValue === 'low' && 'border-green-500 text-green-500',
                          )}
                        >
                          {data.environmentalRestrictions?.biodiversityValue === 'high' ? 'Alto' :
                           data.environmentalRestrictions?.biodiversityValue === 'medium' ? 'Medio' : 'Bajo'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {data.environmentalRestrictions?.requiredPermits && data.environmentalRestrictions.requiredPermits.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-yellow-500" />
                        Permisos Requeridos
                      </div>
                      <div className="bg-yellow-500/10 rounded-lg p-3">
                        <ul className="space-y-1">
                          {data.environmentalRestrictions.requiredPermits.map((permit, i) => (
                            <li key={i} className="text-sm flex items-center gap-2">
                              <ChevronRight className="h-3 w-3 text-yellow-500" />
                              {permit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Risk Tab */}
                <TabsContent value="risk" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Evaluación de Riesgos
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: 'Inundación', value: data.riskAssessment?.floodRisk },
                        { label: 'Deslizamiento', value: data.riskAssessment?.landslideRisk },
                        { label: 'Sísmico', value: data.riskAssessment?.seismicRisk },
                        { label: 'Volcánico', value: data.riskAssessment?.volcanicRisk },
                        { label: 'Incendio', value: data.riskAssessment?.fireRisk },
                      ].map((risk) => (
                        <div 
                          key={risk.label} 
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                        >
                          <span className="text-sm">{risk.label}</span>
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", getRiskColor(risk.value || 'none'))}
                          >
                            {getRiskLabel(risk.value || 'none')}
                          </Badge>
                        </div>
                      ))}
                      
                      {data.riskAssessment?.tsunamiRisk && (
                        <div className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                          <span className="text-sm">Tsunami</span>
                          <Badge variant="destructive" className="text-xs">
                            Zona de riesgo
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Riesgo General</span>
                      <Badge 
                        variant="outline" 
                        className={cn("font-bold", getRiskColor(data.riskAssessment?.overallRisk || 'low'))}
                      >
                        {getRiskLabel(data.riskAssessment?.overallRisk || 'low').toUpperCase()}
                      </Badge>
                    </div>
                    <Progress 
                      value={
                        data.riskAssessment?.overallRisk === 'low' ? 25 :
                        data.riskAssessment?.overallRisk === 'medium' ? 50 :
                        data.riskAssessment?.overallRisk === 'high' ? 75 : 90
                      } 
                      className="h-2"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No se pudieron cargar los datos
            </div>
          )}
        </CardContent>
      </ScrollArea>

      {/* Footer Actions */}
      {data && !isLoading && (
        <div className="border-t border-white/10 p-4 flex gap-2">
          <Button variant="outline" className="flex-1" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" className="flex-1" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Compartir
          </Button>
        </div>
      )}
    </Card>
  );
};

export default LandDataPanel;
