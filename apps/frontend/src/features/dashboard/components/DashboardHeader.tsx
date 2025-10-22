import { User } from '@supabase/supabase-js'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Switch } from '@/shared/components/ui/switch'
import { LogOut, Settings, RotateCw, ArrowUpRight, Menu, Repeat2 } from 'lucide-react'
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
        'w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 group',
        isDestructive
          ? 'text-destructive hover:bg-destructive/15 hover:shadow-lg hover:shadow-destructive/20'
          : 'text-foreground hover:bg-primary/15 hover:shadow-lg hover:shadow-primary/20'
      )}
    >
      <Icon className={cn('w-5 h-5 transition-transform duration-200', isDestructive ? 'group-hover:scale-110' : 'group-hover:scale-110 group-hover:text-primary')} />
      <span className="font-medium">{label}</span>
    </button>
  )

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 border-b border-primary/30 shadow-2xl backdrop-blur-md" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: '1rem', minHeight: '4rem' }}>
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        {/* Left: Beta Badge */}
        <div className="flex items-center">
          <Badge
            variant="secondary"
            className="border-2 border-primary/50 bg-gradient-to-r from-primary/30 to-primary/10 text-primary font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
          >
            ✨ Beta
          </Badge>
        </div>

        {/* Left-Center: Balance & Account Toggle */}
        <div className="flex items-center gap-4">
          {/* Balance Display - Clean */}
          <div className="flex flex-col gap-0.5">
            {isLoading ? (
              <span className="text-sm text-muted-foreground">Carregando...</span>
            ) : error ? (
              <span className="text-sm text-destructive font-semibold">Desconectado</span>
            ) : balance ? (
              <span className="text-lg font-bold text-primary">
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
              className="p-2 rounded-lg hover:bg-primary/20 transition-all duration-300 group"
              title={`Alternar: ${accountType === 'demo' ? 'Demo' : 'Real'}`}
            >
              <Repeat2 className={`w-6 h-6 transition-all duration-300 ${accountType === 'real' ? 'text-primary rotate-180' : 'text-muted-foreground'} group-hover:scale-110`} />
            </button>
          )}
        </div>

        {/* Right: Deposit & User Menu */}
        <div className="flex items-center gap-2 relative" ref={menuRef}>
          {/* Deposit Button - Always Visible */}
          <Button
            onClick={handleDeposit}
            size="sm"
            className="bg-gradient-to-r from-positive to-positive/80 hover:from-positive/90 hover:to-positive/70 text-positive-foreground shadow-lg shadow-positive/30 font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-positive/40"
          >
            Deposit
          </Button>

          {/* User Menu Button */}
          <Button
            onClick={() => setMenuOpen(!menuOpen)}
            variant="outline"
            size="sm"
            className={cn(
              'gap-2 border-primary/50 hover:bg-primary/20 font-semibold transition-all duration-300 p-2',
              menuOpen && 'bg-primary/20 border-primary/80 shadow-lg shadow-primary/30'
            )}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Premium Menu Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-3 w-56 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 border border-primary/40 rounded-xl shadow-2xl shadow-primary/40 backdrop-blur-xl z-50 py-3 space-y-1 animate-in fade-in slide-in-from-top-3 duration-200">
              {/* Header */}
              <div className="px-4 py-2 border-b border-primary/20">
                <p className="text-xs font-bold text-primary/60 uppercase tracking-widest">Transações</p>
              </div>

              {/* Withdraw */}
              <MenuItem
                icon={ArrowUpRight}
                label="Withdraw"
                onClick={handleWithdraw}
                isDestructive={false}
              />

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent my-2" />

              {/* Settings Section Header */}
              <div className="px-4 py-2">
                <p className="text-xs font-bold text-primary/60 uppercase tracking-widest">Conta</p>
              </div>

              {/* Reload Demo Account */}
              <MenuItem
                icon={RotateCw}
                label="Reload Demo"
                onClick={handleReloadDemo}
                isDestructive={false}
              />

              {/* Settings */}
              <MenuItem
                icon={Settings}
                label="Settings"
                onClick={handleSettings}
                isDestructive={false}
              />

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-destructive/20 to-transparent my-2" />

              {/* Logout */}
              <MenuItem
                icon={LogOut}
                label="Logout"
                onClick={handleSignOut}
                isDestructive={true}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
