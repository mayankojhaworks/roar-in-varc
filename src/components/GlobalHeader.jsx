import CountdownPill from './CountdownPill'
import { APP_TITLE, CAT_TARGET_DATE, HEADER_CTA_HREF } from '../utils/constants'

export default function GlobalHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-900/80 bg-[#050608]/96 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
          <div className="rounded-[32px] border border-zinc-800 bg-[linear-gradient(135deg,rgba(10,10,12,0.96),rgba(19,24,34,0.88))] px-6 py-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
            <h1 className="text-2xl font-black tracking-[0.08em] text-zinc-50 sm:text-3xl">
              {APP_TITLE}
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
  A focused prep dashboard for daily reading, practice, mock analysis, and review.
</p>

            <a
              href={HEADER_CTA_HREF}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center rounded-full border border-sky-400/30 bg-sky-400/8 px-4 py-2 text-sm font-semibold text-sky-300 transition duration-200 hover:-translate-y-0.5 hover:border-sky-300/50 hover:bg-sky-400/12"
            >
              Connect with me on LinkedIn
            </a>
          </div>

          <CountdownPill label="CAT 2026 • 29 Nov 2026" date={CAT_TARGET_DATE} />
        </div>
      </div>
    </header>
  )
}