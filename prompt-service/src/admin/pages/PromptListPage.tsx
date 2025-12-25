/**
 * @file prompt-service/src/admin/pages/PromptListPage.tsx
 * @purpose Lists all prompts with status and actions
 * @functionality
 * - Displays table of all prompts with key, name, model, status
 * - Links to create new prompt
 * - Links to edit existing prompts
 * - Shows loading and error states
 * @dependencies
 * - react-router-dom for navigation
 * - ../hooks/usePrompts for data fetching
 * - ../components/Button for action buttons
 * - ../components/Card for container
 */

import { Link } from 'react-router-dom';
import { usePrompts } from '../hooks/usePrompts.js';
import type { PromptDTO } from '../types.js';

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
                        backgroundColor: prompt.isActive ? '#d1fae5' : '#fee2e2',
                        color: prompt.isActive ? '#065f46' : '#991b1b',
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
    color: '#111827',
    margin: 0,
  },
  createButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.625rem 1.25rem',
    backgroundColor: '#3b82f6',
    color: '#fff',
    borderRadius: '0.5rem',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '0.875rem',
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '1rem',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#6b7280',
  },
  tr: {
    borderBottom: '1px solid #e5e7eb',
  },
  td: {
    padding: '1rem',
    fontSize: '0.875rem',
    color: '#374151',
  },
  code: {
    backgroundColor: '#f3f4f6',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.8125rem',
    fontFamily: 'monospace',
  },
  model: {
    fontSize: '0.8125rem',
    color: '#6b7280',
  },
  status: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  editLink: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '0.875rem',
  },
  loading: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#6b7280',
  },
  error: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#dc2626',
  },
  retryButton: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
  },
  empty: {
    textAlign: 'center',
    padding: '4rem 2rem',
    backgroundColor: '#fff',
    borderRadius: '0.75rem',
    color: '#6b7280',
  },
};
