/**
 * @file prompt-service/src/admin/components/InkLoader.tsx
 * @purpose Loading animation component for admin UI with ink-style aesthetics
 * @functionality
 * - Provides 2 variants: fullscreen and contained
 * - Uses ink-style rotating circles animation (vermilion accent)
 * - Supports optional message text
 * - Theme-aware using CSS variables
 * @dependencies
 * - React
 * - @/admin/styles for color references
 */

import type React from 'react';
import { colors } from '@/admin/styles';

/**
 * Props for the InkLoader component
 */
interface InkLoaderProps {
  /** Display variant determining size and container behavior */
  variant?: 'fullscreen' | 'contained';
  /** Optional message to display below the loader */
  message?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

/**
 * InkLoader - Ink-style loading animation for admin UI
 *
 * Matches the main app's InkLoader design for consistent UX.
 */
export function InkLoader({
  variant = 'fullscreen',
  message,
  style,
}: InkLoaderProps) {
  const isFullscreen = variant === 'fullscreen';

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    ...(isFullscreen
      ? {
          minHeight: '100vh',
          backgroundColor: colors.bgPrimary,
        }
      : {
          minHeight: '200px',
        }),
    ...style,
  };

  const svgSize = isFullscreen ? 80 : 48;

  return (
    <div style={containerStyle} role="status" aria-label="Loading">
      {/* Ink brush loading animation - two nested rotating circles */}
      <svg
        viewBox="0 0 80 80"
        width={svgSize}
        height={svgSize}
        style={{
          animation: 'ink-loader-spin 2.5s linear infinite',
        }}
        aria-hidden="true"
      >
        {/* Outer circle with dash pattern */}
        <circle
          cx="40"
          cy="40"
          r="32"
          fill="none"
          stroke={colors.accent}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="60 140"
          opacity="0.6"
        />
        {/* Inner circle with smaller dash pattern */}
        <circle
          cx="40"
          cy="40"
          r="24"
          fill="none"
          stroke={colors.accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="40 120"
          opacity="0.3"
        />
      </svg>

      {/* Optional message */}
      {message && (
        <p
          style={{
            margin: 0,
            color: colors.textSecondary,
            fontSize: '0.875rem',
          }}
        >
          {message}
        </p>
      )}

      {/* Keyframes for the spin animation */}
      <style>
        {`
          @keyframes ink-loader-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
