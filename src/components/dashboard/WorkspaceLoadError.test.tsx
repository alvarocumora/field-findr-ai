// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WorkspaceLoadError from './WorkspaceLoadError';

describe('commercial workspace data recovery', () => {
  it('announces unavailable scoped data and offers an actual retry', () => {
    const retry = vi.fn();
    render(<WorkspaceLoadError title="No pudimos cargar las visitas"
      description="No es posible verificar la agenda en este momento."
      onRetry={retry} />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('No pudimos cargar las visitas');
    expect(alert.textContent).not.toContain('No hay visitas');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar consulta' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
