import { useCallback, useRef, useState } from 'react'

function usesViewportPractice({ userAgent, platform, maxTouchPoints }) {
  // iPadOS can identify itself as a Mac when it requests desktop sites.
  return /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
}

export default function QuantsSmurfs({ onBack }) {
  const frameRef = useRef(null)
  const [viewportFallback, setViewportFallback] = useState(false)

  const handleLoad = useCallback(() => {
    const frame = frameRef.current
    const win = frame?.contentWindow
    const doc = frame?.contentDocument
    if (!doc || !win) return

    const main = doc.querySelector('#main')
    if (!main) return

    const practiceIsRunning = () => main.classList.contains('practicepage') && win.session?.()?.state === 'running'
    const prefersViewport = usesViewportPractice(win.navigator)
    let nativeFullscreen = false
    let starting = false

    const leavePracticeView = () => {
      nativeFullscreen = false
      if (doc.fullscreenElement) doc.exitFullscreen().catch(() => {})
      setViewportFallback(false)
    }

    const onFullscreenChange = () => {
      if (!nativeFullscreen || doc.fullscreenElement) return
      nativeFullscreen = false
      if (practiceIsRunning()) {
        win.markPaused?.('Fullscreen exited. Your work is saved. Resume when ready.')
      }
    }

    const handlePracticeControl = async (event) => {
      const control = event.target.closest?.('[data-action]')
      const action = control?.dataset.action
      if (control?.disabled || (action !== 'start' && action !== 'resume-session')) return

      // Capture in the iframe before its original click handler starts the timer.
      event.preventDefault()
      event.stopImmediatePropagation()
      if (starting) return
      starting = true
      try {
        if (!prefersViewport && !doc.fullscreenElement && doc.documentElement.requestFullscreen) {
          try {
            await doc.documentElement.requestFullscreen({ navigationUI: 'hide' })
          } catch {
            // An unavailable fullscreen request should still allow Start and Resume.
          }
        }
        if (frameRef.current !== frame || frame.contentDocument !== doc) return
        nativeFullscreen = Boolean(doc.fullscreenElement)
        setViewportFallback(!nativeFullscreen)
        win.doAction?.(action, control)
      } finally {
        if (frameRef.current === frame && frame.contentDocument === doc && !practiceIsRunning()) {
          leavePracticeView()
        }
        starting = false
      }
    }

    const watchPractice = new MutationObserver(() => {
      if (!starting && !practiceIsRunning()) leavePracticeView()
    })
    watchPractice.observe(main, { childList: true, attributes: true, attributeFilter: ['class'] })

    doc.addEventListener('click', handlePracticeControl, true)
    doc.addEventListener('fullscreenchange', onFullscreenChange)
    // The iframe is recreated when navigating away; all listeners die with it.
  }, [])

  const returnToRoar = () => {
    const win = frameRef.current?.contentWindow
    const doc = frameRef.current?.contentDocument
    if (win?.session?.()?.state === 'running') win.markPaused?.('Paused to return to ROAR.')
    if (doc?.fullscreenElement) doc.exitFullscreen().catch(() => {})
    onBack?.()
  }

  return (
    <section
      aria-label="Quants Smurfs — CAT Quant PYQ practice"
      className={viewportFallback ? 'quants-smurfs-shell full-viewport' : 'quants-smurfs-shell'}
    >
      <style>{`
        .quants-smurfs-shell {
          height: 100%; min-height: 0; width: 100%; display: flex; flex-direction: column;
          overflow: hidden; border-radius: 18px; background: #f7f7f3;
        }
        .quants-smurfs-shell.full-viewport {
          position: fixed; inset: 0; z-index: 9999; height: 100dvh; width: 100vw;
          border-radius: 0; padding: 0;
        }
        .quants-smurfs-bar {
          height: 48px; min-height: 48px; display: flex; align-items: center;
          justify-content: space-between; gap: 14px; padding: 0 18px;
          background: #fffefa; border-bottom: 1px solid #e2e8db;
          color: #3a4d31; font: 600 13px/1.3 system-ui,sans-serif;
        }
        .quants-smurfs-back {
          border-radius: 999px; border: 1px solid #dbe3d3; padding: 7px 13px;
          background: #f2f6ed; color: #496a3d; cursor: pointer; font-weight: 700;
        }
        .quants-smurfs-back:hover { background: #e5f0df; }
        .quants-smurfs-shell > iframe { flex: 1; min-height: 0; width: 100%; display: block; border: 0; background: #f7f7f3; }
      `}</style>
      <div className="quants-smurfs-bar">
        <button type="button" className="quants-smurfs-back" onClick={returnToRoar} aria-label="Return to ROAR in VARC">
          ← Return to ROAR
        </button>
        <span>QUANTS SMURFS · CAT 2021–2025</span>
      </div>
      <iframe
        ref={frameRef}
        title="Quants Smurfs practice studio"
        src="/quants-smurfs/index.html?embedded=1"
        loading="eager"
        allow="fullscreen; clipboard-write"
        allowFullScreen
        onLoad={handleLoad}
      />
    </section>
  )
}
