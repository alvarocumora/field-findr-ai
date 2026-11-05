import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectCommissionCard from './ProjectCommissionCard';
import { parseClpInput } from '@/lib/commissions/clpInput';

const mutateMock = vi.fn();
const rulesState: { data: unknown[]; isLoading: boolean } = { data: [], isLoading: false };
vi.mock('@/hooks/useAdminCommissions', () => ({
  useCommissionRules: () => rulesState,
  useSetProjectCommission: () => ({ mutate: mutateMock, isPending: false }),
}));

describe('parseClpInput', () => {
  it('acepta montos con puntos, signo peso o sin formato', () => {
    expect(parseClpInput('1.200.000')).toBe(1_200_000);
    expect(parseClpInput('$750.000')).toBe(750_000);
    expect(parseClpInput('500000')).toBe(500_000);
    expect(parseClpInput('')).toBeNull();
  });

  it('rechaza negativos, decimales y separadores mal agrupados', () => {
    expect(parseClpInput('-500.000')).toBeNull();
    expect(parseClpInput('500.000,00')).toBeNull();
    expect(parseClpInput('1.20.000')).toBeNull();
    expect(parseClpInput('12,5')).toBeNull();
  });
});

describe('ProjectCommissionCard', () => {
  beforeEach(() => {
    mutateMock.mockClear();
    rulesState.data = [
      { scope: 'project', project_id: 'p1', is_active: true, fixed_sale_amount: 750_000, referral_fixed_amount: 350_000 },
    ];
  });

  it('el dueño ve los montos vigentes y guarda los nuevos', () => {
    render(<ProjectCommissionCard projectId="p1" canEdit />);

    const sale = screen.getByLabelText(/Total por venta/i) as HTMLInputElement;
    const capture = screen.getByLabelText(/Parte del captador/i) as HTMLInputElement;
    expect(sale.value).toBe('750000');
    expect(capture.value).toBe('350000');

    // Sin cambios no se puede guardar.
    expect(screen.getByRole('button', { name: /Guardar/i })).toBeDisabled();

    fireEvent.change(sale, { target: { value: '1.200.000' } });
    fireEvent.change(capture, { target: { value: '$500.000' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));
    expect(mutateMock).toHaveBeenCalledWith({ projectId: 'p1', saleAmount: 1_200_000, captureAmount: 500_000 });
  });

  it('un proyecto sin regla se puede configurar por primera vez', () => {
    render(<ProjectCommissionCard projectId="p2" canEdit />);

    fireEvent.change(screen.getByLabelText(/Total por venta/i), { target: { value: '600000' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));
    expect(mutateMock).toHaveBeenCalledWith({ projectId: 'p2', saleAmount: 600_000, captureAmount: 0 });
  });

  it('sin permiso solo muestra los montos', () => {
    render(<ProjectCommissionCard projectId="p1" canEdit={false} />);

    expect(screen.queryByRole('button', { name: /Guardar/i })).toBeNull();
    expect(screen.getByText(/^Total por venta$/i).parentElement?.textContent).toContain('750.000');
    expect(screen.getByText(/^Parte del captador$/i).parentElement?.textContent).toContain('350.000');
    expect(screen.getByText(/^Quien cierra \(si otro captó\)$/i).parentElement?.textContent).toContain('400.000');
  });

  it('no deja guardar una captación mayor que el total', () => {
    render(<ProjectCommissionCard projectId="p1" canEdit />);

    fireEvent.change(screen.getByLabelText(/Total por venta/i), { target: { value: '300000' } });
    expect(screen.getByText(/no puede ser mayor que el total/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar/i })).toBeDisabled();
  });
});
