/**
 * @file src/components/shared/index.ts
 * @purpose Barrel export for shared UI components
 * @functionality
 * - Exports DateBadge component
 * - Exports ExportDropdown component
 * - Exports InkBrushDecoration component
 * - Exports LanguageToggle component
 * - Exports PageNavigation component
 * - Exports ThemeToggle component
 * - Exports UserAvatarDropdown component
 * - Re-exports all icons from icons sub-barrel
 * @dependencies
 * - ./DateBadge
 * - ./ExportDropdown
 * - ./InkBrushDecoration
 * - ./LanguageToggle
 * - ./PageNavigation
 * - ./ThemeToggle
 * - ./UserAvatarDropdown
 * - ./icons
 */

export { default as DateBadge } from './DateBadge';
export { default as ExportDropdown } from './ExportDropdown';
export { default as InkBrushDecoration } from './InkBrushDecoration';
export { default as LanguageToggle } from './LanguageToggle';
export { default as PageNavigation } from './PageNavigation';
export { default as ThemeToggle } from './ThemeToggle';
export { default as UserAvatarDropdown } from './UserAvatarDropdown';

// Re-export all icons
export * from './icons'; // @allow-wildcard
