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

  it('corredor: muestra vista de corredor SIN herramientas de agencia', () => {
    mockPlan.plan = 'corredor';
    renderSidebar();
    expect(screen.getByText('Principal')).toBeInTheDocument();
    expect(screen.getByText('CORREDOR')).toBeInTheDocument();
    // Herramientas de agencia NO deben aparecer para el corredor.
    expect(screen.queryByText('Multi-Proyecto')).not.toBeInTheDocument();
    expect(screen.queryByText('Ejecutivo')).not.toBeInTheDocument();
    expect(screen.queryByText('Inmobiliaria')).not.toBeInTheDocument();
  });

  it('inmobiliaria: muestra el panel de agencia CON multi-proyecto y grupos internos', () => {
    mockPlan.plan = 'inmobiliaria';
    renderSidebar();
    expect(screen.getByText('Inmobiliaria')).toBeInTheDocument();
    expect(screen.queryByText('CORREDOR')).not.toBeInTheDocument();
    expect(screen.getByText('INMOBILIARIA')).toBeInTheDocument();
    // Grupos internos del panel de inmobiliaria (los items viven dentro de
    // colapsables cerrados por defecto; validamos las etiquetas de grupo).
    expect(screen.getByText('Proyectos')).toBeInTheDocument();
    expect(screen.getByText('Ventas & Reservas')).toBeInTheDocument();
    expect(screen.getByText('Finanzas')).toBeInTheDocument();
    // La vista de corredor (etiqueta "Principal") NO debe aparecer.
    expect(screen.queryByText('Principal')).not.toBeInTheDocument();
  });

  it('plan grupo/enterprise también recibe el panel de inmobiliaria', () => {
    mockPlan.plan = 'grupo';
    renderSidebar();
    expect(screen.getByText('INMOBILIARIA')).toBeInTheDocument();
  });

  it('admin: muestra la sección Admin con sus grupos', () => {
    mockRedirect.isAdmin = true;
    mockRedirect.isAgent = false;
    mockPlan.plan = 'free';
    renderSidebar();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('Panel Admin')).toBeInTheDocument();
    // Grupos admin colapsables.
    expect(screen.getByText('Gestión')).toBeInTheDocument();
    expect(screen.getByText('Aprobaciones')).toBeInTheDocument();
  });
});
