# 🗄️ Database Schema

Schema completo do banco de dados Supabase (PostgreSQL) com todas as tabelas do sistema.

🤖 1. Bot & Trading Tables

bot_control

- Propósito: Controla comandos do bot (START/STOP/PAUSE/RESUME)
- Campos: user_id, status (IDLE/ACTIVE/STOPPED), command, last_updated
- RLS: Users can only access their own records

bot_configs

- Propósito: Configurações do bot por usuário
- Campos: ativo, valor_entrada, tempo_expiracao, stop_loss, take_profit, martingale_enabled
- Trigger: updated_at auto-atualizado

trades_history

- Propósito: Histórico de todas as operações realizadas
- Campos: user_id, ativo, direcao (CALL/PUT), valor, resultado (WIN/LOSS/DRAW), profit_loss, **strategy_id** ✅
- Constraints: direcao IN ('CALL', 'PUT'), resultado IN ('WIN', 'LOSS', 'DRAW')
- **Atualizado em 2025-10-13:** Coluna strategy_id adicionada para vincular trades às estratégias do Market Scanner

strategy_trades

- Propósito: Sinais do Market Scanner com assertividade
- Campos: active_id, strategy_id, timeframe, direction, assertiveness_score, winrate, result, created_at
- **TTL:** 15 minutos por linha (auto-expirar registros antigos) ✅
- **Trigger:** Auto-atualiza scanner_performance quando trades são finalizados ✅
- Uso: Ranking top 20 por assertividade, dados em tempo real

scanner_performance

- Propósito: Agregação de performance dos últimos 15 minutos do Market Scanner
- Campos: active_id, ativo_nome, timeframe, total_signals, total_wins, total_losses, win_rate, last_signal, last_updated
- **Atualização:** Automática via trigger (UPDATE em strategy_trades) ✅
- **Função:** update_scanner_performance() com TRUNCATE otimizado ✅
- Uso: Frontend Market Scanner, estatísticas precisas em tempo real

👥 2. User & Profile Tables

profiles

- Propósito: Dados adicionais do usuário
- Campos: user_id (FK auth.users), full_name
- Trigger: Auto-criado após signup (on_auth_user_created)

📈 3. CRM Tables (14 tabelas) (ainda não existem no supabase)

crm_contacts

- Central de contatos/leads com scoring
- Campos: email, phone, name, status (lead/prospect/customer/inactive/churned), score (0-100), custom_fields (JSONB)

crm_workflows

- Sistema de automação visual (drag-and-drop)
- Campos: workflow_definition (React Flow format), trigger_type, execution_count

crm_campaigns

- Campanhas multi-canal (email/SMS/push/webhook)
- Stats: sent, delivered, opened, clicked, bounced, unsubscribed

crm_email_templates

- Templates com Unlayer (drag-and-drop email builder)
- Campos: design (Unlayer JSON), html, variables, category

Outras tabelas CRM: crm_segments, crm_journeys, crm_activities, crm_forms, crm_ab_tests, crm_integrations, crm_webhooks, crm_scoring_rules

👑 4. Admin & Monitoring Tables

admin_logs

- Sistema de logging centralizado
- Campos: level (debug/info/warn/error/critical), origin (api/bot/worker/frontend), message, metadata

admin_alerts

- Sistema de alertas para eventos críticos
- Campos: alert_type (error/disconnect/drawdown/custom), severity, is_read, is_resolved

system_config

- Configuração global e feature flags
- Defaults: maintenance_mode, max_concurrent_bots, default_risk_limits, alert_thresholds

webhooks & webhook_logs

- Gerenciamento de webhooks para integrações externas
- Retry policy configurada, logs de execução

🔄 **Últimas Atualizações:**

- **2025-10-10:** Sistema de SSID corrigido. Agora usa API Avalon oficial (POST /session/{userId}) com Bearer token. Não requer mais credenciais do usuário - apenas avalon_user_id. SSID auto-renovado a cada 24h.
- **2025-10-13:** ✅ **Database Analytics Completo**
    - Coluna `strategy_id` adicionada na `trade_history`
    - TTL de `strategy_trades` reduzido para 15 minutos
    - Trigger automático para `scanner_performance`
    - Função `update_scanner_performance()` otimizada
    - Estatísticas precisas e atualizadas em tempo real