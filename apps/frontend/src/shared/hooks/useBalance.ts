import { useState, useEffect, useCallback } from 'react'

export type AccountType = 'demo' | 'real'

interface BalanceData {
  amount: number
  currency: string
  id: string | null
  type: AccountType
}

interface BalanceResponse {
  success: boolean
  balance: BalanceData
  availableBalances?: {
    demo: number
    real: number
  }
  error?: string
}

interface UseBalanceReturn {
  balance: BalanceData | null
  isLoading: boolean
  error: string | null
  accountType: AccountType
  setAccountType: (type: AccountType) => void
  refetch: () => Promise<void>
  availableBalances: { demo: number; real: number } | null
}

const POLLING_INTERVAL = 5000 // 5 seconds

export function useBalance(enabled = true, userId?: string): UseBalanceReturn {
  const [accountType, setAccountType] = useState<AccountType>('demo')
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [availableBalances, setAvailableBalances] = useState<{ demo: number; real: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = useCallback(async () => {
    try {
      setError(null)
      // ✅ Include userId in query if provided for per-user balance isolation
      const url = userId
        ? `/api/bot/balance?accountType=${accountType}&userId=${userId}`
        : `/api/bot/balance?accountType=${accountType}`
      const response = await fetch(url)

      // Check if response has valid JSON content before parsing
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned invalid content type: ${contentType || 'none'}`)
      }

      // Get response text first to handle empty responses
      const responseText = await response.text()
      if (!responseText) {
        throw new Error(
          response.ok
            ? 'Server returned empty response'
            : `Server error: ${response.status} ${response.statusText}`
        )
      }

      // Parse JSON only if response is not empty
      let data: BalanceResponse
      try {
        data = JSON.parse(responseText)
      } catch (parseErr) {
        throw new Error(`Invalid JSON response: ${parseErr instanceof Error ? parseErr.message : 'Unknown error'}`)
      }

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      if (data.success) {
        setBalance(data.balance)
        if (data.availableBalances) {
          setAvailableBalances(data.availableBalances)
        }
      } else {
        setError(data.error || 'Failed to fetch balance')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error fetching balance:', err)
    } finally {
      setIsLoading(false)
    }
  }, [accountType, userId])

  // Initial fetch
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    fetchBalance()
  }, [enabled, fetchBalance])

  // Polling
  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      fetchBalance()
    }, POLLING_INTERVAL)

    return () => clearInterval(interval)
  }, [enabled, fetchBalance])

  return {
    balance,
    isLoading,
    error,
    accountType,
    setAccountType,
    refetch: fetchBalance,
    availableBalances
  }
}
