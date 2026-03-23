import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import * as cheerio from 'cheerio'
import { CAT_TARGET_DATE, CRUCIBLE_START_DATE } from '../src/utils/constants.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

function getInclusiveDayCount(startDate, endDate) {
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)

  const start = new Date(sy, sm - 1, sd, 12)
  const end = new Date(ey, em - 1, ed, 12)

  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1
}

const TOTAL_MISSIONS = getInclusiveDayCount(CRUCIBLE_START_DATE, CAT_TARGET_DATE)

const INPUTS = {
  articles: path.join(rootDir, 'content', 'raw', 'articles.txt'),
  cr: path.join(rootDir, 'content', 'raw', 'cr.txt'),
  rc: path.join(rootDir, 'content', 'raw', 'rc.txt'),
}

const OUTPUT_DIR = path.join(rootDir, 'src', 'data', 'generated')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'missionPlan.json')

const SOURCE_LABELS = {
  'aeon.co': 'Aeon',
  'psyche.co': 'Psyche',
  'noemamag.com': 'Noema',
  'placesjournal.org': 'Places Journal',
  'cabinetmagazine.org': 'Cabinet Magazine',
  '3quarksdaily.com': '3 Quarks Daily',
  'laphamsquarterly.org': "Lapham's Quarterly",
  'asteriskmag.com': 'Asterisk',
  'scientificamerican.com': 'Scientific American',
  'hedgehogreview.com': 'The Hedgehog Review',
  'gmatclub.com': 'GMAT Club',
}

function normalizeHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'unknown-domain'
  }
}

function sourceFromUrl(url) {
  const hostname = normalizeHostname(url)
  return SOURCE_LABELS[hostname] || hostname
}

function fallbackTitleFromUrl(url) {
  try {
    const parsed = new URL(url)
    const last = parsed.pathname.split('/').filter(Boolean).pop() || parsed.hostname

    return decodeURIComponent(last)
      .replace(/[-_]+/g, ' ')
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/\s+/g, ' ')
      .trim()
  } catch {
    return 'Untitled Link'
  }
}

function cleanTitle(title) {
  if (!title) return ''

  return title
    .replace(/\s+\|\s+GMAT Club.*$/i, '')
    .replace(/\s+\|\s+Aeon.*$/i, '')
    .replace(/\s+\|\s+Psyche.*$/i, '')
    .replace(/\s+\|\s+Noema.*$/i, '')
    .replace(/\s+\|\s+Places Journal.*$/i, '')
    .replace(/\s+\|\s+Cabinet Magazine.*$/i, '')
    .replace(/\s+\|\s+3 Quarks Daily.*$/i, '')
    .replace(/\s+\|\s+Lapham.*$/i, '')
    .replace(/\s+\|\s+Scientific American.*$/i, '')
    .replace(/\s+\|\s+The Hedgehog Review.*$/i, '')
    .replace(/\s+-\s+GMAT Club.*$/i, '')
    .replace(/\s+-\s+Aeon.*$/i, '')
    .replace(/\s+-\s+Psyche.*$/i, '')
    .replace(/\s+-\s+Noema.*$/i, '')
    .replace(/\s+-\s+Places Journal.*$/i, '')
    .replace(/\s+-\s+Scientific American.*$/i, '')
    .replace(/\s+-\s+The Hedgehog Review.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function readUrlLines(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8')

    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

function dedupeUrls(urls) {
  return [...new Set(urls)]
}

async function fetchMeta(url, kind) {
  const baseSource = sourceFromUrl(url)

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari',
      },
    })

    const html = await response.text()
    const $ = cheerio.load(html)

    const ogTitle = $('meta[property="og:title"]').attr('content')?.trim()
    const twitterTitle = $('meta[name="twitter:title"]').attr('content')?.trim()
    const titleTag = $('title').text()?.trim()
    const ogSite = $('meta[property="og:site_name"]').attr('content')?.trim()

    const rawTitle = ogTitle || twitterTitle || titleTag || fallbackTitleFromUrl(url)
    const blockedTitle =
      /just a moment|attention required|cloudflare/i.test(rawTitle || '')

    const source =
      kind === 'cr' || kind === 'rc'
        ? 'GMAT Club'
        : ogSite || baseSource

    return {
      title:
        kind === 'cr'
          ? ''
          : blockedTitle
            ? fallbackTitleFromUrl(url)
            : cleanTitle(rawTitle) || fallbackTitleFromUrl(url),
      source,
      url,
    }
  } catch {
    return {
      title: kind === 'cr' ? '' : fallbackTitleFromUrl(url),
      source: kind === 'cr' || kind === 'rc' ? 'GMAT Club' : baseSource,
      url,
    }
  }
}

function dedupeItems(items) {
  const seen = new Set()

  return items.filter((item) => {
    const key = item.url
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function shuffleArray(items) {
  return [...items].sort(() => Math.random() - 0.5)
}

function hasAdjacentDuplicateSource(items) {
  for (let index = 1; index < items.length; index += 1) {
    if (items[index - 1].source === items[index].source) {
      return true
    }
  }

  return false
}

function shuffleAvoidAdjacentSource(items) {
  if (items.length <= 1) return [...items]

  const distinctSources = new Set(items.map((item) => item.source))
  if (distinctSources.size <= 1) {
    return shuffleArray(items)
  }

  let bestAttempt = [...items]

  for (let attempt = 0; attempt < 300; attempt += 1) {
    const pool = shuffleArray(items)
    const result = []

    while (pool.length > 0) {
      const lastSource = result.length ? result[result.length - 1].source : null
      let nextIndex = pool.findIndex((item) => item.source !== lastSource)

      if (nextIndex === -1) {
        nextIndex = 0
      }

      result.push(pool.splice(nextIndex, 1)[0])
    }

    if (!hasAdjacentDuplicateSource(result)) {
      return result
    }

    bestAttempt = result
  }

  return bestAttempt
}

function addDays(dateString, amount) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day + amount, 12)
}

function toIsoDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getWrappedItems(items, startIndex, count) {
  if (!items.length) return []

  return Array.from({ length: count }, (_, index) => {
    return items[(startIndex + index) % items.length]
  })
}

function getSafeArticlePair(items, startIndex) {
  if (!items.length) return []

  if (items.length === 1) {
    return [items[0], items[0]]
  }

  const first = items[startIndex % items.length]

  for (let offset = 1; offset < items.length; offset += 1) {
    const candidate = items[(startIndex + offset) % items.length]
    if (candidate.source !== first.source) {
      return [first, candidate]
    }
  }

  return [first, items[(startIndex + 1) % items.length]]
}

function buildMissionPlan({ articlePool, crPool, rcPool }) {
  const orderedArticles = shuffleAvoidAdjacentSource(articlePool)
  const orderedCR = shuffleAvoidAdjacentSource(crPool)
  const orderedRC = shuffleAvoidAdjacentSource(rcPool)

  return Array.from({ length: TOTAL_MISSIONS }, (_, index) => {
    const missionDate = addDays(CRUCIBLE_START_DATE, index)

    return {
      dayNumber: index + 1,
      date: toIsoDate(missionDate),
      articles: getSafeArticlePair(orderedArticles, index * 2),
      crQuestions: getWrappedItems(orderedCR, index * 2, 2),
      rcPassage: getWrappedItems(orderedRC, index, 1)[0] || null,
    }
  })
}

async function build() {
  const [articleUrlsRaw, crUrlsRaw, rcUrlsRaw] = await Promise.all([
    readUrlLines(INPUTS.articles),
    readUrlLines(INPUTS.cr),
    readUrlLines(INPUTS.rc),
  ])

  const articleUrls = dedupeUrls(articleUrlsRaw)
  const crUrls = dedupeUrls(crUrlsRaw)
  const rcUrls = dedupeUrls(rcUrlsRaw)

  console.log(`Found ${articleUrls.length} article URLs`)
  console.log(`Found ${crUrls.length} CR URLs`)
  console.log(`Found ${rcUrls.length} RC URLs`)
  console.log(`Generating ${TOTAL_MISSIONS} daily entries from ${CRUCIBLE_START_DATE} to ${CAT_TARGET_DATE}`)

  const articles = dedupeItems(
    await Promise.all(articleUrls.map((url) => fetchMeta(url, 'article')))
  )

  const cr = dedupeItems(
    await Promise.all(crUrls.map((url) => fetchMeta(url, 'cr')))
  )

  const rc = dedupeItems(
    await Promise.all(rcUrls.map((url) => fetchMeta(url, 'rc')))
  )

  const missionPlan = buildMissionPlan({
    articlePool: articles,
    crPool: cr,
    rcPool: rc,
  })

  await fs.mkdir(OUTPUT_DIR, { recursive: true })
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(missionPlan, null, 2), 'utf8')

  console.log(`Generated mission plan at ${OUTPUT_FILE}`)
}

build().catch((error) => {
  console.error(error)
  process.exit(1)
})