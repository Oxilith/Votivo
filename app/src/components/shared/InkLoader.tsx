/**
 * @file src/components/shared/InkLoader.tsx
 * @purpose Loading animation component with ink-style aesthetics
 * @functionality
 * - Provides 3 variants: fullscreen, contained, and inline
 * - Uses ink-style rotating circles animation (vermilion accent)
 * - Supports optional title message and description text
 * - Theme-aware background for fullscreen variant
 * @dependencies
 * - React
 */

import type { FC } from 'react';

/**
 * Props for the InkLoader component
 */
export interface InkLoaderProps {
  /** Display variant determining size and container behavior */
  variant?: 'fullscreen' | 'contained' | 'inline';
  /** Optional title/message to display below the loader */
  message?: string;
  /** Optional description text below the message */
  description?: string;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
}

/**
 * Size configuration for each variant
 */
const sizeConfig = {
  fullscreen: {
    container: 'min-h-screen bg-[var(--bg-primary)] flex items-center justify-center',
    svg: 'w-20 h-20', // 80px
    animationDuration: '2.5s',
  },
  contained: {
    container: 'min-h-[200px] flex items-center justify-center',
    svg: 'w-12 h-12', // 48px
    animationDuration: '2.5s',
  },
  inline: {
    container: 'inline-flex items-center justify-center',
    svg: 'w-5 h-5', // 20px
    animationDuration: '2s',
  },
} as const;

/**
 * InkLoader - Ink-style loading animation for the app
 *
 * Uses rotating circles that match the Votive Ink & Stone design system.
 *
 * @example
 * // Fullscreen loading (route transitions, initial load)
 * <InkLoader variant="fullscreen" />
 *
 * @example
 * // Contained loading with message and description (lists, sections)
 * <InkLoader variant="contained" message="Loading..." description="Please wait" />
 *
 * @example
 * // Inline loading (buttons, form submissions)
 * <InkLoader variant="inline" />
 */
const InkLoader: FC<InkLoaderProps> = ({
  variant = 'fullscreen',
  message,
  description,
  className = '',
  'aria-label': ariaLabel = 'Loading',
}) => {
  const config = sizeConfig[variant];

  return (
    <div
      className={`${config.container} ${className}`.trim()}
      role="status"
      aria-label={ariaLabel}
      data-testid="ink-loader"
    >
      <div className="flex flex-col items-center gap-3">
        {/* Ink brush loading animation - two nested rotating circles */}
        <svg
          viewBox="0 0 80 80"
          className={`${config.svg} animate-spin`}
          style={{ animationDuration: config.animationDuration }}
          aria-hidden="true"
        >
          {/* Outer circle with dash pattern */}
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="60 140"
            className="opacity-60"
          />
          {/* Inner circle with smaller dash pattern */}
          <circle
            cx="40"
            cy="40"
            r="24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="40 120"
            className="opacity-30"
          />
        </svg>

        {/* Optional message and description (only for non-inline variants) */}
        {(message ?? description) && variant !== 'inline' && (
          <div className="text-center">
            {message && (
              <h2 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">
                {message}
              </h2>
            )}
            {description && (
              <p className="font-body text-[var(--text-secondary)]">{description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InkLoader;
