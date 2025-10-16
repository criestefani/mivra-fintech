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

export function useBalance(enabled = true): UseBalanceReturn {
  const [accountType, setAccountType] = useState<AccountType>('demo')
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [availableBalances, setAvailableBalances] = useState<{ demo: number; real: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`/api/bot/balance?accountType=${accountType}`)
      const data: BalanceResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch balance')
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
  }, [accountType])

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
