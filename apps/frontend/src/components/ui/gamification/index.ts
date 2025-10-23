/**
 * Gamification UI Components
 *
 * Design System: "Cyber Trading Arena"
 * Phase 1: Complete visual architecture & base components
 *
 * Color Palette:
 * - Electric Blue (#0EA5E9) - Primary, technology
 * - Golden Amber (#F59E0B) - Profit, premium
 * - Profit Green (#10B981) - Success, wins
 * - Loss Red (#EF4444) - Danger, losses
 * - Deep Space (#0F172A) - Background
 */

// Base Components
export { GlassCard } from './GlassCard';
export type { GlassCardProps } from './GlassCard';

export { NeonButton } from './NeonButton';
export type { NeonButtonProps } from './NeonButton';

export { DepositButton } from './DepositButton';
export type { DepositButtonProps } from './DepositButton';

export { WithdrawButton } from './WithdrawButton';
export type { WithdrawButtonProps } from './WithdrawButton';

// Layout Components
export { OrganicBackground } from './OrganicBackground';
export type { OrganicBackgroundProps } from './OrganicBackground';

export { DiagonalSection } from './DiagonalSection';
export type { DiagonalSectionProps } from './DiagonalSection';

// Gamification Components
export { XPBar } from './XPBar';
export type { XPBarProps } from './XPBar';

export { StreakBadge } from './StreakBadge';
export type { StreakBadgeProps } from './StreakBadge';

export { FloatingXP, useFloatingXP } from './FloatingXP';
export type { FloatingXPProps } from './FloatingXP';

export { FloatingPnL, useFloatingPnL } from './FloatingPnL';
export type { FloatingPnLProps } from './FloatingPnL';
