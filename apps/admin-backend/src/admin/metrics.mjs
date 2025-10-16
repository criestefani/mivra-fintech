// Metrics Module - System metrics collection

export async function getRealtimeMetrics(supabase) {
  try {
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id');

    const { data: activeBots, error: botsError } = await supabase
      .from('bot_status')
      .select('id')
      .eq('bot_running', true);

    const { data: recentTrades, error: tradesError } = await supabase
      .from('strategy_trades')
      .select('id, resultado')
      .order('signal_timestamp', { ascending: false })
      .limit(100);

    const wins = recentTrades?.filter(t => t.resultado === 'WIN').length || 0;
    const losses = recentTrades?.filter(t => t.resultado === 'LOSS').length || 0;
    const total = wins + losses;

    return {
      totalUsers: users?.length || 0,
      activeBots: activeBots?.length || 0,
      recentTrades: total,
      winRate: total > 0 ? ((wins / total) * 100).toFixed(2) : '0.00',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching realtime metrics:', error);
    return { error: error.message };
  }
}

export async function getDailyMetrics(supabase) {
  try {
    const { data, error } = await supabase
      .from('strategy_trades')
      .select('*')
      .gte('signal_timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('signal_timestamp', { ascending: false });

    if (error) throw error;

    const wins = data?.filter(t => t.resultado === 'WIN').length || 0;
    const losses = data?.filter(t => t.resultado === 'LOSS').length || 0;
    const total = wins + losses;

    return {
      totalTrades: total,
      wins,
      losses,
      winRate: total > 0 ? ((wins / total) * 100).toFixed(2) : '0.00',
      period: '24h',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching daily metrics:', error);
    return { error: error.message };
  }
}

export async function getSummaryMetrics(supabase) {
  try {
    const { data: allTrades, error } = await supabase
      .from('strategy_trades')
      .select('*');

    if (error) throw error;

    const wins = allTrades?.filter(t => t.resultado === 'WIN').length || 0;
    const losses = allTrades?.filter(t => t.resultado === 'LOSS').length || 0;
    const total = wins + losses;

    return {
      totalTrades: total,
      wins,
      losses,
      winRate: total > 0 ? ((wins / total) * 100).toFixed(2) : '0.00',
      period: 'all-time',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching summary metrics:', error);
    return { error: error.message };
  }
}

export async function getTopUsers(supabase, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching top users:', error);
    return [];
  }
}

export async function getRecentActivity(supabase, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('strategy_trades')
      .select('*')
      .order('signal_timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}
