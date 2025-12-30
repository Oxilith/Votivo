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
 * - ./components/Layout for page layout
 * - ./components/ProtectedRoute for auth protection
 * - ./pages/* for page components
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { PromptListPage } from './pages/PromptListPage';
import { PromptEditPage } from './pages/PromptEditPage';
import { PromptCreatePage } from './pages/PromptCreatePage';
import { ABTestListPage } from './pages/ABTestListPage';
import { ABTestEditPage } from './pages/ABTestEditPage';
import { ABTestCreatePage } from './pages/ABTestCreatePage';

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
