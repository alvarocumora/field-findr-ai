import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectSocialCopyGenerator } from "./ProjectSocialCopyGenerator";

const sdk = vi.hoisted(() => ({
  copy: null as unknown,
  generateSocialCopy: vi.fn(),
}));

vi.mock("@/hooks/useAI", () => ({
  useSocialCopyGenerator: () => ({
    copy: sdk.copy,
    isLoading: false,
    generateSocialCopy: sdk.generateSocialCopy,
  }),
}));

const copyResult = {
  instagram: { caption: 'Tu parcela en Hualañé te espera.', hashtags: ['#parcelas', '#chile'] },
  whatsapp: { message: 'Hola, te comparto esta parcela.' },
  facebook: { post: 'Conoce esta parcela disponible.' },
};

const input = {
  projectName: 'Valle de Hualañé',
  location: 'Hualañé',
  region: 'Maule',
  priceFrom: 9_990_000,
  availableLots: 12,
  brokerName: 'Camila Rojas',
};

describe('broker social copy generator', () => {
  it('sends the real project data (not placeholder text) to the generator', () => {
    sdk.copy = null;
    render(<ProjectSocialCopyGenerator input={input} link="https://ofertaterrenos.com/p/valle-hualane?ref=BK-X" />);
    fireEvent.click(screen.getByRole('button', { name: 'Generar copy con IA' }));
    expect(sdk.generateSocialCopy).toHaveBeenCalledWith(input);
  });

  it('copies the platform text with the real link appended, not a placeholder URL', async () => {
    sdk.copy = copyResult;
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<ProjectSocialCopyGenerator input={input} link="https://ofertaterrenos.com/p/valle-hualane?ref=BK-X" />);

    expect(screen.getByText(/Tu parcela en Hualañé te espera\./)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Copiar con el link/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText.mock.calls[0][0]).toContain('https://ofertaterrenos.com/p/valle-hualane?ref=BK-X');
    expect(writeText.mock.calls[0][0]).toContain('Tu parcela en Hualañé te espera.');
  });
});
