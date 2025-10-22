/**
 * BadgesCollection Component
 * Displays all earned badges with filtering by category and rarity
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useBadges } from '../../../hooks/useGamification';
import { Badge as BadgeType } from '../../../stores/gamificationStore';
import { cn } from '@/shared/utils/cn';

const BADGE_CATEGORIES = ['volume', 'performance', 'behavior', 'social', 'special'];
const BADGE_RARITIES = ['common', 'rare', 'epic', 'legendary'];

const RARITY_COLORS = {
  common: 'from-slate-600 to-slate-700 border-slate-500',
  rare: 'from-blue-600 to-blue-700 border-blue-500',
  epic: 'from-purple-600 to-purple-700 border-purple-500',
  legendary: 'from-amber-600 to-amber-700 border-amber-500',
};

interface BadgesCollectionProps {
  userId: string | null;
  maxColumns?: number;
}

export function BadgesCollection({ userId, maxColumns = 4 }: BadgesCollectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);

  const { badges, badgesByCategory, badgesByRarity, totalBadges, isLoading, error } = useBadges(
    userId
  );

  // Filter badges based on selection
  const filteredBadges = useMemo(() => {
    return badges.filter((badge) => {
      if (selectedCategory && badge.badge_category !== selectedCategory) return false;
      if (selectedRarity && badge.badge_rarity !== selectedRarity) return false;
      return true;
    });
  }, [badges, selectedCategory, selectedRarity]);

  // Get stats for display
  const stats = useMemo(
    () => ({
      total: totalBadges,
      byRarity: Object.fromEntries(
        BADGE_RARITIES.map((rarity) => [rarity, badgesByRarity[rarity]?.length || 0])
      ),
    }),
    [totalBadges, badgesByRarity]
  );

  if (!userId) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-400">
        <p>Sign in to view your badges</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Badges & Conquistas</h2>
          <p className="text-sm text-slate-400 mt-1">
            {totalBadges} total • {stats.byRarity.legendary} legendários
          </p>
        </div>
      </div>

      {/* Stats by Rarity */}
      <div className="grid grid-cols-4 gap-2">
        {BADGE_RARITIES.map((rarity) => (
          <button
            key={rarity}
            onClick={() => setSelectedRarity(selectedRarity === rarity ? null : rarity)}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition-all',
              selectedRarity === rarity
                ? `bg-gradient-to-r ${RARITY_COLORS[rarity as keyof typeof RARITY_COLORS]} border text-white`
                : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-700/50'
            )}
          >
            <span className="capitalize">{rarity}</span>
            <span className="ml-1 text-xs opacity-75">({stats.byRarity[rarity]})</span>
          </button>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm transition-all',
            selectedCategory === null
              ? 'bg-primary/30 border border-primary text-primary'
              : 'bg-slate-800/30 border border-slate-700 text-slate-400 hover:bg-slate-700/30'
          )}
        >
          Todas
        </button>
        {BADGE_CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm transition-all',
              selectedCategory === category
                ? 'bg-primary/30 border border-primary text-primary'
                : 'bg-slate-800/30 border border-slate-700 text-slate-400 hover:bg-slate-700/30'
            )}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className={cn('grid gap-3',
        maxColumns === 2 && 'grid-cols-2',
        maxColumns === 3 && 'grid-cols-3',
        maxColumns === 4 && 'grid-cols-4',
        maxColumns === 5 && 'grid-cols-5',
        maxColumns === 6 && 'grid-cols-6'
      )}>
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center p-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredBadges.length === 0 ? (
          <div className="col-span-full flex items-center justify-center p-8 text-slate-400">
            <p>Nenhum badge encontrado nesta categoria</p>
          </div>
        ) : (
          filteredBadges.map((badge, index) => (
            <motion.button
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedBadge(badge)}
              className={cn(
                'p-4 rounded-lg border backdrop-blur-xl transition-all group relative overflow-hidden',
                `bg-gradient-to-br ${RARITY_COLORS[badge.badge_rarity as keyof typeof RARITY_COLORS]}`,
                'hover:shadow-lg hover:shadow-current hover:scale-105 active:scale-95'
              )}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Badge content */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="text-3xl">{badge.badge_icon || '🏆'}</div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white line-clamp-2">
                    {badge.badge_name}
                  </h3>
                  <p className="text-xs opacity-75 mt-1 text-white/70">
                    +{badge.xp_reward} XP
                  </p>
                </div>
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity" />
            </motion.button>
          ))
        )}
      </div>

      {/* Badge Details Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBadge(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'w-full max-w-sm p-6 rounded-xl border backdrop-blur-xl',
              `bg-gradient-to-br ${RARITY_COLORS[selectedBadge.badge_rarity as keyof typeof RARITY_COLORS]}`
            )}
          >
            {/* Badge icon */}
            <div className="text-6xl text-center mb-4">{selectedBadge.badge_icon || '🏆'}</div>

            {/* Badge name */}
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              {selectedBadge.badge_name}
            </h2>

            {/* Badge rarity */}
            <div className="text-center mb-4">
              <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-white/20 text-white">
                {selectedBadge.badge_rarity.toUpperCase()}
              </span>
            </div>

            {/* Badge details */}
            <div className="space-y-3 text-sm text-white/90">
              <div>
                <p className="text-white/70 mb-1">Categoria</p>
                <p className="font-medium">{selectedBadge.badge_category}</p>
              </div>

              <div>
                <p className="text-white/70 mb-1">Recompensa XP</p>
                <p className="font-medium">+{selectedBadge.xp_reward} XP</p>
              </div>

              <div>
                <p className="text-white/70 mb-1">Conquistado em</p>
                <p className="font-medium">
                  {new Date(selectedBadge.earned_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full mt-6 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium transition-colors"
            >
              Fechar
            </button>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BadgesCollection;
