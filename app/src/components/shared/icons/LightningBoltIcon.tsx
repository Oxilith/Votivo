/**
 * @file src/components/shared/icons/LightningBoltIcon.tsx
 * @purpose Lightning bolt icon for leverage insight type
 * @functionality
 * - Renders a lightning bolt SVG icon representing power/leverage
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
 * LightningBolt Icon
 * Used for leverage insight type in InsightsSection
 */
const LightningBoltIcon: FC<IconProps> = ({
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
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  );
};

export default LightningBoltIcon;
