import type { LegalItem } from '@/lib/projects/legalItemTypes';
import { parseLegalItems } from '@/lib/projects/legalOverrides';
import { hasRecordedLegalReview, uniqueLegalTypes } from '@/lib/projects/legalReview';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShieldCheck, FileCheck } from 'lucide-react';

interface VerificationBadgeProps {
  legalDocuments?: (LegalItem | string)[];
  permits?: (LegalItem | string)[];
  className?: string;
}

export const VerificationBadge = ({ legalDocuments = [], permits = [], className }: VerificationBadgeProps) => {
  const documents = uniqueLegalTypes(parseLegalItems([...legalDocuments, ...permits]));
  if (!documents.length) return null;
  const reviewed = documents.filter(hasRecordedLegalReview).length;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`gap-1.5 cursor-default ${className || ''}`}>
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs">{reviewed}/{documents.length} con revisión registrada</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="w-64 p-3">
          <p className="font-semibold text-sm mb-2">Documentación del proyecto</p>
          <p className="text-xs mb-2">Revisión con fecha y documento adjunto; no constituye garantía legal.</p>
          {documents.map(doc => (
            <div key={doc.type} className="flex items-center gap-2 text-xs">
              <FileCheck className={`h-3 w-3 ${hasRecordedLegalReview(doc) ? 'text-primary' : 'text-muted-foreground'}`} />
              <span>{doc.name || doc.type}: {hasRecordedLegalReview(doc) ? 'revisión registrada' : 'sin revisión registrada'}</span>
            </div>
          ))}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
