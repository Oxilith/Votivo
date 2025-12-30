/**
 * @file src/components/insights/InsightCard.tsx
 * @purpose Reusable card component for displaying AI analysis insights with Ink & Stone styling
 * @functionality
 * - Renders different insight types (patterns, contradictions, blind spots, leverage points, risks)
 * - Uses type-safe property access with 'in' operator checks for polymorphic rendering
 * - Displays optional fields like evidence, severity, hypothesis based on insight type
 * - Supports icons, titles, and various content sections
 * - Uses vermilion accents for emphasis badges
 * - Supports internationalization (English/Polish)
 * @dependencies
 * - React
 * - react-i18next (useTranslation)
 * - @/types/assessment.types (AnalysisPattern, etc.)
 * - @/styles/theme (cardStyles, textStyles, badgeStyles)
 */

import { useTranslation } from 'react-i18next';
import type {
  AnalysisPattern,
  AnalysisContradiction,
  AnalysisBlindSpot,
  AnalysisLeveragePoint,
  AnalysisRisk,
} from '@/types';
import { cardStyles, textStyles, badgeStyles } from '@/styles';
import React from "react";

/**
 * Extended types for leverage points and risks that may include an icon
 * (added at the usage site in IdentityInsightsAI)
 */
type LeveragePointWithIcon = AnalysisLeveragePoint & { icon?: string };
type RiskWithIcon = AnalysisRisk & { icon?: string };

/**
 * Union type representing all possible insight item types
 */
export type InsightItem =
  | AnalysisPattern
  | AnalysisContradiction
  | AnalysisBlindSpot
  | LeveragePointWithIcon
  | RiskWithIcon;

/**
 * Props for the InsightCard component
 */
export interface InsightCardProps {
  /** The insight item to display */
  item: InsightItem;
}

/**
 * A card component that displays various types of AI-generated insights.
 * Uses type-safe 'in' operator checks for conditional rendering based on
 * which properties exist on the insight item.
 */
const InsightCard: React.FC<InsightCardProps> = ({ item }) => {
  const { t } = useTranslation('insights');

  return (
    <div className={`p-5 ${cardStyles.base} space-y-3`}>
      {/* Header with icon, title, and optional severity badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {'icon' in item && item.icon && <span className="text-2xl">{item.icon}</span>}
          <h4 className={`font-display font-semibold ${textStyles.primary}`}>{item.title}</h4>
        </div>
        {'severity' in item && item.severity && (
          <span
            className={`font-mono text-xs px-2 py-0.5 rounded-sm ${
              item.severity === 'high' ? badgeStyles.accent : badgeStyles.default
            }`}
          >
            {item.severity === 'high' ? t('cards.highImpact') : t('cards.mediumImpact')}
          </span>
        )}
      </div>

      {/* Description (patterns, contradictions, risks) */}
      {'description' in item && item.description && (
        <p className={`font-body ${textStyles.primary} opacity-90`}>{item.description}</p>
      )}

      {/* Observation (blind spots) */}
      {'observation' in item && item.observation && (
        <p className={`font-body ${textStyles.primary} opacity-90`}>{item.observation}</p>
      )}

      {/* Evidence as array (patterns) */}
      {'evidence' in item && item.evidence && Array.isArray(item.evidence) && item.evidence.length > 0 && (
        <div className="space-y-1">
          <p className={`font-mono text-xs uppercase tracking-wider ${textStyles.muted}`}>
            {t('cards.evidence')}
          </p>
          <ul className={`font-body text-sm ${textStyles.secondary} space-y-1`}>
            {item.evidence.map((e: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-[var(--accent)] mt-2 flex-shrink-0" />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Evidence as string (blind spots) */}
      {'evidence' in item && item.evidence && typeof item.evidence === 'string' && (
        <div className="space-y-1">
          <p className={`font-mono text-xs uppercase tracking-wider ${textStyles.muted}`}>
            {t('cards.evidence')}
          </p>
          <p className={`font-body text-sm ${textStyles.secondary}`}>{item.evidence}</p>
        </div>
      )}

      {/* Sides / Tension (contradictions) */}
      {'sides' in item && item.sides && (
        <div className="space-y-1">
          <p className={`font-mono text-xs uppercase tracking-wider ${textStyles.muted}`}>
            {t('cards.theTension')}
          </p>
          <div className={`flex items-center gap-3 font-body text-sm ${textStyles.secondary}`}>
            <span className="px-3 py-1.5 bg-[var(--bg-tertiary)] rounded-sm">{item.sides[0]}</span>
            <span className="text-[var(--text-faint)]">{t('cards.vs')}</span>
            <span className="px-3 py-1.5 bg-[var(--bg-tertiary)] rounded-sm">{item.sides[1]}</span>
          </div>
        </div>
      )}

      {/* Implication (patterns) */}
      {'implication' in item && item.implication && (
        <div className="space-y-1">
          <p className={`font-mono text-xs uppercase tracking-wider ${textStyles.muted}`}>
            {t('cards.whatThisMeans')}
          </p>
          <p className={`font-body text-sm ${textStyles.secondary}`}>{item.implication}</p>
        </div>
      )}

      {/* Hypothesis (contradictions) */}
      {'hypothesis' in item && item.hypothesis && (
        <div className="space-y-1">
          <p className={`font-mono text-xs uppercase tracking-wider ${textStyles.muted}`}>
            {t('cards.hypothesis')}
          </p>
          <p className={`font-body text-sm ${textStyles.secondary}`}>{item.hypothesis}</p>
        </div>
      )}

      {/* Reframe (blind spots) */}
      {'reframe' in item && item.reframe && (
        <div className="space-y-1">
          <p className={`font-mono text-xs uppercase tracking-wider ${textStyles.muted}`}>
            {t('cards.reframe')}
          </p>
          <p className={`font-body text-sm font-medium ${textStyles.secondary}`}>{item.reframe}</p>
        </div>
      )}

      {/* Leverage point (patterns) */}
      {'leverage' in item && item.leverage && (
        <div className="space-y-1">
          <p className={`font-mono text-xs uppercase tracking-wider ${textStyles.muted}`}>
            {t('cards.leveragePoint')}
          </p>
          <p className={`font-body text-sm font-medium text-[var(--accent)]`}>{item.leverage}</p>
        </div>
      )}

      {/* Insight (leverage points) */}
      {'insight' in item && item.insight && (
        <p className={`font-body ${textStyles.primary} opacity-90`}>{item.insight}</p>
      )}

      {/* Reflection question (contradictions) */}
      {'question' in item && item.question && (
        <div className="mt-3 p-3 bg-[var(--bg-secondary)] rounded-sm border-l-2 border-[var(--accent)]">
          <p className={`font-mono text-xs uppercase tracking-wider ${textStyles.muted} mb-1`}>
            {t('cards.reflectionQuestion')}
          </p>
          <p className={`font-body text-sm italic ${textStyles.secondary}`}>{item.question}</p>
        </div>
      )}
    </div>
  );
};

export default InsightCard;
