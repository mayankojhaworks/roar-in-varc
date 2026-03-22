import { addDays, formatIsoDate } from './date'
import { shuffleAvoidConsecutiveDomains } from './shuffler'

function getWrappedItems(items, startIndex, count) {
  if (!items.length) return []

  return Array.from({ length: count }, (_, index) => {
    return items[(startIndex + index) % items.length]
  })
}

export function buildMissionPlan({
  startDate,
  totalDays,
  articlePool,
  crPool,
  rcPool,
}) {
  const shuffledArticles = shuffleAvoidConsecutiveDomains(articlePool)
  const shuffledCR = shuffleAvoidConsecutiveDomains(crPool)
  const shuffledRC = shuffleAvoidConsecutiveDomains(rcPool)

  return Array.from({ length: totalDays }, (_, index) => {
    const missionDate = addDays(startDate, index)

    return {
      dayNumber: index + 1,
      date: formatIsoDate(missionDate),
      articles: getWrappedItems(shuffledArticles, index * 2, 2),
      crQuestions: getWrappedItems(shuffledCR, index * 2, 2),
      rcPassage: getWrappedItems(shuffledRC, index, 1)[0] || null,
    }
  })
}