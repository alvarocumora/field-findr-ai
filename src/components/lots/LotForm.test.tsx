import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LotForm } from './LotForm';
import type { Lot } from '@/hooks/useLots';

vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: vi.fn() } } }));
vi.mock('./LotImageUploader', () => ({ LotImageUploader: () => null }));

const lot = {
  id: 'lot-1',
  project_id: 'b4363fda-e99f-400d-ae95-2cbc8244b770',
  user_id: 'owner-1',
  lot_number: '5',
  name: null,
  description: null,
  area: 5200,
  price: 19_990_000,
  price_per_sqm: 3844,
  status: 'available',
  latitude: -34.98,
  longitude: -71.96,
  features: { hasWater: true, rolSii: '08022-00005', rolCertificate: '934308' },
  images: [],
} as unknown as Lot;

describe('LotForm', () => {
  it('keeps the SII rol and other stored feature keys when saving an edit', async () => {
    const onSubmit = vi.fn();
    render(
      <LotForm
        projects={[{ id: 'b4363fda-e99f-400d-ae95-2cbc8244b770', name: 'Valle Escondido Licantén' } as never]}
        initialData={lot}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Actualizar/i }));

    await waitFor(() => {
      const errors = Array.from(document.querySelectorAll('.text-destructive')).map((e) => e.textContent);
      expect(errors).toEqual([]);
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit.mock.calls[0][0].features).toMatchObject({
      hasWater: true,
      rolSii: '08022-00005',
      rolCertificate: '934308',
    });
  });
});
