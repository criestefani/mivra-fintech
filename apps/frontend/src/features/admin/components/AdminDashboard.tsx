import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Clock,
  BarChart3,
  UserCheck,
  Target
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { useAdminDashboard, useTopUsersByPnL } from '../hooks/useAdminData';

interface MetricCard {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: typeof Users;
  description?: string;
}

export const AdminDashboard = () => {
  // Fetch real data from API
  const { data: dashboardData, isLoading, error } = useAdminDashboard();
  const { data: topUsers } = useTopUsersByPnL(4, 'real');

  // Map API data to MetricCard format
  const metrics: MetricCard[] = dashboardData ? [
    {
      title: 'Total Users (REAL)',
      value: dashboardData.total_users_real.toLocaleString(),
      icon: Users,
      description: 'Users with real accounts'
    },
    {
      title: 'Active Bots (REAL)',
      value: dashboardData.active_bots_real.toLocaleString(),
      icon: Activity,
      description: 'Currently running on real'
    },
    {
      title: 'Net Revenue Today',
      value: `$${dashboardData.net_revenue_today_real.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      changeType: dashboardData.net_revenue_today_real >= 0 ? 'positive' : 'negative',
      icon: DollarSign,
      description: 'Deposits - Withdrawals'
    },
    {
      title: 'Trades Today (REAL)',
      value: dashboardData.trades_today_real.toLocaleString(),
      icon: TrendingUp,
      description: 'Executed on real accounts'
    },
    {
      title: 'Platform Win Rate',
      value: `${dashboardData.platform_win_rate_real.toFixed(1)}%`,
      changeType: dashboardData.platform_win_rate_real >= 60 ? 'positive' : 'neutral',
      icon: BarChart3,
      description: 'Across all real users'
    },
    {
      title: 'Active Today (REAL)',
      value: dashboardData.active_users_today_real.toLocaleString(),
      icon: UserCheck,
      description: 'Users active today'
    },
    {
      title: 'New Users (Week)',
      value: dashboardData.new_users_week_real.toLocaleString(),
      icon: Users,
      description: 'New real accounts this week'
    },
    {
      title: 'Conversion Rate',
      value: `${dashboardData.conversion_rate_percent.toFixed(1)}%`,
      changeType: dashboardData.conversion_rate_percent >= 30 ? 'positive' : 'neutral',
      icon: Target,
      description: 'Demo â†’ Real conversion'
    },
    {
      title: 'Avg Days to Convert',
      value: dashboardData.avg_days_to_convert ? dashboardData.avg_days_to_convert.toFixed(1) : 'N/A',
      icon: Clock,
      description: 'Time from demo to real'
    }
  ] : [];

  const getChangeColor = (type?: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive':
        return 'text-positive';
      case 'negative':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2">Loading...</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(9)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
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
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-destructive mt-2">
              Error loading dashboard data: {error.message}
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your trading platform performance (REAL accounts focus)
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index} className="transition-all hover:shadow-lg hover:scale-102">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  {metric.change && (
                    <p className={`text-xs ${getChangeColor(metric.changeType)} mt-1`}>
                      {metric.change} from last period
                    </p>
                  )}
                  {metric.description && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {metric.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>


        {/* Top Performers */}
        <Card>
            <CardHeader>
              <CardTitle>Top Performers (REAL)</CardTitle>
              <CardDescription>Highest lifetime P/L users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topUsers && topUsers.length > 0 ? (
                topUsers.map((user, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.total_trades} trades â€¢ {user.win_rate_percentage.toFixed(1)}% win rate
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${user.lifetime_pnl >= 0 ? 'text-positive' : 'text-destructive'}`}>
                      ${user.lifetime_pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>
    </AdminLayout>
  );
};

