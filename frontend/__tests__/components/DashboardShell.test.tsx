import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardShell from '@/components/layout/DashboardShell';
import userEvent from '@testing-library/user-event';

// Mock dependencies
const mockPush = jest.fn();
const mockLogout = jest.fn();
const mockUsePathname = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockUsePathname(),
}));

jest.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    user: { display_name: 'Test User', email: 'test@example.com' },
    logout: mockLogout,
  }),
}));

jest.mock('@/lib/api', () => ({
  getUnreadCount: jest.fn().mockResolvedValue({ count: 5 }),
  getNotifications: jest.fn().mockResolvedValue({ notifications: [] }),
  markAllRead: jest.fn().mockResolvedValue({}),
  markNotificationRead: jest.fn().mockResolvedValue({}),
}));

// Mock child components
jest.mock('@/components/ThemeToggle', () => {
  const MockThemeToggle = () => <div data-testid="theme-toggle">ThemeToggle</div>;
  MockThemeToggle.displayName = 'MockThemeToggle';
  return MockThemeToggle;
});

describe('DashboardShell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/dashboard');
  });

  it('renders navigation items', async () => {
    render(
      <DashboardShell>
        <div>Content</div>
      </DashboardShell>
    );

    await screen.findByText('5'); // Wait for unread count to prevent act() warning

    expect(screen.getByText(/THREAT/)).toBeInTheDocument();
    expect(screen.getByText(/\[Dashboard\]/i)).toBeInTheDocument();
    expect(screen.getByText(/\[Scans\]/i)).toBeInTheDocument();
    expect(screen.getByText(/\[Settings\]/i)).toBeInTheDocument();
  });

  it('highlights active nav item', async () => {
    mockUsePathname.mockReturnValue('/scans');
    render(
      <DashboardShell>
        <div>Content</div>
      </DashboardShell>
    );

    await screen.findByText('5'); // Wait for unread count

    const scansLink = screen.getByText(/\[Scans\]/i);
    expect(scansLink).toHaveClass('border-primary/30');
    expect(scansLink).toHaveClass('text-primary');
  });

  it('renders children content', async () => {
    render(
      <DashboardShell>
        <div data-testid="child-content">Child Page Content</div>
      </DashboardShell>
    );
    
    await screen.findByText('5'); // Wait for unread count

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('displays user profile info in dropdown', async () => {

    render(
      <DashboardShell>
        <div>Content</div>
      </DashboardShell>
    );

    await screen.findByText('5'); // Wait for unread count

    // Initial state (dropdown hidden) - we can check existence of user initial
    expect(screen.getByText('T')).toBeInTheDocument();

    // Trigger hover (or just check for presence if visible in DOM but hidden via CSS)
    // Since CSS hover is hard to test in jsdom, we might just check if elements exist
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('handles logout', async () => {
    const user = userEvent.setup();
    render(
      <DashboardShell>
        <div>Content</div>
      </DashboardShell>
    );

    await screen.findByText('5'); // Wait for unread count

    // Click logout button (it might be hidden in dropdown, so we might need to target it directly)
    // The button has "Sign Out" text
    const logoutBtn = screen.getByText(/Sign Out/i);
    await user.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
