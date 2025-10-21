import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useAuth } from '@clerk/clerk-react'
import { ThemeProvider } from '@/shared/context/ThemeProvider'
import { BrokerProvider } from '@/shared/context/BrokerContext'
import { NotificationProvider } from '@/features/gamification/providers/NotificationProvider'

// MivraTech Pages
import Auth from '@/pages/Auth'
import Operations from '@/pages/Operations'
import Settings from '@/pages/Settings'
import MarketScanner from '@/pages/MarketScanner'
import History from '@/pages/History'

// Gamification Pages
import { LeaderboardPage } from '@/features/gamification/pages/Leaderboard'
import { BadgesCollection } from '@/features/gamification/components/BadgesCollection'

// Wrapper for Badges page with userId
function BadgesPage() {
  const { userId } = useAuth()
  return <BadgesCollection userId={userId} />
}

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
          <NotificationProvider>
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

                {/* Gamification Pages */}
                <Route path="/gamification/leaderboard" element={<LeaderboardPage />} />
                <Route path="/gamification/badges" element={<BadgesPage />} />

                {/* 404 */}
                <Route path="*" element={<Navigate to="/operations" replace />} />
              </Routes>

              {/* Global Toast Notifications */}
              <Toaster position="top-right" richColors closeButton />
            </BrowserRouter>
          </NotificationProvider>
        </BrokerProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
