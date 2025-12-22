/**
 * @file src/styles/theme.ts
 * @purpose Shared theme color definitions for consistent styling across components
 * @functionality
 * - Provides card background/border color classes
 * - Provides text color classes (primary, secondary, muted, subtle)
 * - Provides hero card gradient classes
 * - Provides badge and circle badge styles
 * @dependencies
 * - None (pure Tailwind class strings)
 */

// Card styles - neutral gray backgrounds
export const cardStyles = {
  base: 'bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl',
  // Special highlighted card (light gradient)
  hero: 'bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-700 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl',
  // Dark card (inverted)
  dark: 'bg-gray-900 dark:bg-gray-800 text-white rounded-xl',
};

// Text colors
export const textStyles = {
  primary: 'text-gray-900 dark:text-gray-100',
  secondary: 'text-gray-700 dark:text-gray-300',
  muted: 'text-gray-500 dark:text-gray-400',
  subtle: 'text-gray-400 dark:text-gray-500',
};

// Badge styles
export const badgeStyles = {
  default: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  emphasis: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
};

// Circle/number badge
export const circleBadge = 'bg-gray-900 dark:bg-white text-white dark:text-gray-900';
