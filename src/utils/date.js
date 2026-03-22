export function parseDateOnly(value) {
    if (value instanceof Date) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12)
    }
  
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day, 12)
  }
  
  export function parseCountdownDate(value) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day, 0, 0, 0, 0)
  }
  
  export function addDays(dateValue, amount) {
    const date = parseDateOnly(dateValue)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount, 12)
  }
  
  export function formatIsoDate(dateValue) {
    const date = parseDateOnly(dateValue)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  export function formatDisplayDate(dateValue) {
    const date = parseDateOnly(dateValue)
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }
  
  export function formatShortDate(dateValue) {
    const date = parseDateOnly(dateValue)
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
    }).format(date)
  }
  
  export function isSameDay(first, second) {
    return formatIsoDate(first) === formatIsoDate(second)
  }
  
  export function compareDay(first, second) {
    const a = parseDateOnly(first).getTime()
    const b = parseDateOnly(second).getTime()
  
    if (a === b) return 0
    return a > b ? 1 : -1
  }
  
  export function getTodayDateOnly() {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)
  }