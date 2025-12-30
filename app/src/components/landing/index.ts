/**
 * @file src/components/landing/index.ts
 * @purpose Barrel export file for landing page components
 * @functionality
 * - Exports LandingPage as default
 * - Exports all section components
 * - Exports all shared components
 * @dependencies
 * - Landing page components
 */

// Main landing page
export { default as LandingPage } from './LandingPage';

// Section components
export * from './sections'; // @allow-wildcard

// Landing page parts (reusable components)
export * from './parts'; // @allow-wildcard
