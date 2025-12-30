/**
 * @file src/components/profile/index.ts
 * @purpose Barrel exports for profile components
 * @functionality
 * - ProfilePage is NOT exported here to enable code-splitting via React.lazy
 * - App.tsx imports ProfilePage directly via lazy(() => import('@/components/profile/ProfilePage'))
 * @dependencies
 * - None (ProfilePage imported directly where needed)
 */

// ProfilePage intentionally not exported here - it's lazy-loaded in App.tsx
// See: app/src/App.tsx for the lazy import
