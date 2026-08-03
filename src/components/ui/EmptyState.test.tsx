import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title, description, and optional action', () => {
    render(
      <EmptyState
        icon={Users}
        title="No families yet"
        description="Add your first family to get started."
        action={<button>Add Family</button>}
      />
    );

    expect(screen.getByText('No families yet')).toBeInTheDocument();
    expect(screen.getByText('Add your first family to get started.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Family' })).toBeInTheDocument();
  });

  it('omits the action when none is provided', () => {
    render(<EmptyState icon={Users} title="No families yet" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
