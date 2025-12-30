/**
 * @file prompt-service/src/admin/pages/ABTestEditPage.tsx
 * @purpose Form page for editing A/B tests and managing variants
 * @functionality
 * - Edit test name, description, and date range
 * - Add, edit, and remove variants
 * - Adjust variant weights via modal editor with percentage validation
 * - View impression and conversion statistics
 * - Activate/deactivate test
 * @dependencies
 * - react-router-dom for navigation and params
 * - ../hooks/useABTests for data fetching
 * - ../api/abTestApi for API calls
 * - ../types for type definitions
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useABTest,
  abTestApi,
  colors,
  shadows,
  fonts,
  CLAUDE_MODELS,
} from '@/admin';
import type { UpdateABTestInput, CreateABVariantInput, ABVariantDTO } from '@/admin';

export function ABTestEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { abTest, loading, error: loadError, refetch } = useABTest(id);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [showWeightEditor, setShowWeightEditor] = useState(false);
  const [weightEdits, setWeightEdits] = useState<Record<string, number>>({});
  const [weightError, setWeightError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateABTestInput>({});
  const [newVariant, setNewVariant] = useState<CreateABVariantInput>({
    name: '',
    content: '',
    model: 'claude-sonnet-4-5',
    weight: 0.5,
  });

  useEffect(() => {
    if (abTest) {
      setFormData({
        name: abTest.name,
        description: abTest.description,
        startDate: abTest.startDate
          ? new Date(abTest.startDate).toISOString().split('T')[0]
          : null,
        endDate: abTest.endDate
          ? new Date(abTest.endDate).toISOString().split('T')[0]
          : null,
      });
    }
  }, [abTest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setError(null);
    setSaving(true);

    try {
      await abTestApi.update(id, formData);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update A/B test');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!id || !abTest) return;

    try {
      if (abTest.isActive) {
        await abTestApi.deactivate(id);
      } else {
        await abTestApi.activate(id);
      }
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle status');
    }
  };

  const handleDelete = async () => {
    if (!id || !abTest) return;
    if (!confirm(`Are you sure you want to delete "${abTest.name}"?`)) return;

    try {
      await abTestApi.delete(id);
      navigate('/ab-tests');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete A/B test');
    }
  };

  const handleAddVariant = async () => {
    if (!id) return;

    try {
      await abTestApi.addVariant(id, newVariant);
      await refetch();
      setShowAddVariant(false);
      setNewVariant({
        name: '',
        content: '',
        model: 'claude-sonnet-4-5',
        weight: 0.5,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add variant');
    }
  };

  const handleRemoveVariant = async (variantId: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to remove this variant?')) return;

    try {
      await abTestApi.removeVariant(id, variantId);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove variant');
    }
  };

  const openWeightEditor = () => {
    if (!abTest) return;
    // Initialize with current weights (as percentages)
    const initialWeights: Record<string, number> = {};
    abTest.variants.forEach((v) => {
      initialWeights[v.id] = Math.round(v.weight * 100);
    });
    setWeightEdits(initialWeights);
    setWeightError(null);
    setShowWeightEditor(true);
  };

  const closeWeightEditor = () => {
    setShowWeightEditor(false);
    setWeightEdits({});
    setWeightError(null);
  };

  const handleWeightChange = (variantId: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      setWeightEdits((prev) => ({ ...prev, [variantId]: 0 }));
      return;
    }
    if (numValue < 0 || numValue > 100) return;
    setWeightEdits((prev) => ({ ...prev, [variantId]: numValue }));
    setWeightError(null);
  };

  const calculateTotalWeight = (): number => {
    return Object.values(weightEdits).reduce((sum, w) => sum + w, 0);
  };

  const saveWeights = async () => {
    if (!id || !abTest) return;

    const total = calculateTotalWeight();
    if (total !== 100) {
      setWeightError(`Weights must sum to 100% (currently ${total}%)`);
      return;
    }

    setSaving(true);
    setWeightError(null);

    try {
      // Update each variant's weight
      for (const [variantId, weight] of Object.entries(weightEdits)) {
        await abTestApi.updateVariant(id, variantId, { weight: weight / 100 });
      }
      await refetch();
      closeWeightEditor();
    } catch (err) {
      setWeightError(err instanceof Error ? err.message : 'Failed to save weights');
    } finally {
      setSaving(false);
    }
  };

  const calculateConversionRate = (impressions: number, conversions: number): string => {
    if (impressions === 0) return '0%';
    return ((conversions / impressions) * 100).toFixed(1) + '%';
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading A/B test...</div>
      </div>
    );
  }

  if (loadError || !abTest) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <p>Error: {loadError ?? 'A/B test not found'}</p>
          <Link to="/ab-tests" style={styles.backButton}>
            Back to A/B Tests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <Link to="/ab-tests" style={styles.backLink}>
            &larr; Back to A/B Tests
          </Link>
          <h1 style={styles.title}>{abTest.name}</h1>
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={() => void handleToggleActive()}
            style={{
              ...styles.statusButton,
              backgroundColor: abTest.isActive ? colors.successBg : colors.bgTertiary,
              color: abTest.isActive ? colors.successText : colors.textMuted,
            }}
          >
            {abTest.isActive ? 'Active' : 'Inactive'}
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} style={styles.form}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Test Configuration</h2>

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

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Start Date</label>
              <input
                type="date"
                value={formData.startDate ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value || null })
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
                  setFormData({ ...formData, endDate: e.target.value || null })
                }
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formActions}>
            <button type="submit" style={styles.saveButton} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>

      <div style={styles.card}>
        <div style={styles.variantsHeader}>
          <h2 style={styles.sectionTitle}>Variants ({abTest.variants.length})</h2>
          <div style={styles.variantsActions}>
            {abTest.variants.length >= 2 && (
              <button
                onClick={openWeightEditor}
                style={styles.editWeightsButton}
              >
                Edit Weights
              </button>
            )}
            <button
              onClick={() => setShowAddVariant(true)}
              style={styles.addVariantButton}
            >
              + Add Variant
            </button>
          </div>
        </div>

        {abTest.variants.length === 0 ? (
          <p style={styles.noVariants}>
            No variants yet. Add at least 2 variants to run this A/B test.
          </p>
        ) : (
          <div style={styles.variantsList}>
            {abTest.variants.map((variant: ABVariantDTO) => (
              <div key={variant.id} style={styles.variantCard}>
                <div style={styles.variantHeader}>
                  <span style={styles.variantName}>{variant.name}</span>
                  <span style={styles.variantModel}>{variant.model}</span>
                </div>

                <div style={styles.variantStats}>
                  <div style={styles.stat}>
                    <span style={styles.statValue}>{variant.impressions.toLocaleString()}</span>
                    <span style={styles.statLabel}>Impressions</span>
                  </div>
                  <div style={styles.stat}>
                    <span style={styles.statValue}>{variant.conversions.toLocaleString()}</span>
                    <span style={styles.statLabel}>Conversions</span>
                  </div>
                  <div style={styles.stat}>
                    <span style={styles.statValue}>
                      {calculateConversionRate(variant.impressions, variant.conversions)}
                    </span>
                    <span style={styles.statLabel}>Conv. Rate</span>
                  </div>
                </div>

                <div style={styles.weightDisplay}>
                  <span style={styles.weightText}>
                    Weight: {(variant.weight * 100).toFixed(0)}%
                  </span>
                </div>

                <details style={styles.variantDetails}>
                  <summary style={styles.variantSummary}>View Prompt Content</summary>
                  <pre style={styles.variantContent}>{variant.content}</pre>
                </details>

                <button
                  onClick={() => void handleRemoveVariant(variant.id)}
                  style={styles.removeVariantButton}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddVariant && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Add New Variant</h3>

            <div style={styles.formGroup}>
              <label style={styles.label}>Variant Name *</label>
              <input
                type="text"
                value={newVariant.name}
                onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                style={styles.input}
                placeholder="e.g., Control, Variation A"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Model</label>
              <select
                value={newVariant.model}
                onChange={(e) => setNewVariant({ ...newVariant, model: e.target.value })}
                style={styles.select}
              >
                {CLAUDE_MODELS.map((model: { value: string; label: string }) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Prompt Content *</label>
              <textarea
                value={newVariant.content}
                onChange={(e) => setNewVariant({ ...newVariant, content: e.target.value })}
                style={{ ...styles.input, minHeight: '200px', fontFamily: 'monospace' }}
                placeholder="Enter the variant's prompt content"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Initial Weight (%)</label>
              <div style={styles.weightInputRow}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round((newVariant.weight ?? 0.5) * 100)}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (!isNaN(value) && value >= 0 && value <= 100) {
                      setNewVariant({ ...newVariant, weight: value / 100 });
                    }
                  }}
                  style={styles.weightNumberInput}
                />
                <span style={styles.weightPercent}>%</span>
              </div>
              <p style={styles.helpText}>
                Weights will be normalized after adding the variant.
              </p>
            </div>

            <div style={styles.modalActions}>
              <button
                onClick={() => setShowAddVariant(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleAddVariant()}
                style={styles.saveButton}
                disabled={!newVariant.name || !newVariant.content}
              >
                Add Variant
              </button>
            </div>
          </div>
        </div>
      )}

      {showWeightEditor && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Edit Variant Weights</h3>
            <p style={styles.modalDescription}>
              Weights must sum to 100%. Variants are selected randomly based on these percentages.
            </p>

            {weightError && (
              <div style={styles.weightErrorBox}>{weightError}</div>
            )}

            <div style={styles.weightEditorList}>
              {abTest.variants.map((variant) => (
                <div key={variant.id} style={styles.weightEditorRow}>
                  <span style={styles.weightEditorName}>{variant.name}</span>
                  <div style={styles.weightInputRow}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={weightEdits[variant.id] ?? Math.round(variant.weight * 100)}
                      onChange={(e) => handleWeightChange(variant.id, e.target.value)}
                      style={styles.weightNumberInput}
                    />
                    <span style={styles.weightPercent}>%</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.weightEditorTotal}>
              Total: {calculateTotalWeight()}%
              {calculateTotalWeight() !== 100 && (
                <span style={styles.weightTotalError}> (must equal 100%)</span>
              )}
            </div>

            <div style={styles.modalActions}>
              <button onClick={closeWeightEditor} style={styles.cancelButton}>
                Cancel
              </button>
              <button
                onClick={() => void saveWeights()}
                style={styles.saveButton}
                disabled={calculateTotalWeight() !== 100 || saving}
              >
                {saving ? 'Saving...' : 'Save Weights'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.dangerZone}>
        <h3 style={styles.dangerTitle}>Danger Zone</h3>
        <p style={styles.dangerText}>
          Deleting this A/B test will remove all variants and statistics. This action cannot be undone.
        </p>
        <button onClick={() => void handleDelete()} style={styles.deleteButton}>
          Delete A/B Test
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '900px',
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
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  statusButton: {
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    border: 'none',
    fontWeight: 500,
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  errorBox: {
    padding: '1rem',
    backgroundColor: colors.dangerBg,
    border: `1px solid ${colors.dangerBorder}`,
    borderRadius: '0.5rem',
    color: colors.dangerText,
    marginBottom: '1.5rem',
  },
  form: {
    marginBottom: '1.5rem',
  },
  card: {
    backgroundColor: colors.bgPrimary,
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: shadows.sm,
    border: `1px solid ${colors.border}`,
    marginBottom: '1.5rem',
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
  formActions: {
    marginTop: '1rem',
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
  variantsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  addVariantButton: {
    padding: '0.5rem 1rem',
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.borderStrong}`,
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    color: colors.textSecondary,
  },
  noVariants: {
    color: colors.textMuted,
    textAlign: 'center',
    padding: '2rem',
  },
  variantsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  variantCard: {
    padding: '1rem',
    backgroundColor: colors.bgSecondary,
    borderRadius: '0.5rem',
    border: `1px solid ${colors.border}`,
  },
  variantHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
  },
  variantName: {
    fontWeight: 600,
    color: colors.textPrimary,
  },
  variantModel: {
    fontSize: '0.8125rem',
    color: colors.textMuted,
  },
  variantStats: {
    display: 'flex',
    gap: '2rem',
    marginBottom: '1rem',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
  },
  statValue: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: '0.75rem',
    color: colors.textMuted,
  },
  weightControl: {
    marginBottom: '0.75rem',
  },
  weightLabel: {
    display: 'block',
    fontSize: '0.8125rem',
    color: colors.textSecondary,
    marginBottom: '0.25rem',
  },
  weightSlider: {
    width: '100%',
    cursor: 'pointer',
  },
  variantDetails: {
    marginBottom: '0.75rem',
  },
  variantSummary: {
    fontSize: '0.8125rem',
    color: colors.accent,
    cursor: 'pointer',
  },
  variantContent: {
    marginTop: '0.5rem',
    padding: '0.75rem',
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    fontFamily: fonts.mono,
    overflow: 'auto',
    maxHeight: '200px',
    whiteSpace: 'pre-wrap',
    color: colors.textPrimary,
  },
  removeVariantButton: {
    padding: '0.25rem 0.5rem',
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.dangerBorder}`,
    borderRadius: '0.25rem',
    color: colors.danger,
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  modal: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: colors.bgPrimary,
    borderRadius: '0.75rem',
    padding: '1.5rem',
    width: '600px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'auto',
    border: `1px solid ${colors.border}`,
    boxShadow: shadows.md,
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: colors.textPrimary,
    margin: '0 0 1.5rem 0',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '1.5rem',
  },
  cancelButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.borderStrong}`,
    borderRadius: '0.5rem',
    color: colors.textSecondary,
    fontWeight: 500,
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  dangerZone: {
    backgroundColor: colors.bgPrimary,
    borderRadius: '0.75rem',
    padding: '1.5rem',
    border: `1px solid ${colors.dangerBorder}`,
  },
  dangerTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: colors.danger,
    margin: '0 0 0.5rem 0',
  },
  dangerText: {
    fontSize: '0.875rem',
    color: colors.textMuted,
    margin: '0 0 1rem 0',
  },
  deleteButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: colors.danger,
    border: 'none',
    borderRadius: '0.5rem',
    color: '#fff',
    fontWeight: 500,
    fontSize: '0.875rem',
    cursor: 'pointer',
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
  // Weight editor styles
  weightDisplay: {
    marginBottom: '0.75rem',
  },
  weightText: {
    fontSize: '0.875rem',
    color: colors.textSecondary,
    fontWeight: 500,
  },
  variantsActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  editWeightsButton: {
    padding: '0.5rem 1rem',
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.borderStrong}`,
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    color: colors.textSecondary,
  },
  modalDescription: {
    fontSize: '0.875rem',
    color: colors.textMuted,
    marginBottom: '1.5rem',
    marginTop: 0,
  },
  weightEditorList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  weightEditorRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: colors.bgSecondary,
    borderRadius: '0.375rem',
  },
  weightEditorName: {
    fontWeight: 500,
    color: colors.textPrimary,
  },
  weightInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  weightNumberInput: {
    width: '70px',
    padding: '0.5rem',
    border: `1px solid ${colors.borderStrong}`,
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    textAlign: 'right' as const,
    fontFamily: fonts.body,
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
  },
  weightPercent: {
    color: colors.textMuted,
    fontSize: '0.875rem',
  },
  weightEditorTotal: {
    padding: '0.75rem',
    backgroundColor: colors.bgTertiary,
    borderRadius: '0.375rem',
    fontWeight: 500,
    textAlign: 'center',
    marginBottom: '1rem',
    color: colors.textPrimary,
  },
  weightTotalError: {
    color: colors.danger,
  },
  weightErrorBox: {
    padding: '0.75rem',
    backgroundColor: colors.dangerBg,
    border: `1px solid ${colors.dangerBorder}`,
    borderRadius: '0.375rem',
    color: colors.dangerText,
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  helpText: {
    fontSize: '0.75rem',
    color: colors.textMuted,
    marginTop: '0.25rem',
    marginBottom: 0,
  },
};
