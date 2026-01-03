/**
 * @file prompt-service/src/admin/pages/ABTestCreatePage.tsx
 * @purpose Form page for creating new A/B tests
 * @functionality
 * - Select prompt to create A/B test for
 * - Set test name, description, and date range
 * - Redirects to edit page to add variants
 * @dependencies
 * - react-router-dom for navigation
 * - ../api/abTestApi for API calls
 * - ../hooks/usePrompts for prompt selection
 * - ../types for type definitions
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { abTestApi } from '@/admin/api';
import { usePrompts } from '@/admin/hooks';
import { colors, shadows, fonts } from '@/admin/styles';
import type { CreateABTestInput, PromptDTO } from '@/admin';

export function ABTestCreatePage() {
  const navigate = useNavigate();
  const { prompts, loading: loadingPrompts } = usePrompts();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateABTestInput>({
    promptId: '',
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const created = await abTestApi.create(formData);
      await navigate(`/ab-tests/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create A/B test');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container} data-testid="abtest-create-page">
      <div style={styles.header}>
        <Link to="/ab-tests" style={styles.backLink} data-testid="abtest-btn-back">
          &larr; Back to A/B Tests
        </Link>
        <h1 style={styles.title}>Create New A/B Test</h1>
      </div>

      {error && (
        <div style={styles.error} role="alert" data-testid="abtest-create-error">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} style={styles.form} aria-label="Create A/B test">
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Test Configuration</h2>

          <div style={styles.formGroup}>
            <label style={styles.label}>Prompt *</label>
            {loadingPrompts ? (
              <p style={styles.hint}>Loading prompts...</p>
            ) : (
              <select
                value={formData.promptId}
                onChange={(e) => setFormData({ ...formData, promptId: e.target.value })}
                style={styles.select}
                required
                data-testid="abtest-select-prompt"
              >
                <option value="">Select a prompt</option>
                {prompts.map((prompt: PromptDTO) => (
                  <option key={prompt.id} value={prompt.id}>
                    {prompt.name} ({prompt.key})
                  </option>
                ))}
              </select>
            )}
            <span style={styles.hint}>
              The prompt this A/B test will experiment on
            </span>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Test Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={styles.input}
              placeholder="e.g., Tone Comparison Test"
              required
              data-testid="abtest-input-name"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ ...styles.input, minHeight: '80px' }}
              placeholder="Describe the hypothesis and goal of this test"
              data-testid="abtest-input-description"
            />
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Schedule (Optional)</h2>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Start Date</label>
              <input
                type="date"
                value={formData.startDate ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value || undefined })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>End Date</label>
              <input
                type="date"
                value={formData.endDate ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value || undefined })
                }
                style={styles.input}
              />
            </div>
          </div>
          <span style={styles.hint}>
            Leave blank for no schedule restrictions. The test must be activated to run.
          </span>
        </div>

        <div style={styles.actions}>
          <Link to="/ab-tests" style={styles.cancelButton} data-testid="abtest-btn-cancel">
            Cancel
          </Link>
          <button type="submit" style={styles.saveButton} disabled={saving} data-testid="abtest-btn-submit">
            {saving ? 'Creating...' : 'Create A/B Test'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '700px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '2rem',
  },
  backLink: {
    color: colors.textMuted,
    textDecoration: 'none',
    fontSize: '0.875rem',
    display: 'inline-block',
    marginBottom: '0.5rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: colors.textPrimary,
    margin: 0,
  },
  error: {
    padding: '1rem',
    backgroundColor: colors.dangerBg,
    border: `1px solid ${colors.dangerBorder}`,
    borderRadius: '0.5rem',
    color: colors.dangerText,
    marginBottom: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  card: {
    backgroundColor: colors.bgPrimary,
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: shadows.sm,
    border: `1px solid ${colors.border}`,
  },
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: colors.textPrimary,
    margin: '0 0 1rem 0',
  },
  formGroup: {
    marginBottom: '1rem',
    flex: 1,
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: colors.textSecondary,
    marginBottom: '0.375rem',
  },
  input: {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: `1px solid ${colors.borderStrong}`,
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontFamily: fonts.body,
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
    resize: 'vertical' as const,
  },
  select: {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: `1px solid ${colors.borderStrong}`,
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontFamily: fonts.body,
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
  },
  hint: {
    fontSize: '0.75rem',
    color: colors.textMuted,
    marginTop: '0.25rem',
  },
  row: {
    display: 'flex',
    gap: '1rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    paddingTop: '1rem',
  },
  cancelButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.borderStrong}`,
    borderRadius: '0.5rem',
    color: colors.textSecondary,
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '0.875rem',
  },
  saveButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: colors.accent,
    border: 'none',
    borderRadius: '0.5rem',
    color: '#fff',
    fontWeight: 500,
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
};
