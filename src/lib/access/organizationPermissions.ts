export type OrganizationRole =
  | 'owner'
  | 'admin'
  | 'org_admin'
  | 'commercial_manager'
  | 'sales_agent'
  | 'member'
  | 'operations'
  | 'finance'
  | 'external_broker'
  | 'viewer';

export type OrganizationCapability =
  | 'projects.read' | 'projects.write'
  | 'inventory.read' | 'inventory.write'
  | 'crm.read' | 'crm.write'
  | 'reservations.read' | 'reservations.write'
  | 'sales.read'
  | 'payments.read' | 'payments.write'
  | 'commissions.read' | 'commissions.write'
  | 'reports.read'
  | 'documents.read' | 'documents.write'
  | 'team.read' | 'team.write';

const ALL_CAPABILITIES: OrganizationCapability[] = [
  'projects.read','projects.write','inventory.read','inventory.write',
  'crm.read','crm.write','reservations.read','reservations.write','sales.read',
  'payments.read','payments.write','commissions.read','commissions.write',
  'reports.read','documents.read','documents.write','team.read','team.write',
];

export const ROLE_CAPABILITIES: Record<OrganizationRole, readonly OrganizationCapability[]> = {
  owner: ALL_CAPABILITIES,
  admin: ALL_CAPABILITIES,
  org_admin: ALL_CAPABILITIES,
  commercial_manager: ['projects.read','projects.write','inventory.read','inventory.write','crm.read','crm.write','reservations.read','reservations.write','sales.read','reports.read','team.read'],
  sales_agent: ['projects.read','inventory.read','crm.read','crm.write','reservations.read','reservations.write','sales.read','commissions.read'],
  member: ['projects.read','inventory.read','crm.read','crm.write','reservations.read','reservations.write','sales.read','commissions.read'],
  operations: ['projects.read','projects.write','inventory.read','inventory.write','reservations.read','reservations.write','documents.read','documents.write'],
  finance: ['sales.read','payments.read','payments.write','commissions.read','commissions.write','reports.read'],
  external_broker: ['projects.read','inventory.read','crm.read','crm.write','reservations.read','reservations.write'],
  viewer: ['projects.read','inventory.read','crm.read','reservations.read','sales.read','payments.read','commissions.read','reports.read','team.read'],
};

export const ORGANIZATION_ROLE_OPTIONS: Array<{ value: Exclude<OrganizationRole, 'owner' | 'admin' | 'member'>; label: string }> = [
  { value: 'org_admin', label: 'Administrador' },
  { value: 'commercial_manager', label: 'Jefatura comercial' },
  { value: 'sales_agent', label: 'Ejecutivo de ventas' },
  { value: 'operations', label: 'Operaciones' },
  { value: 'finance', label: 'Finanzas' },
  { value: 'external_broker', label: 'Corredor externo' },
  { value: 'viewer', label: 'Solo lectura' },
];

export const organizationRoleLabel = (role: OrganizationRole): string =>
  role === 'owner' ? 'Propietario'
  : role === 'admin' || role === 'org_admin' ? 'Administrador'
  : role === 'member' || role === 'sales_agent' ? 'Ejecutivo de ventas'
  : ORGANIZATION_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;

export const hasOrganizationCapability = (
  role: OrganizationRole | null | undefined,
  capability: OrganizationCapability,
): boolean => !!role && ROLE_CAPABILITIES[role].includes(capability);
