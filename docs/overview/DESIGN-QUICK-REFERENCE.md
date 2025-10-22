# 🎨 Design System - Quick Reference Card

Cheat sheet rápido para implementar visual identity em novas páginas.

---

## ⚡ Copy-Paste Template (novo componente)

```tsx
import { OrganicBackground, DiagonalSection } from '@/components/ui/gamification';

export default function NewPage() {
  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Background animado */}
      <OrganicBackground
        blobCount={3}
        colors={['#0EA5E9', '#F59E0B', '#10B981']}
        speed={0.8}
      />

      <DashboardHeader user={user} />
      <Sidebar />

      <main className="lg:ml-64 container mx-auto px-4 py-6 pb-24 relative z-20">
        {/* Header com diagonal */}
        <DiagonalSection
          direction="top-left"           {/* Ajuste conforme page */}
          gradientFrom="from-primary/40"
          className="h-40 lg:h-48 relative z-20 -mx-4 lg:-ml-4"
        >
          <div className="relative z-30">
            <h1 className="text-3xl lg:text-4xl font-bold text-white">
              Page Title
            </h1>
            <p className="text-muted-foreground mt-1 text-sm lg:text-base">
              Subtitle
            </p>
          </div>
        </DiagonalSection>

        {/* Conteúdo */}
      </main>
    </div>
  );
}
```

---

## 🎯 Diagonal Direction Reference

Escolha a melhor direção para seu design:

| Direção | Uso Recomendado | Exemplos |
|---------|-----------------|----------|
| `top-left` | Seções iniciais | MarketScanner |
| `top-right` | Headers dinâmicos | Operations |
| `bottom-left` | Transições | History |
| `bottom-right` | Finais/Settings | Settings, Leaderboard |

---

## 🎨 Cores Padrão

```typescript
// SEMPRE use estas cores
colors={['#0EA5E9', '#F59E0B', '#10B981']}

// Decomposição:
// 🔵 #0EA5E9 - Azul elétrico (Sky/Primary)
// 🟡 #F59E0B - Dourado âmbar (Accent)
// 🟢 #10B981 - Verde profit (Success)
```

---

## ⚙️ Parâmetros Otimizados

```typescript
{/* Padrão para todas as páginas */}
<OrganicBackground
  blobCount={3}        {/* 3 blobs flutuantes */}
  colors={[...]}       {/* 3 cores do sistema */}
  speed={0.8}          {/* 0.8x velocidade normal */}
  // opacity (default 15%) - Ajuste raro
/>
```

---

## 📐 Z-Index Essencial

```
Container pai           → min-h-screen bg-slate-900 relative overflow-hidden
  ├─ OrganicBackground  → (automático z-0)
  ├─ DashboardHeader    → (z-40 automático)
  ├─ Sidebar            → (z-40 automático)
  └─ main               → relative z-20
       └─ DiagonalSection → relative z-20
            └─ Conteúdo    → relative z-30
```

**Regra**: Se precisa aparecer acima do background, adicione `relative z-20`

---

## 🚀 Checklist de Implementação

- [ ] Importe: `OrganicBackground, DiagonalSection`
- [ ] Container: `min-h-screen bg-slate-900 relative overflow-hidden`
- [ ] OrganicBackground com cores/speed padrão
- [ ] Main content: `lg:ml-64 ... relative z-20`
- [ ] DiagonalSection: escolha direção, adicione conteúdo
- [ ] DiagonalSection content: `relative z-30`
- [ ] Teste: fundo visível, conteúdo legível, responsive OK

---

## 🎯 Direções por Página

```
Já Implementadas:
├─ Operations      → top-right (dinâmico)
├─ Auth            → (sem diagonal - card centralizada)
├─ History         → bottom-left (transição)
├─ MarketScanner   → top-left (inicial)
├─ Settings        → bottom-right (final)
├─ Badges          → top-right (proeminente)
└─ Leaderboard     → bottom-right (proeminente)

Padrão para Novas:
├─ Info/Stats      → top-left OU top-right
├─ Transitions     → bottom-left OU bottom-right
└─ Configurações   → bottom-right
```

---

## 🔧 Ajustes Comuns

### Conteúdo não aparece?
```tsx
// ✓ Adicione z-20 ao main
<main className="relative z-20">

// ✓ Certifique-se de overflow-hidden no pai
<div className="overflow-hidden">
```

### Background muito forte/fraco?
```tsx
// Ajuste opacity (10-25%)
// Modificar em OrganicBackground.tsx
className="opacity-15"  // Mude para opacity-10 ou opacity-20
```

### Animação muito rápida/lenta?
```tsx
// Ajuste speed (0.5-1.5)
<OrganicBackground speed={0.6} />  // Mais lento
<OrganicBackground speed={1.2} />  // Mais rápido
```

---

## 🎨 Importações Necessárias

```tsx
// ✅ Sempre adicione estas imports
import { OrganicBackground, DiagonalSection } from '@/components/ui/gamification';
import { DashboardHeader, Sidebar } from '@/features/dashboard';
```

---

## 📱 Classes Tailwind Essenciais

```tsx
{/* Container */}
className="min-h-screen bg-slate-900 relative overflow-hidden"

{/* Main content */}
className="lg:ml-64 container mx-auto px-4 py-6 pb-24 relative z-20"

{/* DiagonalSection */}
className="h-40 lg:h-48 relative z-20 -mx-4 lg:-ml-4"

{/* DiagonalSection content */}
className="relative z-30"

{/* Títulos */}
className="text-3xl lg:text-4xl font-bold text-white"

{/* Subtítulos */}
className="text-muted-foreground mt-1 text-sm lg:text-base"
```

---

## ⚡ Performance Tips

1. ✅ OrganicBackground é otimizado (pointer-events: none)
2. ✅ Z-index fixo evita recálculos
3. ✅ Opacity-15 não reduz performance
4. ✅ Speed 0.8 é o padrão recomendado

---

## 🆘 Troubleshooting

| Problema | Solução |
|----------|---------|
| Background não aparece | Verificar `overflow-hidden` no container |
| Conteúdo escondido | Adicionar `z-20` ao main |
| Animação stuttering | Reduzir blobCount ou aumentar framerate |
| Cores estranhas | Verificar se são valores HEX válidos |
| DiagonalSection cortada | Adicionar `-mx-4 lg:-ml-4` |
| Mobile responsivo quebrado | Verificar `lg:ml-64` em main |

---

**Documento Rápido**: Para documentação completa, veja `🎨 Visual Identity & Design System.md`
