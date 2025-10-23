import { useState, useEffect, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { DashboardHeader, Sidebar } from '@/features/dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { TrendingUp, TrendingDown, Activity, DollarSign, X, Filter } from 'lucide-react'
import { DiagonalSection } from '@/components/ui/gamification'
import { TradeExplanation } from '@/components/trading'

interface Trade {
  id: string
  ativo_nome: string
  direction: string
  valor: number
  resultado: string
  pnl: number
  data_abertura: string
  data_expiracao: string
  expiration_seconds: number
  account_type?: string | null
  strategy_explanation?: string
  confidence_score?: number
  indicators_snapshot?: Record<string, any>
  market_conditions?: Record<string, any>
  technical_summary?: string
  entry_price?: number
  exit_price?: number
}

type DateFilter = 'all' | 'today' | 'yesterday' | 'last7' | 'last30'
type AccountFilter = 'all' | 'demo' | 'real'
type DirectionFilter = 'all' | 'call' | 'put'

export default function History() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)
  const [showTradeExplanation, setShowTradeExplanation] = useState(false)

  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all')
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        loadTrades(user.id)
      }
    })
  }, [])

  const loadTrades = async (uid: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('trade_history')
        .select('*')
        .eq('user_id', uid)
        .order('data_abertura', { ascending: false })
        .limit(200)

      if (error) throw error
      setTrades(data || [])
    } catch (error) {
      console.error('Error loading trades:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter trades
  const filteredTrades = useMemo(() => {
    let result = [...trades]

    // Date filter
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    if (dateFilter !== 'all') {
      result = result.filter((trade) => {
        const tradeDate = new Date(trade.data_abertura)
        const tradeDateOnly = new Date(tradeDate.getFullYear(), tradeDate.getMonth(), tradeDate.getDate())

        switch (dateFilter) {
          case 'today':
            return tradeDateOnly.getTime() === today.getTime()
          case 'yesterday':
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)
            return tradeDateOnly.getTime() === yesterday.getTime()
          case 'last7':
            const sevenDaysAgo = new Date(today)
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
            return tradeDateOnly >= sevenDaysAgo && tradeDateOnly <= today
          case 'last30':
            const thirtyDaysAgo = new Date(today)
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            return tradeDateOnly >= thirtyDaysAgo && tradeDateOnly <= today
          default:
            return true
        }
      })
    }

    // Account filter
    if (accountFilter !== 'all') {
      result = result.filter((trade) => {
        const normalized = (trade.account_type || '').toString().toLowerCase()
        if (accountFilter === 'demo') {
          return ['demo', 'practice', 'virtual', 'demo_account'].includes(normalized)
        } else if (accountFilter === 'real') {
          return ['real', 'live', 'real_account', 'live_account'].includes(normalized)
        }
        return true
      })
    }

    // Direction filter
    if (directionFilter !== 'all') {
      result = result.filter(
        (trade) => trade.direction.toLowerCase() === directionFilter
      )
    }

    return result
  }, [trades, dateFilter, accountFilter, directionFilter])

  // Format trades
  const formattedTrades = useMemo(() => {
    const mapAccountType = (type: string | null | undefined) => {
      if (!type) return 'Unknown'
      const normalized = type.toString().toLowerCase()
      if (['real', 'live', 'real_account', 'live_account'].includes(normalized)) return 'Real'
      if (['demo', 'practice', 'virtual', 'demo_account'].includes(normalized)) return 'Demo'
      return type
    }

    return filteredTrades.map((trade) => ({
      ...trade,
      directionVariant: (trade.direction === 'call' || trade.direction === 'CALL' ? 'success' : 'destructive') as 'success' | 'destructive',
      directionLabel: trade.direction === 'call' || trade.direction === 'CALL' ? 'CALL' : 'PUT',
      formattedAmount: '$' + (trade.valor || 0).toFixed(2),
      formattedPnl: '$' + (trade.pnl || 0).toFixed(2),
      formattedDuration: (trade.expiration_seconds || 0) + 's',
      formattedDate: new Date(trade.data_abertura).toLocaleString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      accountLabel: mapAccountType(trade.account_type),
    }))
  }, [filteredTrades])

  // Calculate stats
  const stats = useMemo(() => {
    if (formattedTrades.length === 0) {
      return {
        totalTrades: 0,
        winRate: '0.00',
        totalPnL: 0,
        bestTrade: null,
        bestDay: null,
        bestStreak: 0,
      }
    }

    const wins = formattedTrades.filter((t) => t.resultado === 'WIN').length
    const winRate = ((wins / formattedTrades.length) * 100).toFixed(2)
    const totalPnL = formattedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)

    // Best trade
    const bestTrade = formattedTrades.reduce((best, trade) => {
      const bestPnL = best?.pnl || -Infinity
      return (trade.pnl || 0) > bestPnL ? trade : best
    }, null as any)

    // Best day
    const dayPnL: Record<string, number> = {}
    formattedTrades.forEach((trade) => {
      const date = new Date(trade.data_abertura).toDateString()
      dayPnL[date] = (dayPnL[date] || 0) + (trade.pnl || 0)
    })
    const bestDayPnL = Math.max(...Object.values(dayPnL))
    const bestDay = Object.entries(dayPnL).find(([, pnl]) => pnl === bestDayPnL)

    // Best streak
    let currentStreak = 0
    let bestStreak = 0
    formattedTrades.forEach((trade) => {
      if (trade.resultado === 'WIN') {
        currentStreak++
        bestStreak = Math.max(bestStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    })

    return {
      totalTrades: formattedTrades.length,
      winRate,
      totalPnL,
      bestTrade,
      bestDay: bestDay ? bestDayPnL : 0,
      bestStreak,
    }
  }, [formattedTrades])

  const pnlClass = stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'

  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade)
    setShowTradeExplanation(true)
  }

  const resetFilters = () => {
    setDateFilter('all')
    setAccountFilter('all')
    setDirectionFilter('all')
  }

  const hasActiveFilters = dateFilter !== 'all' || accountFilter !== 'all' || directionFilter !== 'all'

  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <DashboardHeader user={user} />
      <Sidebar />

      <main className="lg:ml-64 container mx-auto px-4 pt-8 pb-32 space-y-6 relative z-20">
        {/* Header */}
        <DiagonalSection
          direction="bottom-left"
          gradientFrom="from-primary/40"
          className="h-40 lg:h-48 relative z-20 -mx-4 lg:-ml-4"
        >
          <div className="relative z-30">
            <h1 className="text-3xl lg:text-4xl font-bold text-white">Trade History</h1>
            <p className="text-muted-foreground mt-1 text-sm lg:text-base">Complete trading performance and historical records</p>
          </div>
        </DiagonalSection>

        {/* Filter Button (Mobile) */}
        <div className="lg:hidden">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="w-full gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters {hasActiveFilters && `(${dateFilter !== 'all' ? 1 : 0}${accountFilter !== 'all' ? 1 : 0}${directionFilter !== 'all' ? 1 : 0})`}
          </Button>
        </div>

        {/* Filters Panel */}
        {(showFilters || !window.matchMedia('(max-width: 1024px)').matches) && (
          <Card className="backdrop-blur-xl bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Filters</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  disabled={!hasActiveFilters}
                >
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Filter */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Date Range</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    { value: 'all', label: 'All Time' },
                    { value: 'today', label: 'Today' },
                    { value: 'yesterday', label: 'Yesterday' },
                    { value: 'last7', label: 'Last 7 Days' },
                    { value: 'last30', label: 'Last 30 Days' },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={dateFilter === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDateFilter(option.value as DateFilter)}
                      className="text-xs"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Account Type Filter */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Account Type</p>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'demo', label: 'Demo' },
                    { value: 'real', label: 'Real' },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={accountFilter === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAccountFilter(option.value as AccountFilter)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Direction Filter */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Direction</p>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'call', label: 'CALL' },
                    { value: 'put', label: 'PUT' },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={directionFilter === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDirectionFilter(option.value as DirectionFilter)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Close button (Mobile) */}
              <div className="lg:hidden">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Close Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Trades */}
          <Card className="backdrop-blur-xl bg-slate-900/50 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrades}</div>
              <p className="text-xs text-muted-foreground mt-1">Total trades</p>
            </CardContent>
          </Card>

          {/* Win Rate */}
          <Card className="backdrop-blur-xl bg-slate-900/50 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats.winRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Success rate</p>
            </CardContent>
          </Card>

          {/* Total P&L */}
          <Card className="backdrop-blur-xl bg-slate-900/50 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${pnlClass}`}>${stats.totalPnL.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Net profit/loss</p>
            </CardContent>
          </Card>

          {/* Best Streak */}
          <Card className="backdrop-blur-xl bg-slate-900/50 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Streak</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{stats.bestStreak}</div>
              <p className="text-xs text-muted-foreground mt-1">Consecutive wins</p>
            </CardContent>
          </Card>
        </div>

        {/* Best Trade & Best Day (Mobile optimized) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.bestTrade && (
            <Card className="backdrop-blur-xl bg-slate-900/50 border-slate-700/50 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleTradeClick(stats.bestTrade)}>
              <CardHeader>
                <CardTitle className="text-sm">Best Trade</CardTitle>
                <CardDescription>Highest single profit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-green-400">
                  ${(stats.bestTrade.pnl || 0).toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>{stats.bestTrade.ativo_nome} • {stats.bestTrade.directionLabel}</p>
                  <p>{stats.bestTrade.formattedDate}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {stats.bestDay !== null && stats.bestDay !== 0 && (
            <Card className="backdrop-blur-xl bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-sm">Best Day</CardTitle>
                <CardDescription>Highest daily profit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-green-400">
                  ${stats.bestDay.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Peak daily performance
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Trades List/Table */}
        <Card className="backdrop-blur-xl bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle>Trading Activity</CardTitle>
            <CardDescription>
              {formattedTrades.length} trades showing {hasActiveFilters ? '(filtered)' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block rounded-md overflow-x-auto backdrop-blur-xl bg-slate-900/50 border border-slate-700/50">
              <Table className="min-w-full">
                <TableHeader className="bg-slate-800/50 border-b border-slate-700/50">
                  <TableRow className="border-slate-700/50">
                    <TableHead>Asset</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="skeleton w-4 h-4 rounded-full" />
                          <span className="text-muted-foreground">Loading trades...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : formattedTrades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Activity className="w-8 h-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No trades found</p>
                          <p className="text-sm text-muted-foreground">Start trading to see your history here</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    formattedTrades.map((trade) => (
                      <TableRow
                        key={trade.id}
                        className="border-slate-700/30 hover:bg-slate-700/20 cursor-pointer transition-colors"
                        onClick={() => handleTradeClick(trade)}
                      >
                        <TableCell className="font-medium">{trade.ativo_nome}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{trade.accountLabel}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={trade.directionVariant}>
                            {trade.directionVariant === 'success' ? (
                              <>
                                <TrendingUp className="w-3 h-3 mr-1" /> {trade.directionLabel}
                              </>
                            ) : (
                              <>
                                <TrendingDown className="w-3 h-3 mr-1" /> {trade.directionLabel}
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>{trade.formattedAmount}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{trade.formattedDuration}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={trade.resultado === 'WIN' ? 'success' : 'destructive'}>{trade.resultado || 'PENDING'}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${(trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.formattedPnl}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{trade.formattedDate}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-8">
                  <div className="skeleton w-4 h-4 rounded-full" />
                  <span className="text-muted-foreground">Loading trades...</span>
                </div>
              ) : formattedTrades.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8">
                  <Activity className="w-8 h-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No trades found</p>
                  <p className="text-sm text-muted-foreground">Start trading to see your history here</p>
                </div>
              ) : (
                formattedTrades.map((trade) => (
                  <Card
                    key={trade.id}
                    className="backdrop-blur-xl bg-slate-900/30 border-slate-700/30 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => handleTradeClick(trade)}
                  >
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-sm">{trade.ativo_nome}</p>
                            <p className="text-xs text-muted-foreground">{trade.formattedDate}</p>
                          </div>
                          <Badge variant={trade.resultado === 'WIN' ? 'success' : 'destructive'}>
                            {trade.resultado || 'PENDING'}
                          </Badge>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Direction</p>
                            <Badge variant={trade.directionVariant} className="text-xs mt-1">
                              {trade.directionVariant === 'success' ? (
                                <>
                                  <TrendingUp className="w-3 h-3 mr-1" /> {trade.directionLabel}
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="w-3 h-3 mr-1" /> {trade.directionLabel}
                                </>
                              )}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Account</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {trade.accountLabel}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Amount</p>
                            <p className="font-semibold text-xs">{trade.formattedAmount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {trade.formattedDuration}
                            </Badge>
                          </div>
                        </div>

                        {/* P&L row */}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-700/30">
                          <p className="text-xs text-muted-foreground">P&L</p>
                          <span className={`font-bold text-sm ${(trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.formattedPnl}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Trade Explanation Modal */}
      {selectedTrade && (
        <TradeExplanation
          isOpen={showTradeExplanation}
          trade={selectedTrade as any}
          onClose={() => {
            setShowTradeExplanation(false)
            setTimeout(() => setSelectedTrade(null), 300)
          }}
        />
      )}
    </div>
  )
}
