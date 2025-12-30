/**
 * @file src/hooks/useThemeContext.ts
 * @purpose Hook for accessing theme context throughout component tree
 * @functionality
 * - Provides typed access to theme context value
 * - Throws helpful error if used outside ThemeProvider
 * @dependencies
 * - React (useContext)
 * - @/contexts (ThemeContext, ThemeContextValue)
 */

import { useContext } from 'react';
import { ThemeContext } from '@/contexts';
import type { ThemeContextValue } from '@/contexts';

export const useThemeContext = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

export default useThemeContext;
