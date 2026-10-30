import { WorkspaceLoadError } from '@/components/dashboard/WorkspaceLoadError';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle2, XCircle, Building2, MapPin, DollarSign, Clock, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/hooks/useListings';


const PropertyApprovalQueue = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});

  const { data: approvals = [], isLoading, error, refetch } = useQuery({
    queryKey: ['property-approvals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_approvals')
        .select('*, listings(id, title, location, price, type, currency, area_m2, images, user_id)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const updateApproval = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: 'approved' | 'rejected'; reason?: string }) => {
      // El trigger sync_listing_status_from_approval se encarga de actualizar listings.status
      // y de notificar al dueño automáticamente.
      const { error } = await supabase
        .from('property_approvals')
        .update({
          status: status,
          reviewer_id: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: status === 'rejected' ? (reason ?? null) : null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['property-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast.success(vars.status === 'approved' ? 'Propiedad aprobada · dueño notificado' : 'Propiedad rechazada · dueño notificado');
    },
    onError: () => toast.error('Error al actualizar'),
  });


  if (error) return <WorkspaceLoadError title="No pudimos cargar las aprobaciones pendientes" onRetry={refetch} />;

  const pendingCount = approvals.length;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cola de Aprobación</h1>
        <p className="text-sm text-muted-foreground">{isLoading ? 'Cargando pendientes…' : `${pendingCount} propiedades pendientes de revisión`}</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      ) : approvals.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Todo al día</h3>
          <p className="text-muted-foreground">No hay propiedades pendientes de aprobación</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => {
            const listing = approval.listings;
            if (!listing) return null;

            return (
              <Card key={approval.id}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        {listing.images?.[0] ? (
                          <img src={listing.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{listing.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{listing.location}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                      <Clock className="h-3 w-3 mr-1" /> Pendiente
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatPrice(listing.price, listing.currency)}</span>
                    <span>{listing.area_m2} m²</span>
                    <span>{listing.type}</span>
                    <Button asChild size="sm" variant="ghost" className="ml-auto h-7 gap-1">
                      <Link to={`/propiedad/${listing.id}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3 w-3" /> Ver detalle
                      </Link>
                    </Button>

                  </div>

                  <Textarea
                    placeholder="Motivo de rechazo (opcional)"
                    value={rejectionReason[approval.id] || ''}
                    onChange={e => setRejectionReason(prev => ({ ...prev, [approval.id]: e.target.value }))}
                    rows={2}
                    className="resize-none"
                  />

                  <div className="flex gap-3">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => updateApproval.mutate({ id: approval.id, status: 'approved' })}
                      disabled={updateApproval.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Aprobar
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 gap-2"
                      onClick={() => updateApproval.mutate({
                        id: approval.id,
                        status: 'rejected',
                        reason: rejectionReason[approval.id],
                      })}
                      disabled={updateApproval.isPending}
                    >
                      <XCircle className="h-4 w-4" /> Rechazar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PropertyApprovalQueue;
