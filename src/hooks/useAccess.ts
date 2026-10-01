import { useCallback } from 'react';
import { usePanelContext } from '@/hooks/usePanelContext';
import { useSmartRedirect } from '@/hooks/useSmartRedirect';
import {
  hasOrganizationCapability,
  type OrganizationCapability,
} from '@/lib/access/organizationPermissions';
import {
  hasPlanFeature,
  type PlanFeature,
} from '@/lib/access/planEntitlements';

const BROKER_CAPABILITIES: readonly OrganizationCapability[] = [
  'projects.read',
  'inventory.read',
  'crm.read',
  'crm.write',
  'reservations.read',
  'reservations.write',
  'sales.read',
  'sales.write',
  'commissions.read',
];

const BROKER_FEATURES: readonly PlanFeature[] = [
  'marketplace',
  'crm',
  'quotes',
  'reservations',
  'commissions',
];

const AGENT_CORE_FEATURES: readonly PlanFeature[] = [
  'marketplace', 'crm', 'quotes', 'reservations', 'commissions', 'analytics',
];

/**
 * Frontend access facade.
 *
 * It intentionally keeps four concerns separate:
 * identity role, active context, organization capability and SaaS entitlement.
 * Database RLS/RPC remains the security boundary; this hook controls product UX.
 */
export const useAccess = () => {
  const identity = useSmartRedirect();
  const panel = usePanelContext();
  const can = useCallback((capability: OrganizationCapability) => {
    if (panel.context === 'plataforma') return identity.isAdmin;
    if (panel.context === 'buyer' || !panel.context) return false;

    if (panel.context === 'broker') {
      return BROKER_CAPABILITIES.includes(capability);
    }

    if (panel.organizationRole) {
      return hasOrganizationCapability(panel.organizationRole, capability);
    }

    // A solo SaaS agent owns their own workspace/projects even before creating
    // an organization record. Backend RLS still validates row ownership.
    return identity.isAgent && hasOrganizationCapability('owner', capability);
  }, [identity.isAdmin, identity.isAgent, panel.context, panel.organizationRole]);

  const hasFeature = useCallback((feature: PlanFeature) => {
    if (panel.context === 'plataforma') return identity.isAdmin;
    if (panel.context === 'broker' && BROKER_FEATURES.includes(feature)) return true;
    if (panel.context === 'buyer') return feature === 'marketplace';
    // Core selling tools were never plan-gated; keep them for every agent.
    if ((identity.isAgent || identity.isAdmin) && AGENT_CORE_FEATURES.includes(feature)) return true;
    return hasPlanFeature(panel.plan, feature);
  }, [identity.isAdmin, identity.isAgent, panel.context, panel.plan]);

  const canEnterArea = useCallback((area: 'buyer' | 'agent' | 'admin') => {
    if (area === 'buyer') return identity.isBuyer;
    if (area === 'admin') return identity.isAdmin;
    return identity.isAgent || identity.isAdmin;
  }, [identity.isAdmin, identity.isAgent, identity.isBuyer]);

  return {
    context: panel.context,
    contexts: panel.options,
    organization: panel.organization,
    organizationRole: panel.organizationRole,
    brokerProfile: panel.brokerProfile,
    plan: panel.plan,
    limits: panel.planDetails,
    isAdmin: identity.isAdmin,
    isAgent: identity.isAgent,
    isBuyer: identity.isBuyer,
    isBroker: Boolean(panel.brokerProfile?.is_active),
    can,
    hasFeature,
    canEnterArea,
    setContext: panel.setContext,
    planIsAgency: panel.planIsAgency,
    isLoading: panel.isLoading || identity.isLoading,
  };
};
