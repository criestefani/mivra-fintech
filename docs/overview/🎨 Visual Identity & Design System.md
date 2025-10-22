# 🎨 Visual Identity & Design System

Documentação do sistema de identidade visual e design utilizado em toda a plataforma MivraTech. Define os componentes reutilizáveis, paleta de cores, animações e diretrizes de layout.

---

## 🌟 Visão Geral

A identidade visual da MivraTech é baseada em:
- **Tema**: Cyberpunk Trading Arena
- **Paleta**: Cores vibrantes com efeitos de animação fluida
- **Estilo**: Minimalista com elementos geométricos modernos
- **Foco**: Criar uma experiência visual imersiva e profissional

---

## 🎯 Componentes Principais

### 1. OrganicBackground

Componente de fundo animado com blobs flutuantes que criam uma atmosfera visual única.

**Localização**: `apps/frontend/src/components/ui/gamification/OrganicBackground.tsx`

**Props**:
```typescript
interface OrganicBackgroundProps {
  blobCount?: number;           // Quantidade de blobs (default: 3)
  colors?: string[];            // Array de cores hex (default: pré-definidas)
  speed?: number;               // Velocidade da animação (0.5-1.5, default: 1)
  opacity?: number;             // Opacidade (0-100, default: 15)
  className?: string;           // Classes Tailwind adicionais
}
```

**Uso Padrão**:
```tsx
<OrganicBackground
  blobCount={3}
  colors={['#0EA5E9', '#F59E0B', '#10B981']}
  speed={0.8}
/>
```

**Características**:
- Posicionamento: `fixed` (fica no fundo em todas as páginas)
- Z-index: `z-0` (permanece abaixo de todo conteúdo)
- Pointer events: `none` (não interfere com interações)
- Opacity: `opacity-5` (5% - transparência maximizada para mínimo impacto visual)
- Blend mode: `screen` (blending sofisticado)

---

### 2. DiagonalSection

Componente de seção com divisão diagonal e gradiente, usado para headers e separadores visuais.

**Localização**: `apps/frontend/src/components/ui/gamification/DiagonalSection.tsx`

**Props**:
```typescript
interface DiagonalSectionProps {
  direction?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  gradientFrom?: string;  // Classe Tailwind do gradiente (ex: 'from-primary/40')
  className?: string;     // Classes Tailwind adicionais
  children?: React.ReactNode;
}
```

**Padrões de Uso por Página**:

| Página | Direction | Props | Propósito |
|--------|-----------|-------|-----------|
| Operations | `top-right` | `h-32 lg:h-40` | Header dinâmico |
| History | `bottom-left` | `h-40 lg:h-48` | Separador visual |
| MarketScanner | `top-left` | `h-40 lg:h-48` | Header com ícone |
| Settings | `bottom-right` | `h-40 lg:h-48` | Divisão elegante |
| Badges | `top-right` | `h-48 lg:h-64` | Seção proeminente |
| Leaderboard | `bottom-right` | `h-48 lg:h-64` | Seção proeminente |

**Estrutura de Conteúdo**:
```tsx
<DiagonalSection
  direction="top-right"
  gradientFrom="from-primary/40"
  className="h-32 lg:h-40 relative z-20 -mx-4 lg:-ml-4"
>
  <div className="relative z-30">
    <h1 className="text-3xl lg:text-4xl font-bold text-white">Title</h1>
    <p className="text-muted-foreground mt-1 text-sm lg:text-base">Subtitle</p>
  </div>
</DiagonalSection>
```

---

## 🎨 Paleta de Cores

### Cores Principais do Sistema Visual

```
🔵 Azul Elétrico (Primary)
   Hex: #0EA5E9
   Uso: Backgrounds animados, destaques

🟡 Dourado Âmbar (Accent)
   Hex: #F59E0B
   Uso: Alertas, destaque secundário

🟢 Verde Profit (Success)
   Hex: #10B981
   Uso: Ganhos, resultados positivos
```

### Configuração Padrão por Página

Todas as páginas utilizam as mesmas cores para OrganicBackground:

```typescript
colors={['#0EA5E9', '#F59E0B', '#10B981']}
```

**Recomendação**: Manter essas cores consistentes para evitar jarretir visual entre páginas.

---

## 🏗️ Z-Index Layering Strategy

Hierarquia visual bem definida para evitar conflitos de sobreposição:

```
┌─────────────────────────────────────┐
│ z-50: Global Modals & Dialogs       │ (Dialogs, Toast notifications)
├─────────────────────────────────────┤
│ z-40: Header & Navigation           │ (DashboardHeader, Sidebar)
├─────────────────────────────────────┤
│ z-30: DiagonalSection Content       │ (Texto, ícones dentro de headers)
├─────────────────────────────────────┤
│ z-20: Main Page Content             │ (Páginas, cards, conteúdo principal)
├─────────────────────────────────────┤
│ z-10: Background Elements           │ (Efeitos visuais secundários)
├─────────────────────────────────────┤
│ z-0: OrganicBackground              │ (Animação de fundo com blobs)
├─────────────────────────────────────┤
│ z-(-1): Fallback                    │ (Raramente usado)
└─────────────────────────────────────┘
```

**Implementação na Prática**:

```tsx
// Container da página
<div className="min-h-screen relative overflow-hidden">

  {/* Background animado - z-0 (mais atrás) */}
  <OrganicBackground colors={[...]} speed={0.8} />

  {/* Header - z-40 (acima do conteúdo) */}
  <DashboardHeader user={user} />

  {/* Main content - z-20 */}
  <main className="relative z-20">

    {/* DiagonalSection - z-20, conteúdo interno z-30 */}
    <DiagonalSection className="z-20">
      <div className="z-30">...</div>
    </DiagonalSection>

  </main>

</div>
```

---

## ⚡ Animações & Velocidades

### Configuração de Velocidades

| Parâmetro | Valor Padrão | Faixa Recomendada | Efeito |
|-----------|-------------|-------------------|--------|
| `speed` | `0.8` | `0.5 - 1.5` | Velocidade dos blobs |
| `opacity` | `5%` | `3% - 10%` | Transparência do fundo (máxima) |

**Efeitos Observados**:
- **speed: 0.5** → Muito lento, meditativo
- **speed: 0.8** → Padrão recomendado, fluido mas não intrusivo
- **speed: 1.2** → Mais dinâmico, energético
- **speed: 1.5** → Muito acelerado, pode distrair

**Recomendação**: Manter `speed={0.8}` em todas as páginas para consistência.

---

## 📱 Páginas com Visual Identity Aplicada

### ✅ Página Completa

| Página | OrganicBackground | DiagonalSection | Status | Observações |
|--------|-------------------|-----------------|--------|-------------|
| Operations | ✓ | ✓ | Completo | Header "Trading Operations" |
| Auth | ✓ | ✓ | Completo | **NOVO**: Brand hero com logo animado |
| History | ✓ | ✓ | Completo | Header "Trade History" |
| MarketScanner | ✓ | ✓ | Completo | Header "Market Scanner" com ícone |
| Settings | ✓ | ✓ | Completo | Header "Settings" com ícone |
| Badges | ✓ | ✓ | Completo | Header "Badges" proeminente |
| Leaderboard | ✓ | ✓ | Completo | Header "Leaderboard" proeminente |

---

## 🛠️ Guia de Implementação para Novas Páginas

### Passo 1: Importe os Componentes

```tsx
import { OrganicBackground, DiagonalSection } from '@/components/ui/gamification';
```

### Passo 2: Estruture o Container

```tsx
return (
  <div className="min-h-screen bg-slate-900 relative overflow-hidden">
    {/* Background */}
    <OrganicBackground
      blobCount={3}
      colors={['#0EA5E9', '#F59E0B', '#10B981']}
      speed={0.8}
    />

    {/* Header e Navigation */}
    <DashboardHeader user={user} />
    <Sidebar />

    {/* Main Content */}
    <main className="lg:ml-64 container mx-auto px-4 py-6 pb-24 relative z-20">

      {/* DiagonalSection Header (opcional) */}
      <DiagonalSection
        direction="top-left"  // Ajuste conforme necessário
        gradientFrom="from-primary/40"
        className="h-40 lg:h-48 relative z-20 -mx-4 lg:-ml-4"
      >
        <div className="relative z-30">
          <h1 className="text-3xl lg:text-4xl font-bold text-white">Page Title</h1>
          <p className="text-muted-foreground mt-1">Description</p>
        </div>
      </DiagonalSection>

      {/* Conteúdo da página */}
      {/* ... */}

    </main>

  </div>
);
```

### Passo 3: Ajuste de Detalhes

**Tailwind Classes Importantes**:
- `bg-slate-900` → Fundo escuro (combina com OrganicBackground)
- `relative overflow-hidden` → Contém animações
- `relative z-20` → Main content acima do background
- `relative z-30` → Conteúdo dentro de DiagonalSection

### Passo 4: Testes Visuais

- [ ] OrganicBackground visível mas não intrusivo
- [ ] DiagonalSection alinhada corretamente
- [ ] Conteúdo legível sobre o fundo
- [ ] Sem conflitos de z-index
- [ ] Responsive em mobile

---

## 🔐 Caso de Uso Especial: Página de Autenticação (Auth.tsx)

A página de autenticação implementa um padrão único chamado **"Brand Hero"** que combina:

### Estrutura Visual

```
┌─────────────────────────────────────┐
│                                     │
│  DiagonalSection (Brand Hero)       │ ← z-20
│  • Logo MivraTech animado           │
│  • Tagline "Bot de Trading"         │
│  • Descrição da plataforma          │
│                                     │
├─────────────────────────────────────┤  (overlap)
│                                     │
│  Card de Autenticação               │ ← z-20 (com -mt negativo)
│  • Tabs: Login | Cadastro           │
│  • Formulários                      │
│  • Botão de ação                    │
│                                     │
└─────────────────────────────────────┘

Background: OrganicBackground (z-0)
```

### Implementação da Sobreposição

```tsx
{/* DiagonalSection takes up top half */}
<DiagonalSection className="h-48 lg:h-56">
  {/* Content centered inside */}
</DiagonalSection>

{/* Card overlaps with negative margin */}
<div className="-mt-24 lg:-mt-32 relative z-20">
  <Card>
    {/* Auth form */}
  </Card>
</div>
```

### Características Especiais

- **Logo Animado**: `animate-pulse` no ícone Zap
- **Tipografia Hierárquica**:
  - Logo: `text-5xl font-black`
  - Tagline: `text-lg font-semibold`
  - Descrição: `text-sm text-muted-foreground`
- **Card Overlay**: Usa `-mt-24` ou `-mt-32` para criar efeito de profundidade
- **Border Customizado**: `border-primary/20` para melhor visual

### Por Que Este Padrão?

1. **Primeira Impressão**: O Brand Hero cria impacto visual imediato
2. **Profundidade**: A sobreposição cria sensação de camadas
3. **Engajamento**: Elementos animados (Zap pulsing) criam dinamismo
4. **Consistência**: Mantém a identidade visual MivraTech

### Quando Usar Este Padrão

- ✅ Páginas de entrada (Auth, Landing)
- ✅ Páginas de alta importância visual
- ❌ Não usar em páginas internas regulares
- ❌ Não usar em dados-driven dashboards

---

## 💡 Boas Práticas

### ✅ Faça

- **Sempre use `relative overflow-hidden` no container principal**
  ```tsx
  <div className="min-h-screen relative overflow-hidden">
  ```

- **Mantenha `pointer-events-none` no OrganicBackground**
  - Automático no componente

- **Use `lg:ml-64` para acomodar a sidebar**
  ```tsx
  <main className="lg:ml-64 ...">
  ```

- **Adicione `z-20` ao main content**
  - Garante visibilidade acima do background

### ❌ Não Faça

- **Não mude o `bg-slate-900` para outra cor**
  - Otimizado para o OrganicBackground

- **Não defina `pointer-events` no main content**
  - Podem quebrar interações

- **Não aumente a opacidade do OrganicBackground além de 10%**
  - Fica intrusivo e prejudica a legibilidade (padrão é 5%)

- **Não use `absolute -z-10` para backgrounds**
  - Use `fixed z-0` como no OrganicBackground

---

## 📊 Comparação: Antes vs. Depois

### Antes (sem visual identity)
- Background simples cinza
- Headers textuais simples
- Falta de coesão visual
- Cada página sentia-se desconectada

### Depois (com visual identity)
- Background animado, imersivo
- Headers com efeito diagonal + gradiente
- Identidade visual forte e consistente
- Experiência coesiva em todas as páginas
- Aplicação profissional de gamification

---

## 🔄 Atualização & Manutenção

### Como Atualizar Cores

Se precisar alterar a paleta de cores, atualize em todos os locais:

```tsx
// Antes
colors={['#0EA5E9', '#F59E0B', '#10B981']}

// Depois (nova paleta)
colors={['#8B5CF6', '#EC4899', '#06B6D4']}  // Purple, Pink, Cyan
```

**Arquivos a Atualizar**:
- Todas as 6+ páginas com OrganicBackground
- Este documento
- Qualquer documentação de color tokens

### Como Atualizar Velocidade de Animação

```tsx
// Se a animação está muito rápida
speed={0.5}  // Reduzir

// Se muito lenta
speed={1.2}  // Aumentar
```

---

## 🎯 Próximos Passos

- [ ] Implementar Dark/Light mode toggle (com variações de cores)
- [ ] Adicionar mais variações de DiagonalSection (estilos)
- [ ] Criar biblioteca de padrões reutilizáveis
- [ ] Documentar componentes no Storybook
- [ ] Adicionar transições entre páginas

---

## 📚 Referências

- **OrganicBackground**: `apps/frontend/src/components/ui/gamification/OrganicBackground.tsx`
- **DiagonalSection**: `apps/frontend/src/components/ui/gamification/DiagonalSection.tsx`
- **Tailwind CSS**: https://tailwindcss.com
- **Framer Motion**: https://www.framer.com/motion

---

**Última Atualização**: Outubro 2025
**Status**: Production Ready ✅
