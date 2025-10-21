import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/shared/utils/cn'
import {
  Activity,
  TrendingUp,
  Clock,
  Settings,
  Trophy,
  Award,
} from 'lucide-react'

interface SidebarLink {
  to: string
  icon: React.ReactNode
  label: string
  badge?: string
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
    to: '/history',
    icon: <Clock className="w-5 h-5" />,
    label: 'History',
  },
  {
    to: '/gamification/leaderboard',
    icon: <Trophy className="w-5 h-5" />,
    label: 'Leaderboard',
  },
  {
    to: '/gamification/badges',
    icon: <Award className="w-5 h-5" />,
    label: 'Badges',
  },
  {
    to: '/settings',
    icon: <Settings className="w-5 h-5" />,
    label: 'Settings',
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
      <aside className="hidden lg:fixed lg:left-0 lg:top-16 lg:bottom-0 lg:flex lg:w-64 lg:flex-col bg-sidebar/90 backdrop-blur-2xl border-r border-sidebar-border/60 shadow-card z-40 text-sidebar-foreground">
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 border',
                isActive(link.to)
                  ? 'border-primary/50 bg-primary text-primary-foreground shadow-card'
                  : 'border-transparent text-sidebar-foreground/70 hover:border-sidebar-accent/40 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground'
              )}
            >
              {link.icon}
              <span className="font-medium">{link.label}</span>
              {link.badge && (
                <span className="ml-auto text-xs bg-primary/20 px-2 py-0.5 rounded-full text-primary-foreground/80">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border/60">
          <div className="text-xs text-sidebar-foreground/60">
            <p className="font-semibold">MivraTech v1.0</p>
            <p className="mt-1">© 2025 Mivra Fintech</p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border/60 shadow-card">
        <div className="flex items-center justify-around px-2 py-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex min-w-[64px] flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 border',
                isActive(link.to)
                  ? 'border-primary/50 bg-primary text-primary-foreground shadow-card'
                  : 'border-transparent text-sidebar-foreground/70 hover:border-sidebar-accent/40 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground'
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
