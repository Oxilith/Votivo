/**
 * @file app/__tests__/unit/components/shared/InkLoader.test.tsx
 * @purpose Unit tests for InkLoader component
 * @functionality
 * - Tests all three variants (fullscreen, contained, inline)
 * - Tests message and description rendering
 * - Tests accessibility attributes
 * - Tests animation elements
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - @/components/shared/InkLoader
 */

import { render, screen } from '@testing-library/react';
import { InkLoader } from '@/components';

describe('InkLoader', () => {
  describe('variants', () => {
    it('should render fullscreen variant by default', () => {
      const { container } = render(<InkLoader />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('min-h-screen');
      expect(wrapper).toHaveClass('bg-[var(--bg-primary)]');
    });

    it('should render contained variant when specified', () => {
      const { container } = render(<InkLoader variant="contained" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('min-h-[200px]');
      expect(wrapper).not.toHaveClass('min-h-screen');
    });

    it('should render inline variant when specified', () => {
      const { container } = render(<InkLoader variant="inline" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('inline-flex');
      expect(wrapper).not.toHaveClass('min-h-screen');
      expect(wrapper).not.toHaveClass('min-h-[200px]');
    });
  });

  describe('message and description', () => {
    it('should render message when provided', () => {
      render(<InkLoader variant="contained" message="Loading data..." />);

      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
      render(<InkLoader variant="contained" description="Please wait" />);

      expect(screen.getByText('Please wait')).toBeInTheDocument();
    });

    it('should render both message and description', () => {
      render(
        <InkLoader
          variant="contained"
          message="Loading data..."
          description="This may take a moment"
        />
      );

      expect(screen.getByText('Loading data...')).toBeInTheDocument();
      expect(screen.getByText('This may take a moment')).toBeInTheDocument();
    });

    it('should not render message for inline variant', () => {
      render(<InkLoader variant="inline" message="Loading..." />);

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should not render description for inline variant', () => {
      render(<InkLoader variant="inline" description="Please wait" />);

      expect(screen.queryByText('Please wait')).not.toBeInTheDocument();
    });

    it('should render message in h2 with proper styling', () => {
      render(<InkLoader variant="contained" message="Loading..." />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Loading...');
      expect(heading).toHaveClass('font-display', 'text-xl', 'font-semibold');
    });

    it('should render description in paragraph with secondary text styling', () => {
      render(<InkLoader variant="contained" description="Please wait" />);

      const description = screen.getByText('Please wait');
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass('font-body', 'text-[var(--text-secondary)]');
    });
  });

  describe('animation elements', () => {
    it('should render SVG with animate-spin class', () => {
      const { container } = render(<InkLoader />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('animate-spin');
    });

    it('should render two concentric circles', () => {
      const { container } = render(<InkLoader />);

      const circles = container.querySelectorAll('circle');
      expect(circles).toHaveLength(2);
    });

    it('should apply correct animation duration for fullscreen', () => {
      const { container } = render(<InkLoader variant="fullscreen" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveStyle({ animationDuration: '2.5s' });
    });

    it('should apply correct animation duration for inline', () => {
      const { container } = render(<InkLoader variant="inline" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveStyle({ animationDuration: '2s' });
    });

    it('should have aria-hidden on SVG', () => {
      const { container } = render(<InkLoader />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('accessibility', () => {
    it('should have role="status"', () => {
      render(<InkLoader />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have default aria-label', () => {
      render(<InkLoader />);

      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
    });

    it('should accept custom aria-label', () => {
      render(<InkLoader aria-label="Processing request" />);

      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Processing request');
    });
  });

  describe('styling', () => {
    it('should center content with flexbox', () => {
      const { container } = render(<InkLoader />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should apply custom className', () => {
      const { container } = render(<InkLoader className="my-custom-class" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('my-custom-class');
    });

    it('should have correct SVG size for fullscreen (80px)', () => {
      const { container } = render(<InkLoader variant="fullscreen" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-20', 'h-20');
    });

    it('should have correct SVG size for contained (48px)', () => {
      const { container } = render(<InkLoader variant="contained" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-12', 'h-12');
    });

    it('should have correct SVG size for inline (20px)', () => {
      const { container } = render(<InkLoader variant="inline" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-5', 'h-5');
    });

    it('should use accent color for circles', () => {
      const { container } = render(<InkLoader />);

      const circles = container.querySelectorAll('circle');
      circles.forEach((circle) => {
        expect(circle).toHaveAttribute('stroke', 'var(--accent)');
      });
    });
  });
});
