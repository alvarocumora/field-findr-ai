import { useState } from 'react';
import { Users, UserPlus, Building2, Crown, ShieldCheck, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useTeamMembers, useTeamAction, type TeamMember } from '@/hooks/useTeam';
import {
  ORGANIZATION_ROLE_OPTIONS,
  organizationRoleLabel,
  type OrganizationRole,
} from '@/lib/access/organizationPermissions';
import { useCreateOrganization } from '@/hooks/useEnterprise';
import { useCurrentPlan } from '@/hooks/useSubscription';
import { seatsSummary } from '@/lib/team/seats';
import { slugifyAgency } from '@/lib/agency/slug';
import { useQueryClient } from '@tanstack/react-query';

type AssignableRole = Exclude<OrganizationRole, 'owner' | 'admin' | 'member'>;

const roleMeta = (role: OrganizationRole) => ({
  label: organizationRoleLabel(role),
  icon: role === 'owner' ? Crown : role === 'admin' || role === 'org_admin' ? ShieldCheck : Users,
  className:
    role === 'owner'
      ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
      : role === 'admin' || role === 'org_admin'
        ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
});

const normalizeLegacyOrgRole = (role: string | null | undefined) =>
  role === 'admin' ? 'org_admin' : role === 'member' || !role ? 'sales_agent' : role;

const TeamManagement = () => {
  const { data: members = [], isLoading, organization } = useTeamMembers();
  const { plan } = useCurrentPlan();
  const teamAction = useTeamAction();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null);

  const seats = seatsSummary(plan, members.length);

  if (isLoading) {
    return (
      <div className="container py-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!organization) return <CreateOrganizationCard />;

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mi Equipo</h1>
          <p className="text-muted-foreground mt-1">
            {organization.name} · administra los miembros y sus permisos
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} disabled={!seats.canInvite}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invitar miembro
        </Button>
      </div>

      {/* Asientos */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Asientos del plan</span>
            <span className="font-medium">
              {seats.limit === null ? `${seats.used} (ilimitado)` : `${seats.used} de ${seats.limit}`}
            </span>
          </div>
          {seats.limit !== null && (
            <Progress value={Math.min((seats.used / seats.limit) * 100, 100)} className="h-2" />
          )}
          {!seats.canInvite && (
            <p className="text-xs text-amber-500 mt-2">
              Alcanzaste el límite de tu plan. Mejora tu plan para sumar más miembros.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Miembros */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Miembros ({members.length})</CardTitle>
          <CardDescription>Dueño, administradores internos y agentes de tu organización</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border/40">
            {members.map((m) => {
              const meta = roleMeta(m.org_role);
              const Icon = meta.icon;
              return (
                <li key={m.user_id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar className="h-10 w-10">
                    {m.avatar_url && <AvatarImage src={m.avatar_url} />}
                    <AvatarFallback className="bg-muted">
                      {(m.name[0] ?? '?').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email ?? '—'}</p>
                  </div>
                  <Badge variant="outline" className={`gap-1 ${meta.className}`}>
                    <Icon className="h-3 w-3" />
                    {meta.label}
                  </Badge>
                  {!m.is_owner && (
                    <div className="flex items-center gap-1">
                      <Select
                        value={normalizeLegacyOrgRole(m.org_role)}
                        onValueChange={(role) =>
                          teamAction.mutate(
                            { action: 'set_role', member_user_id: m.user_id, org_role: role as AssignableRole },
                            {
                              onSuccess: () => toast({ title: 'Rol actualizado' }),
                              onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
                            },
                          )
                        }
                      >
                        <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ORGANIZATION_ROLE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmRemove(m)}
                        aria-label={`Remover a ${m.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Invitar */}
      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        pending={teamAction.isPending}
        onSubmit={(payload) =>
          teamAction.mutate(
            { action: 'invite', ...payload },
            {
              onSuccess: () => {
                toast({ title: 'Invitación enviada', description: `A ${payload.email}` });
                setInviteOpen(false);
              },
              onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
            },
          )
        }
      />

      {/* Confirmar remoción */}
      <AlertDialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover del equipo</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRemove?.name} perderá el acceso al equipo de {organization.name}. Su cuenta y sus
              datos personales no se eliminan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (!confirmRemove) return;
                teamAction.mutate(
                  { action: 'remove', member_user_id: confirmRemove.user_id },
                  {
                    onSuccess: () => {
                      toast({ title: 'Miembro removido' });
                      setConfirmRemove(null);
                    },
                    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
                  },
                );
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/** Sin organización: crearla aquí mismo (reutiliza useCreateOrganization). */
const CreateOrganizationCard = () => {
  const createOrg = useCreateOrganization();
  const qc = useQueryClient();
  const [name, setName] = useState('');

  return (
    <div className="container py-8">
      <Card className="max-w-lg mx-auto border-border/60 text-center">
        <CardContent className="p-10 space-y-4">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold">Crea tu organización</h2>
          <p className="text-sm text-muted-foreground">
            Tu equipo (agentes y administradores) vive dentro de una organización. Créala para
            empezar a invitar miembros.
          </p>
          <div className="text-left">
            <Label htmlFor="org-name">Nombre de la empresa</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mi Inmobiliaria SpA"
            />
          </div>
          <Button
            className="w-full"
            disabled={!name.trim() || createOrg.isPending}
            onClick={() =>
              createOrg.mutate(
                { name: name.trim(), slug: slugifyAgency(name) },
                {
                  onSuccess: () => {
                    toast({ title: 'Organización creada' });
                    qc.invalidateQueries({ queryKey: ['my-organization'] });
                    qc.invalidateQueries({ queryKey: ['team-members'] });
                  },
                  onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
                },
              )
            }
          >
            {createOrg.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear organización
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const InviteMemberDialog = ({
  open, onOpenChange, onSubmit, pending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (p: { email: string; first_name?: string; last_name?: string; org_role: AssignableRole }) => void;
  pending: boolean;
}) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgRole, setOrgRole] = useState<AssignableRole>('sales_agent');

  const reset = () => { setEmail(''); setFirstName(''); setLastName(''); setOrgRole('sales_agent'); };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Invitar miembro
          </DialogTitle>
          <DialogDescription>
            Si no tiene cuenta, le enviaremos un email de invitación; si ya tiene, se suma directo al equipo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="tm-email">Email *</Label>
            <Input id="tm-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="agente@empresa.cl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tm-fn">Nombre</Label>
              <Input id="tm-fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="tm-ln">Apellido</Label>
              <Input id="tm-ln" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Rol interno</Label>
            <Select value={orgRole} onValueChange={(v) => setOrgRole(v as AssignableRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ORGANIZATION_ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={!email || pending}
            onClick={() => onSubmit({
              email,
              first_name: firstName || undefined,
              last_name: lastName || undefined,
              org_role: orgRole,
            })}
          >
            {pending ? 'Enviando…' : 'Enviar invitación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeamManagement;
