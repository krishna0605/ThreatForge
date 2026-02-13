import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LoginPage from '@/app/(auth)/login/page';
import userEvent from '@testing-library/user-event';

// Mock mocks
const mockLogin = jest.fn();
const mockPush = jest.fn();

jest.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/login',
}));

jest.mock('@/components/ThemeToggle', () => () => <div data-testid="theme-toggle">ThemeToggle</div>);

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByText(/THREAT/)).toBeInTheDocument(); // Logo text
    expect(screen.getByLabelText(/Username \/ System ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Access Key/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Secure Login/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ success: true });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/Username \/ System ID/i), 'test@test.com');
    await user.type(screen.getByLabelText(/Access Key/i), 'password');
    await user.click(screen.getByRole('button', { name: /Secure Login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password', undefined);
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles login error', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ success: false, error: 'Invalid credentials' });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/Username \/ System ID/i), 'test@test.com');
    await user.type(screen.getByLabelText(/Access Key/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /Secure Login/i }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('handles MFA challenge', async () => {
    const user = userEvent.setup();
    // First call returns mfa_required
    mockLogin.mockResolvedValueOnce({ success: false, mfa_required: true });
    // Second call (with MFA) returns success
    mockLogin.mockResolvedValueOnce({ success: true });

    render(<LoginPage />);

    // Step 1: Enter creds
    await user.type(screen.getByLabelText(/Username \/ System ID/i), 'test@test.com');
    await user.type(screen.getByLabelText(/Access Key/i), 'password');
    await user.click(screen.getByRole('button', { name: /Secure Login/i }));

    // Step 2: Check for MFA input
    expect(await screen.findByText(/Enter the 6-digit code/i)).toBeInTheDocument();
    const totpInput = screen.getByPlaceholderText('000000');
    expect(totpInput).toBeInTheDocument();

    // Step 3: Enter TOTP
    await user.type(totpInput, '123456');
    await user.click(screen.getByRole('button', { name: /Verify Code/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password', '123456');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});
