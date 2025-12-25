/**
 * @file prompt-service/src/admin/api/auth.ts
 * @purpose Authentication utilities for admin API requests using HttpOnly cookies
 * @functionality
 * - Provides login function that authenticates via API and sets HttpOnly cookie
 * - Provides logout function that clears the session cookie
 * - Provides checkAuth function to verify authentication status
 * - Handles 401 responses by redirecting to login
 * @dependencies
 * - fetch API for HTTP requests
 * - HttpOnly cookies for secure session storage (set by server)
 */

const API_BASE = '/api/auth';

interface AuthResponse {
  success?: boolean;
  authenticated?: boolean;
  error?: string;
}

/**
 * Login with admin API key
 * Server will set HttpOnly session cookie on success
 */
export async function login(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
      credentials: 'include', // Important for cookies
    });

    const data = (await response.json()) as AuthResponse;

    if (!response.ok) {
      return { success: false, error: data.error ?? 'Login failed' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Network error - please try again' };
  }
}

/**
 * Logout and clear session cookie
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Ignore errors on logout
  }
  // Redirect to login page
  window.location.href = '/admin/login';
}

/**
 * Check if user is authenticated by verifying session with server
 */
export async function checkAuth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/verify`, {
      credentials: 'include',
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as AuthResponse;
    return data.authenticated === true;
  } catch {
    return false;
  }
}

/**
 * Get headers for authenticated API requests
 * Cookie is sent automatically via credentials: 'include'
 */
export function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

/**
 * Get headers without Content-Type (for requests without body)
 */
export function getAuthHeadersNoContent(): HeadersInit {
  return {};
}

/**
 * Handle 401 response by redirecting to login
 */
export function handleUnauthorized(): void {
  window.location.href = '/admin/login';
}
