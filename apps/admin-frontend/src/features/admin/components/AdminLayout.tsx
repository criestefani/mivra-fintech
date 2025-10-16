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
      <header className="fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-border/50">
        <div className="container mx-auto h-full px-4 flex items-center justify-between">
          {/* Logo & Back Button */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/operations')}
              title="Back to Operations"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-destructive rounded-lg flex items-center justify-center">
                <span className="text-destructive-foreground font-bold text-sm">A</span>
              </div>
              <span className="font-bold text-lg hidden sm:inline">Admin Panel</span>
            </div>
          </div>

          {/* User Info & Sign Out */}
          {adminUser && (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium">{adminUser.email}</span>
                <span className="text-xs text-muted-foreground capitalize">{adminUser.role}</span>
              </div>

              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-destructive text-destructive-foreground">
                  {getInitials(adminUser.email)}
                </AvatarFallback>
              </Avatar>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Admin Sidebar */}
      <aside className="hidden lg:fixed lg:left-0 lg:top-16 lg:bottom-0 lg:flex lg:w-64 lg:flex-col glass border-r border-border/50 z-40">
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {adminLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive(link.to)
                  ? 'bg-destructive text-destructive-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {link.icon}
              <span className="font-medium">{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Admin Footer */}
        <div className="p-4 border-t border-border/50">
          <div className="text-xs text-muted-foreground">
            <p className="font-semibold">Admin Panel v1.0</p>
            <p className="mt-1">© 2025 Mivra Fintech</p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50">
        <div className="flex items-center justify-around p-2">
          {adminLinks.slice(0, 4).map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]',
                'hover:bg-accent hover:text-accent-foreground',
                isActive(link.to)
                  ? 'bg-destructive text-destructive-foreground'
                  : 'text-muted-foreground'
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
