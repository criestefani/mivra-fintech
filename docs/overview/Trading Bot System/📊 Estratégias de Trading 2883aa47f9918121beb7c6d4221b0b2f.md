# 📊 Estratégias de Trading

O bot suporta 4 estratégias configuráveis via variável STRATEGY:

**1️⃣ Conservative (Conservador)**

- Arquivo: apps/backend/src/bot/strategies/strategy-conservative.mjs
- Lógica: RSI + MACD com thresholds permissivos
- CALL: RSI < 55 + MACD positivo + tendência alta
- PUT: RSI > 45 + MACD negativo + tendência baixa
- Mínimo 35 candles para análise

**2️⃣ Aggressive (Agressivo)**

- Arquivo: strategy-aggressive.mjs
- Lógica: RSI extremo + ADX força de tendência
- Maior risco, sinais mais raros mas forte convicção

**3️⃣ Balanced (Equilibrado)**

- Lógica: Consensus de 3 indicadores (RSI + MACD + Bollinger)
- MIN_CONSENSUS = 2 (pelo menos 2 concordam)
- Mais sinais que Conservative, melhor qualidade que Aggressive

**4️⃣ Support-Resistance (Rompimento)**

- Arquivo: strategy-support-resistance.mjs
- Lógica: Detecta suporte/resistência e opera rompimentos
- Identifica zonas de preço com volume