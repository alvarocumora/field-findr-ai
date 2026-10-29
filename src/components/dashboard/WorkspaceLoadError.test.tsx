import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceLoadError } from './WorkspaceLoadError';

describe('workspace query failure recovery', () => {
  it('explains unavailable data without claiming an empty workspace and offers retry', () => {
    const retry = vi.fn();
    render(<WorkspaceLoadError title="No pudimos cargar las reservas" onRetry={retry} />);
    expect(screen.getByRole('alert').textContent).toContain('Esto no significa que no haya registros');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar consulta' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
