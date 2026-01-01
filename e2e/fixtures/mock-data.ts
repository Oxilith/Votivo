/**
 * @file e2e/fixtures/mock-data.ts
 * @purpose Test data constants for E2E tests
 * @functionality
 * - Provides admin API key for testing
 * - Contains sample assessment responses
 * - Defines test user credentials
 * @dependencies
 * - None (pure constants)
 */

/**
 * Admin API key for E2E tests
 * Configured via E2E_ADMIN_API_KEY environment variable
 */
export const ADMIN_API_KEY = process.env.E2E_ADMIN_API_KEY ?? 'test-admin-key';

/**
 * Default test user password meeting validation requirements:
 * - Minimum 8 characters
 * - Contains uppercase
 * - Contains lowercase
 * - Contains number
 */
export const DEFAULT_TEST_PASSWORD = 'TestPass123!';

/**
 * Sample assessment responses for E2E tests
 * Matches the AssessmentResponses type from shared package
 */
export const MOCK_ASSESSMENT_RESPONSES = {
  // Phase 1: State Awareness
  peak_energy_times: ['early_morning', 'mid_morning'],
  low_energy_times: ['afternoon', 'evening'],
  energy_consistency: 3,
  energy_drains: 'Long meetings, unclear expectations, and context switching',
  energy_restores: 'Morning walks, focused work time, and meaningful conversations',
  mood_triggers_negative: ['lack_of_progress', 'uncertainty', 'overwhelm'],
  motivation_reliability: 4,
  willpower_pattern: 'start_stop',

  // Phase 2: Identity Mapping
  identity_statements: 'I am someone who values learning, growth, and continuous improvement',
  others_describe: 'Thoughtful, analytical, reliable, always looking to help others grow',
  automatic_behaviors: 'Check email first thing; take detailed notes in meetings; plan tomorrow before leaving',
  keystone_behaviors: 'Morning planning session sets the tone for my entire productive day',
  core_values: ['growth', 'mastery', 'impact'],
  natural_strengths: 'Problem solving, connecting disparate ideas, deep focus on complex problems',
  resistance_patterns: 'Procrastinate on ambiguous tasks, avoid confrontation, overthink decisions',
  identity_clarity: 4,
} as const;

/**
 * Test routes used in E2E tests
 */
export const E2E_ROUTES = {
  home: '/',
  auth: '/auth',
  assessment: '/assessment',
  insights: '/insights',
  profile: '/profile',
  admin: '/admin',
  adminPrompts: '/admin/prompts',
  adminAbTests: '/admin/ab-tests',
} as const;

/**
 * API endpoints accessed during E2E tests
 */
export const E2E_API_ENDPOINTS = {
  // User auth endpoints
  login: '/api/user-auth/login',
  register: '/api/user-auth/register',
  logout: '/api/user-auth/logout',
  refresh: '/api/user-auth/refresh',

  // User data endpoints
  saveAssessment: '/api/user-auth/assessment',
  saveAnalysis: '/api/user-auth/analysis',

  // Admin endpoints
  adminLogin: '/api/auth/login',
  adminLogout: '/api/auth/logout',
  prompts: '/api/prompts',
  abTests: '/api/ab-tests',

  // Analysis endpoint
  analyze: '/api/v1/claude/analyze',
} as const;

/**
 * Timeout values for E2E tests
 */
export const E2E_TIMEOUTS = {
  /** Standard page navigation */
  navigation: 10000,
  /** Form submission and API response */
  apiResponse: 15000,
  /** AI analysis (can take 2-3 minutes) */
  analysis: 180000,
  /** Element visibility check */
  elementVisible: 5000,
} as const;
