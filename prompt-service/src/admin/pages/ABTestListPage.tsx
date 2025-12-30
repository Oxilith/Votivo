/**
 * @file prompt-service/src/admin/pages/ABTestListPage.tsx
 * @purpose Lists all A/B tests with status and actions
 * @functionality
 * - Displays table of all A/B tests with name, prompt, status, dates
 * - Shows impression and conversion stats
 * - Links to create new A/B test
 * - Quick activate/deactivate toggle
 * @dependencies
 * - react-router-dom for navigation
 * - ../hooks/useABTests for data fetching
 * - ../api/abTestApi for API calls
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useABTests } from '../hooks/useABTests';
import { abTestApi } from '../api/abTestApi';
import type { ABTestDTO, ABVariantDTO } from '../types';

export function ABTestListPage() {
  const { abTests, loading, error, refetch } = useABTests();
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (id: string, isActive: boolean) => {
    setToggling(id);
    try {
      if (isActive) {
        await abTestApi.deactivate(id);
      } else {
        await abTestApi.activate(id);
      }
      await refetch();
    } catch (err) {
      console.error('Failed to toggle A/B test:', err);
    } finally {
      setToggling(null);
    }
  };

  const calculateConversionRate = (impressions: number, conversions: number): string => {
    if (impressions === 0) return '0%';
    return ((conversions / impressions) * 100).toFixed(1) + '%';
  };

  const getTotalStats = (test: ABTestDTO) => {
    const impressions = test.variants.reduce((sum: number, v: ABVariantDTO) => sum + v.impressions, 0);
    const conversions = test.variants.reduce((sum: number, v: ABVariantDTO) => sum + v.conversions, 0);
    return { impressions, conversions };
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading A/B tests...</div>
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
        <h1 style={styles.title}>A/B Tests</h1>
        <Link to="/ab-tests/new" style={styles.createButton}>
          + Create A/B Test
        </Link>
      </div>

      {abTests.length === 0 ? (
        <div style={styles.empty}>
          <p>No A/B tests found. Create your first test to start experimenting.</p>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Variants</th>
                <th style={styles.th}>Impressions</th>
                <th style={styles.th}>Conversions</th>
                <th style={styles.th}>Conv. Rate</th>
                <th style={styles.th}>Date Range</th>
                <th style={{ ...styles.th, width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {abTests.map((test: ABTestDTO) => {
                const { impressions, conversions } = getTotalStats(test);
                return (
                  <tr key={test.id} style={styles.tr}>
                    <td style={styles.td}>
                      <Link to={`/ab-tests/${test.id}`} style={styles.testLink}>
                        {test.name}
                      </Link>
                      {test.description && (
                        <p style={styles.description}>{test.description}</p>
                      )}
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => void handleToggle(test.id, test.isActive)}
                        disabled={toggling === test.id}
                        style={{
                          ...styles.statusToggle,
                          backgroundColor: test.isActive ? '#d1fae5' : '#f3f4f6',
                          color: test.isActive ? '#065f46' : '#6b7280',
                        }}
                      >
                        {toggling === test.id ? '...' : test.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={styles.td}>{test.variants.length}</td>
                    <td style={styles.td}>{impressions.toLocaleString()}</td>
                    <td style={styles.td}>{conversions.toLocaleString()}</td>
                    <td style={styles.td}>
                      <span style={styles.convRate}>
                        {calculateConversionRate(impressions, conversions)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.dateRange}>
                        {test.startDate
                          ? new Date(test.startDate).toLocaleDateString()
                          : 'No start'}
                        {' - '}
                        {test.endDate
                          ? new Date(test.endDate).toLocaleDateString()
                          : 'No end'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <Link to={`/ab-tests/${test.id}`} style={styles.editLink}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
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
    verticalAlign: 'top',
  },
  testLink: {
    color: '#111827',
    textDecoration: 'none',
    fontWeight: 500,
  },
  description: {
    margin: '0.25rem 0 0 0',
    fontSize: '0.8125rem',
    color: '#6b7280',
  },
  statusToggle: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
  },
  convRate: {
    fontWeight: 600,
    color: '#059669',
  },
  dateRange: {
    fontSize: '0.8125rem',
    color: '#6b7280',
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
