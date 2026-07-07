import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, Building2, MapPin, Grid3X3, Clock, ExternalLink, Layers } from 'lucide-react';
import {
  usePendingProjectApprovals,
  useReviewProjectApproval,
} from '@/hooks/useProjectApprovals';

const ProjectApprovalQueue = () => {
  const { data: approvals = [], isLoading } = usePendingProjectApprovals();
  const review = useReviewProjectApproval();
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});

  const pendingCount = approvals.length;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cola de Aprobación · Loteos</h1>
        <p className="text-sm text-muted-foreground">
          {pendingCount} loteo{pendingCount === 1 ? '' : 's'} pendiente{pendingCount === 1 ? '' : 's'} de revisión
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : approvals.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Todo al día</h3>
          <p className="text-muted-foreground">No hay loteos pendientes de aprobación</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => {
            const project = approval.project;
            if (!project) return null;
            return (
              <Card key={approval.id}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        {project.images?.[0] ? (
                          <img src={project.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Layers className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{project.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[project.city, project.region, project.location].filter(Boolean).join(' · ') || 'Sin ubicación'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                      <Clock className="h-3 w-3 mr-1" /> Pendiente
                    </Badge>
                  </div>

                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Grid3X3 className="h-3 w-3" />
                      {project.total_lots ?? 0} lotes
                    </span>
                    {project.total_area ? (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {Number(project.total_area).toLocaleString('es-CL')} m²
                      </span>
                    ) : null}
                    <Button asChild size="sm" variant="ghost" className="ml-auto h-7 gap-1">
                      <Link to={`/proyecto/${project.id}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3 w-3" /> Ver detalle
                      </Link>
                    </Button>
                  </div>

                  <Textarea
                    placeholder="Motivo de rechazo (opcional)"
                    value={rejectionReason[approval.id] || ''}
                    onChange={(e) =>
                      setRejectionReason((prev) => ({ ...prev, [approval.id]: e.target.value }))
                    }
                    rows={2}
                    className="resize-none"
                  />

                  <div className="flex gap-3">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() =>
                        review.mutate({ id: approval.id, status: 'approved' })
                      }
                      disabled={review.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Aprobar
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 gap-2"
                      onClick={() =>
                        review.mutate({
                          id: approval.id,
                          status: 'rejected',
                          rejection_reason: rejectionReason[approval.id],
                        })
                      }
                      disabled={review.isPending}
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

export default ProjectApprovalQueue;
