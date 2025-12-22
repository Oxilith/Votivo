/**
 * @file src/components/providers/ThemeProvider.tsx
 * @purpose Provider component that wraps app with theme context
 * @functionality
 * - Provides theme state to entire component tree
 * - Uses useTheme hook for state management
 * - Enables theme access without prop drilling
 * @dependencies
 * - React (ReactNode)
 * - @/contexts/ThemeContext (ThemeContext)
 * - @/hooks/useTheme (useTheme)
 */

import type { ReactNode } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';
import { useTheme } from '@/hooks/useTheme';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const themeValue = useTheme();
  return <ThemeContext.Provider value={themeValue}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
