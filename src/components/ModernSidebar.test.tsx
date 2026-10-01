import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// --- Mockable hooks ---
const mockRedirect = { isAdmin: false, isAgent: true };
const mockPlan = { plan: 'corredor' as string, isLoading: false };
const mockPanel = {
  context: 'empresa' as 'empresa' | 'broker' | 'plataforma' | 'buyer',
  options: [{ id: 'empresa', label: 'Empresa', shortLabel: 'Empresa', home: '/asesor/dashboard', area: 'agent' }] as {
    id: string; label: string; shortLabel: string; home: string; area: 'agent' | 'admin' | 'buyer';
  }[],
  setContext: vi.fn(),
  planIsAgency: false,
};

vi.mock('@/hooks/useSmartRedirect', () => ({
  useSmartRedirect: () => mockRedirect,
}));
vi.mock('@/hooks/useSubscription', () => ({
  useCurrentPlan: () => mockPlan,
}));
vi.mock('@/hooks/useSidebarCounts', () => ({
  useSidebarCounts: () => ({ pendingReservations: 0, newLeads: 0, overduePayments: 0 }),
}));
vi.mock('@/hooks/usePanelContext', () => ({
  usePanelContext: () => mockPanel,
}));
vi.mock('@/hooks/useAccess', () => ({
  useAccess: () => ({
    isAdmin: mockRedirect.isAdmin,
    isAgent: mockRedirect.isAgent,
    plan: mockPlan.plan,
    context: mockPanel.context,
    contexts: mockPanel.options,
    setContext: mockPanel.setContext,
    planIsAgency: mockPanel.planIsAgency,
    can: () => true,
    hasFeature: () => true,
  }),
}));
// Brand logos pull in assets/theme; stub them out.
vi.mock('@/components/brand/Logo', () => ({ default: () => <div>logo</div> }));
vi.mock('@/components/brand/LogoIcon', () => ({ default: () => <div>logo</div> }));
vi.mock('@/components/organization/OrganizationSwitcher', () => ({
  default: () => <div data-testid="organization-switcher">workspace</div>,
}));

import ModernSidebar from './ModernSidebar';

const renderSidebar = (initialEntry = '/') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ModernSidebar />
    </MemoryRouter>,
  );

describe('ModernSidebar — segmentación por tipo de cuenta', () => {
  beforeEach(() => {
    mockRedirect.isAdmin = false;
    mockRedirect.isAgent = true;
    mockPlan.plan = 'corredor';
    mockPlan.isLoading = false;
    mockPanel.context = 'empresa';
    mockPanel.options = [{ id: 'empresa', label: 'Empresa', shortLabel: 'Empresa', home: '/asesor/dashboard', area: 'agent' as const }];
    mockPanel.planIsAgency = false;
  });

  it('corredor: muestra navegación de corredor sin identidad de inmobiliaria', () => {
    mockPlan.plan = 'corredor';
    renderSidebar();
    expect(screen.getByText('Empresa')).toBeInTheDocument();
    expect(screen.getByText('EMPRESA')).toBeInTheDocument();
    expect(screen.queryByText('INMOBILIARIA')).not.toBeInTheDocument();
    expect(screen.queryByText('Administración')).not.toBeInTheDocument();
  });

  it('inmobiliaria: muestra navegación de agencia y grupos comerciales actuales', () => {
    mockPlan.plan = 'inmobiliaria';
    mockPanel.planIsAgency = true;
    renderSidebar();
    expect(screen.getByText('Inmobiliaria')).toBeInTheDocument();
    expect(screen.queryByText('CORREDOR')).not.toBeInTheDocument();
    expect(screen.getByText('INMOBILIARIA')).toBeInTheDocument();
    expect(screen.getByText('proyectos')).toBeInTheDocument();
    expect(screen.getByText('ventas')).toBeInTheDocument();
    expect(screen.getByText('red comercial')).toBeInTheDocument();
    expect(screen.getByText('administración')).toBeInTheDocument();
    expect(screen.getByText('configuración')).toBeInTheDocument();
  });

  it('plan grupo/enterprise también recibe el panel de inmobiliaria', () => {
    mockPlan.plan = 'grupo';
    mockPanel.planIsAgency = true;
    renderSidebar();
    expect(screen.getByText('INMOBILIARIA')).toBeInTheDocument();
  });

  it('admin: muestra la sección Administración con sus grupos actuales', () => {
    mockRedirect.isAdmin = true;
    mockRedirect.isAgent = false;
    mockPlan.plan = 'free';
    mockPanel.context = 'plataforma';
    mockPanel.options = [{ id: 'plataforma', label: 'Administración de plataforma', shortLabel: 'Plataforma', home: '/admin/dashboard', area: 'admin' as const }];
    renderSidebar('/admin/dashboard');
    expect(screen.getByText('PLATAFORMA')).toBeInTheDocument();
    expect(screen.getByText('Administración')).toBeInTheDocument();
    expect(screen.getByText('gestión')).toBeInTheDocument();
    expect(screen.getByText('aprobaciones')).toBeInTheDocument();
  });
});