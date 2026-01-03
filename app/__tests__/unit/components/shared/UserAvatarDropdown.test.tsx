/**
 * @file app/__tests__/unit/components/shared/UserAvatarDropdown.test.tsx
 * @purpose Unit tests for UserAvatarDropdown component
 * @functionality
 * - Tests avatar rendering with user initial
 * - Tests dropdown toggle behavior
 * - Tests profile and sign out navigation
 * - Tests outside click to close
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - UserAvatarDropdown under test
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserAvatarDropdown from '@/components/shared/UserAvatarDropdown';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'nav.profile': 'Profile',
        'nav.signOut': 'Sign Out',
      };
      return translations[key] ?? key;
    },
  }),
}));

// Mock useCurrentUser
let mockUser: { name?: string; email: string } | null = {
  name: 'Test User',
  email: 'test@example.com',
};

vi.mock('@/stores', () => ({
  useCurrentUser: () => mockUser,
}));

describe('UserAvatarDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = {
      name: 'Test User',
      email: 'test@example.com',
    };
  });

  describe('avatar rendering', () => {
    it('should render user initial from name', () => {
      render(<UserAvatarDropdown onSignOut={vi.fn()} />);
      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('should render user initial from email when name not available', () => {
      mockUser = { email: 'user@example.com' };
      render(<UserAvatarDropdown onSignOut={vi.fn()} />);
      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('should render ? when no user info available', () => {
      mockUser = null;
      render(<UserAvatarDropdown onSignOut={vi.fn()} />);
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('should have correct aria-label', () => {
      render(<UserAvatarDropdown onSignOut={vi.fn()} />);
      expect(screen.getByLabelText('Profile')).toBeInTheDocument();
    });

    it('should have data-testid for avatar', () => {
      render(<UserAvatarDropdown onSignOut={vi.fn()} />);
      expect(screen.getByTestId('user-avatar-dropdown')).toBeInTheDocument();
    });
  });

  describe('dropdown toggle', () => {
    it('should open dropdown when avatar clicked', async () => {
      const user = userEvent.setup();
      render(<UserAvatarDropdown onSignOut={vi.fn()} />);

      await user.click(screen.getByTestId('user-avatar-dropdown'));

      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
    });

    it('should close dropdown when avatar clicked again', async () => {
      const user = userEvent.setup();
      render(<UserAvatarDropdown onSignOut={vi.fn()} />);

      await user.click(screen.getByTestId('user-avatar-dropdown'));
      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();

      await user.click(screen.getByTestId('user-avatar-dropdown'));
      expect(screen.queryByTestId('sign-out-button')).not.toBeInTheDocument();
    });

    it('should set aria-expanded to true when open', async () => {
      const user = userEvent.setup();
      render(<UserAvatarDropdown onSignOut={vi.fn()} />);

      const button = screen.getByTestId('user-avatar-dropdown');
      expect(button).toHaveAttribute('aria-expanded', 'false');

      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('profile navigation', () => {
    it('should show profile button when onNavigateToProfile provided', async () => {
      const user = userEvent.setup();
      render(
        <UserAvatarDropdown
          onNavigateToProfile={vi.fn()}
          onSignOut={vi.fn()}
        />
      );

      await user.click(screen.getByTestId('user-avatar-dropdown'));

      expect(screen.getByTestId('profile-button')).toBeInTheDocument();
    });

    it('should not show profile button when onNavigateToProfile not provided', async () => {
      const user = userEvent.setup();
      render(<UserAvatarDropdown onSignOut={vi.fn()} />);

      await user.click(screen.getByTestId('user-avatar-dropdown'));

      expect(screen.queryByTestId('profile-button')).not.toBeInTheDocument();
    });

    it('should call onNavigateToProfile and close dropdown when profile clicked', async () => {
      const user = userEvent.setup();
      const onNavigateToProfile = vi.fn();
      render(
        <UserAvatarDropdown
          onNavigateToProfile={onNavigateToProfile}
          onSignOut={vi.fn()}
        />
      );

      await user.click(screen.getByTestId('user-avatar-dropdown'));
      await user.click(screen.getByTestId('profile-button'));

      expect(onNavigateToProfile).toHaveBeenCalled();
      expect(screen.queryByTestId('profile-button')).not.toBeInTheDocument();
    });
  });

  describe('sign out', () => {
    it('should always show sign out button', async () => {
      const user = userEvent.setup();
      render(<UserAvatarDropdown onSignOut={vi.fn()} />);

      await user.click(screen.getByTestId('user-avatar-dropdown'));

      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
    });

    it('should call onSignOut and close dropdown when sign out clicked', async () => {
      const user = userEvent.setup();
      const onSignOut = vi.fn();
      render(<UserAvatarDropdown onSignOut={onSignOut} />);

      await user.click(screen.getByTestId('user-avatar-dropdown'));
      await user.click(screen.getByTestId('sign-out-button'));

      expect(onSignOut).toHaveBeenCalled();
      expect(screen.queryByTestId('sign-out-button')).not.toBeInTheDocument();
    });
  });

  describe('outside click', () => {
    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <UserAvatarDropdown onSignOut={vi.fn()} />
          <div data-testid="outside">Outside content</div>
        </div>
      );

      await user.click(screen.getByTestId('user-avatar-dropdown'));
      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId('outside'));

      expect(screen.queryByTestId('sign-out-button')).not.toBeInTheDocument();
    });
  });
});
