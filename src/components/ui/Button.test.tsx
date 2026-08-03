import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders its label and fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save Changes</Button>);

    const button = screen.getByRole('button', { name: 'Save Changes' });
    await userEvent.click(button);

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('disables the button and blocks clicks while isLoading', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} isLoading>
        Save Changes
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Save Changes' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
