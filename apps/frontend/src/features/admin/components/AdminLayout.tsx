import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import { useAdminAuth } from '../hooks/useAdminAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface AdminNavLink {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const adminLinks: AdminNavLink[] = [
  {
    to: '/admin',
    icon: <LayoutDashboard className="w-5 h-5" />,
    label: 'Dashboard',
  },
  {
    to: '/admin/users',
    icon: <Users className="w-5 h-5" />,
    label: 'Users',
  },
  {
    to: '/admin/trades',
    icon: <BarChart3 className="w-5 h-5" />,
    label: 'Trades',
  },
  {
    to: '/admin/settings',
    icon: <Settings className="w-5 h-5" />,
    label: 'Settings',
  },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { adminUser, signOut } = useAdminAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-border/50 shadow-card">
        <div className="container mx-auto h-full px-4 flex items-center justify-between">
          {/* Logo & Back Button */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/operations')}
              title="Back to Operations"
              className="border border-transparent text-muted-foreground hover:border-border/60 hover:bg-muted/20 hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-destructive rounded-lg flex items-center justify-center shadow-md shadow-destructive/40">
                <span className="text-destructive-foreground font-semibold text-sm tracking-wide">A</span>
              </div>
              <span className="font-semibold text-lg hidden sm:inline text-foreground/90">Admin Panel</span>
            </div>
          </div>

          {/* User Info & Sign Out */}
          {adminUser && (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium text-foreground/90">{adminUser.email}</span>
                <span className="text-xs text-muted-foreground/80 capitalize">{adminUser.role}</span>
              </div>

              <Avatar className="w-10 h-10 border border-border/40 shadow-sm shadow-destructive/20">
                <AvatarFallback className="bg-destructive text-destructive-foreground">
                  {getInitials(adminUser.email)}
                </AvatarFallback>
              </Avatar>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Admin Sidebar */}
      <aside className="hidden lg:fixed lg:left-0 lg:top-16 lg:bottom-0 lg:flex lg:w-64 lg:flex-col bg-sidebar/90 backdrop-blur-2xl border-r border-sidebar-border/60 shadow-card z-40 text-sidebar-foreground">
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {adminLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 text-sm font-medium',
                isActive(link.to)
                  ? 'border-destructive/60 bg-destructive text-destructive-foreground shadow-card'
                  : 'border-transparent text-sidebar-foreground/70 hover:border-sidebar-accent/40 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground'
              )}
            >
              {link.icon}
              <span className="font-medium">{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Admin Footer */}
        <div className="p-4 border-t border-sidebar-border/60">
          <div className="text-xs text-sidebar-foreground/60">
            <p className="font-semibold">Admin Panel v1.0</p>
            <p className="mt-1">© 2025 Mivra Fintech</p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border/60 shadow-card text-sidebar-foreground">
        <div className="flex items-center justify-around px-2 py-2">
          {adminLinks.slice(0, 4).map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[64px] border transition-all duration-200 text-xs font-medium',
                isActive(link.to)
                  ? 'border-destructive/60 bg-destructive text-destructive-foreground shadow-card'
                  : 'border-transparent text-sidebar-foreground/70 hover:border-sidebar-accent/40 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground'
              )}
            >
              {link.icon}
              <span className="text-xs font-medium">{link.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 pb-20 lg:pb-6">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};
