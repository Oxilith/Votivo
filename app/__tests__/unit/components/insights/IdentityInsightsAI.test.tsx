/**
 * @file app/__tests__/unit/components/insights/IdentityInsightsAI.test.tsx
 * @purpose Unit tests for IdentityInsightsAI component
 * @functionality
 * - Tests no assessment data state
 * - Tests ready for analysis state
 * - Tests loading state
 * - Tests error state with retry
 * - Tests analysis tabs display
 * - Tests tab switching
 * - Tests synthesis tab content
 * - Tests read-only mode
 * - Tests re-analyze button
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - IdentityInsightsAI under test
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IdentityInsightsAI from '@/components/insights/IdentityInsightsAI';
import type { AIAnalysisResult, AssessmentResponses } from '@votive/shared';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Mock analysis store
const mockAnalyze = vi.fn();
const mockDownloadRawResponse = vi.fn();
let mockStoreAnalysis: AIAnalysisResult | null = null;
let mockRawResponse: string | null = null;
let mockIsAnalyzing = false;
let mockAnalysisError: string | null = null;

vi.mock('@/stores/useAnalysisStore', () => ({
  useAnalysisStore: () => ({
    analysis: mockStoreAnalysis,
    rawResponse: mockRawResponse,
    isAnalyzing: mockIsAnalyzing,
    analysisError: mockAnalysisError,
    analyze: mockAnalyze,
    downloadRawResponse: mockDownloadRawResponse,
  }),
}));

// Mock auth store
let mockIsAuthenticated = false;
const mockCurrentUser = null;

vi.mock('@/stores/useAuthStore', () => ({
  useIsAuthenticated: () => mockIsAuthenticated,
  useCurrentUser: () => mockCurrentUser,
}));

// Mock assessment store - savedAt determines if assessment is completed (readonly)
const mockSavedAt: string | null = '2024-01-01T00:00:00Z'; // Default to completed

vi.mock('@/stores/useAssessmentStore', () => ({
  useAssessmentStore: (selector?: (state: { savedAt: string | null }) => unknown) => {
    const state = { savedAt: mockSavedAt };
    if (typeof selector === 'function') {
      return selector(state);
    }
    return state;
  },
}));

// Mock authService
vi.mock('@/services/api/AuthService', () => ({
  authService: {
    saveAnalysis: vi.fn().mockResolvedValue({}),
  },
}));

// Mock components from @/components barrel
vi.mock('@/components', () => ({
  FooterSection: () => <div data-testid="footer" />,
  PageNavigation: () => <div data-testid="page-navigation" />,
  InkBrushDecoration: () => <div data-testid="ink-brush" />,
  InkLoader: () => <div data-testid="ink-loader" />,
  PendingChangesAlert: () => <div data-testid="pending-changes-alert" />,
  ErrorCircleIcon: () => <span data-testid="error-icon" />,
  SearchIcon: () => <span data-testid="search-icon" />,
  SwitchHorizontalIcon: () => <span data-testid="switch-icon" />,
  EyeIcon: () => <span data-testid="eye-icon" />,
  TargetIcon: () => <span data-testid="target-icon" />,
  AlertTriangleIcon: () => <span data-testid="alert-icon" />,
  MirrorIcon: () => <span data-testid="mirror-icon" />,
  RefreshIcon: () => <span data-testid="refresh-icon" />,
  LightningBoltIcon: () => <span data-testid="lightning-icon" />,
  ArrowRightIcon: () => <span data-testid="arrow-icon" />,
}));

vi.mock('@/components/insights/InsightsPageHeader', () => ({
  default: () => <div data-testid="insights-header" />,
}));

vi.mock('@/components/insights/InsightCard', () => ({
  default: ({ item }: { item: { title: string } }) => (
    <div data-testid="insight-card">{item.title}</div>
  ),
}));

vi.mock('@/components/insights/SavePromptModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="save-prompt-modal" /> : null,
}));

// Mock fileUtils
vi.mock('@/utils', () => ({
  importFromJson: vi.fn(),
  logger: { error: vi.fn() },
}));

// Mock styles
vi.mock('@/styles', () => ({
  cardStyles: { base: 'card-base', hero: 'card-hero' },
  textStyles: { primary: 'text-primary', secondary: 'text-secondary', muted: 'text-muted' },
}));

describe('IdentityInsightsAI', () => {
  const mockResponses: AssessmentResponses = {
    peak_energy_times: ['mid_morning'],
    low_energy_times: ['late_night'],
    energy_consistency: 4,
    energy_drains: 'Meetings',
    energy_restores: 'Creative work',
    mood_triggers_negative: ['overwhelm'],
    motivation_reliability: 3,
    willpower_pattern: 'distraction',
    identity_statements: 'I am a learner',
    others_describe: 'Creative',
    automatic_behaviors: 'Coffee routine',
    keystone_behaviors: 'Exercise',
    core_values: ['growth'],
    natural_strengths: 'Problem solving',
    resistance_patterns: 'Procrastination',
    identity_clarity: 4,
  };

  const mockAnalysis: AIAnalysisResult = {
    patterns: [
      {
        title: 'Morning routine',
        icon: '🌅',
        severity: 'high',
        description: 'Consistent morning routine',
        evidence: ['Wakes up early', 'Exercises daily'],
        implication: 'Strong discipline',
        leverage: 'Build on existing routine',
      },
    ],
    contradictions: [
      {
        title: 'Values health',
        icon: '⚖️',
        description: 'Health vs work conflict',
        sides: ['Stated value: health', 'Observed: skips exercise'],
        hypothesis: 'Time pressure',
        question: 'How to prioritize health?',
      },
    ],
    blindSpots: [
      {
        title: 'Self-care',
        icon: '👁️',
        observation: 'Burnout signs visible',
        evidence: 'Working late regularly',
        reframe: 'Rest is productive',
      },
    ],
    leveragePoints: [
      {
        title: 'Morning meditation',
        insight: 'Reduced stress through mindfulness',
      },
    ],
    risks: [
      {
        title: 'Overwork',
        description: 'Burnout risk from consistent overwork',
      },
    ],
    identitySynthesis: {
      currentIdentityCore: 'You are a dedicated professional',
      hiddenStrengths: ['Empathy', 'Creativity'],
      keyTension: 'Balance work and life',
      nextIdentityStep: 'Practice saying no',
    },
  };

  const defaultProps = {
    responses: mockResponses,
    onNavigateToLanding: vi.fn(),
    onNavigateToAssessment: vi.fn(),
    onNavigateToAuth: vi.fn(),
    onNavigateToProfile: vi.fn(),
    onSignOut: vi.fn(),
    hasAnalysis: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreAnalysis = null;
    mockRawResponse = null;
    mockIsAnalyzing = false;
    mockAnalysisError = null;
    mockIsAuthenticated = false;
  });

  describe('no assessment data state', () => {
    const emptyResponses = {} as AssessmentResponses;

    it('should show prompt to complete assessment when no responses', () => {
      render(<IdentityInsightsAI {...defaultProps} responses={emptyResponses} />);

      expect(screen.getByText('noAssessment.title')).toBeInTheDocument();
      expect(screen.getByText('noAssessment.description')).toBeInTheDocument();
      expect(screen.getByText('noAssessment.button')).toBeInTheDocument();
    });

    it('should navigate to assessment when button is clicked', async () => {
      const user = userEvent.setup();
      const onNavigateToAssessment = vi.fn();

      render(
        <IdentityInsightsAI
          {...defaultProps}
          responses={emptyResponses}
          onNavigateToAssessment={onNavigateToAssessment}
        />
      );

      await user.click(screen.getByTestId('insights-btn-start-assessment'));

      expect(onNavigateToAssessment).toHaveBeenCalled();
    });
  });

  describe('ready for analysis state', () => {
    it('should show ready state when responses exist but no analysis', () => {
      render(<IdentityInsightsAI {...defaultProps} />);

      expect(screen.getByText('ready.title')).toBeInTheDocument();
      expect(screen.getByText('ready.description')).toBeInTheDocument();
      expect(screen.getByText('ready.button')).toBeInTheDocument();
    });

    it('should call analyze when button is clicked', async () => {
      const user = userEvent.setup();

      render(<IdentityInsightsAI {...defaultProps} />);
      await user.click(screen.getByTestId('insights-btn-analyze'));

      expect(mockAnalyze).toHaveBeenCalledWith(mockResponses, 'english', undefined);
    });
  });

  describe('loading state', () => {
    it('should show loading state when analyzing', () => {
      mockIsAnalyzing = true;

      render(<IdentityInsightsAI {...defaultProps} />);

      expect(screen.getByTestId('ink-loader')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error state when analysis fails', () => {
      mockAnalysisError = 'Analysis failed';

      render(<IdentityInsightsAI {...defaultProps} />);

      expect(screen.getByText('error.title')).toBeInTheDocument();
      expect(screen.getByText('Analysis failed')).toBeInTheDocument();
    });

    it('should show try again button in error state', () => {
      mockAnalysisError = 'Analysis failed';

      render(<IdentityInsightsAI {...defaultProps} />);

      expect(screen.getByText('error.tryAgain')).toBeInTheDocument();
    });

    it('should call analyze when try again is clicked', async () => {
      const user = userEvent.setup();
      mockAnalysisError = 'Analysis failed';

      render(<IdentityInsightsAI {...defaultProps} />);
      await user.click(screen.getByTestId('insights-btn-try-again'));

      expect(mockAnalyze).toHaveBeenCalled();
    });

    it('should show download raw button when raw response exists', () => {
      mockAnalysisError = 'Parse error';
      mockRawResponse = '{"some": "data"}';

      render(<IdentityInsightsAI {...defaultProps} />);

      expect(screen.getByTestId('insights-btn-download-raw')).toBeInTheDocument();
    });

    it('should call downloadRawResponse when download button is clicked', async () => {
      const user = userEvent.setup();
      mockAnalysisError = 'Parse error';
      mockRawResponse = '{"some": "data"}';

      render(<IdentityInsightsAI {...defaultProps} />);
      await user.click(screen.getByTestId('insights-btn-download-raw'));

      expect(mockDownloadRawResponse).toHaveBeenCalled();
    });
  });

  describe('analysis display', () => {
    beforeEach(() => {
      mockStoreAnalysis = mockAnalysis;
    });

    it('should render tabs when analysis exists', () => {
      render(<IdentityInsightsAI {...defaultProps} />);

      expect(screen.getByText('tabs.patterns')).toBeInTheDocument();
      expect(screen.getByText('tabs.contradictions')).toBeInTheDocument();
      expect(screen.getByText('tabs.blindSpots')).toBeInTheDocument();
      expect(screen.getByText('tabs.leverage')).toBeInTheDocument();
      expect(screen.getByText('tabs.risks')).toBeInTheDocument();
      expect(screen.getByText('tabs.synthesis')).toBeInTheDocument();
    });

    it('should show patterns tab by default', () => {
      render(<IdentityInsightsAI {...defaultProps} />);

      const insightCards = screen.getAllByTestId('insight-card');
      expect(insightCards[0]).toHaveTextContent('Morning routine');
    });

    it('should switch tabs when clicked', async () => {
      const user = userEvent.setup();

      render(<IdentityInsightsAI {...defaultProps} />);
      await user.click(screen.getByTestId('insights-tab-contradictions'));

      const insightCards = screen.getAllByTestId('insight-card');
      expect(insightCards[0]).toHaveTextContent('Values health');
    });

    it('should show synthesis tab content', async () => {
      const user = userEvent.setup();

      render(<IdentityInsightsAI {...defaultProps} />);
      await user.click(screen.getByTestId('insights-tab-synthesis'));

      expect(screen.getByText('synthesisTab.whoYouAre')).toBeInTheDocument();
      expect(screen.getByText('You are a dedicated professional')).toBeInTheDocument();
    });

    it('should show hidden strengths in synthesis tab', async () => {
      const user = userEvent.setup();

      render(<IdentityInsightsAI {...defaultProps} />);
      await user.click(screen.getByTestId('insights-tab-synthesis'));

      expect(screen.getByText('synthesisTab.hiddenStrengths')).toBeInTheDocument();
      expect(screen.getByText('Empathy')).toBeInTheDocument();
      expect(screen.getByText('Creativity')).toBeInTheDocument();
    });

    it('should show key tension in synthesis tab', async () => {
      const user = userEvent.setup();

      render(<IdentityInsightsAI {...defaultProps} />);
      await user.click(screen.getByTestId('insights-tab-synthesis'));

      expect(screen.getByText('synthesisTab.keyTension')).toBeInTheDocument();
      expect(screen.getByText('Balance work and life')).toBeInTheDocument();
    });

    it('should show next step in synthesis tab', async () => {
      const user = userEvent.setup();

      render(<IdentityInsightsAI {...defaultProps} />);
      await user.click(screen.getByTestId('insights-tab-synthesis'));

      expect(screen.getByText('synthesisTab.nextStep')).toBeInTheDocument();
      expect(screen.getByText('Practice saying no')).toBeInTheDocument();
    });
  });

  describe('re-analyze functionality', () => {
    beforeEach(() => {
      mockStoreAnalysis = mockAnalysis;
    });

    it('should show re-analyze button when not in read-only mode', () => {
      render(<IdentityInsightsAI {...defaultProps} />);

      expect(screen.getByText('reanalyze.button')).toBeInTheDocument();
    });

    it('should hide re-analyze button in read-only mode', () => {
      render(<IdentityInsightsAI {...defaultProps} isReadOnly />);

      expect(screen.queryByText('reanalyze.button')).not.toBeInTheDocument();
    });

    it('should call analyze when re-analyze is clicked', async () => {
      const user = userEvent.setup();

      render(<IdentityInsightsAI {...defaultProps} />);
      await user.click(screen.getByTestId('insights-btn-reanalyze'));

      expect(mockAnalyze).toHaveBeenCalled();
    });
  });

  describe('view-only mode', () => {
    const viewOnlyAnalysis = {
      result: mockAnalysis,
      createdAt: '2024-01-15T10:00:00Z',
      assessmentId: 'assessment-123',
    };

    it('should show page header in view-only mode', () => {
      mockStoreAnalysis = null;

      render(
        <IdentityInsightsAI
          {...defaultProps}
          isReadOnly
          viewOnlyAnalysis={viewOnlyAnalysis}
        />
      );

      expect(screen.getByTestId('insights-header')).toBeInTheDocument();
    });

    it('should display analysis from viewOnlyAnalysis prop', () => {
      mockStoreAnalysis = null;

      render(
        <IdentityInsightsAI
          {...defaultProps}
          isReadOnly
          viewOnlyAnalysis={viewOnlyAnalysis}
        />
      );

      expect(screen.getByText('tabs.patterns')).toBeInTheDocument();
    });
  });

  describe('tab count badges', () => {
    beforeEach(() => {
      mockStoreAnalysis = mockAnalysis;
    });

    it('should display count badges for tabs with items', () => {
      render(<IdentityInsightsAI {...defaultProps} />);

      // Each tab should show count
      const countBadges = screen.getAllByText('1');
      expect(countBadges.length).toBeGreaterThan(0);
    });
  });

  describe('page structure', () => {
    const emptyResponses = {} as AssessmentResponses;

    it('should render page navigation', () => {
      render(<IdentityInsightsAI {...defaultProps} responses={emptyResponses} />);

      expect(screen.getByTestId('page-navigation')).toBeInTheDocument();
    });

    it('should render footer', () => {
      render(<IdentityInsightsAI {...defaultProps} responses={emptyResponses} />);

      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should render ink brush decoration', () => {
      render(<IdentityInsightsAI {...defaultProps} responses={emptyResponses} />);

      expect(screen.getByTestId('ink-brush')).toBeInTheDocument();
    });
  });
});
