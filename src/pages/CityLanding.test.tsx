import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [], isLoading: false }),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('@/components/layouts/PublicLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock('@/components/listings/ListingCard', () => ({ default: () => null }));
vi.mock('@/hooks/useListings', () => ({ formatPrice: (price: number) => String(price) }));

import CityLanding from './CityLanding';

const renderCity = (initialPath: string) => render(
  <MemoryRouter initialEntries={[initialPath]}>
    <nav>
      <Link to="/ciudad/no-existe">Ciudad inválida</Link>
      <Link to="/ciudad/buenos-aires">Ir a Buenos Aires</Link>
    </nav>
    <Routes>
      <Route path="/ciudad/:slug" element={<CityLanding />} />
    </Routes>
  </MemoryRouter>,
);

afterEach(() => {
  document.querySelector('link[rel="canonical"]')?.remove();
});

describe('CityLanding navigation', () => {
  it('navigates valid → invalid → valid without changing hook order', () => {
    renderCity('/ciudad/santiago');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Santiago');
    expect(document.title).toContain('Terrenos en Santiago, Chile');

    fireEvent.click(screen.getByRole('link', { name: 'Ciudad inválida' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ciudad no encontrada');
    expect(document.getElementById('seo-json-ld')).toBeNull();

    fireEvent.click(screen.getByRole('link', { name: 'Ir a Buenos Aires' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Buenos Aires');
    expect(document.title).toContain('Terrenos en Buenos Aires, Argentina');
    expect(JSON.parse(document.getElementById('seo-json-ld')!.textContent!)).toMatchObject({
      name: 'Terrenos en Buenos Aires, Argentina',
    });
  });

  it('can open an unknown city and navigate to a valid city', () => {
    renderCity('/ciudad/no-existe');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ciudad no encontrada');
    fireEvent.click(screen.getByRole('link', { name: 'Ir a Buenos Aires' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Buenos Aires');
    expect(document.title).toContain('Terrenos en Buenos Aires, Argentina');
  });
});
