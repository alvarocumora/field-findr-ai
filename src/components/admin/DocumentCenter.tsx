import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { FileText, CheckCircle2, XCircle, Clock, AlertTriangle, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { DOC_TYPE_LABELS, DOC_STATUS_LABELS, type TransactionDocType, type DocStatus } from '@/hooks/useTransactionDocuments';

const DocumentCenter = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: docs, isLoading } = useQuery({
    queryKey: ['admin-document-center', statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('transaction_documents')
        .select('*, reservations(buyer_name, lot_id, lots(lot_number, project_id, projects(name)))')
        .order('deadline', { ascending: true, nullsFirst: false });

      if (statusFilter !== 'all') query = query.eq('status', statusFilter as any);
      if (typeFilter !== 'all') query = query.eq('doc_type', typeFilter as any);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('transaction_documents')
        .update({ status: status as any, reviewed_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-document-center'] });
      toast.success('Documento actualizado');
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkUpdateStatus = async (status: string) => {
    for (const id of selected) {
      await updateMutation.mutateAsync({ id, status });
    }
    setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-500',
    uploaded: 'bg-blue-500/10 text-blue-500',
    under_review: 'bg-purple-500/10 text-purple-500',
    approved: 'bg-emerald-500/10 text-emerald-500',
    rejected: 'bg-destructive/10 text-destructive',
    expired: 'bg-muted text-muted-foreground',
  };

  const stats = {
    total: docs?.length || 0,
    pending: docs?.filter(d => d.status === 'pending' || d.status === 'uploaded').length || 0,
    approved: docs?.filter(d => d.status === 'approved').length || 0,
    expiring: docs?.filter(d => d.deadline && differenceInDays(new Date(d.deadline), new Date()) <= 3 && differenceInDays(new Date(d.deadline), new Date()) >= 0).length || 0,
  };

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Centro de Documentos</h1>
        <p className="text-muted-foreground mt-1">Gestión centralizada de documentos de transacción</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/40"><CardContent className="p-4 text-center">
          <FileText className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
        <Card className="border-border/40"><CardContent className="p-4 text-center">
          <Clock className="h-5 w-5 mx-auto mb-1 text-amber-500" />
          <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
          <p className="text-xs text-muted-foreground">Pendientes</p>
        </CardContent></Card>
        <Card className="border-border/40"><CardContent className="p-4 text-center">
          <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
          <p className="text-2xl font-bold text-emerald-500">{stats.approved}</p>
          <p className="text-xs text-muted-foreground">Aprobados</p>
        </CardContent></Card>
        <Card className="border-border/40"><CardContent className="p-4 text-center">
          <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-destructive" />
          <p className="text-2xl font-bold text-destructive">{stats.expiring}</p>
          <p className="text-xs text-muted-foreground">Por Vencer</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="uploaded">Subido</SelectItem>
            <SelectItem value="under_review">En Revisión</SelectItem>
            <SelectItem value="approved">Aprobado</SelectItem>
            <SelectItem value="rejected">Rechazado</SelectItem>
            <SelectItem value="expired">Vencido</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3 flex items-center justify-between">
            <span className="text-sm font-medium">{selected.size} documentos seleccionados</span>
            <div className="flex gap-2">
              <Button size="sm" className="gap-1" onClick={() => bulkUpdateStatus('approved')}>
                <CheckCircle2 className="h-4 w-4" /> Aprobar
              </Button>
              <Button size="sm" variant="destructive" className="gap-1" onClick={() => bulkUpdateStatus('rejected')}>
                <XCircle className="h-4 w-4" /> Rechazar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox 
                        checked={selected.size > 0 && selected.size === docs?.length}
                        onCheckedChange={() => {
                          if (selected.size === docs?.length) setSelected(new Set());
                          else setSelected(new Set(docs?.map(d => d.id)));
                        }}
                      />
                    </TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead className="w-20">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs?.map((doc: any) => {
                    const daysLeft = doc.deadline ? differenceInDays(new Date(doc.deadline), new Date()) : null;
                    const isExpiring = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <Checkbox checked={selected.has(doc.id)} onCheckedChange={() => toggleSelect(doc.id)} />
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{DOC_TYPE_LABELS[doc.doc_type as TransactionDocType] || doc.doc_type}</p>
                          {doc.file_name && <p className="text-xs text-muted-foreground">{doc.file_name}</p>}
                        </TableCell>
                        <TableCell className="text-sm">{doc.reservations?.buyer_name || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{doc.reservations?.lots?.projects?.name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusColors[doc.status] || ''}>
                            {DOC_STATUS_LABELS[doc.status as DocStatus] || doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {doc.deadline ? (
                            <span className={`text-sm ${isExpiring ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                              {format(new Date(doc.deadline), 'dd/MM/yy')}
                              {isExpiring && <AlertTriangle className="h-3 w-3 inline ml-1" />}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {doc.file_url && (
                              <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Eye className="h-3.5 w-3.5" /></a>
                              </Button>
                            )}
                            {doc.status !== 'approved' && (
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-500" onClick={() => updateMutation.mutate({ id: doc.id, status: 'approved' })}>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {doc.status !== 'rejected' && (
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => updateMutation.mutate({ id: doc.id, status: 'rejected' })}>
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {docs?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-10 w-10 mb-3" />
                  <p>No hay documentos que coincidan con los filtros</p>
                </div>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentCenter;
