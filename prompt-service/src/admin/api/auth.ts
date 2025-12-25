/**
 * @file prompt-service/src/admin/api/auth.ts
 * @purpose Authentication utilities for admin API requests
 * @functionality
 * - Stores and retrieves admin API key from localStorage
 * - Provides function to get auth headers for API requests
 * - Handles 401 responses by redirecting to login
 * @dependencies
 * - localStorage for API key storage
 */

const ADMIN_API_KEY_STORAGE_KEY = 'adminApiKey';

/**
 * Get the stored admin API key from localStorage
 */
export function getAdminApiKey(): string | null {
  return localStorage.getItem(ADMIN_API_KEY_STORAGE_KEY);
}

/**
 * Store the admin API key in localStorage
 */
export function setAdminApiKey(apiKey: string): void {
  localStorage.setItem(ADMIN_API_KEY_STORAGE_KEY, apiKey);
}

/**
 * Clear the stored admin API key
 */
export function clearAdminApiKey(): void {
  localStorage.removeItem(ADMIN_API_KEY_STORAGE_KEY);
}

/**
 * Check if user is authenticated (has stored API key)
 */
export function isAuthenticated(): boolean {
  return getAdminApiKey() !== null;
}

/**
 * Get headers with authentication for API requests
 */
export function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const apiKey = getAdminApiKey();
  if (apiKey) {
    headers['X-Admin-Key'] = apiKey;
  }

  return headers;
}

/**
 * Get headers without Content-Type (for requests without body)
 */
export function getAuthHeadersNoContent(): HeadersInit {
  const headers: HeadersInit = {};

  const apiKey = getAdminApiKey();
  if (apiKey) {
    headers['X-Admin-Key'] = apiKey;
  }

  return headers;
}

/**
 * Handle 401 response by clearing stored key and redirecting to login
 */
export function handleUnauthorized(): void {
  clearAdminApiKey();
  window.location.href = '/admin/login';
}
