/**
 * @file prompt-service/src/admin/components/Layout.tsx
 * @purpose Main layout component with navigation sidebar
 * @functionality
 * - Provides consistent page layout with header and sidebar
 * - Navigation links to Prompts and A/B Tests sections
 * - Highlights current active section
 * - Responsive design for different screen sizes
 * @dependencies
 * - react-router-dom for navigation
 * - react for ReactNode type
 */

import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

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
  color: isActive ? '#3b82f6' : '#4b5563',
  backgroundColor: isActive ? '#eff6ff' : 'transparent',
  fontWeight: isActive ? 600 : 400,
  transition: 'all 0.15s ease',
});

export function Layout({ children }: LayoutProps) {
  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
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
    backgroundColor: '#fff',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100vh',
    left: 0,
    top: 0,
  },
  logo: {
    padding: '1.5rem',
    borderBottom: '1px solid #e5e7eb',
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#111827',
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
    borderTop: '1px solid #e5e7eb',
  },
  footerText: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  },
  main: {
    flex: 1,
    marginLeft: '250px',
    padding: '2rem',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
  },
};
