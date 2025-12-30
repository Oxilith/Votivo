/**
 * @file prompt-service/src/admin/pages/PromptEditPage.tsx
 * @purpose Form page for editing existing prompts
 * @functionality
 * - Loads existing prompt data
 * - Form for editing prompt details
 * - Version history sidebar
 * - Restore to previous version
 * - Delete prompt functionality
 * @dependencies
 * - react-router-dom for navigation and params
 * - ../hooks/usePrompts for data fetching
 * - ../api/promptApi for API calls
 * - ../types for type definitions
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  usePrompt,
  usePromptVersions,
  promptApi,
  colors,
  shadows,
  fonts,
  CLAUDE_MODELS,
} from '@/admin';
import type { UpdatePromptInput, PromptVariantDTO, PromptVersionDTO } from '@/admin';

export function PromptEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { prompt, loading, error: loadError, refetch } = usePrompt(id);
  const { versions, refetch: refetchVersions } = usePromptVersions(id);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [changeNote, setChangeNote] = useState('');

  const [formData, setFormData] = useState<UpdatePromptInput>({});

  useEffect(() => {
    if (prompt) {
      const thinkingVariant = prompt.variants.find((v: PromptVariantDTO) => v.variantType === 'withThinking');
      const nonThinkingVariant = prompt.variants.find((v: PromptVariantDTO) => v.variantType === 'withoutThinking');

      setFormData({
        name: prompt.name,
        description: prompt.description,
        content: prompt.content,
        model: prompt.model,
        variants: {
          withThinking: thinkingVariant
            ? {
                temperature: thinkingVariant.temperature,
                maxTokens: thinkingVariant.maxTokens,
                budgetTokens: thinkingVariant.budgetTokens ?? undefined,
              }
            : undefined,
          withoutThinking: nonThinkingVariant
            ? {
                temperature: nonThinkingVariant.temperature,
                maxTokens: nonThinkingVariant.maxTokens,
              }
            : undefined,
        },
      });
    }
  }, [prompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setError(null);
    setSaving(true);

    try {
      await promptApi.update(id, { ...formData, changeNote: changeNote || undefined });
      setChangeNote('');
      await refetch();
      await refetchVersions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !prompt) return;
    if (!confirm(`Are you sure you want to delete "${prompt.name}"?`)) return;

    try {
      await promptApi.delete(id);
      navigate('/prompts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prompt');
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to restore this version?')) return;

    try {
      await promptApi.restoreVersion(id, versionId);
      await refetch();
      await refetchVersions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore version');
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading prompt...</div>
      </div>
    );
  }

  if (loadError || !prompt) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <p>Error: {loadError ?? 'Prompt not found'}</p>
          <Link to="/prompts" style={styles.backButton}>
            Back to Prompts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <Link to="/prompts" style={styles.backLink}>
            &larr; Back to Prompts
          </Link>
          <h1 style={styles.title}>{prompt.name}</h1>
          <code style={styles.keyBadge}>{prompt.key}</code>
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={() => setShowVersions(!showVersions)}
            style={styles.versionButton}
          >
            {showVersions ? 'Hide' : 'Show'} History ({versions.length})
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <p>{error}</p>
        </div>
      )}

      <div style={styles.layout}>
        <form onSubmit={(e) => void handleSubmit(e)} style={styles.form}>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Basic Information</h2>

            <div style={styles.formGroup}>
              <label style={styles.label}>Name</label>
              <input
                type="text"
                value={formData.name ?? ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                value={formData.description ?? ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ ...styles.input, minHeight: '80px' }}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Model</label>
              <select
                value={formData.model ?? ''}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                style={styles.select}
              >
                {CLAUDE_MODELS.map((model: { value: string; label: string }) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Prompt Content</h2>
            <textarea
              value={formData.content ?? ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              style={{ ...styles.input, minHeight: '300px', fontFamily: 'monospace' }}
            />
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Thinking Variant</h2>

            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Temperature</label>
                <input
                  type="number"
                  value={formData.variants?.withThinking?.temperature ?? 1}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      variants: {
                        ...formData.variants,
                        withThinking: {
                          ...formData.variants?.withThinking,
                          temperature: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  style={styles.input}
                  step="0.1"
                  min="0"
                  max="1"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Max Tokens</label>
                <input
                  type="number"
                  value={formData.variants?.withThinking?.maxTokens ?? 16000}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      variants: {
                        ...formData.variants,
                        withThinking: {
                          ...formData.variants?.withThinking,
                          maxTokens: parseInt(e.target.value, 10),
                        },
                      },
                    })
                  }
                  style={styles.input}
                  min="1"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Budget Tokens</label>
                <input
                  type="number"
                  value={formData.variants?.withThinking?.budgetTokens ?? 10000}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      variants: {
                        ...formData.variants,
                        withThinking: {
                          ...formData.variants?.withThinking,
                          budgetTokens: parseInt(e.target.value, 10),
                        },
                      },
                    })
                  }
                  style={styles.input}
                  min="0"
                />
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Non-Thinking Variant</h2>

            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Temperature</label>
                <input
                  type="number"
                  value={formData.variants?.withoutThinking?.temperature ?? 0.7}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      variants: {
                        ...formData.variants,
                        withoutThinking: {
                          ...formData.variants?.withoutThinking,
                          temperature: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  style={styles.input}
                  step="0.1"
                  min="0"
                  max="1"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Max Tokens</label>
                <input
                  type="number"
                  value={formData.variants?.withoutThinking?.maxTokens ?? 8000}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      variants: {
                        ...formData.variants,
                        withoutThinking: {
                          ...formData.variants?.withoutThinking,
                          maxTokens: parseInt(e.target.value, 10),
                        },
                      },
                    })
                  }
                  style={styles.input}
                  min="1"
                />
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Change Note</h2>
            <input
              type="text"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              style={styles.input}
              placeholder="Briefly describe your changes (optional)"
            />
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              onClick={() => void handleDelete()}
              style={styles.deleteButton}
            >
              Delete
            </button>
            <div style={{ flex: 1 }} />
            <Link to="/prompts" style={styles.cancelButton}>
              Cancel
            </Link>
            <button type="submit" style={styles.saveButton} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {showVersions && (
          <div style={styles.versionsPanel}>
            <h3 style={styles.versionsPanelTitle}>Version History</h3>
            {versions.length === 0 ? (
              <p style={styles.noVersions}>No versions yet</p>
            ) : (
              <div style={styles.versionsList}>
                {versions.map((version: PromptVersionDTO) => (
                  <div key={version.id} style={styles.versionItem}>
                    <div style={styles.versionHeader}>
                      <span style={styles.versionNumber}>v{version.version}</span>
                      <span style={styles.versionDate}>
                        {new Date(version.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {version.changeNote && (
                      <p style={styles.versionNote}>{version.changeNote}</p>
                    )}
                    <button
                      onClick={() => void handleRestoreVersion(version.id)}
                      style={styles.restoreButton}
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
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
    alignItems: 'flex-start',
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
    margin: '0 0 0.5rem 0',
  },
  keyBadge: {
    backgroundColor: colors.bgTertiary,
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    fontFamily: fonts.mono,
    color: colors.textPrimary,
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  versionButton: {
    padding: '0.5rem 1rem',
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.borderStrong}`,
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    color: colors.textSecondary,
  },
  errorBox: {
    padding: '1rem',
    backgroundColor: colors.dangerBg,
    border: `1px solid ${colors.dangerBorder}`,
    borderRadius: '0.5rem',
    color: colors.dangerText,
    marginBottom: '1.5rem',
  },
  layout: {
    display: 'flex',
    gap: '1.5rem',
  },
  form: {
    flex: 1,
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
  row: {
    display: 'flex',
    gap: '1rem',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    paddingTop: '1rem',
  },
  deleteButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.dangerBorder}`,
    borderRadius: '0.5rem',
    color: colors.danger,
    fontWeight: 500,
    fontSize: '0.875rem',
    cursor: 'pointer',
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
  versionsPanel: {
    width: '280px',
    backgroundColor: colors.bgPrimary,
    borderRadius: '0.75rem',
    padding: '1rem',
    boxShadow: shadows.sm,
    border: `1px solid ${colors.border}`,
    alignSelf: 'flex-start',
  },
  versionsPanelTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: colors.textPrimary,
    margin: '0 0 1rem 0',
  },
  noVersions: {
    color: colors.textMuted,
    fontSize: '0.875rem',
  },
  versionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  versionItem: {
    padding: '0.75rem',
    backgroundColor: colors.bgSecondary,
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
  },
  versionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.25rem',
  },
  versionNumber: {
    fontWeight: 600,
    color: colors.accent,
  },
  versionDate: {
    color: colors.textMuted,
    fontSize: '0.75rem',
  },
  versionNote: {
    color: colors.textSecondary,
    margin: '0.25rem 0 0.5rem 0',
    fontSize: '0.8125rem',
  },
  restoreButton: {
    padding: '0.25rem 0.5rem',
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.borderStrong}`,
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    cursor: 'pointer',
    color: colors.textSecondary,
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
  backButton: {
    display: 'inline-block',
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: colors.accent,
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '0.375rem',
  },
};
