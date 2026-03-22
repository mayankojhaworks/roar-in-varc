import CountdownPill from './CountdownPill'
import { APP_TITLE, CAT_TARGET_DATE } from '../utils/constants'

export default function GlobalHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="grid gap-4 lg:grid-cols-[1.6fr_0.6fr]">
          <div className="rounded-[28px] border border-zinc-800 bg-zinc-900/80 px-5 py-5">
            <h1 className="text-2xl font-black tracking-[0.08em] text-zinc-100 sm:text-3xl">
              {APP_TITLE}
            </h1>
          </div>

          <div>
            <CountdownPill label="CAT 2026 • 22 Nov 2026" date={CAT_TARGET_DATE} />
          </div>
        </div>
      </div>
    </header>
  )
}