import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const PROJECT = '11111111-1111-4111-8111-111111111111';
const LOT = '22222222-2222-4222-8222-222222222222';
const RESERVATION = 'abcdef12-3333-4333-8333-333333333333';

const db = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: db.rpc,
    from: () => ({
      select: () => {
        const query = {
          eq: () => query,
          order: () => query,
          then: (resolve: (v: unknown) => void) =>
            resolve({ data: [{ id: PROJECT, name: 'Valle Escondido', slug: 'valle-escondido', city: 'Licantén', region: 'Maule' }], error: null }),
        };
        return query;
      },
    }),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/referrals/referralAttribution', () => ({
  readReferralAttribution: () => ({ code: 'BK-TEST12', landingPath: '/p/valle-escondido' }),
}));

import ReservationFormWizard from './ReservationFormWizard';

beforeAll(() => {
  // Radix Select usa APIs de puntero/scroll que jsdom no implementa.
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => undefined;
  Element.prototype.scrollIntoView = () => undefined;
  window.scrollTo = () => undefined;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderWizard = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <ReservationFormWizard initialProject="valle-escondido" initialLotId={LOT} />
      </QueryClientProvider>
    </MemoryRouter>,
  );
};

const type = (id: string, value: string) => {
  fireEvent.change(document.getElementById(id)!, { target: { value } });
};

describe('ReservationFormWizard', () => {
  it('reserva una parcela del stock real con el formulario completo', async () => {
    db.rpc.mockImplementation(async (fn: string) => {
      if (fn === 'get_reservable_lots') {
        return {
          data: [{ id: LOT, project_id: PROJECT, lot_number: '12', name: null, area: 5000, price: 19_900_000, reservation_amount: 400_000 }],
          error: null,
        };
      }
      if (fn === 'create_public_reservation_form') {
        return {
          data: [{ reservation_id: RESERVATION, reservation_amount: 400_000, expires_at: '2026-11-01T13:00:00.000Z' }],
          error: null,
        };
      }
      return { data: null, error: { message: 'unexpected' } };
    });

    renderWizard();

    // Paso 1: el enlace del asesor preselecciona proyecto (por slug) y lote.
    await screen.findByText('N° 12');
    expect(db.rpc).toHaveBeenCalledWith('get_reservable_lots', { p_project_id: PROJECT });
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    // Paso 2: no avanza sin datos.
    await screen.findByText('Datos del comprador');
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
    expect(await screen.findAllByText('Ingresa nombre y apellidos')).not.toHaveLength(0);

    type('primary-buyer-fullName', 'María José Pérez Soto');
    type('primary-buyer-rut', '123456785');
    type('primary-buyer-profession', 'Ingeniera');
    type('primary-buyer-address', 'Camino Los Robles 1234');
    type('primary-buyer-commune', 'Licantén');
    type('primary-buyer-phone', '+56 9 1234 5678');
    type('primary-buyer-email', 'maria@example.com');
    fireEvent.keyDown(document.getElementById('primary-buyer-maritalStatus')!, { key: 'Enter' });
    fireEvent.click(await screen.findByRole('option', { name: 'Soltero/a' }));
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    // Paso 3: datos de transferencia y aceptación obligatoria.
    await screen.findByText('Datos para transferir la reserva');
    expect(screen.getByText('Asesorías Terra SpA')).toBeTruthy();
    expect(screen.getByText('0221332980')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /enviar reserva/i }));
    expect(await screen.findByText('Debes aceptar las condiciones')).toBeTruthy();
    expect(db.rpc).not.toHaveBeenCalledWith('create_public_reservation_form', expect.anything());

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /enviar reserva/i }));

    await screen.findByText('Reserva registrada');
    expect(screen.getByText('OT-RES-ABCDEF12')).toBeTruthy();
    const call = db.rpc.mock.calls.find(([fn]) => fn === 'create_public_reservation_form');
    expect(call?.[1]).toMatchObject({
      p_lot_id: LOT,
      p_buyer_name: 'María José Pérez Soto',
      p_buyer_email: 'maria@example.com',
      p_buyer_rut: '12.345.678-5',
      p_terms_version: expect.stringMatching(/^ot-reserva-/),
      p_buyer_details: {
        version: 1,
        source: 'formulario_reserva',
        brokerReferralCode: 'BK-TEST12',
        brokerReferralLandingPath: '/p/valle-escondido',
        parties: [{ buyer: expect.objectContaining({ maritalStatus: 'soltero', commune: 'Licantén' }), spouse: null }],
      },
    });
    await waitFor(() => expect(screen.getByRole('button', { name: /descargar formulario/i })).toBeTruthy());
  });

  it('avisa cuando la parcela ya no está en stock', async () => {
    db.rpc.mockResolvedValue({ data: [], error: null });
    renderWizard();
    await screen.findByText(/0 parcelas disponibles/);
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
    expect(await screen.findByText('Selecciona una parcela disponible')).toBeTruthy();
  });
});
