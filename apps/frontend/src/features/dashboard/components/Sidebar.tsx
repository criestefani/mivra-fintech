import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/shared/utils/cn'
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  Settings,
  Users,
  TrendingUp,
} from 'lucide-react'

interface SidebarLink {
  to: string
  icon: React.ReactNode
  label: string
  badge?: string
  adminOnly?: boolean
}

const links: SidebarLink[] = [
  {
    to: '/operations',
    icon: <Activity className="w-5 h-5" />,
    label: 'Operations',
  },
  {
    to: '/market-scanner',
    icon: <TrendingUp className="w-5 h-5" />,
    label: 'Market Scanner',
  },
  {
    to: '/settings',
    icon: <Settings className="w-5 h-5" />,
    label: 'Settings',
  },
  {
    to: '/admin',
    icon: <LayoutDashboard className="w-5 h-5" />,
    label: 'Admin Dashboard',
    adminOnly: true,
  },
  {
    to: '/admin/users',
    icon: <Users className="w-5 h-5" />,
    label: 'Users',
    adminOnly: true,
  },
  {
    to: '/admin/trades',
    icon: <BarChart3 className="w-5 h-5" />,
    label: 'Trades',
    adminOnly: true,
  },
]

export const Sidebar = () => {
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:left-0 lg:top-16 lg:bottom-0 lg:flex lg:w-64 lg:flex-col glass border-r border-border/50 z-40">
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive(link.to)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {link.icon}
              <span className="font-medium">{link.label}</span>
              {link.badge && (
                <span className="ml-auto text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border/50">
          <div className="text-xs text-muted-foreground">
            <p className="font-semibold">MivraTech v1.0</p>
            <p className="mt-1">© 2025 Mivra Fintech</p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50">
        <div className="flex items-center justify-around p-2">
          {links.slice(0, 3).map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]',
                'hover:bg-accent hover:text-accent-foreground',
                isActive(link.to)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {link.icon}
              <span className="text-xs font-medium">{link.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
