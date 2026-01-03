/**
 * @file prompt-service/src/admin/pages/PromptCreatePage.tsx
 * @purpose Form page for creating new prompts
 * @functionality
 * - Form for entering prompt details (key, name, content, model)
 * - Configures thinking and non-thinking variants
 * - Validates input before submission
 * - Redirects to list page on success
 * @dependencies
 * - react-router-dom for navigation
 * - ../api/promptApi for API calls
 * - ../types for type definitions
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { promptApi } from '@/admin/api';
import { colors, shadows, fonts } from '@/admin/styles';
import { CLAUDE_MODELS } from '@/admin/types';
import type { CreatePromptInput } from '@/admin';

export function PromptCreatePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreatePromptInput>({
    key: '',
    name: '',
    description: '',
    content: '',
    model: 'claude-sonnet-4-5',
    variants: {
      withThinking: {
        temperature: 1,
        maxTokens: 16000,
        budgetTokens: 10000,
      },
      withoutThinking: {
        temperature: 0.7,
        maxTokens: 8000,
      },
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await promptApi.create(formData);
      await navigate('/prompts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prompt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container} data-testid="prompt-create-page">
      <div style={styles.header}>
        <Link to="/prompts" style={styles.backLink} data-testid="prompt-btn-back">
          &larr; Back to Prompts
        </Link>
        <h1 style={styles.title}>Create New Prompt</h1>
      </div>

      {error && (
        <div style={styles.error} role="alert" data-testid="prompt-create-error">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} style={styles.form} aria-label="Create prompt">
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Basic Information</h2>

          <div style={styles.formGroup}>
            <label style={styles.label}>Key *</label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
              style={styles.input}
              placeholder="e.g., IDENTITY_ANALYSIS"
              required
              data-testid="prompt-input-key"
            />
            <span style={styles.hint}>Unique identifier (uppercase, underscores)</span>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={styles.input}
              placeholder="e.g., Identity Analysis Prompt"
              required
              data-testid="prompt-input-name"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ ...styles.input, minHeight: '80px' }}
              placeholder="Brief description of the prompt's purpose"
              data-testid="prompt-input-description"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Model *</label>
            <select
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              style={styles.select}
              required
              data-testid="prompt-select-model"
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

          <div style={styles.formGroup}>
            <label style={styles.label}>Prompt *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              style={{ ...styles.input, minHeight: '300px', fontFamily: 'monospace' }}
              placeholder="Enter your prompt content here..."
              required
              data-testid="prompt-input-content"
            />
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Thinking Variant</h2>
          <p style={styles.hint}>Settings when extended thinking is enabled</p>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Temperature</label>
              <input
                type="number"
                value={formData.variants.withThinking.temperature}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    variants: {
                      ...formData.variants,
                      withThinking: {
                        ...formData.variants.withThinking,
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
                value={formData.variants.withThinking.maxTokens}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    variants: {
                      ...formData.variants,
                      withThinking: {
                        ...formData.variants.withThinking,
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
                value={formData.variants.withThinking.budgetTokens}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    variants: {
                      ...formData.variants,
                      withThinking: {
                        ...formData.variants.withThinking,
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
          <p style={styles.hint}>Settings when extended thinking is disabled</p>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Temperature</label>
              <input
                type="number"
                value={formData.variants.withoutThinking.temperature}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    variants: {
                      ...formData.variants,
                      withoutThinking: {
                        ...formData.variants.withoutThinking,
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
                value={formData.variants.withoutThinking.maxTokens}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    variants: {
                      ...formData.variants,
                      withoutThinking: {
                        ...formData.variants.withoutThinking,
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

        <div style={styles.actions}>
          <Link to="/prompts" style={styles.cancelButton} data-testid="prompt-btn-cancel">
            Cancel
          </Link>
          <button type="submit" style={styles.saveButton} disabled={saving} data-testid="prompt-btn-submit">
            {saving ? 'Creating...' : 'Create Prompt'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '900px',
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
