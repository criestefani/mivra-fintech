import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const initialState: ThemeProviderState = {
  theme: 'dark',
  setTheme: () => null,
  toggleTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'mivratech-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return defaultTheme
    }

    const stored = window.localStorage.getItem(storageKey) as Theme | null
    const resolved = stored ?? defaultTheme
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
    root.setAttribute('data-color-mode', resolved)
    root.style.setProperty('color-scheme', resolved)

    if (!stored) {
      window.localStorage.setItem(storageKey, resolved)
    }

    return resolved
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const root = window.document.documentElement

    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    root.setAttribute('data-color-mode', theme)
    root.style.setProperty('color-scheme', theme)
  }, [theme])

  const applyTheme = (value: Theme) => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(storageKey, value)
    setThemeState(value)
  }

  const value = {
    theme,
    setTheme: applyTheme,
    toggleTheme: () => applyTheme(theme === 'dark' ? 'light' : 'dark'),
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
