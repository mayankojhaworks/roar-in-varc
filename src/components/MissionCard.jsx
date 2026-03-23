export default function MissionCard({
    mission,
    stateLabel,
    isSelected,
    onSelect,
  }) {
    const [dayValue = '--', monthValue = ''] = String(mission.shortDate || '').split(' ')
  
    const stateClasses = {
      locked:
        'border-zinc-800 bg-[linear-gradient(180deg,rgba(18,18,22,0.9),rgba(12,12,16,0.9))] text-zinc-500 hover:border-zinc-700',
      active:
        'border-sky-400/70 bg-[linear-gradient(180deg,rgba(9,18,28,0.96),rgba(10,12,18,0.96))] text-zinc-100 shadow-[0_0_0_1px_rgba(56,189,248,0.12),0_20px_40px_rgba(2,8,23,0.34)]',
      missed:
        'border-red-900/70 bg-[linear-gradient(180deg,rgba(28,10,12,0.92),rgba(18,10,12,0.92))] text-zinc-100',
      completed:
        'border-emerald-500/55 bg-[linear-gradient(180deg,rgba(7,24,20,0.94),rgba(8,18,16,0.94))] text-zinc-100 shadow-[0_0_0_1px_rgba(16,185,129,0.1),0_18px_36px_rgba(6,18,15,0.26)]',
    }
  
    const footerText = {
      locked: 'Yet to come',
      active: 'Open today',
      missed: 'Pending review',
      completed: 'Completed',
    }
  
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`group relative min-h-[112px] overflow-hidden rounded-[22px] border p-3 text-left transition duration-300 hover:-translate-y-1 ${
          stateClasses[stateLabel]
        } ${isSelected ? 'ring-1 ring-sky-300 shadow-[0_0_0_1px_rgba(56,189,248,0.18),0_18px_40px_rgba(2,8,23,0.38)]' : ''}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.14),transparent_35%)] opacity-0 transition duration-300 group-hover:opacity-100" />
  
        <div className="relative flex h-full flex-col">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70">
              Day
            </p>
            <p className="mt-1 text-xl font-bold leading-none">{mission.dayNumber}</p>
          </div>
  
          <div className="mt-4">
            <p className="text-[2.5rem] font-black leading-none">{dayValue}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
              {monthValue}
            </p>
          </div>
  
          <div className="mt-auto pt-3">
            <span className="text-[9px] uppercase tracking-[0.14em] opacity-45">
              {footerText[stateLabel]}
            </span>
          </div>
        </div>
      </button>
    )
  }