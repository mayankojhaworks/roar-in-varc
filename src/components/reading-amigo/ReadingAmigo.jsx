import { useEffect, useMemo, useRef, useState } from 'react'
import { calculateFleschReadingEase } from '../../utils/readability'
import { cleanWord, fetchDefinition } from '../../utils/dictionary'
import { readingAmigoQuotes } from '../../data/readingAmigoQuotes'
import './readingAmigo.css'

const SAVED_TEXT_KEY = 'roar-reading-amigo-text'
const VOCAB_BANK_KEY = 'roar-reading-amigo-vocab'

const SPEEDS = [
  { value: 1, label: 'Starter', wpm: 45 },
  { value: 2, label: 'Very Slow', wpm: 65 },
  { value: 3, label: 'Slow', wpm: 90 },
  { value: 4, label: 'Guided', wpm: 125 },
  { value: 5, label: 'Normal', wpm: 180 },
  { value: 6, label: 'Brisk', wpm: 235 },
  { value: 7, label: 'Fast', wpm: 295 },
  { value: 8, label: 'Very Fast', wpm: 360 },
]

const READING_COACH_TIPS = [
  'Read for the author’s movement, not just the individual words.',
  'Pause mentally whenever the author shifts from claim to evidence, example, objection, or conclusion.',
  'Do not chase every detail. First identify the central pressure of the passage.',
  'A hard passage usually becomes easier once you know what the author is trying to correct or complicate.',
  'Track contrast words carefully. They often reveal the real direction of the argument.',
  'When the passage feels dense, reduce speed and protect comprehension first.',
  'Good reading is not word collection. It is structure tracking.',
  'Before judging an option, ask what job the paragraph is doing.',
]

const DEFINITION_BUBBLE_MS = 2500
const TEMP_SLOWDOWN_MS = 2500
const TEMP_SLOWDOWN_FACTOR = 0.2
const MAX_FRAME_DELTA_SECONDS = 0.05

function getLocalText() {
  try {
    return localStorage.getItem(SAVED_TEXT_KEY) || ''
  } catch {
    return ''
  }
}

function getLocalVocab() {
  try {
    const parsed = JSON.parse(localStorage.getItem(VOCAB_BANK_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function escapeHtml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function getWordCount(text = '') {
  return text.split(/\s+/).filter(Boolean).length
}

function formatTime(totalSeconds = 0) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function roundToNearestFive(value) {
  return Math.max(25, Math.round(value / 5) * 5)
}

function parseQuote(rawQuote = '') {
  const parts = rawQuote.split(' — ')
  const quote = parts[0] || rawQuote
  const source = parts.slice(1).join(' — ')

  return {
    quote,
    source,
  }
}

function pickRandomItem(items, fallback) {
  if (!Array.isArray(items) || items.length === 0) return fallback
  return items[Math.floor(Math.random() * items.length)]
}

function getRelativeFocusSpeeds(baseWpm) {
  const safeBase = Number(baseWpm) || 180

  return [
    {
      key: 'minus-50',
      label: '−50%',
      wpm: roundToNearestFive(safeBase * 0.5),
    },
    {
      key: 'minus-25',
      label: '−25%',
      wpm: roundToNearestFive(safeBase * 0.75),
    },
{
  key: 'base',
  label: 'Base Speed',
  wpm: roundToNearestFive(safeBase),
},
    {
      key: 'plus-25',
      label: '+25%',
      wpm: roundToNearestFive(safeBase * 1.25),
    },
    {
      key: 'plus-50',
      label: '+50%',
      wpm: roundToNearestFive(safeBase * 1.5),
    },
  ]
}

function getReadingLineY(windowHeight) {
  return Math.max(132, Math.min(190, windowHeight * 0.22))
}

export default function ReadingAmigo() {
  const [text, setText] = useState(getLocalText)
  const [speedLevel, setSpeedLevel] = useState(5)
  const [readerText, setReaderText] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)

  const [focusBaseWpm, setFocusBaseWpm] = useState(180)
  const [focusWpm, setFocusWpm] = useState(180)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const [highlightedWords, setHighlightedWords] = useState([])
  const [vocabBank, setVocabBank] = useState(getLocalVocab)
  const [selectedWords, setSelectedWords] = useState([])
  const [definition, setDefinition] = useState(null)
  const [floatingDefinition, setFloatingDefinition] = useState(null)
  const [message, setMessage] = useState('')
  const [isVocabOpen, setIsVocabOpen] = useState(false)
  const [isHighlightsOpen, setIsHighlightsOpen] = useState(false)

  const animationRef = useRef(null)
  const lastFrameTimeRef = useRef(0)

  const currentYRef = useRef(0)
  const runningRef = useRef(false)
  const pausedRef = useRef(true)

  const readingWpmRef = useRef(180)
  const selectedWpmRef = useRef(180)

  const elapsedSecondsRef = useRef(0)
  const shownSecondRef = useRef(0)

  const wordProgressRef = useRef(0)
  const readerWordCountRef = useRef(0)
  const scrollStartYRef = useRef(0)
  const scrollDistanceRef = useRef(1)

  const wordRefs = useRef([])

  const slowdownTimeoutRef = useRef(null)
  const floatingDefinitionTimeoutRef = useRef(null)
  const definitionRequestIdRef = useRef(0)

  const readerWindowRef = useRef(null)
  const readerTextRef = useRef(null)
  const textareaRef = useRef(null)

  const activeSpeed = useMemo(() => {
    return SPEEDS.find((speed) => speed.value === Number(speedLevel)) || SPEEDS[4]
  }, [speedLevel])

  const coachQuote = useMemo(() => {
    return parseQuote(
      pickRandomItem(
        readingAmigoQuotes,
        "You don't rise to the occasion. You fall to the level of your training. — Archilochus"
      )
    )
  }, [])

  const coachTip = useMemo(() => {
    return pickRandomItem(
      READING_COACH_TIPS,
      'Read for the author’s movement, not just the individual words.'
    )
  }, [])

  const coachMode = useMemo(() => {
    return Math.random() > 0.35 ? 'quote' : 'tip'
  }, [])

  const focusSpeedModes = useMemo(() => {
    return getRelativeFocusSpeeds(focusBaseWpm)
  }, [focusBaseWpm])

  const stats = useMemo(() => calculateFleschReadingEase(text), [text])

  const readerTokens = useMemo(() => {
    const tokens = readerText.split(/(\s+)/)
    let wordIndex = 0

    return tokens.map((token, tokenIndex) => {
      if (!token.trim()) {
        return {
          token,
          tokenIndex,
          isWord: false,
        }
      }

      const item = {
        token,
        tokenIndex,
        isWord: true,
        wordIndex,
        cleaned: cleanWord(token),
      }

      wordIndex += 1
      return item
    })
  }, [readerText])

  const articleWordCount = useMemo(() => getWordCount(readerText || text), [readerText, text])

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_TEXT_KEY, text)
    } catch {
      // localStorage may be unavailable in some browser modes
    }
  }, [text])

  useEffect(() => {
    try {
      localStorage.setItem(VOCAB_BANK_KEY, JSON.stringify(vocabBank))
    } catch {
      // localStorage may be unavailable in some browser modes
    }
  }, [vocabBank])

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (slowdownTimeoutRef.current) clearTimeout(slowdownTimeoutRef.current)
      if (floatingDefinitionTimeoutRef.current) clearTimeout(floatingDefinitionTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (runningRef.current && !isComplete && readerText) {
        event.preventDefault()
        event.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isComplete, readerText])

  useEffect(() => {
    function handleKeyDown(event) {
      const tag = event.target?.tagName?.toLowerCase()
      const isTyping = tag === 'textarea' || tag === 'input' || tag === 'select'

      if (isTyping) return

      if (event.code === 'Space' && readerText) {
        event.preventDefault()

        if (pausedRef.current) resumeReading()
        else pauseReading()
      }

      if (event.key === 'Escape' && isFocusMode) {
        exitFocusMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [readerText, isFocusMode, isComplete])

  useEffect(() => {
    if (!readerText || !isFocusMode) return

    requestAnimationFrame(() => {
      if (measureReaderLayout()) {
        renderReaderAtProgress()
      }
    })
  }, [readerText, isFocusMode])

  useEffect(() => {
    if (!readerText || !isFocusMode) return

    function handleResize() {
      requestAnimationFrame(() => {
        if (measureReaderLayout()) {
          renderReaderAtProgress()
        }
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [readerText, isFocusMode])

  function applyReaderPosition(yValue) {
    currentYRef.current = yValue

    if (readerTextRef.current) {
      readerTextRef.current.style.transform = `translate3d(0, ${yValue}px, 0)`
    }
  }

  function measureReaderLayout() {
    const windowEl = readerWindowRef.current
    const textEl = readerTextRef.current
    const totalWords = readerWordCountRef.current || getWordCount(readerText)

    if (!windowEl || !textEl || totalWords <= 0) return false

    const windowHeight = windowEl.clientHeight
    const textHeight = textEl.scrollHeight
    const computedStyle = window.getComputedStyle(textEl)
    const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 30

    const startY = getReadingLineY(windowHeight)
    const scrollDistance = Math.max(1, textHeight - lineHeight)

    scrollStartYRef.current = startY
    scrollDistanceRef.current = scrollDistance
    readerWordCountRef.current = totalWords

    return true
  }

  function renderReaderAtProgress() {
    const totalWords = Math.max(readerWordCountRef.current, 1)
    const progressRatio = Math.max(0, Math.min(1, wordProgressRef.current / totalWords))
    const y = scrollStartYRef.current - scrollDistanceRef.current * progressRatio

    applyReaderPosition(y)
  }

  function startWordClockWhenReady(attempt = 0) {
    const measured = measureReaderLayout()

    if (!measured) {
      if (attempt < 12) {
        requestAnimationFrame(() => startWordClockWhenReady(attempt + 1))
        return
      }

      runningRef.current = false
      pausedRef.current = true

      setIsRunning(false)
      setIsPaused(true)
      setIsFocusMode(false)
      setMessage('Reader could not initialise. Please try Start again.')

      return
    }

    wordProgressRef.current = 0
    renderReaderAtProgress()

    const now = performance.now()

    lastFrameTimeRef.current = now

    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    animationRef.current = requestAnimationFrame(animate)
  }

  function animate(currentTime) {
    if (!runningRef.current || pausedRef.current) return

    const rawDeltaSeconds = Math.max(0, (currentTime - lastFrameTimeRef.current) / 1000)
    const deltaSeconds = Math.min(rawDeltaSeconds, MAX_FRAME_DELTA_SECONDS)

    lastFrameTimeRef.current = currentTime

    elapsedSecondsRef.current += deltaSeconds
    wordProgressRef.current += deltaSeconds * (readingWpmRef.current / 60)

    const nextVisibleSecond = Math.floor(elapsedSecondsRef.current)

    if (nextVisibleSecond !== shownSecondRef.current) {
      shownSecondRef.current = nextVisibleSecond
      setElapsedSeconds(nextVisibleSecond)
    }

    if (!measureReaderLayout()) {
      animationRef.current = requestAnimationFrame(animate)
      return
    }

    renderReaderAtProgress()

    const totalWords = Math.max(readerWordCountRef.current, 1)

    if (wordProgressRef.current >= totalWords) {
      wordProgressRef.current = totalWords
      renderReaderAtProgress()

      runningRef.current = false
      pausedRef.current = true

      setIsRunning(false)
      setIsPaused(true)
      setIsComplete(true)
      setIsFocusMode(false)

      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      return
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  function startReading() {
    const cleanText = text.trim()

    if (!cleanText) {
      setMessage('Paste an article first.')
      return
    }

    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    if (slowdownTimeoutRef.current) clearTimeout(slowdownTimeoutRef.current)
    if (floatingDefinitionTimeoutRef.current) clearTimeout(floatingDefinitionTimeoutRef.current)

    const chosenWpm = activeSpeed.wpm
    const totalWords = getWordCount(cleanText)

    wordRefs.current = []
    readerWordCountRef.current = totalWords
    wordProgressRef.current = 0

    readingWpmRef.current = chosenWpm
    selectedWpmRef.current = chosenWpm

    elapsedSecondsRef.current = 0
    shownSecondRef.current = 0
    lastFrameTimeRef.current = 0
    currentYRef.current = 0

    setFocusBaseWpm(chosenWpm)
    setFocusWpm(chosenWpm)
    setElapsedSeconds(0)

    setReaderText(cleanText)
    setHighlightedWords([])
    setSelectedWords([])
    setDefinition(null)
    setFloatingDefinition(null)
    setMessage('')
    setIsComplete(false)
    setIsFocusMode(true)

    runningRef.current = true
    pausedRef.current = false

    setIsRunning(true)
    setIsPaused(false)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        startWordClockWhenReady(0)
      })
    })
  }

  function pauseReading() {
    if (!runningRef.current) return

    pausedRef.current = true
    setIsPaused(true)

    if (animationRef.current) cancelAnimationFrame(animationRef.current)
  }

  function resumeReading() {
    if (!readerText || !runningRef.current) return

    setIsFocusMode(true)

    pausedRef.current = false
    setIsPaused(false)

    requestAnimationFrame(() => {
      measureReaderLayout()
      renderReaderAtProgress()

      lastFrameTimeRef.current = performance.now()

      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      animationRef.current = requestAnimationFrame(animate)
    })
  }

  function resetReader() {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    if (slowdownTimeoutRef.current) clearTimeout(slowdownTimeoutRef.current)
    if (floatingDefinitionTimeoutRef.current) clearTimeout(floatingDefinitionTimeoutRef.current)

    runningRef.current = false
    pausedRef.current = true

    elapsedSecondsRef.current = 0
    shownSecondRef.current = 0
    wordProgressRef.current = 0
    readerWordCountRef.current = 0
    selectedWpmRef.current = activeSpeed.wpm
    wordRefs.current = []

    setIsRunning(false)
    setIsPaused(true)
    setIsComplete(false)
    setReaderText('')
    setHighlightedWords([])
    setDefinition(null)
    setFloatingDefinition(null)
    setMessage('')
    setIsFocusMode(false)
    setElapsedSeconds(0)

    applyReaderPosition(0)
  }

  function exitFocusMode() {
    if (runningRef.current && !isComplete) {
      const ok = window.confirm(
        'Your reading session is not complete yet. Exit focus mode and pause this session?'
      )

      if (!ok) return
    }

    pauseReading()
    setIsFocusMode(false)
  }

  function scrollTextarea(direction) {
    if (!textareaRef.current) return

    textareaRef.current.scrollBy({
      top: direction * 120,
      behavior: 'smooth',
    })
  }

  function decreaseSpeed() {
    setSpeedLevel((previous) => Math.max(1, previous - 1))
  }

  function increaseSpeed() {
    setSpeedLevel((previous) => Math.min(8, previous + 1))
  }

  function handleFocusSpeedChange(mode) {
    if (slowdownTimeoutRef.current) clearTimeout(slowdownTimeoutRef.current)

    selectedWpmRef.current = mode.wpm
    readingWpmRef.current = mode.wpm
    setFocusWpm(mode.wpm)

    lastFrameTimeRef.current = performance.now()

    if (runningRef.current && !pausedRef.current) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      animationRef.current = requestAnimationFrame(animate)
    }
  }

  function startTemporarySlowdown() {
    if (!runningRef.current || pausedRef.current) return

    if (slowdownTimeoutRef.current) clearTimeout(slowdownTimeoutRef.current)

    const baseWpm = selectedWpmRef.current || readingWpmRef.current

    readingWpmRef.current = Math.max(10, baseWpm * TEMP_SLOWDOWN_FACTOR)
    lastFrameTimeRef.current = performance.now()

    slowdownTimeoutRef.current = setTimeout(() => {
      if (!runningRef.current || pausedRef.current) return

      readingWpmRef.current = selectedWpmRef.current || baseWpm
      lastFrameTimeRef.current = performance.now()
    }, TEMP_SLOWDOWN_MS)
  }

  function saveWord(word) {
    const cleaned = cleanWord(word)

    if (!cleaned) return

    setVocabBank((previous) => {
      if (previous.includes(cleaned)) return previous
      return [...previous, cleaned].sort((a, b) => a.localeCompare(b))
    })
  }

  function getContextAroundWordIndex(wordIndex) {
    if (!Number.isFinite(wordIndex)) return ''

    const words = readerTokens.filter((token) => token.isWord).map((token) => token.token)
    const start = Math.max(0, wordIndex - 22)
    const end = Math.min(words.length, wordIndex + 23)

    return words.slice(start, end).join(' ')
  }

  function getWordBubblePosition(wordIndex) {
    const wordEl = wordRefs.current[wordIndex]
    const windowEl = readerWindowRef.current

    if (!wordEl || !windowEl) return null

    const wordRect = wordEl.getBoundingClientRect()
    const windowRect = windowEl.getBoundingClientRect()

    return {
      left: wordRect.left - windowRect.left + wordRect.width / 2,
      top: wordRect.top - windowRect.top,
    }
  }

  function showFloatingWordBubble(wordIndex, payload) {
    const position = getWordBubblePosition(wordIndex)

    if (!position) return

    setFloatingDefinition({
      ...payload,
      wordIndex,
      left: position.left,
      top: position.top,
    })
  }

  async function showDefinition(word, options = {}) {
    const cleaned = cleanWord(word)

    if (!cleaned) return

    const requestId = definitionRequestIdRef.current + 1
    definitionRequestIdRef.current = requestId

    const wordIndex = options.wordIndex
    const shouldShowBubble = Number.isFinite(wordIndex)
    const context = shouldShowBubble ? getContextAroundWordIndex(wordIndex) : ''

    setMessage('')

    const loadingPayload = {
      word: cleaned,
      partOfSpeech: 'loading',
      definition: 'Fetching meaning...',
    }

    setDefinition(loadingPayload)

    if (shouldShowBubble) {
      if (floatingDefinitionTimeoutRef.current) clearTimeout(floatingDefinitionTimeoutRef.current)
      showFloatingWordBubble(wordIndex, loadingPayload)
    }

    try {
      const result = await fetchDefinition(cleaned, context)

      if (definitionRequestIdRef.current !== requestId) return

      setDefinition(result)

      if (shouldShowBubble) {
        showFloatingWordBubble(wordIndex, result)

        floatingDefinitionTimeoutRef.current = setTimeout(() => {
          setFloatingDefinition(null)
        }, DEFINITION_BUBBLE_MS)
      }
    } catch {
      if (definitionRequestIdRef.current !== requestId) return

      const fallback = {
        word: cleaned,
        partOfSpeech: 'unavailable',
        definition: 'Meaning not found.',
      }

      setDefinition(null)
      setMessage(`Could not fetch a definition for “${cleaned}”.`)

      if (shouldShowBubble) {
        showFloatingWordBubble(wordIndex, fallback)

        floatingDefinitionTimeoutRef.current = setTimeout(() => {
          setFloatingDefinition(null)
        }, DEFINITION_BUBBLE_MS)
      }
    }
  }

  async function handleReaderWordClick(rawWord, wordIndex) {
    const cleaned = cleanWord(rawWord)

    if (!cleaned) return

    setHighlightedWords((previous) => {
      if (previous.includes(cleaned)) return previous
      return [...previous, cleaned]
    })

    saveWord(cleaned)
    startTemporarySlowdown()
    await showDefinition(cleaned, { wordIndex })
  }

  function toggleSelectedWord(word) {
    setSelectedWords((previous) => {
      if (previous.includes(word)) return previous.filter((item) => item !== word)
      return [...previous, word]
    })
  }

  function deleteSelectedWords() {
    if (!selectedWords.length) return

    const ok = window.confirm(`Delete ${selectedWords.length} selected word(s)?`)

    if (!ok) return

    setVocabBank((previous) => previous.filter((word) => !selectedWords.includes(word)))
    setSelectedWords([])
  }

  function exportVocabPDF() {
    if (!vocabBank.length) {
      setMessage('Your vocab bank is empty.')
      return
    }

    const printWindow = window.open('', '', 'width=900,height=650')

    if (!printWindow) {
      setMessage('Popup blocked. Allow popups to export the vocab bank.')
      return
    }

    const list = vocabBank.map((word) => `<li>${escapeHtml(word)}</li>`).join('')

    printWindow.document.write(`
      <html>
        <head>
          <title>Reading Amigo Vocabulary Bank</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 34px;
              color: #333333;
              background: #fffaf4;
            }

            h1 {
              text-align: center;
              margin: 0;
              font-size: 28px;
            }

            p {
              text-align: center;
              color: #666;
              margin: 8px 0 28px;
            }

            ul {
              columns: 2;
              column-gap: 48px;
              font-size: 16px;
              line-height: 1.9;
            }

            li {
              break-inside: avoid;
              margin-bottom: 4px;
            }
          </style>
        </head>
        <body>
          <h1>Reading Amigo Vocabulary Bank</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
          <ul>${list}</ul>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 400)
  }

  function renderReaderWindow(extraClass = '') {
    return (
      <div className={`ra-reader-window ${extraClass}`} ref={readerWindowRef}>
        {floatingDefinition && (
          <div
            className="ra-definition-bubble"
            style={{
              left: `${floatingDefinition.left}px`,
              top: `${floatingDefinition.top}px`,
            }}
          >
            <strong>{floatingDefinition.word}</strong>
            <span>{floatingDefinition.partOfSpeech}</span>
            <p>{floatingDefinition.definition}</p>
          </div>
        )}

        {readerText ? (
          <div ref={readerTextRef} className="ra-reader-text">
            {readerTokens.map((token) => {
              if (!token.isWord) {
                return <span key={`space-${token.tokenIndex}`}>{token.token}</span>
              }

              const isHighlighted = highlightedWords.includes(token.cleaned)

              return (
                <span
                  key={`word-${token.wordIndex}-${token.token}`}
                  ref={(node) => {
                    wordRefs.current[token.wordIndex] = node
                  }}
                  className={`ra-reader-word ${isHighlighted ? 'is-highlighted' : ''}`}
                  onClick={() => handleReaderWordClick(token.token, token.wordIndex)}
                >
                  {token.token}
                </span>
              )
            })}
          </div>
        ) : (
          <div className="ra-empty-reader">
            Your article will scroll here after you click Start.
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="reading-amigo">
      <div className="ra-topbar island sketch-border">
        <div>
          <p className="ra-kicker">Focused Reading Lab</p>
          <h1 className="ra-title">Reading Amigo</h1>
        </div>

        <div className="ra-topbar-right">
          <div className="ra-pace-chip">
            <span>Current pace</span>
            <strong>{activeSpeed.wpm} WPM</strong>
          </div>

          <button
            className={`ra-compact-trigger ${isHighlightsOpen ? 'active' : ''}`}
            onClick={() => setIsHighlightsOpen((value) => !value)}
          >
            Highlights <span>{highlightedWords.length}</span>
          </button>

          <button
            className={`ra-compact-trigger ${isVocabOpen ? 'active' : ''}`}
            onClick={() => setIsVocabOpen((value) => !value)}
          >
            Vocab Bank <span>{vocabBank.length}</span>
          </button>
        </div>
      </div>

      <div className="ra-workspace">
        <div className="ra-left-panel island sketch-border">
          <h2 className="ra-panel-title">
            <span>Article Desk</span>
            <span className="ra-mini-note">500-2500 words ideal</span>
          </h2>

          <textarea
            ref={textareaRef}
            className="roar-paper-input ra-textarea"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste your article here..."
          />

          <div className="ra-stats">
            <div className="ra-stat">
              <span>Words</span>
              <strong>{stats.wordCount}</strong>
            </div>

            <div className="ra-stat">
              <span>Sentences</span>
              <strong>{stats.sentenceCount}</strong>
            </div>

            <div className="ra-stat">
              <span>Ease</span>
              <strong style={{ color: 'var(--highlight-blue)' }}>{stats.score ?? '--'}</strong>
            </div>

            <div className="ra-stat ra-wide">
              <span>Difficulty</span>
              <strong style={{ color: 'var(--highlight-lavender)' }}>{stats.difficulty}</strong>
            </div>
          </div>

          <div className="ra-speed-card">
            <div className="ra-speed-head">
              <span>Reading accelerator</span>
              <strong>{activeSpeed.label}</strong>
            </div>

            <div className="ra-accelerator">
              <button onClick={decreaseSpeed} disabled={speedLevel === 1} aria-label="Reduce speed">
                −
              </button>

              <input
                className="ra-speed-slider"
                type="range"
                min="1"
                max="8"
                step="1"
                value={speedLevel}
                onChange={(event) => setSpeedLevel(Number(event.target.value))}
                aria-label="Reading speed"
              />

              <button onClick={increaseSpeed} disabled={speedLevel === 8} aria-label="Increase speed">
                +
              </button>
            </div>

            <p>{activeSpeed.wpm} WPM</p>
          </div>

          <div className="ra-actions primary-actions">
            <button className="ra-btn ra-btn-primary" onClick={startReading}>
              Start
            </button>

            <button className="ra-btn" onClick={pauseReading} disabled={!isRunning || isPaused}>
              Pause
            </button>

            <button className="ra-btn" onClick={resumeReading} disabled={!isRunning || !isPaused}>
              Resume
            </button>

            <button className="ra-btn ra-btn-blue" onClick={resetReader}>
              Reset
            </button>
          </div>

          <div className="ra-actions">
            <button className="ra-btn ra-btn-soft" onClick={() => scrollTextarea(-1)}>
              Text Up
            </button>

            <button className="ra-btn ra-btn-soft" onClick={() => scrollTextarea(1)}>
              Text Down
            </button>
          </div>

          <div className="ra-side-card">
            <span className="ra-side-label">Instant meaning</span>

            {definition ? (
              <>
                <p className="ra-definition-word">
                  {definition.word}
                  <span>{definition.partOfSpeech}</span>
                </p>

                <p className="ra-definition-text">{definition.definition}</p>
              </>
            ) : (
              <p className="ra-empty-copy">
                Click any word in the reader to save it and see its meaning.
              </p>
            )}

            {message && <p className="ra-error">{message}</p>}
          </div>
        </div>

        <div className="ra-coach-panel island sketch-border">
          <div className="ra-coach-card">
            {isComplete ? (
              <>
                <h2 className="ra-coach-title">Session complete</h2>

                <div className="ra-session-summary">
                  <div>
                    <span>Time</span>
                    <strong>{formatTime(elapsedSeconds)}</strong>
                  </div>

                  <div>
                    <span>Words</span>
                    <strong>{articleWordCount}</strong>
                  </div>

                  <div>
                    <span>Pace</span>
                    <strong>{focusWpm} WPM</strong>
                  </div>

                  <div>
                    <span>Saved</span>
                    <strong>{vocabBank.length}</strong>
                  </div>
                </div>

                <p className="ra-coach-copy">
                  Review the words you saved, then ask yourself what the author was really trying
                  to move you toward.
                </p>
              </>
            ) : (
              <>
                {coachMode === 'quote' ? (
                  <div className="ra-coach-feature">
                    <blockquote className="ra-coach-quote">
                      “{coachQuote.quote}”
                      {coachQuote.source && <cite>{coachQuote.source}</cite>}
                    </blockquote>
                  </div>
                ) : (
                  <div className="ra-coach-feature">
                    <p className="ra-coach-tip-line">{coachTip}</p>
                  </div>
                )}

                <div className="ra-coach-footer">Start when your attention is ready.</div>
              </>
            )}
          </div>
        </div>
      </div>

      {isFocusMode && (
        <div className="ra-focus-mode">
          <div className="ra-focus-reader">
            <div className="ra-focus-bar">
              <div>
                <p className="ra-kicker">Reading Timer</p>
                <h2>
                  {formatTime(elapsedSeconds)} · {focusWpm} WPM
                </h2>
              </div>

              <div className="ra-focus-actions">
                {focusSpeedModes.map((mode) => {
                  const isActive = focusWpm === mode.wpm

                  return (
                    <button
                      key={mode.key}
                      className={`ra-btn ${isActive ? 'ra-btn-primary' : ''}`}
                      onClick={() => handleFocusSpeedChange(mode)}
                      title={`${mode.wpm} WPM`}
                    >
                      {mode.label}
                    </button>
                  )
                })}

                <button className="ra-btn" onClick={pauseReading} disabled={!isRunning || isPaused}>
                  Pause
                </button>

                <button className="ra-btn" onClick={resumeReading} disabled={!isRunning || !isPaused}>
                  Resume
                </button>

                <button className="ra-btn ra-btn-blue" onClick={exitFocusMode}>
                  Exit Focus
                </button>
              </div>
            </div>

            {renderReaderWindow('focus-window')}
          </div>
        </div>
      )}

      {isHighlightsOpen && (
        <div className="ra-overlay" onClick={() => setIsHighlightsOpen(false)}>
          <aside
            className="ra-drawer island sketch-border"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ra-drawer-head">
              <div>
                <p className="ra-kicker">Session</p>
                <h2 className="ra-drawer-title">Highlights</h2>
              </div>

              <button className="ra-close-btn" onClick={() => setIsHighlightsOpen(false)}>
                ×
              </button>
            </div>

            {highlightedWords.length ? (
              <div className="ra-chip-list drawer-chips">
                {highlightedWords.map((word) => (
                  <button
                    type="button"
                    className="ra-word-chip"
                    key={word}
                    onClick={() => showDefinition(word)}
                  >
                    {word}
                  </button>
                ))}
              </div>
            ) : (
              <p className="ra-empty-copy">No words highlighted yet.</p>
            )}
          </aside>
        </div>
      )}

      {isVocabOpen && (
        <div className="ra-overlay" onClick={() => setIsVocabOpen(false)}>
          <aside
            className="ra-drawer island sketch-border"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ra-drawer-head">
              <div>
                <p className="ra-kicker">Vocabulary</p>
                <h2 className="ra-drawer-title">Vocab Bank</h2>
              </div>

              <button className="ra-close-btn" onClick={() => setIsVocabOpen(false)}>
                ×
              </button>
            </div>

            <div className="ra-drawer-actions">
              <button className="ra-btn" onClick={deleteSelectedWords} disabled={!selectedWords.length}>
                Delete Selected
              </button>

              <button className="ra-btn ra-btn-blue" onClick={exportVocabPDF} disabled={!vocabBank.length}>
                Export PDF
              </button>
            </div>

            {vocabBank.length ? (
              <div className="ra-vocab-list">
                {vocabBank.map((word) => (
                  <label className="ra-vocab-item" key={word}>
                    <input
                      type="checkbox"
                      checked={selectedWords.includes(word)}
                      onChange={() => toggleSelectedWord(word)}
                    />

                    <button type="button" className="ra-vocab-word" onClick={() => showDefinition(word)}>
                      {word}
                    </button>
                  </label>
                ))}
              </div>
            ) : (
              <p className="ra-empty-copy">Words you click in the reader will appear here.</p>
            )}
          </aside>
        </div>
      )}
    </section>
  )
}