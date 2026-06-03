export function cleanWord(rawWord = '') {
  return String(rawWord)
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/^[^a-z]+|[^a-z]+$/gi, '')
    .trim()
}

function normalizeContext(context = '') {
  return String(context)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function stripSimpleInflection(word = '') {
  const cleaned = cleanWord(word)

  if (cleaned.length <= 4) return cleaned

  if (cleaned.endsWith('ing')) {
    const base = cleaned.slice(0, -3)

    // trumping -> trump
    if (base.length >= 3) return base

    return cleaned
  }

  if (cleaned.endsWith('ed')) {
    return cleaned.slice(0, -2)
  }

  if (cleaned.endsWith('es')) {
    return cleaned.slice(0, -2)
  }

  if (cleaned.endsWith('s') && !cleaned.endsWith('ss')) {
    return cleaned.slice(0, -1)
  }

  return cleaned
}

async function fetchWithTimeout(url, timeoutMs = 4500) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { signal: controller.signal })

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }

    return await response.json()
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function buildCandidatesFromDictionaryApi(data = []) {
  const candidates = []

  data.forEach((entry) => {
    const sourceWord = cleanWord(entry?.word)

    entry?.meanings?.forEach((meaning) => {
      const partOfSpeech = meaning?.partOfSpeech || 'meaning'

      meaning?.definitions?.forEach((item) => {
        if (!item?.definition) return

        candidates.push({
          source: 'dictionaryapi',
          word: sourceWord,
          partOfSpeech,
          definition: item.definition,
          example: item.example || '',
          synonyms: Array.isArray(item.synonyms) ? item.synonyms : [],
        })
      })
    })
  })

  return candidates
}

function buildCandidatesFromDatamuse(data = [], fallbackWord = '') {
  const candidates = []

  data.forEach((entry) => {
    const defs = Array.isArray(entry?.defs) ? entry.defs : []

    defs.forEach((rawDef) => {
      const [rawPos, ...rest] = String(rawDef).split('\t')
      const definition = rest.join('\t').trim()

      if (!definition) return

      candidates.push({
        source: 'datamuse',
        word: cleanWord(entry?.word || fallbackWord),
        partOfSpeech: rawPos || 'meaning',
        definition,
        example: '',
        synonyms: [],
      })
    })
  })

  return candidates
}

function scoreDefinition(candidate, clickedWord, context) {
  const definition = normalizeContext(candidate.definition)
  const example = normalizeContext(candidate.example)
  const combined = `${definition} ${example}`
  const pos = normalizeContext(candidate.partOfSpeech)
  const cleanedClicked = cleanWord(clickedWord)
  const baseClicked = stripSimpleInflection(clickedWord)

  let score = 0

  // Prefer the exact clicked form or its clean base form.
  if (candidate.word === cleanedClicked) score += 5
  if (candidate.word === baseClicked) score += 4

  // Prefer verbs for -ing/-ed words unless context clearly suggests a noun.
  if ((cleanedClicked.endsWith('ing') || cleanedClicked.endsWith('ed')) && pos.includes('verb')) {
    score += 6
  }

  // Context-sensitive handling for words like "trumping".
  const comparisonContext =
    /\b(all|them all|largest|greater|greatest|bigger|more than|above|beyond|surpass|outdo|outdoes|exceed|beat|overwhelm|outweigh)\b/.test(
      context
    )

  const cardContext =
    /\b(card|cards|suit|deck|hand|bridge|game|player|play a card|trump card)\b/.test(context)

  const cardDefinition =
    /\b(card|cards|suit|bridge|trump card|playing card|card game)\b/.test(combined)

  const surpassDefinition =
    /\b(surpass|outdo|outdoes|exceed|exceeds|beat|beats|override|outrank|prevail|be greater|be better)\b/.test(
      combined
    )

  if (comparisonContext && surpassDefinition) score += 18
  if (comparisonContext && cardDefinition) score -= 14
  if (!cardContext && cardDefinition) score -= 8
  if (cardContext && cardDefinition) score += 8

  // Prefer normal learner-friendly definitions.
  if (definition.length >= 35 && definition.length <= 190) score += 3
  if (definition.length > 260) score -= 3

  // Examples often help quality.
  if (example) score += 2

  // Prefer dictionaryapi slightly when both are equal.
  if (candidate.source === 'dictionaryapi') score += 1

  return score
}

function selectBestCandidate(candidates, clickedWord, context = '') {
  if (!candidates.length) return null

  const normalizedContext = normalizeContext(context)

  const ranked = candidates
    .map((candidate) => ({
      ...candidate,
      score: scoreDefinition(candidate, clickedWord, normalizedContext),
    }))
    .sort((a, b) => b.score - a.score)

  return ranked[0]
}

async function fetchDictionaryApiCandidates(word) {
  const encoded = encodeURIComponent(word)
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encoded}`
  const data = await fetchWithTimeout(url)
  return buildCandidatesFromDictionaryApi(data)
}

async function fetchDatamuseCandidates(word) {
  const encoded = encodeURIComponent(word)
  const url = `https://api.datamuse.com/words?sp=${encoded}&max=8&md=d`
  const data = await fetchWithTimeout(url)
  return buildCandidatesFromDatamuse(data, word)
}

export async function fetchDefinition(word, context = '') {
  const cleanedWord = cleanWord(word)

  if (!cleanedWord) {
    throw new Error('Invalid word.')
  }

  const baseWord = stripSimpleInflection(cleanedWord)

  const lookupWords = Array.from(new Set([cleanedWord, baseWord].filter(Boolean)))

  const results = await Promise.allSettled(
    lookupWords.flatMap((lookupWord) => [
      fetchDictionaryApiCandidates(lookupWord),
      fetchDatamuseCandidates(lookupWord),
    ])
  )

  const candidates = results
    .filter((result) => result.status === 'fulfilled')
    .flatMap((result) => result.value)
    .filter((candidate) => candidate?.definition)

  const best = selectBestCandidate(candidates, cleanedWord, context)

  if (!best) {
    throw new Error('Definition not found.')
  }

  return {
    word: cleanedWord,
    lookupWord: best.word || cleanedWord,
    partOfSpeech: best.partOfSpeech || 'meaning',
    definition: best.definition,
    example: best.example || '',
    source: best.source,
  }
}