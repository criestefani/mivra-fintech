-- ============================================================================
-- SUPABASE CLEANUP SCRIPT - Orphaned Trades
-- ============================================================================
-- Execute este script no Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/vecofrvxrepogtigmeyj/sql/new
--
-- PROBLEMA: 6066 trades órfãos (PENDING >10 minutos)
-- CAUSA: setTimeout() verification não disparou
-- AÇÃO: Marcar como TIMEOUT para não reprocessar
-- ============================================================================

BEGIN;

-- Step 1: Diagnóstico antes da limpeza
SELECT
  COUNT(*) as total_trades,
  COUNT(*) FILTER (WHERE result = 'PENDING') as pending_trades,
  COUNT(*) FILTER (WHERE result = 'PENDING' AND signal_timestamp < NOW() - INTERVAL '10 minutes') as orphaned_trades,
  COUNT(*) FILTER (WHERE result = 'WIN') as win_trades,
  COUNT(*) FILTER (WHERE result = 'LOSS') as loss_trades
FROM strategy_trades;

-- Step 2: Sample dos trades que serão marcados como TIMEOUT
SELECT
  id,
  ativo_nome,
  signal_timestamp,
  EXTRACT(EPOCH FROM (NOW() - signal_timestamp))/60 as age_minutes,
  result
FROM strategy_trades
WHERE result = 'PENDING'
  AND signal_timestamp < NOW() - INTERVAL '10 minutes'
ORDER BY signal_timestamp ASC
LIMIT 10;

-- Step 3: UPDATE orphaned trades to TIMEOUT
-- (Não deleta - apenas marca como TIMEOUT para análise posterior)
UPDATE strategy_trades
SET
  result = 'TIMEOUT',
  result_timestamp = NOW(),
  updated_at = NOW()
WHERE result = 'PENDING'
  AND signal_timestamp < NOW() - INTERVAL '10 minutes';

-- Step 4: Confirmar UPDATE
SELECT
  COUNT(*) FILTER (WHERE result = 'TIMEOUT') as timeout_trades,
  COUNT(*) FILTER (WHERE result = 'PENDING') as remaining_pending
FROM strategy_trades;

-- Step 5: DELETE trades muito antigas (>2 horas)
-- Apenas TIMEOUT e completados (WIN/LOSS)
DELETE FROM strategy_trades
WHERE signal_timestamp < NOW() - INTERVAL '2 hours'
  AND result IN ('WIN', 'LOSS', 'TIMEOUT');

-- Step 6: Diagnóstico final
SELECT
  COUNT(*) as total_after_cleanup,
  COUNT(*) FILTER (WHERE result = 'PENDING') as pending_after,
  COUNT(*) FILTER (WHERE result = 'TIMEOUT') as timeout_after,
  COUNT(*) FILTER (WHERE result = 'WIN') as win_after,
  COUNT(*) FILTER (WHERE result = 'LOSS') as loss_after,
  pg_size_pretty(pg_total_relation_size('strategy_trades')) as table_size
FROM strategy_trades;

COMMIT;

-- ============================================================================
-- RESULTADO ESPERADO:
-- - 6066 trades marcadas como TIMEOUT
-- - Trades antigas (>2h) deletadas
-- - Tabela reduzida de ~10k para ~2-3k registros
-- - Nenhum PENDING órfão restante
-- ============================================================================

-- OPCIONAL: Verificar locks ativos (diagnóstico)
SELECT
  pid,
  usename,
  application_name,
  state,
  wait_event_type,
  wait_event,
  query_start,
  LEFT(query, 100) as query_preview
FROM pg_stat_activity
WHERE datname = current_database()
  AND state != 'idle'
  AND query NOT LIKE '%pg_stat_activity%'
ORDER BY query_start;

-- OPCIONAL: Verificar tamanho das tabelas
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;
