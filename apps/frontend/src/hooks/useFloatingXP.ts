/**
 * useFloatingXP Hook
 * Manages floating +XP notifications
 */

import { useState, useCallback } from 'react';

export interface FloatingXPInstance {
  id: string;
  amount: number;
  x: number;
  y: number;
}

/**
 * Hook to manage floating XP instances
 * Used to show +XP notifications that float up and fade
 */
export function useFloatingXP() {
  const [xpInstances, setXPInstances] = useState<FloatingXPInstance[]>([]);

  /**
   * Show a floating XP notification
   * @param amount - XP amount to display
   * @param x - X position (default: random near center)
   * @param y - Y position (default: random near center)
   */
  const showXP = useCallback((amount: number, x?: number, y?: number) => {
    const id = `xp-${Date.now()}-${Math.random()}`;

    // Default position: random near center of screen
    const finalX = x !== undefined ? x : window.innerWidth / 2 + (Math.random() - 0.5) * 100;
    const finalY = y !== undefined ? y : window.innerHeight / 2 + (Math.random() - 0.5) * 100;

    const newInstance: FloatingXPInstance = {
      id,
      amount,
      x: finalX,
      y: finalY,
    };

    setXPInstances((prev) => [...prev, newInstance]);

    // Auto-remove after animation (1.5s)
    setTimeout(() => {
      removeXP(id);
    }, 1500);
  }, []);

  /**
   * Remove a specific XP instance
   */
  const removeXP = useCallback((id: string) => {
    setXPInstances((prev) => prev.filter((instance) => instance.id !== id));
  }, []);

  /**
   * Clear all XP instances
   */
  const clearAll = useCallback(() => {
    setXPInstances([]);
  }, []);

  return {
    xpInstances,
    showXP,
    removeXP,
    clearAll,
  };
}

/**
 * Hook to show XP near a specific element
 * Useful for showing XP near buttons or cards
 */
export function useFloatingXPNearElement() {
  const { showXP, xpInstances, clearAll } = useFloatingXP();

  /**
   * Show XP near a DOM element
   */
  const showXPNearElement = useCallback(
    (amount: number, elementId: string) => {
      const element = document.getElementById(elementId);
      if (!element) {
        // Fallback to center if element not found
        showXP(amount);
        return;
      }

      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      showXP(amount, x, y);
    },
    [showXP]
  );

  /**
   * Show XP near mouse cursor
   */
  const showXPNearCursor = useCallback(
    (amount: number, event: React.MouseEvent) => {
      const x = event.clientX;
      const y = event.clientY;
      showXP(amount, x, y);
    },
    [showXP]
  );

  return {
    xpInstances,
    showXP,
    showXPNearElement,
    showXPNearCursor,
    clearAll,
  };
}
