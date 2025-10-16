import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Search,
  Filter,
  UserPlus,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Activity
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { useAdminUsers } from '../hooks/useAdminData';

export const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch real users data (REAL accounts only by default)
  const { data: users, isLoading, error } = useAdminUsers({
    accountType: 'real',
    search: searchQuery,
    sortBy: 'total_pnl',
    sortOrder: 'desc',
    limit: 100
  });

  const getStatusBadge = (isActive: boolean, botRunning: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (botRunning) {
      return <Badge variant="default">Trading</Badge>;
    }
    return <Badge variant="outline">Active</Badge>;
  };

  // Calculate stats from real data
  const stats = useMemo(() => {
    if (!users) return { total: 0, active: 0, trading: 0, inactive: 0 };

    return {
      total: users.length,
      active: users.filter(u => u.is_active).length,
      trading: users.filter(u => u.bot_running).length,
      inactive: users.filter(u => !u.is_active).length
    };
  }, [users]);

  // Loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
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
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-destructive mt-2">
              Error loading users: {error.message}
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
            <h1 className="text-3xl font-bold tracking-tight">Users (REAL Accounts)</h1>
            <p className="text-muted-foreground mt-2">
              Manage and monitor all real trading users
            </p>
          </div>
          <Button className="gap-2" disabled>
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">All REAL accounts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <div className="h-2 w-2 rounded-full bg-positive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground mt-1">Active users</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trading Now</CardTitle>
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.trading}</div>
              <p className="text-xs text-muted-foreground mt-1">Bots running</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground mt-1">Not active</p>
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
                  placeholder="Search users by name or email..."
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

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users ({users?.length || 0})</CardTitle>
            <CardDescription>Complete list of REAL account users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users && users.length > 0 ? (
                users.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Avatar */}
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {user.email.substring(0, 2).toUpperCase()}
                        </span>
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{user.email}</p>
                          {getStatusBadge(user.is_active, user.bot_running)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="hidden lg:flex items-center gap-8">
                        <div className="text-center">
                          <p className="text-sm font-bold">{user.total_trades}</p>
                          <p className="text-xs text-muted-foreground">Trades</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold">{user.win_rate.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Win Rate</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-sm font-bold ${user.total_pnl >= 0 ? 'text-positive' : 'text-destructive'}`}>
                            ${user.total_pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-muted-foreground">Total P/L</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold">{user.bot_running ? '1' : '0'}</p>
                          <p className="text-xs text-muted-foreground">Bot Status</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No users found. Try adjusting your search.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

