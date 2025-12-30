/**
 * @file src/components/index.ts
 * @purpose Main barrel export for all components
 * @functionality
 * - Re-exports assessment components
 * - Re-exports auth components
 * - Re-exports insights components
 * - Re-exports landing components
 * - Re-exports profile components
 * - Re-exports provider components
 * - Re-exports shared components
 * @dependencies
 * - ./assessment
 * - ./auth
 * - ./insights
 * - ./landing
 * - ./profile
 * - ./providers
 * - ./shared
 */

export * from './assessment'; // @allow-wildcard
export * from './auth'; // @allow-wildcard
export * from './insights'; // @allow-wildcard
export * from './landing'; // @allow-wildcard
export * from './profile'; // @allow-wildcard
export * from './providers'; // @allow-wildcard
export * from './shared'; // @allow-wildcard
