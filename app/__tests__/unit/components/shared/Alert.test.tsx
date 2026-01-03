/**
 * @file app/__tests__/unit/components/shared/Alert.test.tsx
 * @purpose Unit tests for unified Alert component
 * @functionality
 * - Tests all four variants (error, warning, info, success)
 * - Tests title, description, and note rendering
 * - Tests dismiss button and callback
 * - Tests Alert.Actions and Alert.Action components
 * - Tests loading and disabled states on actions
 * - Tests primary and secondary action variants
 * - Tests data-testid attributes
 * - Tests ARIA accessibility attributes
 * - Tests convenience wrappers (Alert.Error, Alert.Warning, Alert.Info, Alert.Success)
 * - Tests className pass-through
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - Alert under test
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import Alert from '@/components/shared/Alert';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

describe('Alert', () => {
  describe('rendering basics', () => {
    it('should render title', () => {
      render(<Alert variant="info" title="Test Title" />);

      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
      render(<Alert variant="info" title="Title" description="Test description" />);

      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should not render description element when not provided', () => {
      render(<Alert variant="info" title="Title" data-testid="test-alert" />);

      expect(screen.queryByTestId('test-alert-description')).not.toBeInTheDocument();
    });

    it('should render note when provided', () => {
      render(<Alert variant="info" title="Title" note="Additional note" />);

      expect(screen.getByText('Additional note')).toBeInTheDocument();
    });

    it('should not render note element when not provided', () => {
      render(<Alert variant="info" title="Title" data-testid="test-alert" />);

      expect(screen.queryByTestId('test-alert-note')).not.toBeInTheDocument();
    });

    it('should pass className to container', () => {
      const { container } = render(
        <Alert variant="info" title="Title" className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('variants', () => {
    it('should render error variant with correct styling', () => {
      const { container } = render(<Alert variant="error" title="Error" />);

      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveClass('border-red-500/30', 'bg-red-500/5');
    });

    it('should render warning variant with correct styling', () => {
      const { container } = render(<Alert variant="warning" title="Warning" />);

      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveClass('border-[var(--accent)]/30', 'bg-[var(--accent)]/5');
    });

    it('should render info variant with correct styling', () => {
      const { container } = render(<Alert variant="info" title="Info" />);

      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveClass('border-blue-500/30', 'bg-blue-500/5');
    });

    it('should render success variant with correct styling', () => {
      const { container } = render(<Alert variant="success" title="Success" />);

      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveClass('border-green-500/30', 'bg-green-500/5');
    });

    it('should render correct icon for each variant', () => {
      const { container: errorContainer } = render(<Alert variant="error" title="E" />);
      const { container: warningContainer } = render(<Alert variant="warning" title="W" />);
      const { container: infoContainer } = render(<Alert variant="info" title="I" />);
      const { container: successContainer } = render(<Alert variant="success" title="S" />);

      // Each variant should have an SVG icon
      expect(errorContainer.querySelector('svg')).toBeInTheDocument();
      expect(warningContainer.querySelector('svg')).toBeInTheDocument();
      expect(infoContainer.querySelector('svg')).toBeInTheDocument();
      expect(successContainer.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have role="alert"', () => {
      render(<Alert variant="info" title="Title" />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have aria-live="assertive" for error variant', () => {
      render(<Alert variant="error" title="Error" />);

      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have aria-live="polite" for non-error variants', () => {
      const { rerender } = render(<Alert variant="warning" title="Warning" />);
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');

      rerender(<Alert variant="info" title="Info" />);
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');

      rerender(<Alert variant="success" title="Success" />);
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-atomic="true"', () => {
      render(<Alert variant="info" title="Title" />);

      expect(screen.getByRole('alert')).toHaveAttribute('aria-atomic', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      render(<Alert variant="info" title="Title" data-testid="test-alert" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-labelledby', 'test-alert-title');
    });

    it('should have aria-describedby pointing to description when provided', () => {
      render(
        <Alert
          variant="info"
          title="Title"
          description="Description"
          data-testid="test-alert"
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-describedby', 'test-alert-description');
    });

    it('should have icons marked as aria-hidden', () => {
      const { container } = render(<Alert variant="info" title="Title" />);

      const svgs = container.querySelectorAll('svg');
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('dismiss button', () => {
    it('should not render close button when onDismiss is not provided', () => {
      render(<Alert variant="info" title="Title" data-testid="test-alert" />);

      expect(screen.queryByTestId('test-alert-close')).not.toBeInTheDocument();
    });

    it('should render close button when onDismiss is provided', () => {
      const onDismiss = vi.fn();
      render(<Alert variant="info" title="Title" onDismiss={onDismiss} data-testid="test-alert" />);

      expect(screen.getByTestId('test-alert-close')).toBeInTheDocument();
    });

    it('should call onDismiss when close button is clicked', () => {
      const onDismiss = vi.fn();
      render(<Alert variant="info" title="Title" onDismiss={onDismiss} data-testid="test-alert" />);

      fireEvent.click(screen.getByTestId('test-alert-close'));

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should have accessible label on close button', () => {
      const onDismiss = vi.fn();
      render(<Alert variant="info" title="Title" onDismiss={onDismiss} />);

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });
  });

  describe('data-testid', () => {
    it('should use default data-testid when not provided', () => {
      render(<Alert variant="info" title="Title" />);

      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByTestId('alert-title')).toBeInTheDocument();
    });

    it('should use custom data-testid when provided', () => {
      render(
        <Alert
          variant="info"
          title="Title"
          description="Desc"
          note="Note"
          onDismiss={() => {}}
          data-testid="custom-alert"
        />
      );

      expect(screen.getByTestId('custom-alert')).toBeInTheDocument();
      expect(screen.getByTestId('custom-alert-title')).toBeInTheDocument();
      expect(screen.getByTestId('custom-alert-description')).toBeInTheDocument();
      expect(screen.getByTestId('custom-alert-note')).toBeInTheDocument();
      expect(screen.getByTestId('custom-alert-close')).toBeInTheDocument();
    });
  });

  describe('forwardRef', () => {
    it('should forward ref to container element', () => {
      const ref = createRef<HTMLDivElement>();
      render(<Alert ref={ref} variant="info" title="Title" />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveAttribute('role', 'alert');
    });
  });

  describe('Alert.Actions', () => {
    it('should render children', () => {
      render(
        <Alert variant="info" title="Title">
          <Alert.Actions>
            <button>Action 1</button>
            <button>Action 2</button>
          </Alert.Actions>
        </Alert>
      );

      expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action 2' })).toBeInTheDocument();
    });

    it('should accept data-testid', () => {
      render(
        <Alert variant="info" title="Title">
          <Alert.Actions data-testid="actions-container">
            <button>Action</button>
          </Alert.Actions>
        </Alert>
      );

      expect(screen.getByTestId('actions-container')).toBeInTheDocument();
    });
  });

  describe('Alert.Action', () => {
    it('should render with children text', () => {
      render(
        <Alert variant="info" title="Title">
          <Alert.Actions>
            <Alert.Action onClick={() => {}}>Click Me</Alert.Action>
          </Alert.Actions>
        </Alert>
      );

      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    it('should call onClick when clicked', () => {
      const onClick = vi.fn();
      render(
        <Alert variant="info" title="Title">
          <Alert.Actions>
            <Alert.Action onClick={onClick}>Click</Alert.Action>
          </Alert.Actions>
        </Alert>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Click' }));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <Alert variant="info" title="Title">
          <Alert.Actions>
            <Alert.Action onClick={() => {}} disabled>
              Disabled
            </Alert.Action>
          </Alert.Actions>
        </Alert>
      );

      expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
    });

    it('should be disabled when loading is true', () => {
      render(
        <Alert variant="info" title="Title">
          <Alert.Actions>
            <Alert.Action onClick={() => {}} loading>
              Loading
            </Alert.Action>
          </Alert.Actions>
        </Alert>
      );

      expect(screen.getByRole('button', { name: 'Loading' })).toBeDisabled();
    });

    it('should show spinner when loading', () => {
      render(
        <Alert variant="info" title="Title">
          <Alert.Actions>
            <Alert.Action onClick={() => {}} loading data-testid="loading-btn">
              Loading
            </Alert.Action>
          </Alert.Actions>
        </Alert>
      );

      const button = screen.getByTestId('loading-btn');
      const spinner = button.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should accept data-testid', () => {
      render(
        <Alert variant="info" title="Title">
          <Alert.Actions>
            <Alert.Action onClick={() => {}} data-testid="action-btn">
              Action
            </Alert.Action>
          </Alert.Actions>
        </Alert>
      );

      expect(screen.getByTestId('action-btn')).toBeInTheDocument();
    });

    it('should render primary variant with accent styling', () => {
      render(
        <Alert variant="warning" title="Title">
          <Alert.Actions>
            <Alert.Action onClick={() => {}} variant="primary">
              Primary
            </Alert.Action>
          </Alert.Actions>
        </Alert>
      );

      const button = screen.getByRole('button', { name: 'Primary' });
      expect(button).toHaveClass('bg-[var(--accent)]');
    });

    it('should render primary variant with red styling for error alert', () => {
      render(
        <Alert variant="error" title="Title">
          <Alert.Actions>
            <Alert.Action onClick={() => {}} variant="primary">
              Primary
            </Alert.Action>
          </Alert.Actions>
        </Alert>
      );

      const button = screen.getByRole('button', { name: 'Primary' });
      expect(button).toHaveClass('bg-red-500');
    });

    it('should render secondary variant with text styling', () => {
      render(
        <Alert variant="info" title="Title">
          <Alert.Actions>
            <Alert.Action onClick={() => {}} variant="secondary">
              Secondary
            </Alert.Action>
          </Alert.Actions>
        </Alert>
      );

      const button = screen.getByRole('button', { name: 'Secondary' });
      expect(button).toHaveClass('text-[var(--text-secondary)]');
    });
  });

  describe('convenience wrappers', () => {
    describe('Alert.Error', () => {
      it('should render with error variant', () => {
        const { container } = render(<Alert.Error title="Error" />);

        const alert = container.firstChild as HTMLElement;
        expect(alert).toHaveClass('border-red-500/30', 'bg-red-500/5');
      });

      it('should have aria-live="assertive"', () => {
        render(<Alert.Error title="Error" />);

        expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
      });

      it('should forward ref', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Alert.Error ref={ref} title="Error" />);

        expect(ref.current).toBeInstanceOf(HTMLDivElement);
      });
    });

    describe('Alert.Warning', () => {
      it('should render with warning variant', () => {
        const { container } = render(<Alert.Warning title="Warning" />);

        const alert = container.firstChild as HTMLElement;
        expect(alert).toHaveClass('border-[var(--accent)]/30', 'bg-[var(--accent)]/5');
      });

      it('should forward ref', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Alert.Warning ref={ref} title="Warning" />);

        expect(ref.current).toBeInstanceOf(HTMLDivElement);
      });
    });

    describe('Alert.Info', () => {
      it('should render with info variant', () => {
        const { container } = render(<Alert.Info title="Info" />);

        const alert = container.firstChild as HTMLElement;
        expect(alert).toHaveClass('border-blue-500/30', 'bg-blue-500/5');
      });

      it('should forward ref', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Alert.Info ref={ref} title="Info" />);

        expect(ref.current).toBeInstanceOf(HTMLDivElement);
      });
    });

    describe('Alert.Success', () => {
      it('should render with success variant', () => {
        const { container } = render(<Alert.Success title="Success" />);

        const alert = container.firstChild as HTMLElement;
        expect(alert).toHaveClass('border-green-500/30', 'bg-green-500/5');
      });

      it('should forward ref', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Alert.Success ref={ref} title="Success" />);

        expect(ref.current).toBeInstanceOf(HTMLDivElement);
      });
    });
  });

  describe('animation classes', () => {
    it('should have animation classes for enter effect', () => {
      const { container } = render(<Alert variant="info" title="Title" />);

      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveClass('animate-in', 'fade-in', 'slide-in-from-top-2');
    });
  });

  describe('multiple actions', () => {
    it('should render multiple action buttons', () => {
      const onRetry = vi.fn();
      const onDismiss = vi.fn();

      render(
        <Alert.Warning title="Save Failed" description="Your changes couldn't be saved.">
          <Alert.Actions>
            <Alert.Action onClick={onRetry} variant="primary">
              Retry
            </Alert.Action>
            <Alert.Action onClick={onDismiss} variant="secondary">
              Dismiss
            </Alert.Action>
          </Alert.Actions>
        </Alert.Warning>
      );

      const retryBtn = screen.getByRole('button', { name: 'Retry' });
      const dismissBtn = screen.getByRole('button', { name: 'Dismiss' });

      expect(retryBtn).toBeInTheDocument();
      expect(dismissBtn).toBeInTheDocument();

      fireEvent.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);

      fireEvent.click(dismissBtn);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });
});
