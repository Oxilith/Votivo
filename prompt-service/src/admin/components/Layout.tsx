/**
 * @file prompt-service/src/admin/components/Layout.tsx
 * @purpose Main layout component with navigation sidebar and theme toggle
 * @functionality
 * - Provides consistent page layout with header and sidebar
 * - Navigation links to Prompts and A/B Tests sections
 * - Highlights current active section
 * - Includes logout button and theme toggle in footer
 * - Uses Ink & Stone design system colors
 * @dependencies
 * - react-router-dom for navigation
 * - react for ReactNode type and useState
 * - ../api/auth for logout functionality
 * - ../styles/theme for toggleTheme and getTheme
 */

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { logout, colors, fonts, toggleTheme, getTheme } from '@/admin';

interface LayoutProps {
  children: ReactNode;
}

const navLinkStyles = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem 1rem',
  borderRadius: '0.5rem',
  textDecoration: 'none',
  color: isActive ? colors.accent : colors.textSecondary,
  backgroundColor: isActive ? colors.bgTertiary : 'transparent',
  fontWeight: isActive ? 600 : 400,
  transition: 'all 0.15s ease',
});

export function Layout({ children }: LayoutProps) {
  const [isDark, setIsDark] = useState(getTheme() === 'dark');

  const handleToggleTheme = () => {
    const newIsDark = toggleTheme();
    setIsDark(newIsDark);
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoMark}>V</span>
          <h1 style={styles.logoText}>Prompt Admin</h1>
        </div>
        <nav style={styles.nav}>
          <NavLink to="/prompts" style={navLinkStyles}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Prompts
          </NavLink>
          <NavLink to="/ab-tests" style={navLinkStyles}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            A/B Tests
          </NavLink>
        </nav>
        <div style={styles.footer}>
          <button
            onClick={handleToggleTheme}
            style={styles.themeButton}
            type="button"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={() => void logout()}
            style={styles.logoutButton}
            type="button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
          <span style={styles.footerText}>Votive Prompt Service</span>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    minHeight: '100vh',
  },
  sidebar: {
    width: '250px',
    backgroundColor: colors.bgSecondary,
    borderRight: `1px solid ${colors.borderStrong}`,
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100vh',
    left: 0,
    top: 0,
    transition: 'background-color 0.2s, border-color 0.2s',
  },
  logo: {
    padding: '1.5rem',
    borderBottom: `1px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  logoMark: {
    width: '32px',
    height: '32px',
    backgroundColor: colors.accent,
    color: '#fff',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: fonts.display,
    fontWeight: 600,
    fontSize: '1.125rem',
    transform: 'rotate(-3deg)',
    transition: 'transform 0.2s ease',
  },
  logoText: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: colors.textPrimary,
    margin: 0,
  },
  nav: {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  footer: {
    padding: '1rem',
    borderTop: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  themeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: 'transparent',
    border: `1px solid ${colors.border}`,
    borderRadius: '0.375rem',
    color: colors.textMuted,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    width: '100%',
    justifyContent: 'center',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: 'transparent',
    border: `1px solid ${colors.border}`,
    borderRadius: '0.375rem',
    color: colors.textMuted,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    width: '100%',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: '0.75rem',
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: '0.5rem',
  },
  main: {
    flex: 1,
    marginLeft: '250px',
    padding: '2rem',
    backgroundColor: colors.bgPrimary,
    minHeight: '100vh',
    transition: 'background-color 0.2s',
  },
};
