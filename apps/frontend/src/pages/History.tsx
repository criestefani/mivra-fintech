import { useState, useEffect, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { DashboardHeader, Sidebar } from '@/features/dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react'

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
}

export default function History() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

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
        .limit(100)

      if (error) throw error

      setTrades(data || [])
    } catch (error) {
      console.error('Error loading trades:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPnL = useMemo(() => {
    return trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
  }, [trades])

  const winRate = useMemo(() => {
    if (trades.length === 0) return '0.00'
    const wins = trades.filter((t) => t.resultado === 'WIN').length
    return ((wins / trades.length) * 100).toFixed(2)
  }, [trades])

  const formattedTrades = useMemo(() => {
    const mapAccountType = (type: string | null | undefined) => {
      if (!type) return 'Unknown'
      const normalized = type.toString().toLowerCase()

      if (['real', 'live', 'real_account', 'live_account'].includes(normalized)) return 'Real'
      if (['demo', 'practice', 'virtual', 'demo_account'].includes(normalized)) return 'Demo'

      return type
    }

    return trades.map((trade) => ({
      ...trade,
      directionVariant: (trade.direction === 'call' || trade.direction === 'CALL' ? 'success' : 'destructive') as 'success' | 'destructive',
      directionLabel: trade.direction === 'call' || trade.direction === 'CALL' ? 'CALL' : 'PUT',
      formattedAmount: '$' + (trade.valor || 0).toFixed(2),
      formattedPnl: '$' + (trade.pnl || 0).toFixed(2),
      formattedDuration: (trade.expiration_seconds || 0) + 's',
      formattedDate: new Date(trade.data_abertura).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      accountLabel: mapAccountType(trade.account_type),
    }))
  }, [trades])

  const pnlClass = totalPnL >= 0 ? 'win-text' : 'loss-text'

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
    <div className="min-h-screen bg-background pt-16">
      <DashboardHeader user={user} />
      <Sidebar />

      <main className="lg:ml-64 container mx-auto px-4 py-6 pb-24 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trade History</h1>
            <p className="text-muted-foreground mt-1">
              View your complete trading history and performance metrics
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trades.length}</div>
              <p className="text-xs text-muted-foreground mt-1">All time trading activity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold win-text">{winRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Success rate across all trades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${pnlClass}`}>${totalPnL.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Net profit and loss</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Trading Activity</CardTitle>
            <CardDescription>
              A comprehensive view of all your trades with detailed metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-[840px]">
                <TableHeader>
                  <TableRow>
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
                      <TableRow key={trade.id}>
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
                          <span className={`font-medium ${(trade.pnl || 0) >= 0 ? 'win-text' : 'loss-text'}`}>
                            {trade.formattedPnl}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{trade.formattedDate}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
