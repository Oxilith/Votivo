/**
 * @file test/test-utils.tsx
 * @purpose Custom render function with providers for testing
 * @functionality
 * - Wraps components with necessary providers (Theme, i18n)
 * - Provides reusable render utility for tests
 * - Exports testing-library utilities
 * @dependencies
 * - @testing-library/react
 * - @/components/providers/ThemeProvider
 * - react-i18next
 */

import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@/components';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@/i18n';

interface AllTheProvidersProps {
  children: ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>{children}</ThemeProvider>
    </I18nextProvider>
  );
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
