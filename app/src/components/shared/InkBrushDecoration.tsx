/**
 * @file src/components/shared/InkBrushDecoration.tsx
 * @purpose Fixed ink brush SVG decoration used across all pages for Ink & Stone aesthetic
 * @functionality
 * - Renders decorative ink brush strokes on the right side of the page
 * - Ink-draw animation plays on mount (stroke draws in, then circles splash)
 * - Hidden on smaller screens (lg:block)
 * - Non-interactive (pointer-events-none)
 * - Subtle opacity that adjusts for light/dark themes
 * @dependencies
 * - React
 */

import type { FC, CSSProperties } from 'react';

/**
 * InkBrushDecoration - Fixed ink brush SVG decoration for page aesthetics
 * Always animates on mount with ink-draw effect
 */
const InkBrushDecoration: FC = () => {
  const pathStyle: CSSProperties = {
    strokeDasharray: 2000,
    strokeDashoffset: 2000,
    animation: 'ink-draw 3s var(--ease-out) 0.5s forwards',
  };

  const circle1Style: CSSProperties = {
    opacity: 0,
    animation: 'ink-splash 0.8s var(--ease-out) 2s forwards',
  };

  const circle2Style: CSSProperties = {
    opacity: 0,
    animation: 'ink-splash 0.8s var(--ease-out) 2.5s forwards',
  };

  return (
    <svg
      data-testid="ink-brush-decoration"
      className="fixed right-0 top-[10%] h-[80vh] w-auto max-w-[500px] opacity-[0.06] dark:opacity-[0.08] pointer-events-none z-[1] hidden lg:block"
      viewBox="0 0 400 800"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M200 0 Q 250 200 180 400 Q 120 600 220 800"
        stroke="currentColor"
        strokeWidth="80"
        strokeLinecap="round"
        style={pathStyle}
      />
      <circle cx="200" cy="150" r="60" fill="currentColor" style={circle1Style} />
      <circle cx="180" cy="450" r="40" fill="currentColor" style={circle2Style} />
    </svg>
  );
};

export default InkBrushDecoration;
