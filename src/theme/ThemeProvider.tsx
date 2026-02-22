import { createContext, useContext, type ReactNode } from 'react'
import { tokens } from './tokens'

type Theme = {
  tokens: typeof tokens
}

const ThemeContext = createContext<Theme | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeContext.Provider value={{ tokens }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const v = useContext(ThemeContext)
  if (!v) throw new Error('useTheme must be used within ThemeProvider')
  return v
}

