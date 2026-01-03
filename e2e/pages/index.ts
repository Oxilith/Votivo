/**
 * @file e2e/pages/index.ts
 * @purpose Barrel export for all Page Object Models
 * @functionality
 * - Exports BasePage with CSRF constants
 * - Exports all feature-specific page objects
 * - Provides single import point for tests
 * @dependencies
 * - All page object modules
 */

// Base page with common functionality and CSRF constants
export { BasePage, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from './BasePage';

// Authentication pages
export { LoginPage } from './LoginPage';
export { RegisterPage, type RegistrationData } from './RegisterPage';

// Feature pages
export { AssessmentPage } from './AssessmentPage';
export { InsightsPage, type InsightTab } from './InsightsPage';
export { ProfilePage, type ProfileTab } from './ProfilePage';

// Admin pages
export { AdminPage } from './AdminPage';

// Layout testing
export { LayoutPage, VIEWPORTS } from './LayoutPage';
