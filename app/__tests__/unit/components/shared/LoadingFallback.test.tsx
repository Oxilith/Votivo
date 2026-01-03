/**
 * @file app/__tests__/unit/components/shared/LoadingFallback.test.tsx
 * @purpose Unit tests for LoadingFallback component
 * @functionality
 * - Tests fullscreen variant (default)
 * - Tests contained variant
 * - Verifies delegation to InkLoader
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - LoadingFallback under test
 */

import { render, screen } from '@testing-library/react';
import LoadingFallback from '@/components/shared/LoadingFallback';

describe('LoadingFallback', () => {
  describe('variants', () => {
    it('should render fullscreen variant by default', () => {
      const { container } = render(<LoadingFallback />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('min-h-screen');
    });

    it('should render contained variant when specified', () => {
      const { container } = render(<LoadingFallback variant="contained" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('min-h-[200px]');
      expect(wrapper).not.toHaveClass('min-h-screen');
    });
  });

  describe('animation elements', () => {
    it('should render SVG loading animation', () => {
      const { container } = render(<LoadingFallback />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('animate-spin');
    });

    it('should render two animated circles', () => {
      const { container } = render(<LoadingFallback />);

      const circles = container.querySelectorAll('circle');
      expect(circles).toHaveLength(2);
    });
  });

  describe('styling', () => {
    it('should center content with flexbox', () => {
      const { container } = render(<LoadingFallback />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should apply background color for fullscreen', () => {
      const { container } = render(<LoadingFallback />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('bg-[var(--bg-primary)]');
    });
  });

  describe('accessibility', () => {
    it('should have role="status"', () => {
      render(<LoadingFallback />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});
