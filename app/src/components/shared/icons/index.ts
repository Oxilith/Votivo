/**
 * @file src/components/shared/icons/index.ts
 * @purpose Centralized icon component library with consistent sizing and accessibility
 * @functionality
 * - Provides 20+ reusable SVG icon components with shared styling patterns
 * - Supports four size variants: xs (12px), sm (16px), md (20px), lg (24px)
 * - All icons use 24x24 viewBox for consistent scaling
 * - Icons inherit text color via currentColor for seamless theming
 * - Built-in accessibility support with aria-hidden and aria-label props
 * - Includes navigation, theme, feedback, action, brand, and communication icons
 * @dependencies
 * - React (FC, SVG elements)
 *
 * @example
 * // Basic usage
 * import { CheckIcon, SunIcon } from '@/components';
 * <CheckIcon size="md" />
 * <SunIcon size="lg" className="text-yellow-500" />
 *
 * @example
 * // Accessible icon with label
 * <ArrowRightIcon aria-hidden={false} aria-label="Navigate forward" />
 */

// Base Icon component and types
export { default as Icon } from './Icon';
export type { IconProps, IconSize } from './Icon';

// Navigation icons
export { default as ChevronDownIcon } from './ChevronDownIcon';
export { default as ArrowRightIcon } from './ArrowRightIcon';
export { default as ArrowDownIcon } from './ArrowDownIcon';

// Theme icons
export { default as SunIcon } from './SunIcon';
export { default as MoonIcon } from './MoonIcon';

// Menu icons
export { default as MoreVerticalIcon } from './MoreVerticalIcon';
export { default as UploadIcon } from './UploadIcon';
export { default as DownloadIcon } from './DownloadIcon';

// Feedback icons
export { default as ErrorCircleIcon } from './ErrorCircleIcon';
export { default as CheckIcon } from './CheckIcon';
export { default as AlertTriangleIcon } from './AlertTriangleIcon';

// Action icons
export { default as SearchIcon } from './SearchIcon';
export { default as RefreshIcon } from './RefreshIcon';
export { default as LoadingSpinnerIcon } from './LoadingSpinnerIcon';

// Brand icons
export { default as GitHubIcon } from './GitHubIcon';

// Communication icons
export { default as MailIcon } from './MailIcon';

// Insight type icons
export { default as ChartBarIcon } from './ChartBarIcon';
export { default as SwitchHorizontalIcon } from './SwitchHorizontalIcon';
export { default as EyeIcon } from './EyeIcon';
export { default as EyeOffIcon } from './EyeOffIcon';
export { default as LightningBoltIcon } from './LightningBoltIcon';
export { default as LightbulbIcon } from './LightbulbIcon';
export { default as TargetIcon } from './TargetIcon';
export { default as MirrorIcon } from './MirrorIcon';
