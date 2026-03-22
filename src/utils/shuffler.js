export function getDomainFromUrl(url) {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return 'unknown-domain'
    }
  }
  
  function hasAdjacentDuplicateDomain(items) {
    for (let index = 1; index < items.length; index += 1) {
      const prev = getDomainFromUrl(items[index - 1].url)
      const current = getDomainFromUrl(items[index].url)
  
      if (prev === current) {
        return true
      }
    }
  
    return false
  }
  
  export function shuffleAvoidConsecutiveDomains(items) {
    if (!Array.isArray(items) || items.length <= 1) {
      return [...(items || [])]
    }
  
    let bestAttempt = [...items]
  
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const pool = [...items].sort(() => Math.random() - 0.5)
      const result = []
  
      while (pool.length > 0) {
        const lastDomain =
          result.length > 0 ? getDomainFromUrl(result[result.length - 1].url) : null
  
        let nextIndex = pool.findIndex((item) => getDomainFromUrl(item.url) !== lastDomain)
  
        if (nextIndex === -1) {
          nextIndex = 0
        }
  
        result.push(pool.splice(nextIndex, 1)[0])
      }
  
      if (!hasAdjacentDuplicateDomain(result)) {
        return result
      }
  
      bestAttempt = result
    }
  
    return bestAttempt
  }