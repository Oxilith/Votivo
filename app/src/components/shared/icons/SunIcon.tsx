/**
 * @file src/components/shared/icons/SunIcon.tsx
 * @purpose Sun icon for light theme toggle indicator
 * @functionality
 * - Renders a sun SVG icon with rays
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
 * Sun Icon
 * Used for theme toggle (light mode indicator) in Header and NavSection
 */
const SunIcon: FC<IconProps> = ({
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
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
};

export default SunIcon;
