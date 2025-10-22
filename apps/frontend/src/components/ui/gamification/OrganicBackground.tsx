import { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';

export interface OrganicBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of blobs to render */
  blobCount?: number;
  /** Colors for the blobs */
  colors?: string[];
  /** Animation speed multiplier */
  speed?: number;
}

/**
 * OrganicBackground - Animated SVG blobs for fluid backgrounds
 *
 * Creates morphing organic shapes that float across the background
 * Inspired by Persona 5 and Cyberpunk 2077 fluid aesthetics
 *
 * @example
 * ```tsx
 * <OrganicBackground colors={['#0EA5E9', '#F59E0B']} blobCount={3} />
 * ```
 */
export function OrganicBackground({
  className,
  blobCount = 3,
  colors = ['#0EA5E9', '#F59E0B', '#10B981'],
  speed = 1,
  ...props
}: OrganicBackgroundProps) {
  return (
    <div
      className={cn('fixed inset-0 z-0 overflow-hidden pointer-events-none', className)}
      {...props}
    >
      {/* Gradient mesh background */}
      <div className="absolute inset-0 bg-gradient-to-br from-deep-space via-deep-space/95 to-deep-space" />

      {/* Animated blobs */}
      {Array.from({ length: blobCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            background: colors[i % colors.length],
            width: `${300 + i * 50}px`,
            height: `${300 + i * 50}px`,
            mixBlendMode: 'screen',
            opacity: 0.02,
          }}
          animate={{
            x: [
              `${-20 + i * 30}%`,
              `${80 - i * 20}%`,
              `${-20 + i * 30}%`,
            ],
            y: [
              `${-10 + i * 20}%`,
              `${90 - i * 30}%`,
              `${-10 + i * 20}%`,
            ],
            scale: [1, 1.2, 0.8, 1],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            duration: (20 + i * 5) / speed,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Noise overlay for texture */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
          backgroundSize: 'cover',
          backgroundRepeat: 'repeat',
        }}
      />
    </div>
  );
}
