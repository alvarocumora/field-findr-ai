import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// --- Mockable hooks ---
const mockRedirect = { isAdmin: false, isAgent: true };
const mockPlan = { plan: 'corredor' as string, isLoading: false };

vi.mock('@/hooks/useSmartRedirect', () => ({
  useSmartRedirect: () => mockRedirect,
}));
vi.mock('@/hooks/useSubscription', () => ({
  useCurrentPlan: () => mockPlan,
}));
vi.mock('@/hooks/useSidebarCounts', () => ({
  useSidebarCounts: () => ({ pendingReservations: 0, newLeads: 0, overduePayments: 0 }),
}));
// Brand logos pull in assets/theme; stub them out.
vi.mock('@/components/brand/Logo', () => ({ default: () => <div>logo</div> }));
vi.mock('@/components/brand/LogoIcon', () => ({ default: () => <div>logo</div> }));

import ModernSidebar from './ModernSidebar';

const renderSidebar = () =>
  render(
    <MemoryRouter>
      <ModernSidebar />
    </MemoryRouter>,
  );

describe('ModernSidebar — segmentación por tipo de cuenta', () => {
  beforeEach(() => {
    mockRedirect.isAdmin = false;
    mockRedirect.isAgent = true;
    mockPlan.plan = 'corredor';
    mockPlan.isLoading = false;
  });

  it('corredor: muestra navegación de corredor sin identidad de inmobiliaria', () => {
    mockPlan.plan = 'corredor';
    renderSidebar();
    expect(screen.getByText('Corredor')).toBeInTheDocument();
    expect(screen.getByText('CORREDOR')).toBeInTheDocument();
    expect(screen.queryByText('INMOBILIARIA')).not.toBeInTheDocument();
    expect(screen.queryByText('Administración')).not.toBeInTheDocument();
  });

  it('inmobiliaria: muestra navegación de agencia y grupos comerciales actuales', () => {
    mockPlan.plan = 'inmobiliaria';
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
    renderSidebar();
    expect(screen.getByText('INMOBILIARIA')).toBeInTheDocument();
  });

  it('admin: muestra la sección Administración con sus grupos actuales', () => {
    mockRedirect.isAdmin = true;
    mockRedirect.isAgent = false;
    mockPlan.plan = 'free';
    renderSidebar();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('Administración')).toBeInTheDocument();
    expect(screen.getByText('gestión')).toBeInTheDocument();
    expect(screen.getByText('aprobaciones')).toBeInTheDocument();
  });
});