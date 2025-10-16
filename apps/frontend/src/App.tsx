import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/shared/context/ThemeProvider'
import { BrokerProvider } from '@/shared/context/BrokerContext'

// MivraTech Pages
import Auth from '@/pages/Auth'
import Operations from '@/pages/Operations'
import Settings from '@/pages/Settings'
import MarketScanner from '@/pages/MarketScanner'
import History from '@/pages/History'

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
})

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="mivratech-ui-theme">
      <QueryClientProvider client={queryClient}>
        <BrokerProvider>
          <BrowserRouter>
            <Routes>
              {/* Auth */}
              <Route path="/auth" element={<Auth />} />

              {/* MivraTech App */}
              <Route path="/" element={<Navigate to="/operations" replace />} />
              <Route path="/operations" element={<Operations />} />
              <Route path="/market-scanner" element={<MarketScanner />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/history" element={<History />} />

              {/* 404 */}
              <Route path="*" element={<Navigate to="/operations" replace />} />
            </Routes>

            {/* Global Toast Notifications */}
            <Toaster position="top-right" richColors closeButton />
          </BrowserRouter>
        </BrokerProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
