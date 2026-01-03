/**
 * @file app/src/components/insights/index.ts
 * @purpose Barrel export for insights components
 * @functionality
 * - Exports insight card component
 * - Exports insights page header
 * - NOTE: IdentityInsightsAI is NOT exported here - it's lazy-loaded in App.tsx for code splitting
 * @dependencies
 * - ./InsightCard
 * - ./InsightsPageHeader
 */

export { default as InsightCard } from './InsightCard';
export { default as InsightsPageHeader } from './InsightsPageHeader';

// IdentityInsightsAI is lazy-loaded in App.tsx - not exported from barrel
// See: app/src/App.tsx for lazy import
