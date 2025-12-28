/**
 * @file src/components/shared/icons/CheckIcon.tsx
 * @purpose Checkmark icon for selected/checked states
 * @functionality
 * - Renders a filled checkmark SVG icon
 * - Supports size variants: sm (16px), md (20px), lg (24px)
 * - Uses currentColor for fill to inherit text color
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
 * Check Icon
 * Used for checkbox checked states and selection indicators
 */
const CheckIcon: FC<IconProps> = ({
  size = 'md',
  className = '',
  'aria-hidden': ariaHidden = true,
  'aria-label': ariaLabel,
}) => {
  const config = sizeConfig[size];

  return (
    <svg
      className={`${config.className} ${className}`.trim()}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
};

export default CheckIcon;
