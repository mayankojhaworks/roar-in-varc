import { useCountdown } from '../hooks/useCountdown'

export default function CountdownPill({ label, date }) {
  const { days, hours, minutes, seconds } = useCountdown(date)

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 px-4 py-3 shadow-[0_0_0_1px_rgba(39,39,42,0.2)]">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
        {label}
      </p>

      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-sky-400">{days}</span>
        <span className="pb-1 text-xs uppercase tracking-[0.22em] text-zinc-500">days</span>
      </div>

      <p className="mt-2 text-sm text-zinc-300">
        {String(hours).padStart(2, '0')}h : {String(minutes).padStart(2, '0')}m :{' '}
        {String(seconds).padStart(2, '0')}s
      </p>
    </div>
  )
}