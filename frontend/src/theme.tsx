import React, { createContext, useContext } from 'react'

interface ThemeContextValue {
  primary: string
  background: string
  surface: string
  text: string
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = {
    primary: 'var(--syn-primary)',
    background: 'var(--syn-bg-dark)',
    surface: 'var(--syn-card-bg)',
    text: 'var(--syn-text-main)',
    borderRadius: 'var(--syn-radius)',
  }
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('ThemeProvider missing')
  return ctx
}
