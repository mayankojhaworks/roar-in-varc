import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * The 330-question engine is deliberately left unchanged.
 * We attach a same-origin fullscreen gate to its Start / Resume controls so a
 * user gesture grants fullscreen BEFORE the question timer can run.
 */
export default function QuantsSmurfs({ onBack }) {
  const frameRef = useRef(null)
  const [viewportFallback, setViewportFallback] = useState(false)
  const [loadStatus, setLoadStatus] = useState('loading')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (loadStatus !== 'loading') return
    const timer = setTimeout(() => setLoadStatus('error'), 12000)
    return () => clearTimeout(timer)
  }, [loadStatus, retry])

  const retryLoad = () => {
    setLoadStatus('loading')
    setRetry(n => n + 1)
  }

  const handleLoad = useCallback(() => {
    const frame = frameRef.current
    const win = frame?.contentWindow
    const doc = frame?.contentDocument
    if (!doc || !win) {
      setLoadStatus('error')
      return
    }
    // An iframe may report loaded even if its own script never rendered the app.
    const isRendered = () => Boolean(doc.querySelector('#main')?.textContent?.trim())
    if (!isRendered()) {
      setTimeout(() => {
        if (frameRef.current !== frame) return
        setLoadStatus(isRendered() ? 'ready' : 'error')
      }, 600)
    } else {
      setLoadStatus('ready')
    }

    const inPractice = () => doc.querySelector('#main')?.classList.contains('practicepage')
    const pauseIfRunning = () => {
      if (win.session?.()?.state === 'running' && inPractice()) {
        win.markPaused?.('Fullscreen exited. Your work is saved. Resume when ready.')
      }
    }

    const stopFallback = () => {
      setViewportFallback(false)
      doc.documentElement.classList.remove('smurfs-view-fullscreen')
    }

    const onFullscreenChange = () => {
      if (!doc.fullscreenElement) pauseIfRunning()
    }

    const handlePracticeControl = async (event) => {
      const control = event.target.closest?.('[data-action]')
      const action = control?.dataset.action
      if (!control || control.disabled) return
      if (action === 'start' || action === 'resume-session') {
        // Capture in the iframe before its original click handler starts the timer.
        event.preventDefault()
        event.stopImmediatePropagation()
        if (frame.dataset.fullscreenBusy === '1') return
        frame.dataset.fullscreenBusy = '1'
        try {
          if (!doc.fullscreenElement) {
            if (doc.documentElement.requestFullscreen) {
              await doc.documentElement.requestFullscreen({ navigationUI: 'hide' })
            } else {
              // iOS/Safari versions without the element Fullscreen API.
              doc.documentElement.classList.add('smurfs-view-fullscreen')
              setViewportFallback(true)
            }
          }
          win.doAction?.(action, control)
          if (win.session?.()?.state !== 'running' || !inPractice()) {
            if (doc.fullscreenElement) await doc.exitFullscreen()
            stopFallback()
          }
        } catch {
          // If permission was denied, do not begin the session or its timer.
          win.notify?.('Fullscreen was blocked. Please allow fullscreen to start practice.')
        } finally {
          frame.dataset.fullscreenBusy = '0'
        }
        return
      }

      if (['pause-session', 'end-session', 'nav'].includes(action)) {
        // The underlying app handles confirmation, persistence and navigation.
        queueMicrotask(() => {
          if (!inPractice() || win.session?.()?.state !== 'running') {
            if (doc.fullscreenElement) doc.exitFullscreen().catch(() => {})
            stopFallback()
          }
        })
      }
    }

    const main = doc.querySelector('#main')
    const watchResult = new MutationObserver(() => {
      if (!inPractice()) {
        if (doc.fullscreenElement) doc.exitFullscreen().catch(() => {})
        stopFallback()
      }
    })
    if (main) watchResult.observe(main, { attributes: true, attributeFilter: ['class'] })

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
        .quants-smurfs-stage { flex: 1; min-height: 0; position: relative; }
        .quants-smurfs-stage > iframe { height: 100%; width: 100%; display: block; border: 0; background: #f7f7f3; }
        .quants-smurfs-status {
          position: absolute; inset: 0; background: #f7f7f3; display: flex;
          flex-direction: column; align-items: center; justify-content: center;
          padding: 28px; text-align: center; gap: 12px; font: 14px/1.5 system-ui,sans-serif; color: #4e5e47;
        }
        .quants-smurfs-status h2 { font: 700 21px/1.2 system-ui,sans-serif; color: #293126; margin: 0; }
        .quants-smurfs-status p { max-width: 480px; margin: 0; color: #69776b; }
        .quants-smurfs-actions { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin-top:8px; }
        .quants-smurfs-actions button, .quants-smurfs-actions a {
          border: 1px solid #d5dfd1; background: white; color: #496a3d;
          border-radius: 12px; font-weight: 700; padding: 10px 15px; text-decoration:none; cursor:pointer;
        }
        .quants-smurfs-actions button { background: #698854; border-color: #698854; color: #fff; }
      `}</style>
      <div className="quants-smurfs-bar">
        <button type="button" className="quants-smurfs-back" onClick={returnToRoar} aria-label="Return to ROAR in VARC">
          ← Return to ROAR
        </button>
        <span>QUANTS SMURFS · CAT 2021–2025</span>
      </div>
      <div className="quants-smurfs-stage">
        <iframe
          key={retry}
          ref={frameRef}
          title="Quants Smurfs practice studio"
          src={'/quants-smurfs/index.html?embedded=1&shell=20261114&retry=' + retry}
          loading="eager"
          allow="fullscreen; clipboard-write"
          allowFullScreen
          onLoad={handleLoad}
          onError={() => setLoadStatus('error')}
          style={{ visibility: loadStatus === 'ready' ? 'visible' : 'hidden' }}
        />
        {loadStatus !== 'ready' && (
          <div className="quants-smurfs-status" role="status" aria-live="polite">
            {loadStatus === 'loading' ? (
              <>
                <h2>Loading Quants Smurfs…</h2>
                <p>Opening your question bank and practice setup.</p>
              </>
            ) : (
              <>
                <h2>The practice workspace did not load</h2>
                <p>The ROAR shell is working, but the embedded question page could not initialize. Your existing saved progress has not been cleared.</p>
                <div className="quants-smurfs-actions">
                  <button type="button" onClick={retryLoad}>Try again</button>
                  <a href="/quants-smurfs/index.html" target="_blank" rel="noopener noreferrer">Open directly</a>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
