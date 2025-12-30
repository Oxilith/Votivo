/**
 * @file components/insights/__tests__/InsightCard.test.tsx
 * @purpose Unit tests for InsightCard component
 * @functionality
 * - Tests rendering of different insight types (patterns, contradictions, blind spots, leverage points, risks)
 * - Tests conditional rendering of optional fields (evidence, severity, hypothesis, etc.)
 * - Tests i18n translations via mocked react-i18next
 * @dependencies
 * - vitest
 * - @testing-library/react
 * - InsightCard component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InsightCard from '../InsightCard';
import type {
  AnalysisPattern,
  AnalysisContradiction,
  AnalysisBlindSpot,
  AnalysisLeveragePoint,
  AnalysisRisk,
} from '@/types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Keys now use 'insights' namespace, so they're passed without prefix
      const translations: Record<string, string> = {
        'cards.highImpact': 'High Impact',
        'cards.mediumImpact': 'Medium Impact',
        'cards.evidence': 'Evidence',
        'cards.theTension': 'The Tension',
        'cards.vs': 'vs',
        'cards.whatThisMeans': 'What This Means',
        'cards.hypothesis': 'Hypothesis',
        'cards.reframe': 'Reframe',
        'cards.leveragePoint': 'Leverage Point',
        'cards.reflectionQuestion': 'Reflection Question',
      };
      return translations[key] ?? key;
    },
  }),
}));

// Test fixtures
const patternFixture: AnalysisPattern = {
  title: 'Morning Energy Pattern',
  icon: '🌅',
  severity: 'high',
  description: 'You consistently perform better in morning hours.',
  evidence: ['Peak productivity before 10am', 'Decline after lunch'],
  implication: 'Consider scheduling important tasks early.',
  leverage: 'Block mornings for deep work.',
};

const contradictionFixture: AnalysisContradiction = {
  title: 'Work-Life Balance Tension',
  icon: '⚖️',
  description: 'Your values conflict with your behaviors.',
  sides: ['Desire for family time', 'Workaholic tendencies'],
  hypothesis: 'Achievement may be compensating for insecurity.',
  question: 'What would "enough" look like for you?',
};

const blindSpotFixture: AnalysisBlindSpot = {
  title: 'Undervalued Creativity',
  icon: '🎨',
  observation: 'You dismiss creative pursuits as unproductive.',
  evidence: 'Multiple mentions of abandoned artistic hobbies.',
  reframe: 'Creativity enhances problem-solving in all domains.',
};

const leveragePointFixture: AnalysisLeveragePoint & { icon?: string } = {
  title: 'Community Connection',
  insight: 'Building a support network could amplify your growth.',
  icon: '🎯',
};

const riskFixture: AnalysisRisk & { icon?: string } = {
  title: 'Burnout Risk',
  description: 'Current pace is unsustainable without intervention.',
  icon: '⚠️',
};

describe('InsightCard', () => {
  describe('Pattern insight type', () => {
    it('should render title and icon', () => {
      render(<InsightCard item={patternFixture} />);

      expect(screen.getByText('Morning Energy Pattern')).toBeInTheDocument();
      expect(screen.getByText('🌅')).toBeInTheDocument();
    });

    it('should render high severity badge', () => {
      render(<InsightCard item={patternFixture} />);

      expect(screen.getByText('High Impact')).toBeInTheDocument();
    });

    it('should render medium severity badge', () => {
      const mediumPattern = { ...patternFixture, severity: 'medium' as const };
      render(<InsightCard item={mediumPattern} />);

      expect(screen.getByText('Medium Impact')).toBeInTheDocument();
    });

    it('should render description', () => {
      render(<InsightCard item={patternFixture} />);

      expect(screen.getByText('You consistently perform better in morning hours.')).toBeInTheDocument();
    });

    it('should render evidence array as list', () => {
      render(<InsightCard item={patternFixture} />);

      expect(screen.getByText('Evidence')).toBeInTheDocument();
      expect(screen.getByText('Peak productivity before 10am')).toBeInTheDocument();
      expect(screen.getByText('Decline after lunch')).toBeInTheDocument();
    });

    it('should render implication section', () => {
      render(<InsightCard item={patternFixture} />);

      expect(screen.getByText('What This Means')).toBeInTheDocument();
      expect(screen.getByText('Consider scheduling important tasks early.')).toBeInTheDocument();
    });

    it('should render leverage point section', () => {
      render(<InsightCard item={patternFixture} />);

      expect(screen.getByText('Leverage Point')).toBeInTheDocument();
      expect(screen.getByText('Block mornings for deep work.')).toBeInTheDocument();
    });
  });

  describe('Contradiction insight type', () => {
    it('should render title and icon', () => {
      render(<InsightCard item={contradictionFixture} />);

      expect(screen.getByText('Work-Life Balance Tension')).toBeInTheDocument();
      expect(screen.getByText('⚖️')).toBeInTheDocument();
    });

    it('should render description', () => {
      render(<InsightCard item={contradictionFixture} />);

      expect(screen.getByText('Your values conflict with your behaviors.')).toBeInTheDocument();
    });

    it('should render tension sides', () => {
      render(<InsightCard item={contradictionFixture} />);

      expect(screen.getByText('The Tension')).toBeInTheDocument();
      expect(screen.getByText('Desire for family time')).toBeInTheDocument();
      expect(screen.getByText('vs')).toBeInTheDocument();
      expect(screen.getByText('Workaholic tendencies')).toBeInTheDocument();
    });

    it('should render hypothesis', () => {
      render(<InsightCard item={contradictionFixture} />);

      expect(screen.getByText('Hypothesis')).toBeInTheDocument();
      expect(screen.getByText('Achievement may be compensating for insecurity.')).toBeInTheDocument();
    });

    it('should render reflection question', () => {
      render(<InsightCard item={contradictionFixture} />);

      expect(screen.getByText('Reflection Question')).toBeInTheDocument();
      expect(screen.getByText('What would "enough" look like for you?')).toBeInTheDocument();
    });
  });

  describe('BlindSpot insight type', () => {
    it('should render title and icon', () => {
      render(<InsightCard item={blindSpotFixture} />);

      expect(screen.getByText('Undervalued Creativity')).toBeInTheDocument();
      expect(screen.getByText('🎨')).toBeInTheDocument();
    });

    it('should render observation', () => {
      render(<InsightCard item={blindSpotFixture} />);

      expect(screen.getByText('You dismiss creative pursuits as unproductive.')).toBeInTheDocument();
    });

    it('should render evidence as string', () => {
      render(<InsightCard item={blindSpotFixture} />);

      expect(screen.getByText('Evidence')).toBeInTheDocument();
      expect(screen.getByText('Multiple mentions of abandoned artistic hobbies.')).toBeInTheDocument();
    });

    it('should render reframe', () => {
      render(<InsightCard item={blindSpotFixture} />);

      expect(screen.getByText('Reframe')).toBeInTheDocument();
      expect(screen.getByText('Creativity enhances problem-solving in all domains.')).toBeInTheDocument();
    });
  });

  describe('LeveragePoint insight type', () => {
    it('should render title and icon', () => {
      render(<InsightCard item={leveragePointFixture} />);

      expect(screen.getByText('Community Connection')).toBeInTheDocument();
      expect(screen.getByText('🎯')).toBeInTheDocument();
    });

    it('should render insight text', () => {
      render(<InsightCard item={leveragePointFixture} />);

      expect(screen.getByText('Building a support network could amplify your growth.')).toBeInTheDocument();
    });

    it('should render without icon when not provided', () => {
      const noIconLeveragePoint = { title: 'No Icon Point', insight: 'Some insight' };
      render(<InsightCard item={noIconLeveragePoint} />);

      expect(screen.getByText('No Icon Point')).toBeInTheDocument();
      expect(screen.getByText('Some insight')).toBeInTheDocument();
    });
  });

  describe('Risk insight type', () => {
    it('should render title and icon', () => {
      render(<InsightCard item={riskFixture} />);

      expect(screen.getByText('Burnout Risk')).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should render description', () => {
      render(<InsightCard item={riskFixture} />);

      expect(screen.getByText('Current pace is unsustainable without intervention.')).toBeInTheDocument();
    });

    it('should render without icon when not provided', () => {
      const noIconRisk = { title: 'Plain Risk', description: 'A risk description' };
      render(<InsightCard item={noIconRisk} />);

      expect(screen.getByText('Plain Risk')).toBeInTheDocument();
      expect(screen.getByText('A risk description')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle minimal pattern without optional fields populated', () => {
      const minimalPattern: AnalysisPattern = {
        title: 'Minimal',
        icon: '📝',
        severity: 'medium',
        description: 'Basic description',
        evidence: [],
        implication: '',
        leverage: '',
      };
      render(<InsightCard item={minimalPattern} />);

      expect(screen.getByText('Minimal')).toBeInTheDocument();
      expect(screen.getByText('Basic description')).toBeInTheDocument();
      // Empty evidence array should not render
      expect(screen.queryByText('Evidence')).not.toBeInTheDocument();
    });

    it('should handle empty evidence array gracefully', () => {
      const emptyEvidencePattern = {
        ...patternFixture,
        evidence: [],
      };
      render(<InsightCard item={emptyEvidencePattern} />);

      // Evidence section should not render when array is empty
      expect(screen.queryByText('Evidence')).not.toBeInTheDocument();
    });
  });
});
