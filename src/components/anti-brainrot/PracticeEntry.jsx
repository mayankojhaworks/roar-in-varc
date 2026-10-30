import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function PracticeEntry({ drill, onEnter, onFinish }) {
  const callbacks = useRef({ onEnter, onFinish })
  const surface = useRef(null)

  useEffect(() => { callbacks.current = { onEnter, onFinish } }, [onEnter, onFinish])

  useEffect(() => {
    surface.current?.focus({ preventScroll: true })
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const enterTimer = setTimeout(() => callbacks.current.onEnter(), reducedMotion ? 60 : 450)
    const finishTimer = setTimeout(() => callbacks.current.onFinish(), reducedMotion ? 140 : 1000)
    return () => { clearTimeout(enterTimer); clearTimeout(finishTimer) }
  }, [drill.id])

  const content = <div className="ab-entry" role="status" aria-live="polite" ref={surface} tabIndex={-1}>
    <span className="ab-entry-announcement">Entering isolated practice. Day {drill.day}, set {drill.number}.</span>
    <div className="ab-entry-scene" aria-hidden="true">
      <div className="ab-entry-sheet" />
      <div className="ab-entry-copy">
        <div className="ab-entry-coordinate">ROAR IN VARC <span> / </span> ANTI BRAINROT</div>
        <div className="ab-entry-heading">A little space to think.</div>
        <div className="ab-entry-destination">DAY {String(drill.day).padStart(2, '0')} <i /> SET {String(drill.number).padStart(2, '0')}</div>
      </div>
    </div>
  </div>

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content
}
