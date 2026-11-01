import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConvertToSaleDialog from './ConvertToSaleDialog';

const mutateMock = vi.fn();
vi.mock('@/hooks/useReservations', () => ({
  useRegisterSale: () => ({ mutate: mutateMock, isPending: false }),
}));

const rulesState: { data: unknown[]; isLoading: boolean } = { data: [], isLoading: false };
vi.mock('@/hooks/useAdminCommissions', () => ({
  useCommissionRules: () => rulesState,
}));

const reservation = {
  id: 'res-1',
  buyer_name: 'Jorge Fuentes',
  reservation_amount: 500_000,
  lots: { lot_number: '9', name: null, price: 68_000_000, area: 6100, project_id: 'proj-1' },
};

describe('ConvertToSaleDialog', () => {
  beforeEach(() => {
    mutateMock.mockClear();
    rulesState.data = [
      { scope: 'project', project_id: 'proj-1', is_active: true, fixed_sale_amount: 1_200_000, referral_fixed_amount: 500_000 },
    ];
    rulesState.isLoading = false;
  });

  it('prefills the sale amount with the lot list price and shows the balance after the deposit', () => {
    render(<ConvertToSaleDialog open onOpenChange={() => {}} reservation={reservation} />);

    const amount = screen.getByLabelText(/Precio final de venta/i) as HTMLInputElement;
    expect(amount.value).toBe('68000000');

    // Saldo por cobrar = 68.000.000 − 500.000 (seña)
    expect(screen.getByText(/Saldo por cobrar/i).parentElement?.textContent).toContain('67.500.000');
  });

  it('shows the project fixed commission and has no rate field', () => {
    render(<ConvertToSaleDialog open onOpenChange={() => {}} reservation={reservation} />);

    expect(screen.getByText(/Comisión por venta/i).parentElement?.textContent).toContain('1.200.000');
    expect(screen.getByText(/Captación/i).parentElement?.textContent).toContain('500.000');
    expect(screen.queryByLabelText(/Tasa de comisión/i)).toBeNull();
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it('lets the database apply the project rule (null rate) when the commission switch is on', () => {
    render(<ConvertToSaleDialog open onOpenChange={() => {}} reservation={reservation} />);

    fireEvent.click(screen.getByRole('button', { name: /Confirmar venta/i }));
    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock.mock.calls[0][0]).toMatchObject({
      reservationId: 'res-1',
      saleAmount: 68_000_000,
      commissionRate: null,
    });
  });

  it('sends a zero rate (no commission) when the commission switch is off', () => {
    render(<ConvertToSaleDialog open onOpenChange={() => {}} reservation={reservation} />);

    fireEvent.click(screen.getByRole('switch'));
    expect(screen.queryByText(/Comisión por venta/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Confirmar venta/i }));
    expect(mutateMock.mock.calls[0][0]).toMatchObject({ commissionRate: 0 });
  });

  it('explains the fallback when the project has no fixed commission', () => {
    rulesState.data = [];
    render(<ConvertToSaleDialog open onOpenChange={() => {}} reservation={reservation} />);

    expect(screen.getByText(/no tiene comisión fija/i)).toBeInTheDocument();
  });

  it('blocks a fixed-commission sale priced below CLP 1.000.000', () => {
    render(<ConvertToSaleDialog open onOpenChange={() => {}} reservation={reservation} />);

    fireEvent.change(screen.getByLabelText(/Precio final de venta/i), { target: { value: '850' } });
    expect(screen.getByText(/precio debe estar en pesos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirmar venta/i })).toBeDisabled();

    // Sin comisión, el monto bajo el umbral se puede registrar.
    fireEvent.click(screen.getByRole('switch'));
    expect(screen.getByRole('button', { name: /Confirmar venta/i })).not.toBeDisabled();
  });

  it('gives the sale commission to the broker who brought the client by default', () => {
    render(
      <ConvertToSaleDialog
        open
        onOpenChange={() => {}}
        reservation={{ ...reservation, referring_agent_id: 'broker-1', referral_code: 'BK-ABC123' }}
      />,
    );

    expect(screen.getByText(/Quién cerró la venta/i)).toBeInTheDocument();
    expect(screen.getByText(/BK-ABC123/)).toBeInTheDocument();
    expect(screen.getByText(/Comisión por venta \(broker\)/i).parentElement?.textContent).toContain('1.200.000');
    fireEvent.click(screen.getByRole('button', { name: /Confirmar venta/i }));
    expect(mutateMock.mock.calls[0][0]).toMatchObject({ commissionRate: null, brokerCloses: true });
  });

  it('leaves only the captación to the broker when the project team closed the sale', () => {
    render(
      <ConvertToSaleDialog
        open
        onOpenChange={() => {}}
        reservation={{ ...reservation, referring_agent_id: 'broker-1', referral_code: 'BK-ABC123' }}
      />,
    );

    fireEvent.click(screen.getByLabelText(/El equipo del proyecto/i));
    expect(screen.getByText(/Captación \(broker\)/i).parentElement?.textContent).toContain('500.000');
    fireEvent.click(screen.getByRole('button', { name: /Confirmar venta/i }));
    expect(mutateMock.mock.calls[0][0]).toMatchObject({ brokerCloses: false });
  });

  it('does not ask who closed the sale when no broker brought the client', () => {
    render(<ConvertToSaleDialog open onOpenChange={() => {}} reservation={reservation} />);

    expect(screen.queryByText(/Quién cerró la venta/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Confirmar venta/i }));
    expect(mutateMock.mock.calls[0][0]).toMatchObject({ brokerCloses: null });
  });

  it('blocks confirmation when the sale amount is invalid', () => {
    render(<ConvertToSaleDialog open onOpenChange={() => {}} reservation={reservation} />);

    fireEvent.change(screen.getByLabelText(/Precio final de venta/i), { target: { value: '0' } });
    const confirm = screen.getByRole('button', { name: /Confirmar venta/i });
    expect(confirm).toBeDisabled();
    fireEvent.click(confirm);
    expect(mutateMock).not.toHaveBeenCalled();
  });
});
