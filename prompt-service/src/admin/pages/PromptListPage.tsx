/**
 * @file prompt-service/src/admin/pages/PromptListPage.tsx
 * @purpose Lists all prompts with status and actions
 * @functionality
 * - Displays table of all prompts with key, name, model, status
 * - Links to create new prompt
 * - Links to edit existing prompts
 * - Shows loading and error states
 * - Uses Ink & Stone design system colors
 * @dependencies
 * - react-router-dom for navigation
 * - ../hooks/usePrompts for data fetching
 * - ../styles/theme for colors
 */

import { Link } from 'react-router-dom';
import { usePrompts, colors, shadows, fonts } from '@/admin';
import type { PromptDTO } from '@/admin';

export function PromptListPage() {
  const { prompts, loading, error, refetch } = usePrompts();

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading prompts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <p>Error: {error}</p>
          <button onClick={() => void refetch()} style={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Prompts</h1>
        <Link to="/prompts/new" style={styles.createButton}>
          + Create Prompt
        </Link>
      </div>

      {prompts.length === 0 ? (
        <div style={styles.empty}>
          <p>No prompts found. Create your first prompt to get started.</p>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Key</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Model</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Updated</th>
                <th style={{ ...styles.th, width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prompts.map((prompt: PromptDTO) => (
                <tr key={prompt.id} style={styles.tr}>
                  <td style={styles.td}>
                    <code style={styles.code}>{prompt.key}</code>
                  </td>
                  <td style={styles.td}>{prompt.name}</td>
                  <td style={styles.td}>
                    <span style={styles.model}>{prompt.model}</span>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.status,
                        backgroundColor: prompt.isActive ? colors.successBg : colors.dangerBg,
                        color: prompt.isActive ? colors.successText : colors.dangerText,
                      }}
                    >
                      {prompt.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {new Date(prompt.updatedAt).toLocaleDateString()}
                  </td>
                  <td style={styles.td}>
                    <Link to={`/prompts/${prompt.id}`} style={styles.editLink}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: colors.textPrimary,
    margin: 0,
  },
  createButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.625rem 1.25rem',
    backgroundColor: colors.accent,
    color: '#fff',
    borderRadius: '0.5rem',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '0.875rem',
  },
  tableContainer: {
    backgroundColor: colors.bgPrimary,
    borderRadius: '0.75rem',
    boxShadow: shadows.sm,
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '1rem',
    backgroundColor: colors.bgSecondary,
    borderBottom: `1px solid ${colors.border}`,
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: colors.textMuted,
  },
  tr: {
    borderBottom: `1px solid ${colors.border}`,
  },
  td: {
    padding: '1rem',
    fontSize: '0.875rem',
    color: colors.textSecondary,
  },
  code: {
    backgroundColor: colors.bgTertiary,
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.8125rem',
    fontFamily: fonts.mono,
    color: colors.textPrimary,
  },
  model: {
    fontSize: '0.8125rem',
    color: colors.textMuted,
  },
  status: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  editLink: {
    color: colors.accent,
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '0.875rem',
  },
  loading: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: colors.textMuted,
  },
  error: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: colors.danger,
  },
  retryButton: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: colors.accent,
    color: '#fff',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
  },
  empty: {
    textAlign: 'center',
    padding: '4rem 2rem',
    backgroundColor: colors.bgPrimary,
    borderRadius: '0.75rem',
    border: `1px solid ${colors.border}`,
    color: colors.textMuted,
  },
};
