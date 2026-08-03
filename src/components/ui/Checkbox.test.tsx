import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('toggles checked state and calls onChange', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Wedding" onChange={onChange} />);

    const checkbox = screen.getByLabelText('Wedding');
    expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('respects a controlled checked value', () => {
    render(<Checkbox label="Haldi" checked readOnly />);
    expect(screen.getByLabelText('Haldi')).toBeChecked();
  });
});
