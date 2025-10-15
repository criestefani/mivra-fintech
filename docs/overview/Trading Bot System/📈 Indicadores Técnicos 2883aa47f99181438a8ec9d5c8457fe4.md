# 📈 Indicadores Técnicos

O sistema utiliza 6 indicadores técnicos principais para análise de mercado. Cada indicador retorna um sinal (CALL/PUT/NEUTRO) que é usado pelas estratégias de trading.

📂 Localização: apps/backend/src/bot/indicators/

1. RSI (Relative Strength Index)

📊 Descrição: Oscilador de momento que mede velocidade e magnitude das mudanças de preço. Identifica condições de sobrecompra (>70) e sobrevenda (<30).

📐 Fórmula: RSI = 100 - (100 / (1 + RS)), onde RS = Média de Ganhos / Média de Perdas

🎯 Sinais:

- RSI < 30 → CALL (sobrevenda, reversão para cima)
- RSI > 70 → PUT (sobrecompra, reversão para baixo)
- 30 <= RSI <= 70 → NEUTRO

💡 Técnica: Usa suavização de Wilder (EMA adaptada) para médias de ganhos/perdas.

2. MACD (Moving Average Convergence Divergence)

📊 Descrição: Indicador de momentum baseado em diferença entre EMAs rápida e lenta. Detecta mudanças de tendência através de cruzamentos.

📐 Fórmulas:

- MACD Line = EMA(12) - EMA(26)
- Signal Line = EMA(9) do MACD
- Histogram = MACD - Signal

🎯 Sinais:

- Histogram > 0 E crescente → CALL (momentum de alta)
- Histogram < 0 E decrescente → PUT (momentum de baixa)
- Cruzamento negativo→positivo → CALL (reversão bullish)
- Cruzamento positivo→negativo → PUT (reversão bearish)

💡 Uso: Estratégia Conservative combina MACD com RSI para confirmar sinais.

3. Bollinger Bands

📊 Descrição: Indicador de volatilidade com 3 bandas (superior, média, inferior). Detecta breakouts e períodos de squeeze (baixa volatilidade).

📐 Fórmulas:

- Middle Band = SMA(20)
- Upper Band = SMA(20) + (2 × σ)
- Lower Band = SMA(20) - (2 × σ)
- Bandwidth = (Upper - Lower) / Middle

🎯 Sinais:

- Toque na banda inferior → CALL (oversold, reversão esperada)
- Toque na banda superior → PUT (overbought, reversão esperada)
- Bandwidth < 0.01 → SQUEEZE (consolidação, breakout iminente)

💡 Técnica: Usa tolerância de 0.5% para detectar 'toque' nas bandas (não precisa ser exato).

4. ADX (Average Directional Index)

📊 Descrição: Mede força da tendência (não direção). Valores >25 indicam tendência forte. Usa +DI e -DI para determinar direção.

📐 Fórmulas:

- TR (True Range) = max(high-low, |high-prev_close|, |low-prev_close|)
- +DI = (Smoothed +DM / Smoothed TR) × 100
- -DI = (Smoothed -DM / Smoothed TR) × 100
- DX = (|+DI - -DI| / (+DI + -DI)) × 100

🎯 Sinais:

- ADX > 25 E +DI > -DI → CALL (tendência de alta forte)
- ADX > 25 E -DI > +DI → PUT (tendência de baixa forte)
- ADX < 25 → NEUTRO (mercado lateral, sem tendência)

💡 Uso: Estratégia Aggressive usa ADX para confirmar força da tendência antes de entrar.

5. Stochastic RSI

📊 Descrição: Oscilador que aplica fórmula Stochastic sobre valores RSI. Mais sensível que RSI tradicional, detecta reversões mais cedo.

📐 Fórmula: StochRSI = (RSI - Min(RSI)) / (Max(RSI) - Min(RSI)) × 100

🎯 Sinais:

- StochRSI < 20 → CALL (oversold extremo)
- StochRSI > 80 → PUT (overbought extremo)
- 20 <= StochRSI <= 80 → NEUTRO

💡 Técnica: Calcula RSI(14) primeiro, depois aplica Stochastic sobre últimos 14 valores RSI.

6. Trend (EMAs 9/21/50)

📊 Descrição: Identifica tendência através de alinhamento de 3 EMAs. Detecta tendências fortes, fracas e mercado lateral.

📐 Componentes:

- EMA(9) - Curto prazo, reage rápido
- EMA(21) - Médio prazo
- EMA(50) - Longo prazo, suporte/resistência

🎯 Sinais:

- EMA9 > EMA21 > EMA50 E preço > EMA9 → CALL (tendência de alta forte)
- EMA9 < EMA21 < EMA50 E preço < EMA9 → PUT (tendência de baixa forte)
- EMA9 > EMA21 E divergência > 0.05% → CALL (tendência de alta fraca)
- EMA9 < EMA21 E divergência > 0.05% → PUT (tendência de baixa fraca)
- Divergência < 0.05% → LATERAL (sem tendência definida)

💡 Uso: Estratégia Balanced usa Trend como um dos 3 indicadores para consenso.