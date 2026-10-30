import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import PracticeEntry from './PracticeEntry'
import { drills } from './drillData'
import { STORAGE_KEY, newAttempt, newBank, restoreBank, formatTime, scoreAttempt } from './attempt'
import './antiBrainrot.css'

function loadAttempt() {
  try { return restoreBank(localStorage.getItem(STORAGE_KEY), drills) } catch { return newBank(drills) }
}

export default function AntiBrainrot() {
  const [bank, setBank] = useState(loadAttempt)
  const drill = drills.find(item => item.id === bank.selectedId) || drills[0]
  const attempt = bank.attempts[drill.id] || newAttempt(drill.questions.length)
  const setAttempt = update => setBank(previous => {
    const current = previous.attempts[previous.selectedId] || newAttempt(drill.questions.length)
    return { ...previous, attempts: { ...previous.attempts, [previous.selectedId]: typeof update === 'function' ? update(current) : update } }
  })
  const [saveMessage, setSaveMessage] = useState('')
  const workspace = useRef(null)
  const title = useRef(null)
  const responsePane = useRef(null)
  const [mobileChoice, setMobileChoice] = useState(null)
  const [entering, setEntering] = useState(null)
  const { view, q, answers, notes, recall, seconds, hidden } = attempt
  const question = drill.questions[q]
  const score = scoreAttempt(answers, drill.questions)
  const reading = view === 'read'
  const reviewing = view === 'review'
  const inSession = view !== 'library'
  const mobilePanel = mobileChoice?.view === view && mobileChoice?.id === drill.id ? mobileChoice.panel : reading ? 'passage' : 'response'
  const patch = changes => setAttempt(previous => ({ ...previous, ...changes }))
  const completedDrills = drills.filter(item => bank.attempts[item.id]?.completed)
  const totalCorrect = completedDrills.reduce((sum, item) => sum + scoreAttempt(bank.attempts[item.id].answers, item.questions), 0)
  const totalAnswered = completedDrills.reduce((sum, item) => sum + item.questions.length, 0)
  const totalSeconds = drills.reduce((sum, item) => sum + (bank.attempts[item.id]?.seconds || 0), 0)
  const days = [...new Set(drills.map(item => item.day))].sort((a, b) => a - b)
  const lastQuestion = q === drill.questions.length - 1

  function openDrill(item) {
    setBank(previous => {
      const current = previous.attempts[item.id] || newAttempt(item.questions.length)
      return { ...previous, selectedId: item.id, attempts: { ...previous.attempts, [item.id]: { ...current, view: current.completed ? 'review' : current.answers.some(answer => answer !== null) ? 'questions' : 'read' } } }
    })
  }

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bank))
      setSaveMessage('Progress saved in this browser')
    } catch {
      setSaveMessage('Browser storage unavailable; progress will last only while this tab stays open.')
    }
  }, [bank])

  useEffect(() => {
    if (entering || !['read', 'questions'].includes(view)) return
    const timer = setInterval(() => {
      if (!document.hidden) setAttempt(previous => ({ ...previous, seconds: previous.seconds + 1 }))
    }, 1000)
    return () => clearInterval(timer)
  }, [view, entering])

  useEffect(() => {
    if (entering) return
    workspace.current?.scrollTo({ top: 0 })
    responsePane.current?.scrollTo({ top: 0 })
    title.current?.focus({ preventScroll: true })
  }, [view, q, drill.id, entering])

  useEffect(() => {
    if (!inSession && !entering) return
    const root = document.getElementById('root')
    const previousInert = root?.inert
    if (root) root.inert = true
    return () => { if (root) root.inert = previousInert }
  }, [inSession, entering])

  function selectAnswer(index) {
    patch({ answers: answers.map((answer, i) => i === q ? index : answer) })
  }

  function retry() {
    if (window.confirm('Start a new attempt? This replaces the saved attempt for this set only.')) {
      setAttempt({ ...newAttempt(drill.questions.length), view: 'read' })
    }
  }

  function renderReview() {
    return <>
      <div className="result"><div className="eyebrow">Drill complete</div><strong>{score} / {drill.questions.length}</strong><span className="muted"> correct · {formatTime(seconds)}</span></div>
      <div className="row"><h3 ref={title} tabIndex={-1}>Question {q + 1} review</h3><div className="question-nav">{drill.questions.map((_, index) => <button key={index} className={`btn ${index === q ? 'active-q' : ''}`} onClick={() => patch({ q: index })} aria-label={`Review question ${index + 1}`} aria-pressed={q === index}>{index + 1}</button>)}</div></div>
      <p className="question">{question.stem}</p>
      {question.options.map((option, index) => <div className="review-choice" key={option}><b>{'ABCD'[index]}.</b> {option} {index === question.key && <strong className="correct-label">✓ Correct</strong>}{answers[q] === index && <em> (your answer)</em>}</div>)}
      {question.solution.map(section => <div className="review-block" key={section.heading}>
        <h3>{section.heading}</h3>
        {section.paragraphs.map((text, index) => <p key={index}>{text}</p>)}
        {section.heading === 'The Task in One Line' && notes[q] && <details><summary>Your stem paraphrase</summary><p>{notes[q]}</p></details>}
      </div>)}
      {recall && <details className="original-note"><summary>Your original passage note</summary><p>{recall}</p></details>}
      <div className="actions"><button className="btn" onClick={retry}>Try set again</button></div>
    </>
  }

  const content = <section className={`anti-brainrot ${inSession ? 'ab-session' : 'ab-library'}`} ref={workspace} aria-label={inSession ? `Anti Brainrot, Day ${drill.day}, Set ${drill.number}` : 'Anti Brainrot'} role={inSession ? 'dialog' : 'region'} inert={inSession && entering ? true : undefined} aria-modal={inSession ? true : undefined} data-mobile-panel={mobilePanel}>
    <div className="main">
      {view === 'library' ? <>
        <div className="intro"><div><div className="eyebrow">Attention training / Retention Spike Drills</div><h1 ref={title} tabIndex={-1}>Anti Brainrot</h1><p>Keep the argument in mind. Keep the question in focus.</p></div><div className="note">Two questions.<br />A lot more than two details.</div></div>
        <div className="stats"><div className="stat island"><strong>{completedDrills.length} / {drills.length}</strong><span>Sets completed</span></div><div className="stat island"><strong>{totalAnswered ? `${totalCorrect}/${totalAnswered}` : '—'}</strong><span>Correct across completed sets</span></div><div className="stat island"><strong>{formatTime(totalSeconds)}</strong><span>Total practice time</span></div></div>
        <div className="library-layout"><section><div className="row desk-heading"><h3>Your drill desk</h3><span className="fine">{drills.length} sets · {days.length} days · 2 sets per day</span></div>
          {days.map(day => {
            const dayDrills = drills.filter(item => item.day === day)
            return <section className="day-section" key={day} aria-labelledby={`ab-day-${day}`}>
              <div className="row day-heading"><h2 id={`ab-day-${day}`}>Day {day}</h2><span className="fine">{dayDrills.filter(item => bank.attempts[item.id]?.completed).length} / {dayDrills.length} completed</span></div>
              <div className="day-drills">{dayDrills.map(item => {
                const progress = bank.attempts[item.id]
                return <article className="drill island" key={item.id}>
                  <div className="chips"><span className="chip purple">SET {String(item.number).padStart(2, '0')}</span><span className="chip">{item.topic}</span><span className="chip">{item.passage.join(' ').split(/\s+/).length} words · {item.questions.length} questions</span></div>
                  <h3>{item.title}</h3>
                  <div className="row drill-start"><span className="fine">{progress?.completed ? `Completed · ${scoreAttempt(progress.answers, item.questions)}/${item.questions.length} correct` : progress?.seconds || progress?.view && progress.view !== 'library' ? 'In progress' : 'Untimed · timer counts up'}</span><button className="btn primary" onClick={() => setEntering(item)}>{progress?.completed ? 'Review set' : progress?.seconds || progress?.view && progress.view !== 'library' ? 'Continue set' : 'Begin set'} →</button></div>
                </article>
              })}</div>
            </section>
          })}
        </section><aside className="aside island"><div className="eyebrow">The practice loop</div><h2>Stay with the logic.</h2><ol><li><b>Read the passage.</b><br />Track the claim, objection and refinement.</li><li><b>Decode the task.</b><br />Two questions, each with its own demands.</li><li><b>Review your reasoning.</b><br />Check the stem, passage logic and eliminations.</li></ol><p className="fine">Work through two sets each day. Your answers, notes and time are saved separately for every set.</p><p className="fine">Passage visibility is your choice. Use “Hide passage” when you want to practise holding its argument in mind.</p></aside></div>
      </> : <>
        <div className="workspace-head"><div className="session-identity"><span className="session-mark" aria-hidden="true">R</span><div><span className="session-brand">Anti Brainrot</span><span className="session-meta">Day {drill.day} <span aria-hidden="true">/</span> Set {String(drill.number).padStart(2, '0')}</span></div></div><div className="steps"><span className={reading ? 'current' : ''} aria-current={reading ? 'step' : undefined}>01 Read</span><span>→</span><span className={!reading && !reviewing ? 'current' : ''} aria-current={!reading && !reviewing ? 'step' : undefined}>02 Respond</span><span>→</span><span className={reviewing ? 'current' : ''} aria-current={reviewing ? 'step' : undefined}>03 Review</span></div><div className="session-tools"><div className="timer-block"><span>Time elapsed</span><div className="clock" aria-label="Practice time">{formatTime(seconds)}</div></div><button className="btn exit-session" onClick={() => patch({ view: 'library' })}>Exit set <span aria-hidden="true">↗</span></button></div></div>
        <div className="mobile-session-tabs" aria-label="Practice panels"><button className={mobilePanel === 'passage' ? 'selected' : ''} aria-pressed={mobilePanel === 'passage'} onClick={() => setMobileChoice({ view, id: drill.id, panel: 'passage' })}>Passage</button><button className={mobilePanel === 'response' ? 'selected' : ''} aria-pressed={mobilePanel === 'response'} onClick={() => setMobileChoice({ view, id: drill.id, panel: 'response' })}>{reading ? 'Notes & start' : reviewing ? 'Review' : `Question ${q + 1} / ${drill.questions.length}`}</button></div>
        <div className="work-grid"><section className="pane island passage-pane" aria-label="Reading passage"><div className="row"><div className="eyebrow">Day {drill.day} · Set {drill.number}</div><button className="text-btn" onClick={() => patch({ hidden: !hidden })} aria-expanded={!hidden} aria-controls="ab-passage">{hidden ? 'Show' : 'Hide'} passage</button></div><h2>{drill.title}</h2><div className="passage" id="ab-passage" hidden={hidden}>{drill.passage.map(text => <p key={text}>{text}</p>)}</div>{hidden && <div className="hide-note">Passage hidden.<br />Hold the argument in mind; reveal it whenever you need.</div>}</section>
          <section className="pane island response-pane" ref={responsePane} aria-label={reviewing ? 'Answer review' : reading ? 'Reading notes' : 'Questions'}>
            {reading ? <><div className="eyebrow">Before you begin</div><h2 ref={title} tabIndex={-1}>Read for the movement.</h2><p className="muted">Notice what the author accepts, what they reject, and how the final test differs from the one they began with.</p><label className="field" htmlFor="ab-recall">Optional: capture the argument in one sentence.</label><textarea id="ab-recall" value={recall} onChange={event => patch({ recall: event.target.value })} placeholder="The author moves from… to…" /><p className="fine">This is a private note, not an automatically graded answer.</p><div className="actions"><span /><button className="btn primary" onClick={() => patch({ view: 'questions' })}>Go to questions →</button></div></> : reviewing ? renderReview() : <>
              <div className="row"><div className="eyebrow" ref={title} tabIndex={-1}>Question {q + 1} of {drill.questions.length}</div><div className="question-nav">{drill.questions.map((_, index) => <button key={index} className={`btn ${q === index ? 'active-q' : ''}`} onClick={() => patch({ q: index })} aria-label={`Question ${index + 1}${answers[index] !== null ? ', answered' : ''}`} aria-pressed={q === index}>{index + 1}{answers[index] !== null ? ' •' : ''}</button>)}</div></div>
              <p className="question" id="ab-question">{question.stem}</p><div className="options" role="group" aria-labelledby="ab-question">{question.options.map((option, index) => <button key={option} className={`option ${answers[q] === index ? 'selected' : ''}`} onClick={() => selectAnswer(index)} aria-pressed={answers[q] === index}><span className="letter">{'ABCD'[index]}</span><span>{option}</span></button>)}</div>
              <details className="stem-note"><summary>Add a stem paraphrase <span className="muted">(optional)</span></summary><label className="field" htmlFor="ab-paraphrase">Optional: what exactly is this question asking you to do?</label><textarea id="ab-paraphrase" value={notes[q]} onChange={event => patch({ notes: notes.map((note, index) => index === q ? event.target.value : note) })} placeholder="In my own words…" /></details>
              <div className="actions"><button className="btn" onClick={() => patch(q ? { q: q - 1 } : { view: 'read' })}>{q ? `← Question ${q}` : '← Back to reading'}</button><button className="btn primary" disabled={lastQuestion && answers.some(answer => answer === null)} onClick={() => { if (!lastQuestion) patch({ q: q + 1 }); else if (answers.every(answer => answer !== null)) patch({ completed: true, view: 'review' }) }}>{lastQuestion ? 'Submit set' : `Question ${q + 2} →`}</button></div>{lastQuestion && answers.some(answer => answer === null) && <p className="fine">Choose one answer for each question to submit this set.</p>}
            </>}
          </section></div>
      </>}
      <div className="session-bottom"><p className="saved" role="status">{saveMessage}.</p>{inSession && <span className="session-bottom-note">{reviewing ? 'Review your reasoning at your own pace' : 'Untimed practice · focus on the reasoning'}</span>}</div>
      <footer className="footer">Read closely. Hold the logic. Stay with the question.</footer>
    </div>
  </section>

  const surface = inSession && typeof document !== 'undefined' ? createPortal(content, document.body) : content
  return <>{surface}{entering && <PracticeEntry drill={entering} onEnter={() => openDrill(entering)} onFinish={() => setEntering(null)} />}</>
}
