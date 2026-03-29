import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ToastProvider, useToast } from '../components/ToastProvider';

// Helper component that triggers a toast
function ToastTrigger({ message, type }) {
  const { toast } = useToast();
  return (
    <button onClick={() => toast(message, type)}>
      Show Toast
    </button>
  );
}

describe('ToastProvider', () => {
  it('shows a success toast', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger message="Operación exitosa" type="success" />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Operación exitosa')).toBeInTheDocument();
  });

  it('shows an error toast', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger message="Error al guardar" type="error" />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Error al guardar')).toBeInTheDocument();
  });

  it('removes toast when X is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger message="Mensaje a cerrar" type="success" />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Mensaje a cerrar')).toBeInTheDocument();

    // Click the X button inside the toast
    const closeBtn = screen.getByRole('button', { name: '' }); // lucide X button
    await user.click(closeBtn);
    expect(screen.queryByText('Mensaje a cerrar')).not.toBeInTheDocument();
  });
});
