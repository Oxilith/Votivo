/**
 * @file src/components/shared/icons/ArrowDownIcon.tsx
 * @purpose Arrow down icon for scroll indicators and downward navigation
 * @functionality
 * - Renders a downward-pointing arrow SVG icon with arrowhead
 * - Supports size variants: sm (16px), md (20px), lg (24px)
 * - Uses currentColor for stroke to inherit text color
 * @dependencies
 * - React
 * - ./Icon (IconProps, IconSize)
 */

import type { FC } from 'react';
import type { IconProps } from './Icon';

const sizeConfig: Record<'sm' | 'md' | 'lg', { className: string }> = {
  sm: { className: 'w-4 h-4' },
  md: { className: 'w-5 h-5' },
  lg: { className: 'w-6 h-6' },
};

/**
 * Arrow Down Icon
 * Used for scroll indicators and downward navigation cues
 */
const ArrowDownIcon: FC<IconProps> = ({
  size = 'md',
  className = '',
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 14l-7 7m0 0l-7-7m7 7V3"
      />
    </svg>
  );
};

export default ArrowDownIcon;
