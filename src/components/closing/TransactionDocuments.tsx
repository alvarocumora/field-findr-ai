import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useTransactionDocuments,
  useCreateTransactionDocument,
  useUpdateTransactionDocument,
  useUploadTransactionFile,
  DOC_TYPE_LABELS,
  DOC_STATUS_LABELS,
  TransactionDocType,
  DocStatus,
} from '@/hooks/useTransactionDocuments';
import {
  FileText, Upload, CheckCircle2, Clock, AlertTriangle, XCircle,
  Eye, Plus, Loader2, Calendar, Shield,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_ICON: Record<DocStatus, typeof Clock> = {
  pending: Clock,
  uploaded: Upload,
  under_review: Eye,
  approved: CheckCircle2,
  rejected: XCircle,
  expired: AlertTriangle,
};

const STATUS_COLOR: Record<DocStatus, string> = {
  pending: 'text-muted-foreground',
  uploaded: 'text-blue-600',
  under_review: 'text-amber-600',
  approved: 'text-green-600',
  rejected: 'text-red-600',
  expired: 'text-red-500',
};

interface TransactionDocumentsProps {
  reservationId: string;
  readOnly?: boolean;
}

export const TransactionDocuments = ({ reservationId, readOnly = false }: TransactionDocumentsProps) => {
  const { data: docs = [], isLoading } = useTransactionDocuments(reservationId);
  const createDoc = useCreateTransactionDocument();
  const updateDoc = useUpdateTransactionDocument();
  const uploadFile = useUploadTransactionFile();
  const [addingType, setAddingType] = useState<TransactionDocType | ''>('');
  const [addingDeadline, setAddingDeadline] = useState('');
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleAddDoc = () => {
    if (!addingType) return;
    createDoc.mutate({
      reservation_id: reservationId,
      doc_type: addingType,
      deadline: addingDeadline || undefined,
    }, {
      onSuccess: () => { setAddingType(''); setAddingDeadline(''); },
    });
  };

  const handleFileUpload = (docId: string, file: File) => {
    uploadFile.mutate({ documentId: docId, reservationId, file });
  };

  const handleReview = (docId: string, approved: boolean) => {
    updateDoc.mutate({
      id: docId,
      status: approved ? 'approved' : 'rejected',
      reviewed_at: new Date().toISOString(),
      rejection_reason: approved ? null : 'Documento no cumple requisitos',
    } as any);
  };

  const approvedCount = docs.filter(d => d.status === 'approved').length;
  const totalCount = docs.length;
  const progress = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Carpeta Documental
          </CardTitle>
          {totalCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {approvedCount}/{totalCount} aprobados ({progress}%)
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Document list */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando documentos...
          </div>
        ) : docs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No hay documentos requeridos aún. {!readOnly && 'Agrega los documentos necesarios para esta transacción.'}
          </p>
        ) : (
          <div className="space-y-2">
            {docs.map(doc => {
              const Icon = STATUS_ICON[doc.status as DocStatus] || Clock;
              const color = STATUS_COLOR[doc.status as DocStatus] || '';
              const isOverdue = doc.deadline && new Date(doc.deadline) < new Date() && !['approved', 'rejected'].includes(doc.status);

              return (
                <div key={doc.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isOverdue ? 'border-destructive/40 bg-destructive/5' : 'border-border'}`}>
                  <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {DOC_TYPE_LABELS[doc.doc_type as TransactionDocType] || doc.doc_type}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{DOC_STATUS_LABELS[doc.status as DocStatus]}</span>
                      {doc.deadline && (
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                          <Calendar className="h-3 w-3" />
                          {isOverdue ? 'Vencido' : 'Vence'}: {format(new Date(doc.deadline), 'dd/MM/yyyy', { locale: es })}
                        </span>
                      )}
                    </div>
                    {doc.rejection_reason && (
                      <p className="text-xs text-destructive mt-1">{doc.rejection_reason}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* View file */}
                    {doc.file_url && (
                      <Button size="sm" variant="ghost" className="h-7 px-2" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}

                    {/* Upload file (for pending/rejected docs) */}
                    {!readOnly && ['pending', 'rejected'].includes(doc.status) && (
                      <>
                        <input
                          type="file"
                          className="hidden"
                          ref={el => { fileInputRefs.current[doc.id] = el; }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(doc.id, file);
                          }}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs gap-1"
                          disabled={uploadFile.isPending}
                          onClick={() => fileInputRefs.current[doc.id]?.click()}
                        >
                          {uploadFile.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                          Subir
                        </Button>
                      </>
                    )}

                    {/* Review buttons (for uploaded docs, owner only) */}
                    {!readOnly && doc.status === 'uploaded' && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-green-600" onClick={() => handleReview(doc.id, true)}>
                          <CheckCircle2 className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-red-600" onClick={() => handleReview(doc.id, false)}>
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add document form */}
        {!readOnly && (
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
            <Select value={addingType} onValueChange={(v) => setAddingType(v as TransactionDocType)}>
              <SelectTrigger className="flex-1 h-9 text-sm">
                <SelectValue placeholder="Tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="w-auto h-9 text-sm"
              value={addingDeadline}
              onChange={e => setAddingDeadline(e.target.value)}
              placeholder="Fecha límite"
            />
            <Button size="sm" className="h-9 gap-1" disabled={!addingType || createDoc.isPending} onClick={handleAddDoc}>
              {createDoc.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Agregar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
