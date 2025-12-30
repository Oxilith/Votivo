/**
 * @file src/components/shared/LoadingFallback.tsx
 * @purpose Loading state component for React Suspense boundaries during lazy loading
 * @functionality
 * - Displays centered loading indicator with subtle animation
 * - Uses theme-aware colors for consistent appearance
 * - Provides fullscreen or contained variants
 * @dependencies
 * - React
 */

import type { FC } from 'react';

interface LoadingFallbackProps {
  /** Display as fullscreen (default) or contained within parent */
  variant?: 'fullscreen' | 'contained';
}

const LoadingFallback: FC<LoadingFallbackProps> = ({ variant = 'fullscreen' }) => {
  const containerClasses =
    variant === 'fullscreen'
      ? 'min-h-screen bg-[var(--bg-primary)]'
      : 'min-h-[200px]';

  return (
    <div className={`${containerClasses} flex items-center justify-center`}>
      <div className="flex flex-col items-center gap-3">
        {/* Animated dots - synchronized wave effect */}
        <div className="flex gap-1">
          <span
            className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-staggered-pulse"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-staggered-pulse"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-staggered-pulse"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingFallback;
