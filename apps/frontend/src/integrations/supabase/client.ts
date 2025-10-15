import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vecofrvxrepogtigmeyj.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Export types for database tables
export type Trade = {
  id: number
  external_id: number
  user_id: string
  type: string
  active_id: number
  ativo_nome: string
  direction: 'CALL' | 'PUT'
  valor: number
  profit_esperado: number | null
  pnl: number | null
  status: string | null
  resultado: 'WIN' | 'LOSS' | 'TIE' | null
  data_abertura: string
  data_expiracao: string
  expiration_seconds: number | null
  strategy_id: string | null
  account_type: 'demo' | 'real'
  created_at: string
}

export type BotStatus = {
  id: string
  user_id: string
  is_connected: boolean
  broker_balance: number
  account_type: 'demo' | 'real'
  bot_running: boolean
  bot_pid: number | null
  ssid: string | null
  avalon_ssid: string | null
  avalon_user_id: number | null
  session_active: boolean
  last_heartbeat: string
  last_updated: string
  created_at: string
}

export type BotControl = {
  id: string
  user_id: string
  status: 'idle' | 'running' | 'stopped'
  command: 'start' | 'stop' | 'pause' | 'resume' | null
  last_updated: string
  created_at: string
  command_type: string | null
  auto_min_win_rate: number
  auto_max_trades_per_hour: number
  max_loss_per_day: number
  max_loss_streak: number
  current_loss_streak: number
  default_amount: number
}

export type Profile = {
  id: string
  user_id: string
  full_name: string | null
  email: string | null
  phone: string | null
  broker_name: string
  broker_user_id: string | null
  broker_ssid: string | null
  current_balance: number
  total_deposits: number
  total_withdrawals: number
  total_profit: number
  avatar_url: string | null
  created_at: string
  updated_at: string
}
