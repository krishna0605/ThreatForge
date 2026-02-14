/**
 * Unit Tests — AuthContext (src/lib/AuthContext.tsx)
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock dependencies
jest.mock('@/hooks/useIdleTimeout', () => ({
  useIdleTimeout: () => ({
    showWarning: false,
    remainingSeconds: 0,
    dismissWarning: jest.fn(),
  }),
}));

jest.mock('@/lib/api', () => ({
  getSecurityPreferences: jest.fn().mockResolvedValue({
    session_timeout_enabled: false,
    session_timeout_minutes: 15,
  }),
  apiPost: jest.fn(),
}));

jest.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { apiPost } from '@/lib/api';

function TestConsumer() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="authenticated">{String(isAuthenticated)}</div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
      <button data-testid="login-btn" onClick={() => login('test@test.com', 'pass')}>Login</button>
      <button data-testid="logout-btn" onClick={logout}>Logout</button>
    </div>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
  (window.localStorage.setItem as jest.Mock).mockImplementation(() => {});
  (window.localStorage.removeItem as jest.Mock).mockImplementation(() => {});
});

describe('AuthProvider', () => {
  it('starts unauthenticated when no saved token', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('loads saved token on mount', async () => {
    (window.localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'access_token') return 'saved-token';
      if (key === 'user') return JSON.stringify({ id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', email: 'saved@test.com', display_name: 'S', role: 'analyst', mfa_enabled: false });
      return null;
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toBe('saved@test.com');
  });

  it('login success sets user and token', async () => {
    const user = userEvent.setup();

    (apiPost as jest.Mock).mockResolvedValueOnce({
      status: 'success',
      data: {
        user: { id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', email: 'test@test.com', display_name: 'Test', role: 'analyst', mfa_enabled: false },
        access_token: 'new-token',
        refresh_token: 'new-refresh',
      }
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });
    expect(screen.getByTestId('user').textContent).toBe('test@test.com');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('access_token', 'new-token');
  });

  it('login with MFA required returns mfa_required', async () => {
    const user = userEvent.setup();

    (apiPost as jest.Mock).mockResolvedValueOnce({
      status: 'success',
      data: { mfa_required: true }
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // We can't directly check the return value from the button click,
    // but the user should remain unauthenticated
    await user.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });
  });

  it('logout clears state and localStorage', async () => {
    const user = userEvent.setup();

    (window.localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'access_token') return 'existing-token';
      if (key === 'user') return JSON.stringify({ id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', email: 't@t.com', display_name: 'T', role: 'analyst', mfa_enabled: false });
      return null;
    });

    (apiPost as jest.Mock).mockResolvedValueOnce({});

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    await user.click(screen.getByTestId('logout-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('access_token');
  });
});

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useAuth must be used within an AuthProvider');
    consoleError.mockRestore();
  });
});
