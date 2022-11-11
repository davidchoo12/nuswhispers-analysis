import { ReactNode, createContext, useState } from 'react'
import colors from 'tailwindcss/colors'

interface Palette {
  fgColor: string
  bgColor: string
  graphFill: string
  graphGrid: string
  fgSecondary: string
  bgSecondary: string
  bgHighlight: string
}

const themes: Record<string, Palette> = {
  light: {
    fgColor: colors.slate[900],
    bgColor: colors.slate[200],
    graphFill: 'rgb(5, 150, 105, 0.15)',
    graphGrid: colors.slate[400],
    fgSecondary: colors.emerald[900],
    bgSecondary: colors.emerald[200],
    bgHighlight: colors.yellow[300],
  },
  dark: {
    fgColor: colors.slate[200],
    bgColor: colors.slate[900],
    graphFill: 'rgb(110, 231, 183, 0.15)',
    graphGrid: colors.slate[700],
    fgSecondary: colors.emerald[200],
    bgSecondary: colors.emerald[900],
    bgHighlight: colors.yellow[600],
  },
}

interface ThemeContextInterface {
  isDarkMode: boolean
  toggleDarkMode: () => void
  palette: Palette
}

export const ThemeContext = createContext<ThemeContextInterface>(undefined!)

interface ThemeProviderProps {
  children: ReactNode
}
// function setDarkMode(on: boolean) {
//   console.log('setting dark mode', on)
//   localStorage.theme = on ? 'dark' : 'light'
//   if (on) {
//     document.documentElement.classList.add('dark')
//   } else {
//     document.documentElement.classList.remove('dark')
//   }
// }

// function isDarkMode() {
//   // return window.matchMedia('(prefers-color-scheme: dark)').matches
//   return (
//     localStorage.theme === 'dark' ||
//     (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
//   )
// }

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const defaultIsDarkMode =
    localStorage.theme === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [isDarkMode, setIsDarkMode] = useState(defaultIsDarkMode)
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode)
  let palette
  if (isDarkMode) {
    localStorage.theme = 'dark'
    document.documentElement.classList.add('dark')
    palette = themes.dark
  } else {
    localStorage.theme = 'light'
    document.documentElement.classList.remove('dark')
    palette = themes.light
  }
  // const palette = isDarkMode ? themes.dark : themes.light
  return <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, palette }}>{children}</ThemeContext.Provider>
}
