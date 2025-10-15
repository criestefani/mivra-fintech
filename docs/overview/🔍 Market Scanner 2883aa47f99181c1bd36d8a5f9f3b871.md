# 🔍 Market Scanner

O Market Scanner analisa continuamente o mercado para identificar as melhores oportunidades de trading em tempo real.

📊 Estatísticas de Análise

- 150 ativos monitorados simultaneamente
- 5 timeframes por ativo (M1, M5, M15, M30, H1)
- 4 estratégias aplicadas em cada combinação
- 3.000 combinações analisadas a cada ciclo (150 × 5 × 4)
- Intervalo de scan: 10 segundos

🔄 Fluxo de Funcionamento

1. Inicialização

- Conecta ao Avalon SDK
- Obtém lista de ativos negociáveis (blitz.getActives())
- Filtra apenas ativos que podem ser comprados no momento

2. Scan Loop (a cada 10s)

- Para cada ativo: busca candles de 5 timeframes
- Para cada timeframe: aplica 4 estratégias
- Calcula assertividade e winrate de cada sinal
- Armazena sinais no Supabase (tabela strategy_trades)

3. Ranking por Assertividade

- Consulta sinais dos últimos 30 minutos
- Ordena por assertividade (% de acertos)
- Retorna top 20 melhores oportunidades

📊 Estratégia Balanced (Consenso)

Estratégia especial que usa consenso de 3 indicadores:

- RSI (Relative Strength Index)
- Bollinger Bands
- Trend (EMAs 9/21/50)

MIN_CONSENSUS = 2: Pelo menos 2 dos 3 indicadores devem concordar no sinal.

💾 Persistência de Dados

Tabela: strategy_trades

Campos armazenados:

- active_id, active_name, strategy_id
- timeframe (M1, M5, M15, M30, H1)
- direction (CALL/PUT)
- entry_price, entry_time
- assertiveness_score (% de acertos históricos)
- winrate (taxa de vitória)