/**
 * @file src/components/shared/LoadingFallback.tsx
 * @purpose Loading state component for React Suspense boundaries during lazy loading
 * @functionality
 * - Wraps InkLoader for consistent loading animation
 * - Provides fullscreen or contained variants
 * - Used as Suspense fallback throughout the app
 * @dependencies
 * - React
 * - InkLoader
 */

import type { FC } from 'react';
import InkLoader from './InkLoader';

interface LoadingFallbackProps {
  /** Display as fullscreen (default) or contained within parent */
  variant?: 'fullscreen' | 'contained';
}

/**
 * LoadingFallback - Wrapper around InkLoader for Suspense boundaries
 *
 * @example
 * <Suspense fallback={<LoadingFallback />}>
 *   <LazyComponent />
 * </Suspense>
 */
const LoadingFallback: FC<LoadingFallbackProps> = ({ variant = 'fullscreen' }) => {
  return <InkLoader variant={variant} />;
};

export default LoadingFallback;
