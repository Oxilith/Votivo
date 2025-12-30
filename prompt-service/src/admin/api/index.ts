/**
 * @file prompt-service/src/admin/api/index.ts
 * @purpose Barrel export for admin API modules
 * @functionality
 * - Exports authentication utilities (login, logout, checkAuth, headers)
 * - Exports prompt API client
 * - Exports A/B test API client
 * @dependencies
 * - ./auth
 * - ./promptApi
 * - ./abTestApi
 */

export {
  login,
  logout,
  checkAuth,
  getAuthHeaders,
  getAuthHeadersNoContent,
  handleUnauthorized,
} from './auth';
export { promptApi } from './promptApi';
export { abTestApi } from './abTestApi';
