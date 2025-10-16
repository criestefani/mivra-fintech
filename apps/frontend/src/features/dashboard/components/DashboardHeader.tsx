import { User } from '@supabase/supabase-js'
import { Button } from '@/shared/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { Switch } from '@/shared/components/ui/switch'
import { LogOut, Wallet } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useNavigate } from 'react-router-dom'
import { useBalance } from '@/shared/hooks/useBalance'

interface DashboardHeaderProps {
  user: User
}

export const DashboardHeader = ({ user }: DashboardHeaderProps) => {
  const navigate = useNavigate()
  const { balance, isLoading, error, accountType, setAccountType } = useBalance(true)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-border/50 shadow-card">
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary shadow-md shadow-primary/40">
              <span className="text-primary-foreground font-semibold text-sm tracking-wide">
                MT
              </span>
            </div>
            <span className="font-semibold text-lg hidden sm:inline text-foreground/90">
              MivraTech
            </span>
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex border border-border/40 bg-secondary/60 text-secondary-foreground">
            Beta
          </Badge>
        </div>

        {/* Balance Display - Mobile & Desktop */}
        <div className="flex items-center gap-2 sm:gap-3 bg-card/50 border border-border/40 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 shadow-sm">
          <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          <div className="flex flex-col">
            {isLoading ? (
              <span className="text-xs sm:text-sm text-muted-foreground">Loading...</span>
            ) : error ? (
              <span className="text-xs sm:text-sm text-destructive">Not connected</span>
            ) : balance ? (
              <>
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  {formatBalance(balance.amount)}
                </span>
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Demo</span>
                  <Switch
                    checked={accountType === 'real'}
                    onCheckedChange={(checked) => setAccountType(checked ? 'real' : 'demo')}
                    className="scale-75 sm:scale-90"
                  />
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Real</span>
                </div>
              </>
            ) : (
              <span className="text-xs sm:text-sm text-muted-foreground">No balance</span>
            )}
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-sm font-medium text-foreground/90">{user.email}</span>
            <span className="text-xs text-muted-foreground/80">ID: {user.id.slice(0, 8)}...</span>
          </div>

          <Avatar className="w-10 h-10 border border-border/40 shadow-sm shadow-primary/15">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user.email || 'U')}
            </AvatarFallback>
          </Avatar>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-primary-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
