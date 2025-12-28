/**
 * @file src/components/shared/icons/Icon.tsx
 * @purpose Base icon wrapper component providing consistent sizing and accessibility
 * @functionality
 * - Provides three size variants: sm (16px), md (20px), lg (24px)
 * - Supports className prop for additional styling
 * - Sets aria-hidden="true" by default for decorative icons
 * - Uses currentColor for stroke/fill to inherit text color
 * @dependencies
 * - React
 */

import type { FC, ReactNode } from 'react';

export type IconSize = 'sm' | 'md' | 'lg';

export interface IconProps {
  /** Size variant: sm=16px, md=20px, lg=24px */
  size?: IconSize;
  /** Additional CSS classes */
  className?: string;
  /** SVG path content */
  children?: ReactNode;
  /** Accessibility: hide from screen readers (default: true) */
  'aria-hidden'?: boolean;
  /** Accessible label for interactive icons */
  'aria-label'?: string;
}

const sizeConfig: Record<IconSize, { dimension: number; className: string }> = {
  sm: { dimension: 16, className: 'w-4 h-4' },
  md: { dimension: 20, className: 'w-5 h-5' },
  lg: { dimension: 24, className: 'w-6 h-6' },
};

/**
 * Base Icon wrapper component
 * Provides consistent sizing and accessibility for SVG icons
 */
const Icon: FC<IconProps> = ({
  size = 'md',
  className = '',
  children,
  'aria-hidden': ariaHidden = true,
  'aria-label': ariaLabel,
}) => {
  const config = sizeConfig[size];

  return (
    <svg
      className={`${config.className} ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
    >
      {children}
    </svg>
  );
};

export default Icon;
