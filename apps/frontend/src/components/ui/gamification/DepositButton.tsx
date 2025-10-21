import { forwardRef } from 'react';
import { NeonButton, NeonButtonProps } from './NeonButton';

export interface DepositButtonProps extends Omit<NeonButtonProps, 'variant' | 'icon'> {
  /** Override default icon */
  customIcon?: React.ReactNode;
}

/**
 * DepositButton - Specialized button for broker deposits
 *
 * Critical component for conversion funnel
 * Always uses golden-amber color with glow effect
 *
 * @example
 * ```tsx
 * <DepositButton size="lg" onClick={() => openDepositModal()}>
 *   Depositar
 * </DepositButton>
 * ```
 */
export const DepositButton = forwardRef<HTMLButtonElement, DepositButtonProps>(
  ({ children = 'Depositar', customIcon, glow = true, ...props }, ref) => {
    return (
      <NeonButton
        ref={ref}
        variant="secondary"
        icon={customIcon || '💎'}
        glow={glow}
        {...props}
      >
        {children}
      </NeonButton>
    );
  }
);

DepositButton.displayName = 'DepositButton';
