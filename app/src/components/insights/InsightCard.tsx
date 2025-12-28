/**
 * @file src/components/insights/InsightCard.tsx
 * @purpose Reusable card component for displaying AI analysis insights
 * @functionality
 * - Renders different insight types (patterns, contradictions, blind spots, leverage points, risks)
 * - Uses type-safe property access with 'in' operator checks
 * - Displays optional fields like evidence, severity, hypothesis based on insight type
 * - Supports icons, titles, and various content sections
 * - Uses shared theme styles for consistent appearance
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
} from '@/types/assessment.types';
import { cardStyles, textStyles, badgeStyles } from '@/styles/theme';

/**
 * Discriminator type for identifying insight categories
 */
export type InsightType = 'pattern' | 'contradiction' | 'blindSpot' | 'leverage' | 'risk';

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
  /** The type of insight (used for potential future per-type styling) */
  type: InsightType;
}

/**
 * A card component that displays various types of AI-generated insights.
 * Uses type-safe 'in' operator checks for conditional rendering based on
 * which properties exist on the insight item.
 */
const InsightCard: React.FC<InsightCardProps> = ({ item, type: _type }) => {
  const { t } = useTranslation();

  // Use shared theme styles - all insight types use consistent neutral colors
  // _type is kept for potential future per-type styling

  return (
    <div className={`p-5 ${cardStyles.base} space-y-3`}>
      {/* Header with icon, title, and optional severity badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {'icon' in item && item.icon && <span className="text-2xl">{item.icon}</span>}
          <h4 className={`font-semibold ${textStyles.primary}`}>{item.title}</h4>
        </div>
        {'severity' in item && item.severity && (
          <span
            className={`text-xs px-2 py-0.5  ${
              item.severity === 'high' ? badgeStyles.emphasis : badgeStyles.default
            }`}
          >
            {item.severity === 'high' ? t('insights.cards.highImpact') : t('insights.cards.mediumImpact')}
          </span>
        )}
      </div>

      {/* Description (patterns, contradictions, risks) */}
      {'description' in item && item.description && (
        <p className={`${textStyles.primary} opacity-90`}>{item.description}</p>
      )}

      {/* Observation (blind spots) */}
      {'observation' in item && item.observation && (
        <p className={`${textStyles.primary} opacity-90`}>{item.observation}</p>
      )}

      {/* Evidence as array (patterns) */}
      {'evidence' in item && item.evidence && Array.isArray(item.evidence) && (
        <div className="space-y-1">
          <p className={`text-xs font-medium uppercase tracking-wide ${textStyles.secondary} opacity-70`}>
            {t('insights.cards.evidence')}
          </p>
          <ul className={`text-sm ${textStyles.secondary} space-y-1`}>
            {item.evidence.map((e, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="opacity-50">•</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Evidence as string (blind spots) */}
      {'evidence' in item && item.evidence && typeof item.evidence === 'string' && (
        <div className="space-y-1">
          <p className={`text-xs font-medium uppercase tracking-wide ${textStyles.secondary} opacity-70`}>
            {t('insights.cards.evidence')}
          </p>
          <p className={`text-sm ${textStyles.secondary}`}>{item.evidence}</p>
        </div>
      )}

      {/* Sides / Tension (contradictions) */}
      {'sides' in item && item.sides && (
        <div className="space-y-1">
          <p className={`text-xs font-medium uppercase tracking-wide ${textStyles.secondary} opacity-70`}>
            {t('insights.cards.theTension')}
          </p>
          <div className={`flex items-center gap-3 text-sm ${textStyles.secondary}`}>
            <span className="px-3 py-1.5 bg-[var(--bg-secondary)] ">{item.sides[0]}</span>
            <span className="opacity-50">{t('insights.cards.vs')}</span>
            <span className="px-3 py-1.5 bg-[var(--bg-secondary)] ">{item.sides[1]}</span>
          </div>
        </div>
      )}

      {/* Implication (patterns) */}
      {'implication' in item && item.implication && (
        <div className="space-y-1">
          <p className={`text-xs font-medium uppercase tracking-wide ${textStyles.secondary} opacity-70`}>
            {t('insights.cards.whatThisMeans')}
          </p>
          <p className={`text-sm ${textStyles.secondary}`}>{item.implication}</p>
        </div>
      )}

      {/* Hypothesis (contradictions) */}
      {'hypothesis' in item && item.hypothesis && (
        <div className="space-y-1">
          <p className={`text-xs font-medium uppercase tracking-wide ${textStyles.secondary} opacity-70`}>
            {t('insights.cards.hypothesis')}
          </p>
          <p className={`text-sm ${textStyles.secondary}`}>{item.hypothesis}</p>
        </div>
      )}

      {/* Reframe (blind spots) */}
      {'reframe' in item && item.reframe && (
        <div className="space-y-1">
          <p className={`text-xs font-medium uppercase tracking-wide ${textStyles.secondary} opacity-70`}>
            {t('insights.cards.reframe')}
          </p>
          <p className={`text-sm font-medium ${textStyles.secondary}`}>{item.reframe}</p>
        </div>
      )}

      {/* Leverage point (patterns) */}
      {'leverage' in item && item.leverage && (
        <div className="space-y-1">
          <p className={`text-xs font-medium uppercase tracking-wide ${textStyles.secondary} opacity-70`}>
            {t('insights.cards.leveragePoint')}
          </p>
          <p className={`text-sm font-medium ${textStyles.secondary}`}>{item.leverage}</p>
        </div>
      )}

      {/* Insight (leverage points) */}
      {'insight' in item && item.insight && (
        <p className={`${textStyles.primary} opacity-90`}>{item.insight}</p>
      )}

      {/* Reflection question (contradictions) */}
      {'question' in item && item.question && (
        <div className="mt-3 p-3 bg-[var(--bg-secondary)] ">
          <p className={`text-xs font-medium uppercase tracking-wide ${textStyles.secondary} opacity-70 mb-1`}>
            {t('insights.cards.reflectionQuestion')}
          </p>
          <p className={`text-sm italic ${textStyles.secondary}`}>{item.question}</p>
        </div>
      )}
    </div>
  );
};

export default InsightCard;
