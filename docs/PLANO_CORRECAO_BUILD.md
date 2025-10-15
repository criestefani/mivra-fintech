# 🔧 Plano de Correção - Build Errors Frontend

**Criado em:** 15/10/2025 - 14:10
**Última Atualização:** 15/10/2025 - 14:10

---

## 📊 Status Atual

**Build Status:** ❌ FALHANDO
**Erros Encontrados:** 28+ componentes/arquivos faltando
**Prioridade:** CRÍTICA - Bloqueando desenvolvimento

---

## 🎯 Estratégia de Correção

### Abordagem: Bottom-Up (Base → Topo)

1. **Criar componentes UI base faltantes** (shadcn/ui)
2. **Criar hooks e services fundamentais**
3. **Criar features de baixo para cima** (bot-control → trading → market-scanner)
4. **Corrigir exports e index files**
5. **Testar build novamente**

---

## ✅ Checklist de Correção

### FASE A - Componentes UI Base (shadcn/ui)
- [ ] `shared/components/ui/tabs.tsx` - TabsList, TabsContent, TabsTrigger
- [ ] `shared/components/ui/dialog.tsx` - Dialog, DialogContent, DialogHeader, etc
- [ ] `shared/components/ui/select.tsx` (bonus para depois)
- [ ] `shared/components/ui/switch.tsx` (bonus para depois)

### FASE B - Hooks e Services Fundamentais
- [ ] `shared/hooks/use-toast.ts` - Hook toast com Sonner
- [ ] `services/avalon.ts` - Service Avalon (criar ou copiar se existe)
- [ ] `features/broker/services/avalon.service.ts`
- [ ] `features/broker/hooks/useAvalon.ts`

### FASE C - Feature: Bot Control
- [ ] `features/bot-control/hooks/useBotStatus.ts`
- [ ] `features/bot-control/index.ts` - Export useBotStatus

### FASE D - Feature: Market Scanner
- [ ] `features/market-scanner/types/scanner.types.ts` - ScannerConfig, ScannerFilters
- [ ] `features/market-scanner/hooks/useScannerSubscription.ts`
- [ ] `features/market-scanner/components/ScannerFilters.tsx`
- [ ] Verificar e corrigir exports em HeatmapGrid.tsx e AssetCard.tsx
- [ ] `features/market-scanner/index.ts` - Exports centralizados

### FASE E - Feature: Trading (CRÍTICO - 6 componentes)
- [ ] `features/trading/components/OperationsHeader.tsx`
- [ ] `features/trading/components/AutoModeConfig.tsx`
- [ ] `features/trading/components/AutoModeRunning.tsx`
- [ ] `features/trading/components/MetricsCards.tsx`
- [ ] `features/trading/components/TradeHistory.tsx` (+ tipo Trade export)
- [ ] `features/trading/components/TradingChart.tsx` (lightweight-charts integration)

### FASE F - Feature: Admin
- [ ] `features/admin/index.ts` - Export AdminDashboard, AdminUsers, AdminTrades, AdminSettings

### FASE G - Correções de Export
- [ ] Adicionar `export default MarketScanner` em MarketScanner.tsx
- [ ] Verificar todos os export default vs named exports

---

## 📝 Notas Técnicas

### Dependências Críticas

**Tabs Component (Auth.tsx):**
```tsx
<Tabs defaultValue="login">
  <TabsList>
    <TabsTrigger value="login">Login</TabsTrigger>
    <TabsTrigger value="signup">Cadastro</TabsTrigger>
  </TabsList>
  <TabsContent value="login">...</TabsContent>
</Tabs>
```

**Dialog Component (Settings.tsx):**
```tsx
<Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>...</DialogTitle>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

**useToast Hook:**
```tsx
const { toast } = useToast()
toast({ title: "...", description: "..." })
```

**useBotStatus Hook (Operations.tsx):**
```tsx
const { botStatus, isConnected, isRunning, startBotRuntime, stopBotRuntime, loading } = useBotStatus(user?.id)
```

**TradingChart Component:**
- Usa `lightweight-charts` library
- Recebe: category, asset, timeframe, tradeMarkers
- Deve buscar candles via `useBackendCandles`

---

## 🚀 Ordem de Execução

**Sessão 1 (30-45 min):**
1. Criar Tabs e Dialog (shadcn/ui base)
2. Criar use-toast hook
3. Testar Auth.tsx e Settings.tsx

**Sessão 2 (45-60 min):**
1. Criar avalon service e useAvalon hook
2. Criar useBotStatus
3. Criar bot-control index exports

**Sessão 3 (60-90 min - MAIOR):**
1. Criar todos os 6 componentes de Trading
2. Este é o maior trabalho - Operations depende disso
3. TradingChart precisa de integração com lightweight-charts

**Sessão 4 (30 min):**
1. Criar Market Scanner types, hooks e componentes
2. Corrigir exports existentes

**Sessão 5 (15 min):**
1. Admin exports
2. Correções finais
3. Test build completo

---

## ⏱️ Estimativa de Tempo

- **FASE A:** 20 min
- **FASE B:** 30 min
- **FASE C:** 15 min
- **FASE D:** 30 min
- **FASE E:** 90 min ⚠️ (Maior complexidade)
- **FASE F:** 5 min
- **FASE G:** 10 min

**TOTAL:** ~3h de trabalho concentrado

---

## 🎯 Próxima Ação

**COMEÇAR POR:** FASE A - Componentes UI Base (Tabs + Dialog)

**Comando para testar:**
```bash
cd "I:/Mivra Fintech/apps/frontend" && npm run dev
```

---

**Status:** 📋 Plano criado, aguardando aprovação para execução
