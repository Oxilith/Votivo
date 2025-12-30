/**
 * @file src/components/landing/shared/VotiveLogo.tsx
 * @purpose Hanko seal logo component inspired by Japanese personal stamps (hanko/inkan)
 * @functionality
 * - Renders square seal with vermilion background and white "V" character
 * - Supports three size variants: sm (nav), md (default), lg (hero)
 * - Includes subtle organic rotation for handcrafted aesthetic (-3deg)
 * - Adapts to light/dark themes via CSS custom properties
 * @dependencies
 * - React
 */

import type { FC } from 'react';

type LogoSize = 'sm' | 'md' | 'lg';

interface VotiveLogoProps {
  size?: LogoSize;
  className?: string;
  /** @deprecated No longer used in Ink & Stone design */
  withGlow?: boolean;
}

const sizeConfig: Record<LogoSize, { dimension: string; fontSize: string; borderRadius: string }> = {
  sm: {
    dimension: 'w-8 h-8',
    fontSize: 'text-lg',
    borderRadius: 'rounded-[3px]',
  },
  md: {
    dimension: 'w-10 h-10',
    fontSize: 'text-xl',
    borderRadius: 'rounded-[4px]',
  },
  lg: {
    dimension: 'w-14 h-14',
    fontSize: 'text-2xl',
    borderRadius: 'rounded-[5px]',
  },
};

const VotiveLogo: FC<VotiveLogoProps> = ({ size = 'md', className = '' }) => {
  const config = sizeConfig[size];

  return (
    <div
      className={`
        ${config.dimension}
        ${config.borderRadius}
        bg-[var(--accent)]
        flex items-center justify-center
        -rotate-3
        transition-transform duration-200
        hover:rotate-0
        ${className}
      `.trim()}
      aria-label="Votive"
      role="img"
    >
      <span
        className={`
          font-display font-semibold
          ${config.fontSize}
          text-white
          select-none
          leading-none
        `}
      >
        V
      </span>
    </div>
  );
};

export default VotiveLogo;
