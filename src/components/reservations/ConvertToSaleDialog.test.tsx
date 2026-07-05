import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConvertToSaleDialog from './ConvertToSaleDialog';

const mutateMock = vi.fn();
vi.mock('@/hooks/useReservations', () => ({
  useRegisterSale: () => ({ mutate: mutateMock, isPending: false }),
}));

const reservation = {
  id: 'res-1',
  buyer_name: 'Jorge Fuentes',
  reservation_amount: 500_000,
  lots: { lot_number: '9', name: null, price: 68_000_000, area: 6100 },
};

describe('ConvertToSaleDialog', () => {
  beforeEach(() => mutateMock.mockClear());

  it('prefills the sale amount with the lot list price and shows the balance after the deposit', () => {
    render(<ConvertToSaleDialog open onOpenChange={() => {}} reservation={reservation} />);

    const amount = screen.getByLabelText(/Precio final de venta/i) as HTMLInputElement;
    expect(amount.value).toBe('68000000');

    // Saldo por cobrar = 68.000.000 − 500.000 (seña)
    expect(screen.getByText(/Saldo por cobrar/i).parentElement?.textContent).toContain('67.500.000');
  });

  it('computes the commission from the rate and passes it to register_sale', () => {
    render(<ConvertToSaleDialog open onOpenChange={() => {}} reservation={reservation} />);

    // Default 3% de 68M = 2.040.000
    expect(screen.getByText(/2\.040\.000/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Confirmar venta/i }));
    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock.mock.calls[0][0]).toMatchObject({
      reservationId: 'res-1',
      saleAmount: 68_000_000,
      commissionRate: 3,
    });
  });

  it('sends a null commission rate when the commission switch is off', () => {
    render(<ConvertToSaleDialog open onOpenChange={() => {}} reservation={reservation} />);

    fireEvent.click(screen.getByRole('switch'));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar venta/i }));
    expect(mutateMock.mock.calls[0][0]).toMatchObject({ commissionRate: null });
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
