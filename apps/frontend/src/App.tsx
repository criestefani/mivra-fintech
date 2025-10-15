import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

// Pages
import Auth from '@/pages/Auth'
import Operations from '@/pages/Operations'
import Settings from '@/pages/Settings'
import MarketScanner from '@/pages/MarketScanner'

// Admin Pages
import { AdminDashboard, AdminUsers, AdminTrades, AdminSettings } from '@/features/admin'

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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route path="/auth" element={<Auth />} />

          {/* Main App */}
          <Route path="/" element={<Navigate to="/operations" replace />} />
          <Route path="/operations" element={<Operations />} />
          <Route path="/market-scanner" element={<MarketScanner />} />
          <Route path="/settings" element={<Settings />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/trades" element={<AdminTrades />} />
          <Route path="/admin/settings" element={<AdminSettings />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/operations" replace />} />
        </Routes>

        {/* Global Toast Notifications */}
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
