import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/shared/utils/cn'
import {
  Activity,
  TrendingUp,
  Clock,
  User,
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
    label: 'Scanner',
  },
  {
    to: '/history',
    icon: <Clock className="w-5 h-5" />,
    label: 'History',
  },
  {
    to: '/profile',
    icon: <User className="w-5 h-5" />,
    label: 'Profile',
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
      <aside className="hidden lg:fixed lg:left-0 lg:top-16 lg:bottom-0 lg:flex lg:w-64 lg:flex-col backdrop-blur-xl bg-slate-900/50 border-r border-slate-700/50 shadow-2xl z-40 text-sidebar-foreground">
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-300 border',
                isActive(link.to)
                  ? 'border-primary/50 bg-gradient-to-r from-primary/40 to-primary/20 text-primary-foreground shadow-lg shadow-primary/20'
                  : 'border-slate-700/30 text-slate-300 hover:border-slate-700/50 hover:bg-slate-800/40 hover:text-slate-100'
              )}
            >
              {link.icon}
              <span className="font-medium">{link.label}</span>
              {link.badge && (
                <span className="ml-auto text-xs bg-primary/30 px-2 py-0.5 rounded-full text-primary-foreground/90 font-semibold">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 backdrop-blur-md bg-slate-800/20">
          <div className="text-xs text-slate-400">
            <p className="font-semibold text-slate-300">MivraTech v1.0</p>
            <p className="mt-2 text-slate-500">© 2025 Mivra Fintech</p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-900/80 border-t border-slate-700/50 shadow-2xl">
        <div className="flex items-center justify-around px-2 py-3 gap-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex min-w-[56px] flex-col items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-300 border',
                isActive(link.to)
                  ? 'border-primary/50 bg-gradient-to-b from-primary/40 to-primary/20 text-primary-foreground shadow-lg shadow-primary/20'
                  : 'border-slate-700/30 text-slate-400 hover:border-slate-700/50 hover:bg-slate-800/50 hover:text-slate-200'
              )}
            >
              {link.icon}
              <span className="text-xs font-semibold leading-tight">{link.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
