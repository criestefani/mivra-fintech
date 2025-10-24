import { User } from '@supabase/supabase-js'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Switch } from '@/shared/components/ui/switch'
import { LogOut, Settings, RotateCw, ArrowUpRight, Menu, Repeat2, AlertCircle, Plug } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useNavigate } from 'react-router-dom'
import { useBalance } from '@/shared/hooks/useBalance'
import { useToast } from '@/shared/hooks/use-toast'
import { useSound } from '@/contexts/SoundContext'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/shared/utils/cn'

interface DashboardHeaderProps {
  user: User
}

export const DashboardHeader = ({ user }: DashboardHeaderProps) => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { playClick } = useSound()
  // ✅ Pass userId to useBalance for per-user balance isolation
  const { balance, isLoading, error, accountType, setAccountType } = useBalance(true, user?.id)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
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
    playClick()
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const handleReloadDemo = async () => {
    playClick()
    setMenuOpen(false)

    try {
      // Construir URL dinâmica para funcionar em desktop e mobile
      const getApiUrl = () => {
        // Se está em localhost/127.0.0.1 (desktop dev), usa localhost:4001
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return 'http://localhost:4001'
        }
        // Se está em IP ou domínio (mobile/produção), usa o mesmo host com porta 4001
        return `http://${window.location.hostname}:4001`
      }

      const apiUrl = getApiUrl()
      console.log(`🌐 [Reload Demo] Chamando API em: ${apiUrl}/api/bot/reload-demo`)

      const response = await fetch(`${apiUrl}/api/bot/reload-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Demo Account Reloaded",
          description: `Your demo balance has been reset to $${data.newBalance.toLocaleString()}`,
          variant: "default",
        })
      } else {
        toast({
          title: "❌ Error",
          description: data.error || "Failed to reload demo account",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error reloading demo:', error)
      toast({
        title: "❌ Error",
        description: "Failed to reload demo account. Make sure you're connected to the broker.",
        variant: "destructive",
      })
    }
  }

  const handleWithdraw = () => {
    playClick()
    setShowWithdrawModal(true)
    setMenuOpen(false)
  }

  const handleDeposit = () => {
    playClick()
    setShowDepositModal(true)
  }

  const handleSettings = () => {
    playClick()
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
    <>
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
              <Button
                onClick={() => {
                  playClick()
                  handleSettings()
                }}
                size="sm"
                className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:via-red-400 hover:to-red-500 text-white shadow-lg shadow-red-500/30 font-semibold text-xs gap-2 px-4 py-1.5 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/50 hover:scale-105 active:scale-95"
              >
                <Plug className="w-4 h-4" />
                Connect Broker
              </Button>
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
              onClick={() => {
                playClick()
                setAccountType(accountType === 'demo' ? 'real' : 'demo')
              }}
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
            onClick={() => {
              playClick()
              handleDeposit()
            }}
            size="sm"
            className="bg-gradient-to-r from-positive via-positive to-positive/80 hover:from-positive/95 hover:via-positive/90 hover:to-positive/75 text-positive-foreground shadow-lg shadow-positive/50 font-bold text-sm transition-all duration-300 hover:shadow-2xl hover:shadow-positive/60 hover:scale-105 active:scale-95 px-6"
          >
            Deposit
          </Button>

          {/* User Menu Button - Modern & Elegant */}
          <button
            onClick={() => {
              playClick()
              setMenuOpen(!menuOpen)
            }}
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

    {/* Deposit Popup - FORA do header para maior liberdade */}
    {showDepositModal && (
      <>
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]"
          onClick={() => setShowDepositModal(false)}
        />

        {/* Popup Container - GRANDE E CENTRALIZADO */}
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6">
          <div className="w-[95vw] h-[95vh] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] max-w-7xl bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/30 flex-shrink-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">💰 Deposit</h2>
              <button
                onClick={() => setShowDepositModal(false)}
                className="p-2 sm:p-3 hover:bg-slate-700/50 rounded-lg transition-all duration-200 flex-shrink-0 text-slate-400 hover:text-white active:scale-95"
                aria-label="Close"
              >
                <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Warning Banner - PROMINENT */}
            <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 bg-gradient-to-r from-amber-900/50 via-amber-800/40 to-amber-900/50 border-b-2 border-amber-500 flex items-start gap-4 flex-shrink-0 shadow-lg">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex flex-col gap-1">
                <p className="text-sm sm:text-base md:text-lg text-amber-50 font-bold">
                  Important Notice
                </p>
                <p className="text-xs sm:text-sm text-amber-100 font-medium">
                  Please log in to Avalon using the SAME credentials you use to access MivraTech.
                </p>
              </div>
            </div>

            {/* Content with scroll - FULL HEIGHT */}
            <div className="flex-1 overflow-y-auto bg-slate-950/50">
              <iframe
                src="https://trade.avalonbroker.com/pt/counting"
                className="w-full h-full border-0"
                title="Deposit"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
                allow="payment"
              />
            </div>
          </div>
        </div>
      </>
    )}

    {/* Withdraw Popup - FORA do header para maior liberdade */}
    {showWithdrawModal && (
      <>
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]"
          onClick={() => setShowWithdrawModal(false)}
        />

        {/* Popup Container - GRANDE E CENTRALIZADO */}
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6">
          <div className="w-[95vw] h-[95vh] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] max-w-7xl bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/30 flex-shrink-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">💸 Withdraw</h2>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="p-2 sm:p-3 hover:bg-slate-700/50 rounded-lg transition-all duration-200 flex-shrink-0 text-slate-400 hover:text-white active:scale-95"
                aria-label="Close"
              >
                <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Warning Banner - PROMINENT */}
            <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 bg-gradient-to-r from-amber-900/50 via-amber-800/40 to-amber-900/50 border-b-2 border-amber-500 flex items-start gap-4 flex-shrink-0 shadow-lg">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex flex-col gap-1">
                <p className="text-sm sm:text-base md:text-lg text-amber-50 font-bold">
                  Important Notice
                </p>
                <p className="text-xs sm:text-sm text-amber-100 font-medium">
                  Please log in to Avalon using the SAME credentials you use to access MivraTech.
                </p>
              </div>
            </div>

            {/* Content with scroll - FULL HEIGHT */}
            <div className="flex-1 overflow-y-auto bg-slate-950/50">
              <iframe
                src="https://trade.avalonbroker.com/en/withdrawal"
                className="w-full h-full border-0"
                title="Withdraw"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
                allow="payment"
              />
            </div>
          </div>
        </div>
      </>
    )}
    </>
  )
}
