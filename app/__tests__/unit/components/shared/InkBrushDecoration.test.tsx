/**
 * @file app/__tests__/unit/components/shared/InkBrushDecoration.test.tsx
 * @purpose Unit tests for InkBrushDecoration component
 * @functionality
 * - Tests SVG rendering with correct attributes
 * - Tests animation styles on path and circles
 * - Tests accessibility (aria-hidden)
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - InkBrushDecoration under test
 */

import { render } from '@testing-library/react';
import InkBrushDecoration from '@/components/shared/InkBrushDecoration';

describe('InkBrushDecoration', () => {
  describe('rendering', () => {
    it('should render an SVG element', () => {
      const { container } = render(<InkBrushDecoration />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render a path for the brush stroke', () => {
      const { container } = render(<InkBrushDecoration />);

      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
    });

    it('should render two circles for splash effects', () => {
      const { container } = render(<InkBrushDecoration />);

      const circles = container.querySelectorAll('circle');
      expect(circles).toHaveLength(2);
    });
  });

  describe('accessibility', () => {
    it('should be marked as aria-hidden for screen readers', () => {
      const { container } = render(<InkBrushDecoration />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('styling', () => {
    it('should be fixed positioned on the right side', () => {
      const { container } = render(<InkBrushDecoration />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('fixed', 'right-0');
    });

    it('should be non-interactive', () => {
      const { container } = render(<InkBrushDecoration />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('pointer-events-none');
    });

    it('should be hidden on mobile (lg:block)', () => {
      const { container } = render(<InkBrushDecoration />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('hidden', 'lg:block');
    });
  });

  describe('animations', () => {
    it('should apply ink-draw animation to path', () => {
      const { container } = render(<InkBrushDecoration />);

      const path = container.querySelector('path');
      expect(path?.getAttribute('style')).toContain('ink-draw');
    });

    it('should apply ink-splash animation to first circle', () => {
      const { container } = render(<InkBrushDecoration />);

      const circles = container.querySelectorAll('circle');
      expect(circles[0].getAttribute('style')).toContain('ink-splash');
    });

    it('should apply ink-splash animation to second circle with delay', () => {
      const { container } = render(<InkBrushDecoration />);

      const circles = container.querySelectorAll('circle');
      expect(circles[1].getAttribute('style')).toContain('ink-splash');
    });
  });
});
