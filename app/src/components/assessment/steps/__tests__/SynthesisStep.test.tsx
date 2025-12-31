/**
 * @file components/assessment/steps/__tests__/SynthesisStep.test.tsx
 * @purpose Unit tests for SynthesisStep component
 * @functionality
 * - Tests rendering of synthesis sections
 * - Tests display of response data
 * - Tests selected options label resolution
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - SynthesisStep under test
 */

import { render, screen } from '@testing-library/react';
import { SynthesisStep } from '@/components/assessment/steps/SynthesisStep';
import type { AssessmentResponses } from 'shared';
import type { Phase } from '@/components/assessment/types';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock styles
vi.mock('@/styles', () => ({
  cardStyles: { base: 'card-base', hero: 'card-hero' },
  textStyles: { primary: 'text-primary', secondary: 'text-secondary', muted: 'text-muted' },
  phaseBadge: 'phase-badge',
}));

describe('SynthesisStep', () => {
  const mockPhases: Phase[] = [
    { id: 'intro', title: 'intro', subtitle: 'intro', steps: [] },
    {
      id: 'phase1',
      title: 'state-awareness',
      subtitle: 'State Awareness',
      steps: [
        {
          type: 'multiSelect',
          id: 'peak_energy_times',
          question: 'Peak times?',
          options: [
            { id: 'mid_morning', label: 'Mid-morning' },
            { id: 'afternoon', label: 'Afternoon' },
          ],
        },
        {
          type: 'multiSelect',
          id: 'low_energy_times',
          question: 'Low times?',
          options: [
            { id: 'early_morning', label: 'Early morning' },
            { id: 'late_night', label: 'Late night' },
          ],
        },
        { type: 'scale', id: 'energy_consistency', question: 'Consistency?', lowLabel: 'Low', highLabel: 'High', min: 1, max: 5 },
        { type: 'textarea', id: 'energy_drains', question: 'Drains?' },
        { type: 'textarea', id: 'energy_restores', question: 'Restores?' },
        {
          type: 'multiSelect',
          id: 'mood_triggers_negative',
          question: 'Triggers?',
          options: [
            { id: 'overwhelm', label: 'Overwhelm' },
            { id: 'lack_of_progress', label: 'Lack of progress' },
          ],
        },
        { type: 'scale', id: 'motivation_reliability', question: 'Reliability?', lowLabel: 'Low', highLabel: 'High', min: 1, max: 5 },
        {
          type: 'singleSelect',
          id: 'willpower_pattern',
          question: 'Pattern?',
          options: [
            { id: 'distraction', label: 'Distraction' },
            { id: 'procrastination', label: 'Procrastination' },
          ],
        },
      ],
    },
    {
      id: 'phase2',
      title: 'identity-mapping',
      subtitle: 'Identity Mapping',
      steps: [
        { type: 'textarea', id: 'identity_statements', question: 'Statements?' },
        { type: 'textarea', id: 'others_describe', question: 'Others?' },
        { type: 'textarea', id: 'automatic_behaviors', question: 'Automatic?' },
        { type: 'textarea', id: 'keystone_behaviors', question: 'Keystone?' },
        { type: 'scale', id: 'identity_clarity', question: 'Clarity?', lowLabel: 'Low', highLabel: 'High', min: 1, max: 5 },
        {
          type: 'multiSelect',
          id: 'core_values',
          question: 'Values?',
          options: [
            { id: 'growth', label: 'Growth' },
            { id: 'mastery', label: 'Mastery' },
          ],
        },
        { type: 'textarea', id: 'natural_strengths', question: 'Strengths?' },
        { type: 'textarea', id: 'resistance_patterns', question: 'Resistance?' },
      ],
    },
  ];

  const mockResponses: Partial<AssessmentResponses> = {
    peak_energy_times: ['mid_morning', 'afternoon'],
    low_energy_times: ['late_night'],
    energy_consistency: 4,
    energy_drains: 'Long meetings',
    energy_restores: 'Creative work',
    mood_triggers_negative: ['overwhelm'],
    motivation_reliability: 3,
    willpower_pattern: 'distraction',
    identity_statements: 'I am a learner',
    others_describe: 'Analytical and creative',
    automatic_behaviors: 'Morning coffee routine',
    keystone_behaviors: 'Daily exercise',
    identity_clarity: 4,
    core_values: ['growth', 'mastery'],
    natural_strengths: 'Problem solving',
    resistance_patterns: 'Procrastination on complex tasks',
  };

  it('should render synthesis heading', () => {
    render(<SynthesisStep responses={mockResponses} phases={mockPhases} />);
    expect(screen.getByText('synthesis.heading')).toBeInTheDocument();
  });

  it('should render synthesis description', () => {
    render(<SynthesisStep responses={mockResponses} phases={mockPhases} />);
    expect(screen.getByText('synthesis.description')).toBeInTheDocument();
  });

  it('should render operating rhythm section', () => {
    render(<SynthesisStep responses={mockResponses} phases={mockPhases} />);
    expect(screen.getByText('synthesis.sections.operatingRhythm.title')).toBeInTheDocument();
  });

  it('should display peak energy times labels', () => {
    render(<SynthesisStep responses={mockResponses} phases={mockPhases} />);
    expect(screen.getByText(/Mid-morning, Afternoon/)).toBeInTheDocument();
  });

  it('should display low energy times labels', () => {
    render(<SynthesisStep responses={mockResponses} phases={mockPhases} />);
    expect(screen.getByText(/Late night/)).toBeInTheDocument();
  });

  it('should display energy consistency rating', () => {
    render(<SynthesisStep responses={mockResponses} phases={mockPhases} />);
    // Multiple ratings shown (4/5 for energy, identity clarity, and 3/5 for motivation)
    expect(screen.getAllByText(/4\/5/).length).toBeGreaterThan(0);
  });

  it('should display energy drains', () => {
    render(<SynthesisStep responses={mockResponses} phases={mockPhases} />);
    expect(screen.getByText('Long meetings')).toBeInTheDocument();
  });

  it('should display energy restores', () => {
    render(<SynthesisStep responses={mockResponses} phases={mockPhases} />);
    expect(screen.getByText('Creative work')).toBeInTheDocument();
  });

  it('should display mood triggers', () => {
    render(<SynthesisStep responses={mockResponses} phases={mockPhases} />);
    expect(screen.getByText('Overwhelm')).toBeInTheDocument();
  });

  it('should display willpower pattern label', () => {
    render(<SynthesisStep responses={mockResponses} phases={mockPhases} />);
    expect(screen.getByText('Distraction')).toBeInTheDocument();
  });

  it('should display identity statements', () => {
    render(<SynthesisStep responses={mockResponses} phases={mockPhases} />);
    expect(screen.getByText('I am a learner')).toBeInTheDocument();
  });

  it('should display others describe', () => {
    render(<SynthesisStep responses={mockResponses} phases={mockPhases} />);
    expect(screen.getByText('Analytical and creative')).toBeInTheDocument();
  });

  it('should display core values labels', () => {
    render(<SynthesisStep responses={mockResponses} phases={mockPhases} />);
    expect(screen.getByText(/Growth, Mastery/)).toBeInTheDocument();
  });

  it('should display natural strengths', () => {
    render(<SynthesisStep responses={mockResponses} phases={mockPhases} />);
    expect(screen.getByText('Problem solving')).toBeInTheDocument();
  });

  it('should display resistance patterns', () => {
    render(<SynthesisStep responses={mockResponses} phases={mockPhases} />);
    expect(screen.getByText('Procrastination on complex tasks')).toBeInTheDocument();
  });

  it('should render what\'s next section', () => {
    render(<SynthesisStep responses={mockResponses} phases={mockPhases} />);
    expect(screen.getByText('synthesis.whatsNext.title')).toBeInTheDocument();
  });

  it('should handle empty responses gracefully', () => {
    render(<SynthesisStep responses={{}} phases={mockPhases} />);
    // Should still render section titles
    expect(screen.getByText('synthesis.sections.operatingRhythm.title')).toBeInTheDocument();
    // Should show default values for ratings
    expect(screen.getAllByText(/3\/5/).length).toBeGreaterThan(0);
  });

  it('should handle missing phases gracefully', () => {
    render(<SynthesisStep responses={mockResponses} phases={[]} />);
    // Should still render section titles but no option labels
    expect(screen.getByText('synthesis.sections.operatingRhythm.title')).toBeInTheDocument();
  });
});
