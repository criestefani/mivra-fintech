import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

export interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variant of the neon button */
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show pulsing glow animation */
  glow?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Icon to display before text */
  icon?: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-electric-blue text-white border-electric-blue hover:bg-electric-blue-600',
  secondary: 'bg-golden-amber text-deep-space border-golden-amber hover:bg-golden-amber-600',
  success: 'bg-profit-green text-white border-profit-green hover:bg-profit-green-600',
  danger: 'bg-loss-red text-white border-loss-red hover:bg-loss-red-600',
  ghost: 'bg-transparent text-white border-white/30 hover:bg-white/10',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

const glowAnimations = {
  primary: 'shadow-[0_0_20px_rgba(14,165,233,0.7)]',
  secondary: 'shadow-[0_0_20px_rgba(245,158,11,0.7)]',
  success: 'shadow-[0_0_20px_rgba(16,185,129,0.7)]',
  danger: 'shadow-[0_0_20px_rgba(239,68,68,0.7)]',
  ghost: 'shadow-[0_0_20px_rgba(255,255,255,0.3)]',
};

/**
 * NeonButton - Button component with neon glow and particle effects
 *
 * Part of the "Cyber Trading Arena" design system
 * Implements futuristic button with hover effects and optional animations
 *
 * @example
 * ```tsx
 * <NeonButton variant="secondary" glow icon="💎">
 *   Depositar
 * </NeonButton>
 * ```
 */
export const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    glow = false,
    loading = false,
    icon,
    children,
    disabled,
    ...props
  }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          // Base styles
          'relative',
          'inline-flex items-center justify-center gap-2',
          'rounded-lg border-2',
          'font-medium',
          'transition-all duration-300',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Variant styles
          variantStyles[variant],
          // Size styles
          sizeStyles[size],
          // Glow animation
          glow && !disabled && glowAnimations[variant],
          glow && !disabled && 'animate-pulse-glow',
          className
        )}
        whileHover={!disabled ? { scale: 1.05 } : undefined}
        whileTap={!disabled ? { scale: 0.95 } : undefined}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <motion.div
            className="h-5 w-5 rounded-full border-2 border-current border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          <>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
          </>
        )}
      </motion.button>
    );
  }
);

NeonButton.displayName = 'NeonButton';
