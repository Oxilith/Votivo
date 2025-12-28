/**
 * @file src/components/shared/icons/SwitchHorizontalIcon.tsx
 * @purpose Horizontal switch icon for contradictions insight type
 * @functionality
 * - Renders bidirectional arrows SVG icon representing contradictions/opposites
 * - Supports size variants: sm (16px), md (20px), lg (24px)
 * - Uses currentColor for stroke to inherit text color
 * @dependencies
 * - React
 * - ./Icon (IconProps)
 */

import type { FC } from 'react';
import type { IconProps } from './Icon';

const sizeConfig: Record<'sm' | 'md' | 'lg', { className: string }> = {
  sm: { className: 'w-4 h-4' },
  md: { className: 'w-5 h-5' },
  lg: { className: 'w-6 h-6' },
};

/**
 * SwitchHorizontal Icon
 * Used for contradictions insight type in InsightsSection
 */
const SwitchHorizontalIcon: FC<IconProps> = ({
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
        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
      />
    </svg>
  );
};

export default SwitchHorizontalIcon;
