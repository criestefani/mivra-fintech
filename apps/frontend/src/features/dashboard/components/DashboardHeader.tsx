import { User } from '@supabase/supabase-js'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Switch } from '@/shared/components/ui/switch'
import { LogOut, Settings, RotateCw, ArrowUpRight, Menu, Repeat2, AlertCircle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useNavigate } from 'react-router-dom'
import { useBalance } from '@/shared/hooks/useBalance'
import { useToast } from '@/shared/hooks/use-toast'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/shared/utils/cn'

interface DashboardHeaderProps {
  user: User
}

export const DashboardHeader = ({ user }: DashboardHeaderProps) => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { balance, isLoading, error, accountType, setAccountType } = useBalance(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  // Close menu on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const handleReloadDemo = () => {
    toast.info('Recarregando conta demo...')
    setMenuOpen(false)
  }

  const handleWithdraw = () => {
    toast.info('Modal de saque em breve')
    setMenuOpen(false)
  }

  const handleDeposit = () => {
    toast.info('Modal de depósito em breve')
    setMenuOpen(false)
  }

  const handleSettings = () => {
    navigate('/settings')
    setMenuOpen(false)
  }

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const MenuItem = ({ icon: Icon, label, onClick, isDestructive = false }: any) => (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group text-sm',
        isDestructive
          ? 'text-destructive hover:bg-destructive/20'
          : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
      )}
    >
      <Icon className={cn('w-4 h-4 transition-all duration-200 opacity-70 group-hover:opacity-100', isDestructive ? 'group-hover:scale-110' : 'group-hover:scale-105')} />
      <span className="font-medium">{label}</span>
    </button>
  )

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 border-b border-primary/30 shadow-2xl backdrop-blur-md" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: '1rem', minHeight: '4rem' }}>
      <div className="container mx-auto h-full px-4 flex items-center justify-between gap-4">
        {/* Left: Demo + Balance + Account Toggle */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Demo Indicator */}
          {balance && accountType === 'demo' && (
            <span className="text-xs text-yellow-400/70 font-medium">Demo</span>
          )}

          {/* Balance Display - Clean */}
          <div className="flex flex-col gap-0">
            {isLoading ? (
              <span className="text-sm text-muted-foreground">Carregando...</span>
            ) : error ? (
              <span className="text-sm text-destructive font-semibold">Desconectado</span>
            ) : balance ? (
              <span className={`text-lg font-bold ${accountType === 'demo' ? 'text-yellow-400' : 'text-green-400'}`}>
                {formatBalance(balance.amount)}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Sem saldo</span>
            )}
          </div>

          {/* Account Type Icon - Clean */}
          {balance && (
            <button
              onClick={() => setAccountType(accountType === 'demo' ? 'real' : 'demo')}
              className="p-1.5 md:p-2 rounded-lg hover:bg-primary/20 transition-all duration-300 group"
              title={`Alternar: ${accountType === 'demo' ? 'Demo' : 'Real'}`}
            >
              <Repeat2 className={`w-5 h-5 md:w-6 md:h-6 transition-all duration-300 ${accountType === 'real' ? 'text-primary rotate-180' : 'text-muted-foreground'} group-hover:scale-110`} />
            </button>
          )}
        </div>

        {/* Center: Spacer */}
        <div className="flex-1" />

        {/* Right: Deposit & User Menu */}
        <div className="flex items-center gap-2 relative" ref={menuRef}>
          {/* Deposit Button - Always Visible */}
          <Button
            onClick={handleDeposit}
            size="sm"
            className="bg-gradient-to-r from-positive via-positive to-positive/80 hover:from-positive/95 hover:via-positive/90 hover:to-positive/75 text-positive-foreground shadow-lg shadow-positive/50 font-bold text-sm transition-all duration-300 hover:shadow-2xl hover:shadow-positive/60 hover:scale-105 active:scale-95 px-6"
          >
            Deposit
          </Button>

          {/* User Menu Button - Modern & Elegant */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              'relative p-2 rounded-lg transition-all duration-300 group',
              'hover:bg-slate-800/40 active:scale-95',
              menuOpen && 'bg-slate-800/50'
            )}
            title="Menu"
          >
            <Menu
              className={cn(
                'w-5 h-5 transition-all duration-300',
                menuOpen ? 'text-primary' : 'text-slate-400 group-hover:text-slate-200'
              )}
            />
            {menuOpen && (
              <div className="absolute inset-0 rounded-lg bg-primary/5 animate-pulse pointer-events-none" />
            )}
          </button>

          {/* Modern Menu Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-950 border border-slate-700/50 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Transaction Section */}
              <div className="px-3 py-2">
                <MenuItem
                  icon={ArrowUpRight}
                  label="Withdraw"
                  onClick={handleWithdraw}
                  isDestructive={false}
                />
              </div>

              {/* Account Section */}
              <div className="px-3 py-2 border-t border-slate-700/30 space-y-1">
                <MenuItem
                  icon={RotateCw}
                  label="Reload Demo"
                  onClick={handleReloadDemo}
                  isDestructive={false}
                />
                <MenuItem
                  icon={Settings}
                  label="Settings"
                  onClick={handleSettings}
                  isDestructive={false}
                />
              </div>

              {/* Logout Section */}
              <div className="px-3 py-2 border-t border-slate-700/30">
                <MenuItem
                  icon={LogOut}
                  label="Logout"
                  onClick={handleSignOut}
                  isDestructive={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
