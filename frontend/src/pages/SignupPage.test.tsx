import { screen } from '@testing-library/react';
import { passwordRules } from '@workout-planner/shared';
import { describe, expect, it, vi } from 'vitest';
import authService from '@/services/auth.service';
import { renderWithProviders } from '@/test/render';
import SignupPage from './SignupPage';

vi.mock('@/services/auth.service', () => ({
  default: { signup: vi.fn(), login: vi.fn(), verify: vi.fn() },
}));

function ruleItem(label: string) {
  return screen.getByText(label).closest('li');
}

describe('SignupPage', () => {
  it('shows live hints for each password rule', async () => {
    const { user } = renderWithProviders(<SignupPage />);
    const password = screen.getByLabelText('Password');

    await user.type(password, 'abc');
    expect(ruleItem('One lowercase letter')).toHaveAttribute('data-met', 'true');
    expect(ruleItem('One uppercase letter')).toHaveAttribute('data-met', 'false');
    expect(ruleItem('One number')).toHaveAttribute('data-met', 'false');

    await user.type(password, 'DEF1');
    for (const rule of passwordRules) {
      expect(ruleItem(rule.label)).toHaveAttribute('data-met', 'true');
    }
  });

  it('logs the user in straight after signing up', async () => {
    vi.mocked(authService.signup).mockResolvedValue({
      authToken: 'new-token',
      user: { _id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    });
    const { user } = renderWithProviders(<SignupPage />);

    await user.type(screen.getByLabelText('Name'), 'Alice');
    await user.type(screen.getByLabelText('Email'), 'Alice@Example.com');
    await user.type(screen.getByLabelText('Password'), 'Secret123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await vi.waitFor(() => expect(localStorage.getItem('authToken')).toBe('new-token'));
    expect(authService.signup).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Secret123',
    });
  });
});
