/**
 * @file src/components/shared/icons/MoonIcon.tsx
 * @purpose Moon icon for dark theme toggle indicator
 * @functionality
 * - Renders a crescent moon SVG icon
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
 * Moon Icon
 * Used for theme toggle (dark mode indicator) in Header and NavSection
 */
const MoonIcon: FC<IconProps> = ({
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
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
};

export default MoonIcon;
