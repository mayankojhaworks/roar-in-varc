import { useEffect, useMemo, useState } from 'react'
import { parseCountdownDate } from '../utils/date'

export function useCountdown(targetDate) {
  const target = useMemo(() => parseCountdownDate(targetDate).getTime(), [targetDate])
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  const difference = Math.max(target - now, 0)

  const days = Math.floor(difference / (1000 * 60 * 60 * 24))
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((difference / (1000 * 60)) % 60)
  const seconds = Math.floor((difference / 1000) % 60)

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: difference <= 0,
  }
}