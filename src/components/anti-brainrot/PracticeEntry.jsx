import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function PracticeEntry({ drill, onEnter, onFinish }) {
  const callbacks = useRef({ onEnter, onFinish })
  const surface = useRef(null)

  useEffect(() => { callbacks.current = { onEnter, onFinish } }, [onEnter, onFinish])

  useEffect(() => {
    surface.current?.focus({ preventScroll: true })
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const enterTimer = setTimeout(() => callbacks.current.onEnter(), reducedMotion ? 80 : 1100)
    const finishTimer = setTimeout(() => callbacks.current.onFinish(), reducedMotion ? 200 : 2200)
    return () => { clearTimeout(enterTimer); clearTimeout(finishTimer) }
  }, [drill.id])

  const content = <div className="ab-entry" role="status" aria-live="polite" ref={surface} tabIndex={-1}>
    <span className="ab-entry-announcement">Entering isolated practice. Day {drill.day}, set {drill.number}.</span>
    <div className="ab-entry-scene" aria-hidden="true">
      <div className="ab-entry-grid" />
      <div className="ab-entry-orbit ab-entry-orbit-one" />
      <div className="ab-entry-orbit ab-entry-orbit-two" />
      <div className="ab-entry-tunnel">
        {Array.from({ length: 10 }, (_, index) => <div className="ab-entry-frame" style={{ '--i': index }} key={index}><span /><span /><span /><span /></div>)}
      </div>
      <div className="ab-entry-horizon" />
      <div className="ab-entry-copy">
        <div className="ab-entry-coordinate">ROAR IN VARC <span> / </span> ATTENTION SPACE</div>
        <div className="ab-entry-heading"><span>Leave the noise.</span><strong>Enter the argument.</strong></div>
        <div className="ab-entry-rule"><span /></div>
        <div className="ab-entry-destination">DAY {String(drill.day).padStart(2, '0')} <i /> SET {String(drill.number).padStart(2, '0')}</div>
      </div>
      <div className="ab-entry-corner ab-entry-corner-top">ONE PASSAGE<span>ONE FIELD OF ATTENTION</span></div>
      <div className="ab-entry-corner ab-entry-corner-bottom">{drill.title}<span>ISOLATED PRACTICE</span></div>
    </div>
  </div>

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content
}
