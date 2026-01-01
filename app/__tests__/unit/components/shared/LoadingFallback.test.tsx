/**
 * @file app/__tests__/unit/components/shared/LoadingFallback.test.tsx
 * @purpose Unit tests for LoadingFallback component
 * @functionality
 * - Tests fullscreen variant (default)
 * - Tests contained variant
 * - Tests loading animation elements
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - LoadingFallback under test
 */

import { render } from '@testing-library/react';
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
    it('should render three animated dots', () => {
      const { container } = render(<LoadingFallback />);

      const dots = container.querySelectorAll('.animate-staggered-pulse');
      expect(dots).toHaveLength(3);
    });

    it('should apply staggered animation delays', () => {
      const { container } = render(<LoadingFallback />);

      const dots = container.querySelectorAll('.animate-staggered-pulse');
      expect(dots[0]).toHaveStyle({ animationDelay: '0ms' });
      expect(dots[1]).toHaveStyle({ animationDelay: '150ms' });
      expect(dots[2]).toHaveStyle({ animationDelay: '300ms' });
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
});
