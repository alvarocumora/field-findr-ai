import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// --- Mockable hooks ---
const mockRedirect = { isAdmin: false, isAgent: true };
const mockPlan = { plan: 'corredor' as string, isLoading: false };
const mockPanel = {
  context: 'empresa' as 'empresa' | 'broker' | 'plataforma' | 'buyer',
  options: [{ id: 'empresa', label: 'Empresa', shortLabel: 'Empresa', home: '/asesor/dashboard', area: 'agent' as 'agent' | 'admin' | 'buyer' }],
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
    expect(screen.getByText('propiedades')).toBeInTheDocument();
    expect(screen.getByText('ventas y cobros')).toBeInTheDocument();
    expect(screen.getByText('mi red')).toBeInTheDocument();
    expect(screen.getByText('gestión y reportes')).toBeInTheDocument();
    expect(screen.getByText('mi cuenta')).toBeInTheDocument();
  });

  it('plan grupo/enterprise también recibe el panel de inmobiliaria', () => {
    mockPlan.plan = 'grupo';
    mockPanel.planIsAgency = true;
    renderSidebar();
    expect(screen.getByText('INMOBILIARIA')).toBeInTheDocument();
  });

  it('drawer móvil: cierra el menú tras elegir un módulo y no ofrece colapsar barra de escritorio', () => {
    const onNavigate = vi.fn();
    const { container } = render(
      <MemoryRouter initialEntries={['/asesor/leads']}>
        <ModernSidebar mobile onNavigate={onNavigate} />
      </MemoryRouter>,
    );
    expect(container.querySelector('aside')?.className).toContain('relative w-full');
    expect(screen.queryByRole('button', { name: 'Colapsar menú' })).not.toBeInTheDocument();
    const leadLink = screen.getByRole('link', { name: 'Consultas y prospectos' });
    expect(leadLink).toHaveAttribute('aria-current', 'page');
    fireEvent.click(leadLink);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('barra de escritorio: sigue ofreciendo el botón de colapsar de forma independiente', () => {
    const onToggle = vi.fn();
    render(
      <MemoryRouter initialEntries={['/asesor/leads']}>
        <ModernSidebar onToggle={onToggle} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Colapsar menú' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
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
  it('search reveals a matching module and clearing restores groups', () => {
    renderSidebar('/asesor/dashboard');
    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar en el menú' }), { target: { value: 'comisiones' } });
    expect(screen.getByRole('link', { name: 'Comisiones' })).toHaveAttribute('href', '/asesor/comisiones');
    expect(screen.queryByRole('link', { name: 'Equipo' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda del menú' }));
    expect(screen.getByText('mi cuenta')).toBeInTheDocument();
  });
  it('keeps the only profile destination inside the current workspace', () => {
    renderSidebar('/asesor/profile');
    const profiles = screen.getAllByRole('link', { name: 'Mi perfil' });
    expect(profiles).toHaveLength(1);
    expect(profiles[0]).toHaveAttribute('href', '/asesor/profile');
    expect(screen.queryByRole('link', { name: 'Mi negocio broker' })).not.toBeInTheDocument();
  });
  it('menu search cannot reveal another workspace administration', () => {
    renderSidebar('/asesor/dashboard');
    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar en el menú' }), { target: { value: 'Usuarios' } });
    expect(screen.getByRole('status')).toHaveTextContent('No hay módulos');
    expect(screen.queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument();
  });

});