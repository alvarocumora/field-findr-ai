import { toast } from 'sonner';
import { ExternalLink, Mail, Phone, RefreshCw, UsersRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAdminCommercialPlanLeads,
  useUpdateCommercialPlanLeadStatus,
  type CommercialPlanLead,
  type CommercialPlanLeadStatus,
} from '@/hooks/useCommercialPlanLead';

const statusLabels: Record<CommercialPlanLeadStatus, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Calificado',
  closed: 'Cerrado',
  lost: 'Perdido',
};

const planLabels: Record<string, string> = {
  'starter-loteo': 'Starter Loteo',
  'growth-inmobiliaria': 'Growth Inmobiliaria',
  'enterprise-loteos': 'Enterprise Loteos',
};

const formatDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const getStatusVariant = (status: CommercialPlanLeadStatus) => {
  if (status === 'new') return 'default';
  if (status === 'lost') return 'destructive';
  return 'outline';
};

const LeadCard = ({
  lead,
  onStatusChange,
  isUpdating,
}: {
  lead: CommercialPlanLead;
  onStatusChange: (lead: CommercialPlanLead, status: CommercialPlanLeadStatus) => void;
  isUpdating: boolean;
}) => {
  const planLabel = planLabels[lead.plan_slug] ?? lead.plan_slug;
  const emailHref = `mailto:${lead.email}?subject=Demo%20OfertaTerrenos%20-%20${encodeURIComponent(planLabel)}`;
  const phoneHref = lead.phone ? `tel:${lead.phone}` : undefined;

  return (
    <div className="rounded-xl border border-border/70 bg-background/70 p-4 transition-colors hover:bg-muted/40">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{planLabel}</Badge>
            <Badge variant={getStatusVariant(lead.status)}>{statusLabels[lead.status] ?? lead.status}</Badge>
            {lead.source && <Badge variant="outline">{lead.source}</Badge>}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {lead.company_name || 'Empresa sin nombre'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {lead.contact_name || 'Contacto sin nombre'} · {formatDate(lead.created_at)}
            </p>
          </div>
          {lead.message && (
            <p className="line-clamp-3 max-w-3xl text-sm text-muted-foreground">{lead.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 lg:items-end">
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button variant="outline" size="sm" asChild>
              <a href={emailHref}>
                <Mail className="mr-2 h-3.5 w-3.5" />
                Email
              </a>
            </Button>
            {phoneHref && (
              <Button variant="outline" size="sm" asChild>
                <a href={phoneHref}>
                  <Phone className="mr-2 h-3.5 w-3.5" />
                  Llamar
                </a>
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            {(['contacted', 'qualified', 'closed', 'lost'] as CommercialPlanLeadStatus[]).map((status) => (
              <Button
                key={status}
                variant={lead.status === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => onStatusChange(lead, status)}
                disabled={isUpdating || lead.status === status}
              >
                {statusLabels[status]}
              </Button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">{lead.email}</p>
        </div>
      </div>
    </div>
  );
};

const CommercialLeadsAdmin = () => {
  const { data: leads = [], isLoading, isError, refetch, isFetching } = useAdminCommercialPlanLeads();
  const updateStatus = useUpdateCommercialPlanLeadStatus();

  const newLeads = leads.filter((lead) => lead.status === 'new').length;
  const contactedLeads = leads.filter((lead) => lead.status === 'contacted').length;
  const qualifiedLeads = leads.filter((lead) => lead.status === 'qualified').length;

  const handleStatusChange = async (lead: CommercialPlanLead, status: CommercialPlanLeadStatus) => {
    try {
      await updateStatus.mutateAsync({ id: lead.id, status });
      toast.success('Lead actualizado');
    } catch (error) {
      console.error('Commercial lead status update error:', error);
      toast.error('No se pudo actualizar el lead');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-primary">Ventas</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Leads comerciales</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Revisa solicitudes comerciales capturadas desde planes de loteos y actualiza su estado de seguimiento.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <UsersRound className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{leads.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Nuevos</p>
            <p className="text-2xl font-bold">{newLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Contactados</p>
            <p className="text-2xl font-bold">{contactedLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Calificados</p>
            <p className="text-2xl font-bold">{qualifiedLeads}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Solicitudes recibidas</CardTitle>
          <Badge variant="outline">Admin</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              No se pudieron cargar los leads. Revisa que la migración esté aplicada y que el usuario tenga permisos admin.
            </div>
          ) : leads.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="font-semibold text-foreground">Aún no hay leads comerciales</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Comparte la página de planes o prueba el formulario público para validar la captura.
              </p>
              <Button className="mt-4" variant="outline" asChild>
                <a href="/planes-loteos" target="_blank" rel="noreferrer">
                  Ver planes
                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onStatusChange={handleStatusChange}
                  isUpdating={updateStatus.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommercialLeadsAdmin;
