/**
 * @file app/__tests__/unit/components/shared/ChunkErrorBoundary.test.tsx
 * @purpose Unit tests for ChunkErrorBoundary component
 * @functionality
 * - Tests error catching and display
 * - Tests retry functionality
 * - Tests reload functionality
 * - Tests chunk load error detection
 * - Tests error state reset on children change
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - ChunkErrorBoundary under test
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ChunkErrorBoundary from '@/components/shared/ChunkErrorBoundary';

// Mock i18next
vi.mock('react-i18next', () => ({
  withTranslation: () => (Component: React.ComponentType<{ t: (key: string, fallback: string) => string }>) => {
    const WrappedComponent = (props: Record<string, unknown>) => (
      <Component {...props} t={(_key: string, fallback: string) => fallback} />
    );
    WrappedComponent.displayName = `withTranslation(${Component.displayName || Component.name})`;
    return WrappedComponent;
  },
}));

// Mock window.location.reload
const mockReload = vi.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
});

// Suppress console.error for expected errors in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

// Component that throws an error for testing
const ThrowError = ({ error }: { error: Error }) => {
  throw error;
};

// Component that renders successfully
const SuccessComponent = () => <div data-testid="success">Success</div>;

describe('ChunkErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normal rendering', () => {
    it('should render children when there is no error', () => {
      render(
        <ChunkErrorBoundary>
          <SuccessComponent />
        </ChunkErrorBoundary>
      );

      expect(screen.getByTestId('success')).toBeInTheDocument();
    });

    it('should render multiple children without error', () => {
      render(
        <ChunkErrorBoundary>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </ChunkErrorBoundary>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should catch errors and display error UI', () => {
      const error = new Error('Test error');

      render(
        <ChunkErrorBoundary>
          <ThrowError error={error} />
        </ChunkErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
    });

    it('should display chunk error message for chunk load errors', () => {
      const chunkError = new Error('Loading chunk failed');

      render(
        <ChunkErrorBoundary>
          <ThrowError error={chunkError} />
        </ChunkErrorBoundary>
      );

      expect(screen.getByText('Failed to load')).toBeInTheDocument();
      expect(screen.getByText('There was a problem loading this page. Please check your connection and try again.')).toBeInTheDocument();
    });

    it('should detect CSS chunk load errors', () => {
      const cssChunkError = new Error('Loading CSS chunk failed');

      render(
        <ChunkErrorBoundary>
          <ThrowError error={cssChunkError} />
        </ChunkErrorBoundary>
      );

      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });

    it('should detect dynamically imported module errors', () => {
      const moduleError = new Error('Failed to fetch dynamically imported module');

      render(
        <ChunkErrorBoundary>
          <ThrowError error={moduleError} />
        </ChunkErrorBoundary>
      );

      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });

    it('should detect ChunkLoadError by name', () => {
      const chunkLoadError = new Error('Some error');
      chunkLoadError.name = 'ChunkLoadError';

      render(
        <ChunkErrorBoundary>
          <ThrowError error={chunkLoadError} />
        </ChunkErrorBoundary>
      );

      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });

    it('should display action buttons', () => {
      const error = new Error('Test error');

      render(
        <ChunkErrorBoundary>
          <ThrowError error={error} />
        </ChunkErrorBoundary>
      );

      expect(screen.getByText('Try again')).toBeInTheDocument();
      expect(screen.getByText('Reload page')).toBeInTheDocument();
    });
  });

  describe('retry functionality', () => {
    it('should retry rendering on retry button click', () => {
      let shouldThrow = true;
      const ConditionalError = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div data-testid="recovered">Recovered</div>;
      };

      const { rerender } = render(
        <ChunkErrorBoundary>
          <ConditionalError />
        </ChunkErrorBoundary>
      );

      // Should show error UI
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Fix the error condition
      shouldThrow = false;

      // Click retry
      fireEvent.click(screen.getByTestId('chunk-error-btn-retry'));

      // Re-render to trigger the state change
      rerender(
        <ChunkErrorBoundary>
          <ConditionalError />
        </ChunkErrorBoundary>
      );

      // Should show recovered content
      expect(screen.getByTestId('recovered')).toBeInTheDocument();
    });

    it('should reload page after max retries exceeded', () => {
      const error = new Error('Persistent error');

      render(
        <ChunkErrorBoundary>
          <ThrowError error={error} />
        </ChunkErrorBoundary>
      );

      // Click retry 3 times (MAX_RETRIES is 2, so 3rd click should reload)
      fireEvent.click(screen.getByTestId('chunk-error-btn-retry'));
      fireEvent.click(screen.getByTestId('chunk-error-btn-retry'));
      fireEvent.click(screen.getByTestId('chunk-error-btn-retry'));

      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  describe('reload functionality', () => {
    it('should reload page on reload button click', () => {
      const error = new Error('Test error');

      render(
        <ChunkErrorBoundary>
          <ThrowError error={error} />
        </ChunkErrorBoundary>
      );

      fireEvent.click(screen.getByTestId('chunk-error-btn-reload'));

      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  describe('error state reset', () => {
    it('should reset error state when children prop changes', () => {
      const error = new Error('Test error');
      const ErrorChild = () => {
        throw error;
      };

      const { rerender } = render(
        <ChunkErrorBoundary>
          <ErrorChild />
        </ChunkErrorBoundary>
      );

      // Should show error UI
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Change children to a working component
      rerender(
        <ChunkErrorBoundary>
          <SuccessComponent />
        </ChunkErrorBoundary>
      );

      // Should show success content
      expect(screen.getByTestId('success')).toBeInTheDocument();
    });
  });

  describe('error icon', () => {
    it('should display error icon in error state', () => {
      const error = new Error('Test error');

      render(
        <ChunkErrorBoundary>
          <ThrowError error={error} />
        </ChunkErrorBoundary>
      );

      // SVG icon should be present
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
