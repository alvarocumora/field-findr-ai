import { hasRecordedLegalReview } from '@/lib/projects/legalReview';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Shield,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileCheck,
  Building2,
  Droplets,
  Zap,
  TreePine,
  Scale,
  ExternalLink,
  Download
} from 'lucide-react';
import type { LegalItem } from '@/lib/projects/legalItemTypes';
import { cn } from '@/lib/utils';

type LegalDocument = LegalItem & { verified_at?: string; notes?: string };

type Permit = LegalItem & { number?: string; issued_date?: string; expiry_date?: string };

interface LegalTabProps {
  legalDocuments: LegalDocument[];
  legalStatus: string;
  rolNumber?: string;
  permits: Permit[];
  isOwner?: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'verified':
    case 'approved':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'rejected':
    case 'expired':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'not_required':
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'verified':
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Verificado</Badge>;
    case 'approved':
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Aprobado</Badge>;
    case 'pending':
      return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pendiente</Badge>;
    case 'rejected':
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Rechazado</Badge>;
    case 'expired':
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Expirado</Badge>;
    case 'not_required':
      return <Badge variant="secondary">No requerido</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getDocumentIcon = (type: string) => {
  switch (type) {
    case 'titulo_dominio':
      return <FileCheck className="h-5 w-5" />;
    case 'planos_aprobados':
      return <Building2 className="h-5 w-5" />;
    case 'factibilidad_agua':
      return <Droplets className="h-5 w-5" />;
    case 'factibilidad_electricidad':
      return <Zap className="h-5 w-5" />;
    case 'impacto_ambiental':
      return <TreePine className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
};

// Default documents structure
const DEFAULT_DOCUMENTS: LegalDocument[] = [
  { type: 'titulo_dominio', name: 'Título de Dominio', status: 'pending' },
  { type: 'planos_aprobados', name: 'Planos Aprobados', status: 'pending' },
  { type: 'certificado_subdivision', name: 'Certificado de Subdivisión', status: 'pending' },
  { type: 'permisos_municipales', name: 'Permisos Municipales', status: 'pending' },
  { type: 'recepcion_final', name: 'Recepción Final', status: 'not_required' },
  { type: 'factibilidad_agua', name: 'Factibilidad de Agua', status: 'pending' },
  { type: 'factibilidad_electricidad', name: 'Factibilidad Eléctrica', status: 'pending' },
];

const DEFAULT_PERMITS: Permit[] = [
  { type: 'permiso_loteo', name: 'Permiso de Loteo', status: 'pending' },
  { type: 'resolucion_sanitaria', name: 'Resolución Sanitaria', status: 'pending' },
  { type: 'impacto_ambiental', name: 'Informe de Impacto Ambiental', status: 'pending' },
  { type: 'certificado_urbanizacion', name: 'Certificado de Urbanización', status: 'pending' },
];

export const LegalTab = ({ 
  legalDocuments = [], 
  legalStatus = 'pending',
  rolNumber,
  permits = [],
  isOwner = false
}: LegalTabProps) => {
  // Merge defaults with provided data
  const documents = DEFAULT_DOCUMENTS.map(defaultDoc => {
    const found = legalDocuments.find(d => d.type === defaultDoc.type);
    return found || defaultDoc;
  });

  const projectPermits = DEFAULT_PERMITS.map(defaultPermit => {
    const found = permits.find(p => p.type === defaultPermit.type);
    return found || defaultPermit;
  });

  // Calculate verification progress
  const verifiedCount = documents.filter(hasRecordedLegalReview).length;
  const totalDocuments = documents.length;
  const verificationProgress = Math.round((verifiedCount / totalDocuments) * 100);

  const approvedPermits = projectPermits.filter(hasRecordedLegalReview).length;
  const totalPermits = projectPermits.length;
  const permitsProgress = Math.round((approvedPermits / totalPermits) * 100);

  const getOverallStatusColor = () => {
    if (legalStatus === 'verified') return 'text-muted-foreground';
    if (legalStatus === 'issues') return 'text-destructive';
    return 'text-amber-500';
  };

  const getOverallStatusLabel = () => {
    if (legalStatus === 'verified') return 'Estado declarado: verificado';
    if (legalStatus === 'issues') return 'Con observaciones';
    return 'En revisión';
  };

  return (
    <div className="space-y-6">
      {/* Overall Status Card */}
      <Card className="glass-strong border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-full",
                legalStatus === 'verified' ? 'bg-emerald-500/10' : 
                legalStatus === 'issues' ? 'bg-destructive/10' : 'bg-amber-500/10'
              )}>
                <Shield className={cn("h-8 w-8", getOverallStatusColor())} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Estado Legal del Proyecto</h2>
                <p className={cn("text-lg font-medium", getOverallStatusColor())}>
                  {getOverallStatusLabel()}
                </p>
              </div>
            </div>
            
            {rolNumber && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">ROL Catastral</p>
                <p className="text-lg font-mono font-semibold">{rolNumber}</p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Documentos con revisión registrada</span>
                <span className="font-medium">{verifiedCount}/{totalDocuments}</span>
              </div>
              <Progress value={verificationProgress} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Permisos con revisión registrada</span>
                <span className="font-medium">{approvedPermits}/{totalPermits}</span>
              </div>
              <Progress value={permitsProgress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Documents Section */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Documentos del Proyecto
            </CardTitle>
            <CardDescription>
              Documentación legal y técnica del loteo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {documents.map((doc, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">
                    {getDocumentIcon(doc.type)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    {doc.verified_at && (
                      <p className="text-xs text-muted-foreground">
                        Verificado: {new Date(doc.verified_at).toLocaleDateString('es-CL')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.file_url && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {getStatusIcon(doc.status)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Permits Section */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Permisos y Aprobaciones
            </CardTitle>
            <CardDescription>
              Autorizaciones requeridas para el proyecto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {projectPermits.map((permit, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{permit.name}</p>
                  {permit.number && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {permit.number}
                    </p>
                  )}
                  {permit.expiry_date && (
                    <p className="text-xs text-muted-foreground">
                      Vigente hasta: {new Date(permit.expiry_date).toLocaleDateString('es-CL')}
                    </p>
                  )}
                </div>
                {permit.status === 'approved' && !hasRecordedLegalReview(permit) ? <Badge variant="outline">Sin revisión registrada</Badge> : getStatusBadge(permit.status)}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Legal Notice */}
      <Card className="glass border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Aviso Legal</p>
              <p>
                La información legal mostrada es de carácter informativo. Se recomienda verificar 
                la documentación directamente con el Conservador de Bienes Raíces y las entidades 
                correspondientes antes de tomar decisiones de inversión.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
