/**
 * @file src/contexts/ThemeContext.ts
 * @purpose React context definition for theme state
 * @functionality
 * - Defines ThemeContext for consuming theme state
 * - Exports context value type for type safety
 * @dependencies
 * - React (createContext)
 * - @/hooks/useTheme (Theme type)
 */

import { createContext } from 'react';
import type { Theme } from '@/hooks';

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
