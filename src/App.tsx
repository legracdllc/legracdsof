import { ThemeProvider } from './theme/ThemeProvider'
import { AppRouter } from './routes/AppRouter'
import { LanguageProvider } from './i18n/LanguageProvider'

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppRouter />
      </LanguageProvider>
    </ThemeProvider>
  )
}
