import { Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganizationWorkspace } from '@/hooks/useMyOrganization';

interface OrganizationSwitcherProps {
  compact?: boolean;
}

const OrganizationSwitcher = ({ compact = false }: OrganizationSwitcherProps) => {
  const { data, isLoading, selectOrganization } = useOrganizationWorkspace();

  if (isLoading) return <Skeleton className={compact ? 'h-8 w-8' : 'h-9 w-full'} />;
  if (!data?.organization) return null;

  if (data.organizations.length === 1) {
    return (
      <div
        className={compact
          ? 'flex h-8 w-8 items-center justify-center rounded-md bg-muted/50'
          : 'flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-2'}
        title={data.organization.name}
      >
        <Building2 className="h-4 w-4 shrink-0 text-primary" />
        {!compact && <span className="truncate text-xs font-medium">{data.organization.name}</span>}
      </div>
    );
  }

  return (
    <Select value={data.organization.id} onValueChange={selectOrganization}>
      <SelectTrigger
        className={compact ? 'h-8 w-8 border-border/60 p-0 [&>svg]:hidden' : 'h-9 w-full border-border/60 text-xs'}
        aria-label="Cambiar inmobiliaria o workspace"
      >
        {compact ? (
          <Building2 className="mx-auto h-4 w-4 text-primary" />
        ) : (
          <SelectValue placeholder="Seleccionar organización" />
        )}
      </SelectTrigger>
      <SelectContent>
        {data.organizations.map((organization) => (
          <SelectItem key={organization.id} value={organization.id}>
            {organization.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default OrganizationSwitcher;
