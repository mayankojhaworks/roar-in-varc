export const STORAGE_KEY = 'roar-anti-brainrot-library-v1'

export function newAttempt(questionCount = 2) {
  return { view: 'library', q: 0, answers: Array(questionCount).fill(null), notes: Array(questionCount).fill(''), recall: '', seconds: 0, completed: false, hidden: false }
}

export function restoreAttempt(raw, questionCount = 2) {
  const initial = newAttempt(questionCount)
  try {
    const value = JSON.parse(raw)
    if (!value || typeof value !== 'object') return initial
    const answers = initial.answers.map((_, i) =>
      Number.isInteger(value.answers?.[i]) && value.answers[i] >= 0 && value.answers[i] < 4 ? value.answers[i] : null)
    const completed = value.completed === true && answers.every(answer => answer !== null)
    const view = ['library', 'read', 'questions', 'review'].includes(value.view) ? value.view : 'library'
    return {
      view: view === 'review' && !completed ? 'read' : view,
      q: Number.isInteger(value.q) && value.q >= 0 && value.q < questionCount ? value.q : 0,
      answers,
      notes: initial.notes.map((_, i) => typeof value.notes?.[i] === 'string' ? value.notes[i] : ''),
      recall: typeof value.recall === 'string' ? value.recall : '',
      seconds: Number.isSafeInteger(value.seconds) && value.seconds >= 0 ? value.seconds : 0,
      completed,
      hidden: value.hidden === true,
    }
  } catch {
    return initial
  }
}

export function newBank(drills) {
  return { selectedId: drills[0].id, attempts: {} }
}

export function restoreBank(raw, drills) {
  const initial = newBank(drills)
  try {
    const value = JSON.parse(raw)
    if (!value || typeof value !== 'object') return initial
    // Keep attempts for known stable IDs; new sets start fresh when added.
    const attempts = Object.fromEntries(drills
      .filter(drill => Object.hasOwn(value.attempts || {}, drill.id))
      .map(drill => [drill.id, restoreAttempt(JSON.stringify(value.attempts[drill.id]), drill.questions.length)]))
    return {
      selectedId: drills.some(drill => drill.id === value.selectedId) ? value.selectedId : initial.selectedId,
      attempts,
    }
  } catch {
    return initial
  }
}

export function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function scoreAttempt(answers, questions) {
  return questions.reduce((score, question, i) => score + (answers[i] === question.key ? 1 : 0), 0)
}
