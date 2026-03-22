export default function StatCard({ label, value, accent = 'default', subtext }) {
    const accentClass =
      accent === 'blue'
        ? 'text-sky-300'
        : accent === 'green'
        ? 'text-emerald-400'
        : accent === 'red'
        ? 'text-red-300'
        : 'text-zinc-100'
  
    return (
      <div className="rounded-[24px] border border-zinc-800 bg-zinc-900/70 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
          {label}
        </p>
        <p className={`mt-3 text-3xl font-black ${accentClass}`}>{value}</p>
        {subtext ? <p className="mt-2 text-sm text-zinc-400">{subtext}</p> : null}
      </div>
    )
  }