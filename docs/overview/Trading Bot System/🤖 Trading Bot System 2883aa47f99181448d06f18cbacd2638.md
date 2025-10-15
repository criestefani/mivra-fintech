# 🤖 Trading Bot System

Sistema de trading automatizado que conecta ao Avalon Broker via SDK, analisa indicadores técnicos em tempo real e executa trades baseado em estratégias configuráveis.

**Arquitetura: Multi-user (Fase 3 - Implementado ✅) - Suporta múltiplas sessões simultâneas com isolamento completo via SessionManager e BotSession**

- SessionManager (Singleton): Gerencia todas as sessões ativas via Map<userId, BotSession>
- BotSession: Encapsula lógica de trading para um único usuário com estado isolado
- Controle granular: Start, stop, pause, resume por usuário individual
- Suite de testes: 12 testes validando gerenciamento multi-usuário (100% passando)
- Arquivo principal: apps/backend/src/bot/bot-live.mjs (542 linhas)
- Classe: MivraTecBot - Gerencia ciclo completo de trading
- Integrações: Avalon SDK, Supabase (RLS bypass), WebSocket Events

**🔄 Fluxo de Execução**

- 1. checkStartCommand() - Verifica bot_control no Supabase a cada 5s
- 2. init() - Conecta Avalon SDK, inicializa BlitzOptions e WebSocket
- 3. executarCicloTrade() - Loop principal:
- → scanAllAssets() - Analisa ~150 ativos em paralelo (batch 20)
- → analyzeActive() - Calcula RSI, MACD, Bollinger por ativo
- → checkAssetHold() - Verifica bloqueio por perdas consecutivas
- → blitz.buy() - Executa trade via Avalon SDK
- → salvarNoSupabase() - Persiste trade_history
- → atualizarResultado() - Aguarda expiração + verifica WIN/LOSS

**🛡️ Sistema de Proteção HOLD**

Bloqueia ativos com perdas consecutivas para evitar martingale destrutivo:

- MAX_CONSECUTIVE_LOSSES = 2 (após 2 perdas seguidas no mesmo ativo)
- HOLD_TIME = 5 minutos (tempo de bloqueio)
- blockedAssets Map<activeId, timestamp> - Controla bloqueios ativos
- assetLosses Map<activeId, count> - Conta perdas consecutivas
- Reset automático: Ao obter WIN, zera contador de perdas

[📊 Estratégias de Trading](%F0%9F%93%8A%20Estrat%C3%A9gias%20de%20Trading%202883aa47f9918121beb7c6d4221b0b2f.md)

[📈 Indicadores Técnicos](%F0%9F%93%88%20Indicadores%20T%C3%A9cnicos%202883aa47f99181438a8ec9d5c8457fe4.md)

✅ Atualização 2025-10-10: SSID Generation corrigido! Sistema agora usa avalon-ssid-generator.mjs com API oficial da Avalon. BotSession atualizado para geração automática. Bot operando normalmente.