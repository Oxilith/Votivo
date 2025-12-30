/**
 * @file prompt-service/src/admin/App.tsx
 * @purpose Main application component with route configuration
 * @functionality
 * - Defines routes for prompt and A/B test management pages
 * - Provides login page for authentication
 * - Wraps protected pages with authentication check
 * - Wraps authenticated pages with Layout component
 * - Provides navigation between admin sections
 * @dependencies
 * - react-router-dom for routing
 * - @/admin/components/Layout for page layout
 * - @/admin/components/ProtectedRoute for auth protection
 * - @/admin/pages/* for page components
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import {
  Layout,
  ProtectedRoute,
  LoginPage,
  PromptListPage,
  PromptEditPage,
  PromptCreatePage,
  ABTestListPage,
  ABTestEditPage,
  ABTestCreatePage,
} from '@/admin';

export function App() {
  return (
    <Routes>
      {/* Public route - Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes - require authentication */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/prompts" replace />} />
                <Route path="/prompts" element={<PromptListPage />} />
                <Route path="/prompts/new" element={<PromptCreatePage />} />
                <Route path="/prompts/:id" element={<PromptEditPage />} />
                <Route path="/ab-tests" element={<ABTestListPage />} />
                <Route path="/ab-tests/new" element={<ABTestCreatePage />} />
                <Route path="/ab-tests/:id" element={<ABTestEditPage />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
