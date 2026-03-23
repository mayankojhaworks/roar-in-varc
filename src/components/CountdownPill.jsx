import { useCountdown } from '../hooks/useCountdown'

export default function CountdownPill({ label, date }) {
  const { days, hours, minutes, seconds } = useCountdown(date)

  return (
    <div className="rounded-[32px] border border-zinc-800 bg-[linear-gradient(135deg,rgba(10,10,12,0.96),rgba(19,24,34,0.88))] px-5 py-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-400">
        {label}
      </p>

      <div className="mt-5 flex items-end gap-3">
        <span className="text-5xl font-black leading-none text-sky-300">{days}</span>
        <span className="pb-1 text-xs uppercase tracking-[0.22em] text-zinc-500">days</span>
      </div>

      <p className="mt-4 text-sm tracking-[0.06em] text-zinc-300">
        {String(hours).padStart(2, '0')}h : {String(minutes).padStart(2, '0')}m :{' '}
        {String(seconds).padStart(2, '0')}s
      </p>
    </div>
  )
}