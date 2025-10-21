import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export interface DiagonalSectionProps extends HTMLAttributes<HTMLDivElement> {
  /** Direction of the diagonal */
  direction?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Background gradient colors */
  gradientFrom?: string;
  /** Whether to invert the diagonal */
  inverted?: boolean;
  /** Content to render */
  children: ReactNode;
}

const clipPaths = {
  'top-left': 'polygon(0 0, 100% 0, 100% 80%, 0 100%)',
  'top-right': 'polygon(0 0, 100% 0, 100% 100%, 0 80%)',
  'bottom-left': 'polygon(0 0, 100% 20%, 100% 100%, 0 100%)',
  'bottom-right': 'polygon(0 20%, 100% 0, 100% 100%, 0 100%)',
};

/**
 * DiagonalSection - Persona 5-inspired diagonal layouts
 *
 * Creates non-conventional diagonal divisions with illuminated content areas
 * Adds visual dynamism and breaks traditional grid layouts
 *
 * @example
 * ```tsx
 * <DiagonalSection direction="top-left" gradientFrom="from-purple-600/20">
 *   <h2>Your Stats</h2>
 *   <p>Content always in the illuminated area</p>
 * </DiagonalSection>
 * ```
 */
export function DiagonalSection({
  className,
  direction = 'top-left',
  gradientFrom = 'from-primary/10',
  inverted = false,
  children,
  ...props
}: DiagonalSectionProps) {
  return (
    <div className={cn('relative overflow-hidden', className)} {...props}>
      {/* Diagonal background */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br via-transparent',
          gradientFrom
        )}
        style={{
          clipPath: clipPaths[direction],
          transform: inverted ? 'scaleX(-1)' : undefined,
        }}
      />

      {/* Content area - always readable */}
      <div className="relative z-10 p-8">{children}</div>
    </div>
  );
}
