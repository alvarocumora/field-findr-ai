import type { LegalItem } from '@/lib/projects/legalItemTypes';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShieldCheck, FileCheck } from 'lucide-react';

interface VerificationBadgeProps {
  legalDocuments?: (LegalItem | string)[];
  permits?: (LegalItem | string)[];
  className?: string;
}

const DOC_TYPES = [
  { key: 'escritura', label: 'Escritura' },
  { key: 'permiso_municipal', label: 'Permiso Municipal' },
  { key: 'plano', label: 'Plano Aprobado' },
  { key: 'certificado_dominio', label: 'Certificado de Dominio' },
  { key: 'informe_previo', label: 'Informe Previo' },
  { key: 'rol_sii', label: 'Rol SII' },
];

export const VerificationBadge = ({ legalDocuments = [], permits = [], className }: VerificationBadgeProps) => {
  const allDocs = [...(legalDocuments || []), ...(permits || [])];
  const verifiedCount = allDocs.length;
  const totalChecks = DOC_TYPES.length;
  const percentage = Math.round((Math.min(verifiedCount, totalChecks) / totalChecks) * 100);

  if (verifiedCount === 0) return null;

  const color = percentage >= 80 ? 'text-emerald-500' : percentage >= 50 ? 'text-amber-500' : 'text-muted-foreground';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`gap-1.5 cursor-default ${className}`}>
            <ShieldCheck className={`h-3.5 w-3.5 ${color}`} />
            <span className="text-xs">{Math.min(verifiedCount, totalChecks)}/{totalChecks} verificado</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="w-56 p-3">
          <p className="font-semibold text-sm mb-2">Documentos del Proyecto</p>
          <div className="space-y-1.5">
            {DOC_TYPES.map(doc => {
              const found = allDocs.some((d) =>
                typeof d === 'string' ? d.toLowerCase().includes(doc.key) : d?.type?.toLowerCase().includes(doc.key)
              );
              return (
                <div key={doc.key} className="flex items-center gap-2 text-xs">
                  <FileCheck className={`h-3 w-3 ${found ? 'text-emerald-500' : 'text-muted-foreground/30'}`} />
                  <span className={found ? 'text-foreground' : 'text-muted-foreground'}>{doc.label}</span>
                </div>
              );
            })}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
