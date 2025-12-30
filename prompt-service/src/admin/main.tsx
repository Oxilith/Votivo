/**
 * @file prompt-service/src/admin/main.tsx
 * @purpose React entry point for the Admin UI application
 * @functionality
 * - Mounts React application to DOM
 * - Wraps app with BrowserRouter for routing
 * @dependencies
 * - react-dom/client for React 18 rendering
 * - react-router-dom for routing
 * - @/admin/App for main application component
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <BrowserRouter basename="/admin">
      <App />
    </BrowserRouter>
  </StrictMode>
);
