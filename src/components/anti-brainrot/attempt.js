export const STORAGE_KEY = 'roar-anti-brainrot-empty-square-v1'

export function newAttempt() {
  return { view: 'library', q: 0, answers: [null, null], notes: ['', ''], recall: '', seconds: 0, completed: false, hidden: false }
}

export function restoreAttempt(raw) {
  const initial = newAttempt()
  try {
    const value = JSON.parse(raw)
    if (!value || typeof value !== 'object') return initial
    const answers = initial.answers.map((_, i) =>
      Number.isInteger(value.answers?.[i]) && value.answers[i] >= 0 && value.answers[i] < 4 ? value.answers[i] : null)
    const completed = value.completed === true && answers.every(answer => answer !== null)
    const view = ['library', 'read', 'questions', 'review'].includes(value.view) ? value.view : 'library'
    return {
      view: view === 'review' && !completed ? 'read' : view,
      q: value.q === 1 ? 1 : 0,
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

export function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function scoreAttempt(answers, questions) {
  return questions.reduce((score, question, i) => score + (answers[i] === question.key ? 1 : 0), 0)
}
