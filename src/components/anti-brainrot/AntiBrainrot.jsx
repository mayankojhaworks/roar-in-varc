import { useEffect, useRef, useState } from 'react'
import { drill } from './drillData'
import { STORAGE_KEY, newAttempt, restoreAttempt, formatTime, scoreAttempt } from './attempt'
import './antiBrainrot.css'

function loadAttempt() {
  try { return restoreAttempt(localStorage.getItem(STORAGE_KEY)) } catch { return newAttempt() }
}

export default function AntiBrainrot() {
  const [attempt, setAttempt] = useState(loadAttempt)
  const [saveMessage, setSaveMessage] = useState('')
  const workspace = useRef(null)
  const title = useRef(null)
  const { view, q, answers, notes, recall, seconds, completed, hidden } = attempt
  const question = drill.questions[q]
  const score = scoreAttempt(answers, drill.questions)
  const reading = view === 'read'
  const reviewing = view === 'review'
  const patch = changes => setAttempt(previous => ({ ...previous, ...changes }))

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt))
      setSaveMessage('Progress saved in this browser')
    } catch {
      setSaveMessage('Browser storage unavailable; progress will last only while this tab stays open.')
    }
  }, [attempt])

  useEffect(() => {
    if (!['read', 'questions'].includes(view)) return
    const timer = setInterval(() => {
      if (!document.hidden) setAttempt(previous => ({ ...previous, seconds: previous.seconds + 1 }))
    }, 1000)
    return () => clearInterval(timer)
  }, [view])

  useEffect(() => {
    workspace.current?.scrollTo({ top: 0 })
    title.current?.focus({ preventScroll: true })
  }, [view, q])

  function selectAnswer(index) {
    patch({ answers: answers.map((answer, i) => i === q ? index : answer) })
  }

  function retry() {
    if (window.confirm('Start a new attempt? This replaces the saved sample attempt.')) {
      setAttempt({ ...newAttempt(), view: 'read' })
    }
  }

  function renderReview() {
    return <>
      <div className="result"><div className="eyebrow">Drill complete</div><strong>{score} / 2</strong><span className="muted"> correct · {formatTime(seconds)}</span></div>
      <div className="row"><h3 ref={title} tabIndex={-1}>Question {q + 1} review</h3><div className="question-nav">{drill.questions.map((_, index) => <button key={index} className={`btn ${index === q ? 'active-q' : ''}`} onClick={() => patch({ q: index })} aria-label={`Review question ${index + 1}`} aria-pressed={q === index}>{index + 1}</button>)}</div></div>
      <p className="question">{question.stem}</p>
      {question.options.map((option, index) => <div className="review-choice" key={option}><b>{'ABCD'[index]}.</b> {option} {index === question.key && <strong className="correct-label">✓ Correct</strong>}{answers[q] === index && <em> (your answer)</em>}</div>)}
      <div className="review-block"><h3>Understanding the question</h3><p>{q === 0 ? 'Two requirements operate together: the statement must bolster the critics’ particular objection and preserve the author’s replacement test.' : '“Least justified” asks for the judgement with the weakest support, not an accurate statement of the author’s view.'}</p></div>
      <div className="review-block"><h3>Task in one line</h3><p>{question.task}</p>{notes[q] && <details><summary>Your stem paraphrase</summary><p>{notes[q]}</p></details>}</div>
      <div className="review-block"><h3>Relevant passage logic</h3><p>{question.logic}</p></div>
      <div className="review-block"><h3>Eliminating the options</h3>{question.elimination.map(text => <p key={text}>{text}</p>)}</div>
      <div className="review-block"><h3>Why {'ABCD'[question.key]} works</h3><p>{q === 0 ? 'It demonstrates opportunistic evaluation—the critics’ actual target—without presenting any reason that usable opportunities cannot be assessed.' : 'It crosses the boundary the passage explicitly draws between permission and practical opportunity. The phrase “has thereby secured” makes the unsupported leap decisive.'}</p></div>
      <div className="review-block"><h3>Retention check</h3><p>{question.retention}</p><details><summary>Check your recall</summary><p>Formal permission does not guarantee a usable opportunity. Seating, shade and management can determine whether people can realistically remain.</p></details>{recall && <details><summary>Your original passage note</summary><p>{recall}</p></details>}</div>
      <div className="actions"><button className="btn" onClick={retry}>Try sample again</button></div>
    </>
  }

  return <section className="anti-brainrot" ref={workspace} aria-label="Anti Brainrot">
    <div className="main">
      {view === 'library' ? <>
        <div className="intro"><div><div className="eyebrow">Attention training / Retention Spike Drills</div><h1 ref={title} tabIndex={-1}>Anti Brainrot</h1><p>Keep the argument in mind. Keep the question in focus.</p></div><div className="note">Two questions.<br />A lot more than two details.</div></div>
        <div className="stats"><div className="stat island"><strong>{completed ? '1' : '0'}</strong><span>Drills completed</span></div><div className="stat island"><strong>{completed ? `${score}/2` : '—'}</strong><span>Latest accuracy</span></div><div className="stat island"><strong>{formatTime(seconds)}</strong><span>Practice time</span></div></div>
        <div className="library-layout"><section><div className="row desk-heading"><h3>Your drill desk</h3><span className="fine">1 sample drill</span></div><article className="drill island"><div className="chips"><span className="chip purple">RETENTION SPIKE 01</span><span className="chip">{drill.topic}</span><span className="chip">{drill.passage.join(' ').split(/\s+/).length} words · 2 questions</span></div><h2>{drill.title}</h2><p className="muted">Follow a disagreement about public space, then hold its qualifications together as the questions change what you have to judge.</p><div className="row drill-start"><span className="fine">{completed ? 'Completed · available for review' : seconds ? 'In progress · pick up where you left off' : 'Untimed · timer counts up'}</span><button className="btn primary" onClick={() => patch({ view: completed ? 'review' : answers.some(answer => answer !== null) ? 'questions' : 'read' })}>{completed ? 'Review drill' : seconds ? 'Continue drill' : 'Begin drill'} →</button></div></article><p className="fine">Original sample content. The full passage bank will be added separately.</p></section><aside className="aside island"><div className="eyebrow">The practice loop</div><h2>Stay with the logic.</h2><ol><li><b>Read the passage.</b><br />Track the claim, objection and refinement.</li><li><b>Decode the task.</b><br />Two questions, each with its own demands.</li><li><b>Review your reasoning.</b><br />Check the stem, passage logic and eliminations.</li></ol><p className="fine">Passage visibility is your choice. Use “Hide passage” when you want to practise holding its argument in mind.</p></aside></div>
      </> : <>
        <div className="workspace-head"><button className="btn" onClick={() => patch({ view: 'library' })}>← Drill desk</button><div className="steps"><span className={reading ? 'current' : ''} aria-current={reading ? 'step' : undefined}>01 Read</span><span>→</span><span className={!reading && !reviewing ? 'current' : ''} aria-current={!reading && !reviewing ? 'step' : undefined}>02 Respond</span><span>→</span><span className={reviewing ? 'current' : ''} aria-current={reviewing ? 'step' : undefined}>03 Review</span></div><div className="clock" aria-label="Practice time">{formatTime(seconds)}</div></div>
        <div className="work-grid"><section className="pane island"><div className="row"><div className="eyebrow">Passage 01 · Urban life</div><button className="text-btn" onClick={() => patch({ hidden: !hidden })} aria-expanded={!hidden} aria-controls="ab-passage">{hidden ? 'Show' : 'Hide'} passage</button></div><h2>{drill.title}</h2><div className="passage" id="ab-passage" hidden={hidden}>{drill.passage.map(text => <p key={text}>{text}</p>)}</div>{hidden && <div className="hide-note">Passage hidden.<br />Hold the argument in mind; reveal it whenever you need.</div>}</section>
          <section className="pane island">
            {reading ? <><div className="eyebrow">Before you begin</div><h2 ref={title} tabIndex={-1}>Read for the movement.</h2><p className="muted">Notice what the author accepts, what they reject, and how the final test differs from the one they began with.</p><label className="field" htmlFor="ab-recall">Optional: capture the argument in one sentence.</label><textarea id="ab-recall" value={recall} onChange={event => patch({ recall: event.target.value })} placeholder="The author moves from… to…" /><p className="fine">This is a private note, not an automatically graded answer.</p><div className="actions"><span /><button className="btn primary" onClick={() => patch({ view: 'questions' })}>Go to questions →</button></div></> : reviewing ? renderReview() : <>
              <div className="row"><div className="eyebrow" ref={title} tabIndex={-1}>Question {q + 1} of 2</div><div className="question-nav">{drill.questions.map((_, index) => <button key={index} className={`btn ${q === index ? 'active-q' : ''}`} onClick={() => patch({ q: index })} aria-label={`Question ${index + 1}${answers[index] !== null ? ', answered' : ''}`} aria-pressed={q === index}>{index + 1}{answers[index] !== null ? ' •' : ''}</button>)}</div></div>
              <p className="question" id="ab-question">{question.stem}</p><div className="options" role="group" aria-labelledby="ab-question">{question.options.map((option, index) => <button key={option} className={`option ${answers[q] === index ? 'selected' : ''}`} onClick={() => selectAnswer(index)} aria-pressed={answers[q] === index}><span className="letter">{'ABCD'[index]}</span><span>{option}</span></button>)}</div>
              <label className="field" htmlFor="ab-paraphrase">Optional: what exactly is this question asking you to do?</label><textarea id="ab-paraphrase" value={notes[q]} onChange={event => patch({ notes: notes.map((note, index) => index === q ? event.target.value : note) })} placeholder="In my own words…" />
              <div className="actions"><button className="btn" onClick={() => patch(q ? { q: 0 } : { view: 'read' })}>{q ? '← Question 1' : '← Back to reading'}</button><button className="btn primary" disabled={q === 1 && answers.some(answer => answer === null)} onClick={() => { if (!q) patch({ q: 1 }); else if (answers.every(answer => answer !== null)) patch({ completed: true, view: 'review' }) }}>{q ? 'Submit drill' : 'Question 2 →'}</button></div>{q === 1 && answers.some(answer => answer === null) && <p className="fine">Choose one answer for each question to submit.</p>}
            </>}
          </section></div>
      </>}
      <p className="saved" role="status">{saveMessage}. Progress is stored on this device.</p>
      <footer className="footer">Read closely. Hold the logic. Stay with the question.</footer>
    </div>
  </section>
}
