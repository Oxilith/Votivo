/**
 * @file src/components/shared/ChunkErrorBoundary.tsx
 * @purpose Error boundary for catching and recovering from lazy-loaded chunk failures
 * @functionality
 * - Catches errors from failed dynamic imports (network issues, CDN failures)
 * - Displays user-friendly error message with retry option
 * - Resets error state when children change (navigation to different route)
 * - Theme-aware styling matching LoadingFallback component
 * @dependencies
 * - React (Component, ErrorInfo, ReactNode)
 * - react-i18next (withTranslation, TFunction)
 */

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { withTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

interface ChunkErrorBoundaryProps {
  children: ReactNode;
  t: TFunction;
}

interface ChunkErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * Checks if an error is a chunk load failure (dynamic import error)
 * Detects errors from Vite, Webpack, and native ES module loading failures
 */
function isChunkLoadError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('loading chunk') ||
    message.includes('loading css chunk') ||
    message.includes('dynamically imported module') ||
    error.name === 'ChunkLoadError'
  );
}

class ChunkErrorBoundaryBase extends Component<
  ChunkErrorBoundaryProps,
  ChunkErrorBoundaryState
> {
  private static readonly MAX_RETRIES = 2;

  constructor(props: ChunkErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ChunkErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error for debugging (could integrate with error tracking service)
    console.error('ChunkErrorBoundary caught an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ChunkErrorBoundaryProps): void {
    // Reset error state when children change (navigation to different route)
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false, error: null, retryCount: 0 });
    }
  }

  handleRetry = (): void => {
    const { retryCount } = this.state;
    if (retryCount >= ChunkErrorBoundaryBase.MAX_RETRIES) {
      // Too many retries - force full reload to bust cache
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null, retryCount: retryCount + 1 });
  };

  handleReload = (): void => {
    // Full page reload as fallback
    window.location.reload();
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, t } = this.props;

    if (hasError && error) {
      const isChunkError = isChunkLoadError(error);

      return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            {/* Error icon */}
            <div className="mb-6">
              <svg
                className="w-16 h-16 mx-auto text-[var(--text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error message */}
            <h2 className="font-display text-xl text-[var(--text-primary)] mb-2">
              {isChunkError
                ? t('chunkError.title', 'Failed to load')
                : t('chunkError.unexpectedTitle', 'Something went wrong')}
            </h2>
            <p className="font-body text-[var(--text-secondary)] mb-6">
              {isChunkError
                ? t(
                    'chunkError.description',
                    'There was a problem loading this page. Please check your connection and try again.'
                  )
                : t(
                    'chunkError.unexpectedDescription',
                    'An unexpected error occurred. Please try again.'
                  )}
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                data-testid="chunk-error-btn-retry"
                className="px-6 py-2.5 bg-[var(--accent)] text-white font-body text-sm
                         hover:bg-[var(--accent-soft)] transition-colors duration-200"
              >
                {t('chunkError.retry', 'Try again')}
              </button>
              <button
                onClick={this.handleReload}
                data-testid="chunk-error-btn-reload"
                className="px-6 py-2.5 border border-[var(--border-strong)] text-[var(--text-secondary)]
                         font-body text-sm hover:bg-[var(--bg-secondary)] transition-colors duration-200"
              >
                {t('chunkError.reload', 'Reload page')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

const ChunkErrorBoundary = withTranslation('common')(ChunkErrorBoundaryBase);

export default ChunkErrorBoundary;
