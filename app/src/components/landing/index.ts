/**
 * @file src/components/landing/index.ts
 * @purpose Barrel export file for landing page components
 * @functionality
 * - Exports all section components
 * - Exports all shared components
 * - NOTE: LandingPage is NOT exported here - it's lazy-loaded in App.tsx for code splitting
 * @dependencies
 * - ./sections
 * - ./parts
 */

// Section components
export * from './sections'; // @allow-wildcard

// Landing page parts (reusable components)
export * from './parts'; // @allow-wildcard

// LandingPage is lazy-loaded in App.tsx - not exported from barrel
// See: app/src/App.tsx for lazy import
