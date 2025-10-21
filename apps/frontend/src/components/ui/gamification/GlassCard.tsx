import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../../lib/utils';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Variant of the glass card */
  variant?: 'default' | 'amber' | 'blue' | 'green' | 'red';
  /** Intensity of the blur effect */
  blurIntensity?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show golden glow */
  withGlow?: boolean;
}

const variantStyles = {
  default: 'border-golden-amber/30',
  amber: 'border-golden-amber/50',
  blue: 'border-electric-blue/50',
  green: 'border-profit-green/50',
  red: 'border-loss-red/50',
};

const glowStyles = {
  default: 'shadow-[0_0_20px_rgba(245,158,11,0.5)]',
  amber: 'shadow-[0_0_20px_rgba(245,158,11,0.7)]',
  blue: 'shadow-[0_0_20px_rgba(14,165,233,0.7)]',
  green: 'shadow-[0_0_20px_rgba(16,185,129,0.7)]',
  red: 'shadow-[0_0_20px_rgba(239,68,68,0.7)]',
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
