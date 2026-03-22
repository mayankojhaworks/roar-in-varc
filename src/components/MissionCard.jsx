export default function MissionCard({
    mission,
    stateLabel,
    isSelected,
    onSelect,
  }) {
    const stateClasses = {
      locked: 'border-zinc-800 bg-zinc-900/70 text-zinc-500',
      active: 'border-sky-400 bg-zinc-950 text-zinc-100',
      missed: 'border-red-900 bg-red-950/90 text-zinc-100',
      completed: 'border-emerald-500 bg-emerald-500/20 text-zinc-100',
    }
  
    const stateText = {
      locked: 'Locked',
      active: 'Active',
      missed: 'Missed',
      completed: 'Completed',
    }
  
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`rounded-2xl border p-3 text-left transition hover:translate-y-[-1px] ${
          stateClasses[stateLabel]
        } ${isSelected ? 'ring-1 ring-sky-400' : ''}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] opacity-70">
              Day {mission.dayNumber}
            </p>
            <p className="mt-2 text-base font-bold">{mission.shortDate}</p>
          </div>
  
          <span className="rounded-full border border-current/20 px-2 py-1 text-[10px] uppercase tracking-[0.18em]">
            {stateText[stateLabel]}
          </span>
        </div>
      </button>
    )
  }