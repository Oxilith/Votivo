/**
 * @file src/components/insights/index.ts
 * @purpose Barrel export for insights components
 * @functionality
 * - Exports insight card component
 * - Exports insights page header
 * - Exports save prompt modal
 * - NOTE: IdentityInsightsAI is NOT exported here - it's lazy-loaded in App.tsx for code splitting
 * @dependencies
 * - ./InsightCard
 * - ./InsightsPageHeader
 * - ./SavePromptModal
 */

export { default as InsightCard } from './InsightCard';
export { default as InsightsPageHeader } from './InsightsPageHeader';
export { default as SavePromptModal } from './SavePromptModal';

// IdentityInsightsAI is lazy-loaded in App.tsx - not exported from barrel
// See: app/src/App.tsx for lazy import
