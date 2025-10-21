import { forwardRef } from 'react';
import { NeonButton, NeonButtonProps } from './NeonButton';

export interface WithdrawButtonProps extends Omit<NeonButtonProps, 'variant' | 'icon'> {
  /** Override default icon */
  customIcon?: React.ReactNode;
}

/**
 * WithdrawButton - Specialized button for broker withdrawals
 *
 * Ghost variant to be less prominent than deposit button
 * Placed next to deposit button but visually secondary
 *
 * @example
 * ```tsx
 * <WithdrawButton onClick={() => openWithdrawModal()}>
 *   Sacar
 * </WithdrawButton>
 * ```
 */
export const WithdrawButton = forwardRef<HTMLButtonElement, WithdrawButtonProps>(
  ({ children = 'Sacar', customIcon, ...props }, ref) => {
    return (
      <NeonButton
        ref={ref}
        variant="ghost"
        icon={customIcon || '💰'}
        {...props}
      >
        {children}
      </NeonButton>
    );
  }
);

WithdrawButton.displayName = 'WithdrawButton';
