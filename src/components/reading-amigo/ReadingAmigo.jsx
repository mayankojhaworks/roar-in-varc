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
      key: 'settle',
      label: 'Settle',
      wpm: roundToNearestFive(safeBase * 0.8),
    },
    {
      key: 'chosen',
      label: 'Chosen',
      wpm: roundToNearestFive(safeBase),
    },
    {
      key: 'stretch',
      label: 'Stretch',
      wpm: roundToNearestFive(safeBase * 1.18),
    },
    {
      key: 'push',
      label: 'Push',
      wpm: roundToNearestFive(safeBase * 1.35),
    },
  ]
}

function getReadingLineY(windowHeight) {
  return Math.max(118, Math.min(176, windowHeight * 0.2))
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
  const [message, setMessage] = useState('')
  const [isVocabOpen, setIsVocabOpen] = useState(false)
  const [isHighlightsOpen, setIsHighlightsOpen] = useState(false)

  const animationRef = useRef(null)
  const lastTimeRef = useRef(0)

  const currentYRef = useRef(0)
  const runningRef = useRef(false)
  const pausedRef = useRef(true)
  const readingWpmRef = useRef(180)

  const elapsedSecondsRef = useRef(0)
  const shownSecondRef = useRef(0)

  const baseTimeRef = useRef(0)
  const baseWordIndexRef = useRef(0)
  const currentWordIndexRef = useRef(0)
  const readerWordCountRef = useRef(0)
  const wordPositionsRef = useRef([])
  const wordLineStartsRef = useRef([])
  const wordRefs = useRef([])

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
        moveReaderToWord(currentWordIndexRef.current)
      }
    })
  }, [readerText, isFocusMode])

  useEffect(() => {
    if (!readerText || !isFocusMode) return

    function handleResize() {
      requestAnimationFrame(() => {
        if (measureReaderLayout()) {
          moveReaderToWord(currentWordIndexRef.current)
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
    const totalWords = getWordCount(readerText)

    if (!windowEl || !textEl || !readerText || totalWords <= 0) return false

    const positions = []

    for (let index = 0; index < totalWords; index += 1) {
      const wordEl = wordRefs.current[index]

      if (!wordEl) return false

      positions[index] = wordEl.offsetTop
    }

    const lineStarts = []
    let lastTop = null

    positions.forEach((top, index) => {
      if (lastTop === null || Math.abs(top - lastTop) > 1) {
        lineStarts.push({ index, top })
        lastTop = top
      }
    })

    if (!lineStarts.length) return false

    wordPositionsRef.current = positions
    wordLineStartsRef.current = lineStarts
    readerWordCountRef.current = totalWords

    return true
  }

  function getInterpolatedTextTop(activeWordIndex) {
    const totalWords = readerWordCountRef.current || getWordCount(readerText)
    const lineStarts = wordLineStartsRef.current

    if (!lineStarts.length || totalWords <= 0) return 0

    const safeWordIndex = Math.max(0, Math.min(activeWordIndex, totalWords))
    let low = 0
    let high = lineStarts.length - 1
    let lineIndex = 0

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)

      if (lineStarts[mid].index <= safeWordIndex) {
        lineIndex = mid
        low = mid + 1
      } else {
        high = mid - 1
      }
    }

    const currentLine = lineStarts[lineIndex]
    const nextLine = lineStarts[lineIndex + 1]

    if (!nextLine) {
      const previousLine = lineStarts[lineIndex - 1]
      const estimatedLineHeight = previousLine
        ? Math.max(26, currentLine.top - previousLine.top)
        : 32

      const remainingWordsInLine = Math.max(totalWords - currentLine.index, 1)
      const progress = Math.max(
        0,
        Math.min(1, (safeWordIndex - currentLine.index) / remainingWordsInLine)
      )

      return currentLine.top + estimatedLineHeight * progress
    }

    const wordsInLine = Math.max(nextLine.index - currentLine.index, 1)
    const progress = Math.max(
      0,
      Math.min(1, (safeWordIndex - currentLine.index) / wordsInLine)
    )

    return currentLine.top + (nextLine.top - currentLine.top) * progress
  }

  function moveReaderToWord(activeWordIndex) {
    const windowEl = readerWindowRef.current

    if (!windowEl) return

    const readingLineY = getReadingLineY(windowEl.clientHeight)
    const targetTop = getInterpolatedTextTop(activeWordIndex)

    applyReaderPosition(readingLineY - targetTop)
  }

  function getCurrentActiveWordIndex(currentTime = performance.now()) {
    if (!runningRef.current) return currentWordIndexRef.current

    const elapsedSinceBase = Math.max(0, (currentTime - baseTimeRef.current) / 1000)
    const wordsAdvanced = elapsedSinceBase * (readingWpmRef.current / 60)

    return baseWordIndexRef.current + wordsAdvanced
  }

  function lockCurrentWord(currentTime = performance.now()) {
    const totalWords = readerWordCountRef.current || getWordCount(readerText)
    const currentWordIndex = Math.max(
      0,
      Math.min(getCurrentActiveWordIndex(currentTime), totalWords)
    )

    currentWordIndexRef.current = currentWordIndex
    baseWordIndexRef.current = currentWordIndex
    baseTimeRef.current = currentTime

    return currentWordIndex
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

    moveReaderToWord(0)

    const now = performance.now()

    baseTimeRef.current = now
    baseWordIndexRef.current = 0
    currentWordIndexRef.current = 0
    lastTimeRef.current = now

    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    animationRef.current = requestAnimationFrame(animate)
  }

  function animate(currentTime) {
    if (!runningRef.current || pausedRef.current) return

    const deltaSeconds = Math.max(0, (currentTime - lastTimeRef.current) / 1000)
    lastTimeRef.current = currentTime

    elapsedSecondsRef.current += deltaSeconds

    const nextVisibleSecond = Math.floor(elapsedSecondsRef.current)

    if (nextVisibleSecond !== shownSecondRef.current) {
      shownSecondRef.current = nextVisibleSecond
      setElapsedSeconds(nextVisibleSecond)
    }

    if (!wordLineStartsRef.current.length && !measureReaderLayout()) {
      animationRef.current = requestAnimationFrame(animate)
      return
    }

    const totalWords = readerWordCountRef.current || getWordCount(readerText)
    const activeWordIndex = getCurrentActiveWordIndex(currentTime)

    currentWordIndexRef.current = activeWordIndex
    moveReaderToWord(activeWordIndex)

    if (activeWordIndex >= totalWords) {
      runningRef.current = false
      pausedRef.current = true

      currentWordIndexRef.current = totalWords
      moveReaderToWord(totalWords)

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

    const chosenWpm = activeSpeed.wpm
    const totalWords = getWordCount(cleanText)

    wordRefs.current = []
    wordPositionsRef.current = []
    wordLineStartsRef.current = []
    readerWordCountRef.current = totalWords

    readingWpmRef.current = chosenWpm
    elapsedSecondsRef.current = 0
    shownSecondRef.current = 0
    baseTimeRef.current = 0
    baseWordIndexRef.current = 0
    currentWordIndexRef.current = 0
    currentYRef.current = 0

    setFocusBaseWpm(chosenWpm)
    setFocusWpm(chosenWpm)
    setElapsedSeconds(0)

    setReaderText(cleanText)
    setHighlightedWords([])
    setSelectedWords([])
    setDefinition(null)
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

    const currentWordIndex = lockCurrentWord()
    moveReaderToWord(currentWordIndex)

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

      const now = performance.now()

      baseWordIndexRef.current = currentWordIndexRef.current
      baseTimeRef.current = now
      lastTimeRef.current = now

      moveReaderToWord(currentWordIndexRef.current)

      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      animationRef.current = requestAnimationFrame(animate)
    })
  }

  function resetReader() {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)

    runningRef.current = false
    pausedRef.current = true

    elapsedSecondsRef.current = 0
    shownSecondRef.current = 0
    baseTimeRef.current = 0
    baseWordIndexRef.current = 0
    currentWordIndexRef.current = 0
    readerWordCountRef.current = 0
    wordRefs.current = []
    wordPositionsRef.current = []
    wordLineStartsRef.current = []

    setIsRunning(false)
    setIsPaused(true)
    setIsComplete(false)
    setReaderText('')
    setHighlightedWords([])
    setDefinition(null)
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
    const now = performance.now()
    const currentWordIndex =
      runningRef.current && !pausedRef.current
        ? lockCurrentWord(now)
        : currentWordIndexRef.current

    readingWpmRef.current = mode.wpm
    setFocusWpm(mode.wpm)

    baseWordIndexRef.current = currentWordIndex
    baseTimeRef.current = now

    requestAnimationFrame(() => {
      measureReaderLayout()
      moveReaderToWord(currentWordIndex)
    })
  }

  function saveWord(word) {
    const cleaned = cleanWord(word)

    if (!cleaned) return

    setVocabBank((previous) => {
      if (previous.includes(cleaned)) return previous
      return [...previous, cleaned].sort((a, b) => a.localeCompare(b))
    })
  }

  async function showDefinition(word) {
    const cleaned = cleanWord(word)

    if (!cleaned) return

    setMessage('')
    setDefinition({
      word: cleaned,
      partOfSpeech: 'loading',
      definition: 'Fetching meaning...',
    })

    try {
      const result = await fetchDefinition(cleaned)
      setDefinition(result)
    } catch {
      setDefinition(null)
      setMessage(`Could not fetch a definition for “${cleaned}”.`)
    }
  }

  async function handleReaderWordClick(rawWord) {
    const cleaned = cleanWord(rawWord)

    if (!cleaned) return

    if (isRunning && !isPaused) pauseReading()

    setHighlightedWords((previous) => {
      if (previous.includes(cleaned)) return previous.filter((word) => word !== cleaned)
      return [...previous, cleaned]
    })

    saveWord(cleaned)
    await showDefinition(cleaned)
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
                  onClick={() => handleReaderWordClick(token.token)}
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
                <h2>{formatTime(elapsedSeconds)}</h2>
              </div>

              <div className="ra-focus-actions">
                {focusSpeedModes.map((mode) => {
                  const isActive = focusWpm === mode.wpm

                  return (
                    <button
                      key={mode.key}
                      className={`ra-btn ${isActive ? 'ra-btn-primary' : ''}`}
                      onClick={() => handleFocusSpeedChange(mode)}
                    >
                      {mode.label} · {mode.wpm}
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