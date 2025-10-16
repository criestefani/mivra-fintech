import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Clock,
  User,
  Target
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { useAdminTrades } from '../hooks/useAdminData';

export const AdminTrades = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch real trades from API (default to 'real' account type)
  const { data: trades, isLoading, error } = useAdminTrades({ accountType: 'real', limit: 100 });

  const getDirectionBadge = (direcao: string) => {
    return direcao === 'CALL' ? (
      <Badge variant="default" className="gap-1">
        <TrendingUp className="h-3 w-3" />
        CALL
      </Badge>
    ) : (
      <Badge variant="secondary" className="gap-1">
        <TrendingDown className="h-3 w-3" />
        PUT
      </Badge>
    );
  };

  const getResultadoBadge = (resultado: string) => {
    const variants: Record<string, { variant: any; label: string; color: string }> = {
      WIN: { variant: 'default', label: 'Win', color: 'text-positive' },
      LOSS: { variant: 'destructive', label: 'Loss', color: 'text-destructive' },
      TIE: { variant: 'outline', label: 'Tie', color: 'text-muted-foreground' }
    };
    const config = variants[resultado] || variants.TIE;
    return (
      <Badge variant={config.variant as any} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Filter trades based on search query
  const filteredTrades = trades?.filter(trade =>
    trade.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trade.ativo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trade.trade_id.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Calculate stats
  const totalTrades = trades?.length || 0;
  const completedTrades = trades || [];
  const totalPL = completedTrades.reduce((sum, t) => sum + t.pnl, 0);
  const winningTrades = completedTrades.filter(t => t.resultado === 'WIN').length;
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : '0';

  // Loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trades (REAL Accounts)</h1>
            <p className="text-muted-foreground mt-2">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trades (REAL Accounts)</h1>
            <p className="text-destructive mt-2">
              Error loading trades: {error.message}
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trades (REAL Accounts)</h1>
            <p className="text-muted-foreground mt-2">
              Complete trading history for real account users
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P/L</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalPL >= 0 ? 'text-positive' : 'text-destructive'}`}>
                ${totalPL.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">From {totalTrades} trades</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-positive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{winRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">{winningTrades} winning trades</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTrades}</div>
              <p className="text-xs text-muted-foreground mt-1">Real accounts only</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Trade Value</CardTitle>
              <Clock className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">
                ${totalTrades > 0 ? (completedTrades.reduce((sum, t) => sum + t.valor, 0) / totalTrades).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Average investment</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, asset, or trade ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Trades Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Trades ({filteredTrades.length})</CardTitle>
            <CardDescription>Real account trading history</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTrades.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No trades found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchQuery ? 'Try adjusting your search criteria' : 'No trades available yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTrades.map((trade) => (
                  <div
                    key={trade.trade_id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Asset */}
                      <div className="min-w-[100px]">
                        <p className="font-bold text-lg">{trade.ativo}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getDirectionBadge(trade.direcao)}
                          {getResultadoBadge(trade.resultado)}
                        </div>
                      </div>

                      {/* User */}
                      <div className="min-w-[180px]">
                        <div className="flex items-center gap-1 text-sm mb-1">
                          <User className="h-3 w-3" />
                          <span className="font-medium">{trade.user_email}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {trade.trade_id.substring(0, 8)}...
                        </div>
                      </div>

                      {/* Value */}
                      <div className="hidden md:block min-w-[100px]">
                        <p className="text-xs text-muted-foreground">Investment</p>
                        <p className="text-sm font-medium">
                          ${trade.valor.toFixed(2)}
                        </p>
                      </div>

                      {/* Duration */}
                      <div className="hidden lg:block min-w-[80px]">
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="text-sm font-medium">{formatDuration(trade.duracao_segundos)}</p>
                      </div>

                      {/* P/L */}
                      <div className="min-w-[100px]">
                        <p className="text-xs text-muted-foreground">P/L</p>
                        <p className={`text-lg font-bold ${trade.pnl >= 0 ? 'text-positive' : 'text-destructive'}`}>
                          ${trade.pnl.toFixed(2)}
                        </p>
                      </div>

                      {/* Time */}
                      <div className="hidden xl:flex flex-col items-end min-w-[140px]">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(trade.duracao_segundos)}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDateTime(trade.data_abertura)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

