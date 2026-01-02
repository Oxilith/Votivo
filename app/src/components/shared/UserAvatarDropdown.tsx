/**
 * @file src/components/shared/UserAvatarDropdown.tsx
 * @purpose Reusable user avatar dropdown menu component
 * @functionality
 * - Displays user avatar with initial letter
 * - Shows dropdown menu on click with Profile and Sign Out options
 * - Closes dropdown when clicking outside
 * - Uses translations for menu items
 * - Follows Ink & Stone design system
 * @dependencies
 * - React (useState, useRef, useEffect)
 * - react-i18next (useTranslation)
 * - @/stores (useCurrentUser)
 */

import { useState, useRef, useEffect, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/stores';

interface UserAvatarDropdownProps {
  /** Navigate to profile page - only shown in dropdown if provided */
  onNavigateToProfile?: () => void;
  onSignOut: () => void;
}

const UserAvatarDropdown: FC<UserAvatarDropdownProps> = ({
  onNavigateToProfile,
  onSignOut,
}) => {
  const { t } = useTranslation(['landing', 'header']);
  const user = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user initial for avatar
  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email.charAt(0).toUpperCase() ?? '?';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleProfileClick = () => {
    setIsOpen(false);
    onNavigateToProfile?.();
  };

  const handleSignOutClick = () => {
    setIsOpen(false);
    onSignOut();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); }}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--accent)] text-white font-body text-sm font-medium hover:opacity-90 transition-opacity"
        aria-label={t('nav.profile')}
        aria-expanded={isOpen}
        aria-haspopup="true"
        data-testid="user-avatar-dropdown"
      >
        {userInitial}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-40 bg-[var(--bg-primary)] border border-[var(--border)] shadow-md z-50"
          role="menu"
          aria-orientation="vertical"
          data-testid="user-menu"
        >
          <div className="py-1">
            {onNavigateToProfile && (
              <button
                onClick={handleProfileClick}
                role="menuitem"
                className="w-full text-left px-4 py-2 font-body text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                data-testid="profile-button"
              >
                {t('nav.profile')}
              </button>
            )}
            <button
              onClick={handleSignOutClick}
              role="menuitem"
              className="w-full text-left px-4 py-2 font-body text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              data-testid="sign-out-button"
            >
              {t('nav.signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAvatarDropdown;
