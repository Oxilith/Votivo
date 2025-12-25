/**
 * @file prompt-service/src/admin/pages/LoginPage.tsx
 * @purpose Login page for admin authentication
 * @functionality
 * - Displays login form for entering admin API key
 * - Authenticates via API and receives HttpOnly session cookie
 * - Redirects to prompts page after successful login
 * - Shows validation feedback for empty input or invalid credentials
 * @dependencies
 * - react for useState
 * - react-router-dom for navigation
 * - ../api/auth for login API call
 */

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth.js';

export function LoginPage() {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await login(apiKey.trim());

    if (result.success) {
      navigate('/prompts');
    } else {
      setError(result.error ?? 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Prompt Service Admin</h1>
        <p style={styles.subtitle}>Enter your admin API key to continue</p>

        <form onSubmit={(e) => void handleSubmit(e)} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="apiKey" style={styles.label}>
              Admin API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError('');
              }}
              placeholder="Enter your API key"
              style={styles.input}
              autoFocus
              disabled={isLoading}
            />
            {error && <p style={styles.error}>{error}</p>}
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={styles.hint}>
          The API key should be provided by your system administrator.
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '1rem',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    padding: '2rem',
    maxWidth: '400px',
    width: '100%',
  },
  title: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#333',
    textAlign: 'center' as const,
  },
  subtitle: {
    margin: '0 0 1.5rem 0',
    fontSize: '0.875rem',
    color: '#666',
    textAlign: 'center' as const,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#333',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  error: {
    margin: 0,
    fontSize: '0.75rem',
    color: '#dc2626',
  },
  button: {
    padding: '0.75rem',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  hint: {
    marginTop: '1.5rem',
    fontSize: '0.75rem',
    color: '#999',
    textAlign: 'center' as const,
  },
};
