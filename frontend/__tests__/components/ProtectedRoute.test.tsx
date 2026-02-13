/**
 * Component Tests — ProtectedRoute
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock useAuth
const mockPush = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('@/lib/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

import ProtectedRoute from '@/components/auth/ProtectedRoute';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ProtectedRoute', () => {
  it('renders children when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Secret Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByTestId('protected-content').textContent).toBe('Secret Content');
  });

  it('redirects to login when not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Secret Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('shows loading spinner while loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Secret Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    // Should have a loading indicator  
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
