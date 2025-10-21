import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/utils/cn';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Variant of the glass card */
  variant?: 'default' | 'amber' | 'blue' | 'green' | 'red';
  /** Intensity of the blur effect */
  blurIntensity?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show golden glow */
  withGlow?: boolean;
}

const variantStyles = {
  default: 'border-warning/30',
  amber: 'border-warning/50',
  blue: 'border-primary/50',
  green: 'border-positive/50',
  red: 'border-negative/50',
};

const glowStyles = {
  default: 'shadow-[0_0_20px_rgba(245,166,35,0.5)]',
  amber: 'shadow-[0_0_20px_rgba(245,166,35,0.7)]',
  blue: 'shadow-[0_0_20px_rgba(255,140,26,0.7)]',
  green: 'shadow-[0_0_20px_rgba(16,185,129,0.7)]',
  red: 'shadow-[0_0_20px_rgba(235,47,47,0.7)]',
};

const blurIntensities = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
};

/**
 * GlassCard - Glassmorphism card component with golden glow effect
 *
 * Part of the "Cyber Trading Arena" design system
 * Implements frosted glass effect with backdrop-filter blur and neon glow
 *
 * @example
 * ```tsx
 * <GlassCard variant="amber" withGlow>
 *   <h3>Trading Stats</h3>
 *   <p>Win Rate: 85%</p>
 * </GlassCard>
 * ```
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({
    className,
    variant = 'default',
    blurIntensity = 'lg',
    withGlow = false,
    children,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'rounded-3xl border',
          'bg-deep-space/70',
          'shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]',
          // Backdrop blur
          blurIntensities[blurIntensity],
          // Variant border
          variantStyles[variant],
          // Glow effect
          withGlow && glowStyles[variant],
          // Transitions
          'transition-all duration-300',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
