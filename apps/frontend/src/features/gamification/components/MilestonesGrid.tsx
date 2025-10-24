import { MilestoneCard } from './MilestoneCard';
import type { Milestone } from '../hooks/useUserProfile';

interface MilestonesGridProps {
  milestones: Milestone[];
  isLoading?: boolean;
}

export function MilestonesGrid({ milestones, isLoading }: MilestonesGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 lg:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 md:p-4 lg:p-6 animate-pulse"
          >
            <div className="w-12 h-12 bg-slate-700 rounded mb-4" />
            <div className="h-4 bg-slate-700 rounded w-full mb-2" />
            <div className="h-3 bg-slate-800 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 lg:gap-4">
      {milestones.map((milestone, index) => (
        <MilestoneCard
          key={milestone.id}
          milestone={milestone}
          index={index}
        />
      ))}
    </div>
  );
}
