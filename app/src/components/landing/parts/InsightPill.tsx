/**
 * @file src/components/landing/shared/InsightPill.tsx
 * @purpose Interactive pill component for displaying AI insight categories
 * @functionality
 * - Displays insight type with vermilion dot and label
 * - Includes hover animation with subtle lift
 * - Supports custom icon rendering via children prop
 * - Uses Ink & Stone stone card styling
 * @dependencies
 * - React (ReactNode)
 */

import type { FC, ReactNode } from 'react';

interface InsightPillProps {
  icon: ReactNode;
  label: string;
  className?: string;
}

const InsightPill: FC<InsightPillProps> = ({ icon, label, className = '' }) => {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)] hover:translate-y-[-2px] transition-transform duration-200 ${className}`.trim()}
    >
      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-sm bg-[var(--accent)]/10 text-[var(--accent)]">
        {icon}
      </span>
      <span className="font-body text-sm font-medium text-[var(--text-primary)]">{label}</span>
    </div>
  );
};

export default InsightPill;
