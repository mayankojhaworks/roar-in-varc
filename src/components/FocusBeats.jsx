import { useEffect, useMemo, useRef, useState } from 'react'
import { tracks } from '../data/tracks'

function getRandomIndex(length, exclude = null) {
  if (length <= 1) return 0

  let index = Math.floor(Math.random() * length)

  while (index === exclude) {
    index = Math.floor(Math.random() * length)
  }

  return index
}

export default function FocusBeats() {
  const audioRef = useRef(null)
  const fadeIntervalRef = useRef(null)
  const currentIndexRef = useRef(0)
  const isTransitioningRef = useRef(false)

  const [currentIndex, setCurrentIndex] = useState(() => getRandomIndex(tracks.length))
  const [isPlaying, setIsPlaying] = useState(false)
  const [shuffle, setShuffle] = useState(true)
  const [loopTrack, setLoopTrack] = useState(false)

  const currentTrack = useMemo(() => tracks[currentIndex], [currentIndex])

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = 0.45
    audio.loop = loopTrack
  }, [loopTrack, currentIndex])

  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        window.clearInterval(fadeIntervalRef.current)
      }
    }
  }, [])

  const fadeTo = (targetVolume, duration = 500) => {
    return new Promise((resolve) => {
      const audio = audioRef.current
      if (!audio) {
        resolve()
        return
      }

      if (fadeIntervalRef.current) {
        window.clearInterval(fadeIntervalRef.current)
      }

      const startVolume = audio.volume
      const difference = targetVolume - startVolume
      const steps = 10
      const stepDuration = duration / steps
      let step = 0

      fadeIntervalRef.current = window.setInterval(() => {
        step += 1
        const nextVolume = startVolume + (difference * step) / steps
        audio.volume = Math.max(0, Math.min(0.45, nextVolume))

        if (step >= steps) {
          window.clearInterval(fadeIntervalRef.current)
          fadeIntervalRef.current = null
          audio.volume = Math.max(0, Math.min(0.45, targetVolume))
          resolve()
        }
      }, stepDuration)
    })
  }

  const startPlayback = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      audio.volume = 0
      await audio.play()
      await fadeTo(0.45, 500)
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }

  const pausePlayback = async () => {
    const audio = audioRef.current
    if (!audio) return

    await fadeTo(0, 350)
    audio.pause()
    audio.volume = 0.45
    setIsPlaying(false)
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.loop = loopTrack

    if (isPlaying) {
      startPlayback()
    } else {
      audio.pause()
      audio.volume = 0.45
    }
  }, [currentIndex])

  const changeTrack = async (nextIndex) => {
    const audio = audioRef.current
    if (!audio || isTransitioningRef.current) {
      setCurrentIndex(nextIndex)
      return
    }

    const wasPlaying = isPlaying
    isTransitioningRef.current = true

    if (wasPlaying) {
      await fadeTo(0, 350)
      audio.pause()
    }

    setCurrentIndex(nextIndex)

    window.setTimeout(async () => {
      const updatedAudio = audioRef.current
      if (!updatedAudio) {
        isTransitioningRef.current = false
        return
      }

      updatedAudio.currentTime = 0
      updatedAudio.volume = wasPlaying ? 0 : 0.45

      if (wasPlaying) {
        try {
          await updatedAudio.play()
          await fadeTo(0.45, 500)
          setIsPlaying(true)
        } catch {
          setIsPlaying(false)
        }
      }

      isTransitioningRef.current = false
    }, 80)
  }

  const goNext = async () => {
    const nextIndex = shuffle
      ? getRandomIndex(tracks.length, currentIndexRef.current)
      : (currentIndexRef.current + 1) % tracks.length

    await changeTrack(nextIndex)
  }

  const goPrev = async () => {
    const nextIndex = shuffle
      ? getRandomIndex(tracks.length, currentIndexRef.current)
      : (currentIndexRef.current - 1 + tracks.length) % tracks.length

    await changeTrack(nextIndex)
  }

  const handlePlayPause = async () => {
    if (isPlaying) {
      await pausePlayback()
    } else {
      await startPlayback()
    }
  }

  const handleTrackEnd = async () => {
    if (loopTrack) {
      const audio = audioRef.current
      if (!audio) return

      audio.currentTime = 0
      audio.volume = 0
      try {
        await audio.play()
        await fadeTo(0.45, 500)
      } catch {
        setIsPlaying(false)
      }
      return
    }

    await goNext()
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-[28px] border border-zinc-800 bg-zinc-900/70 p-5">
        <h2 className="text-2xl font-black text-zinc-100">Focus Beats</h2>

        <div className="mt-6 rounded-[24px] border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Now Playing</p>
          <h3 className="mt-3 text-2xl font-black text-sky-300">{currentTrack.title}</h3>
          <p className="mt-1 text-sm text-zinc-400">{currentTrack.artist}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
            {currentTrack.type}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={goPrev}
              className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-700"
            >
              Prev
            </button>

            <button
              type="button"
              onClick={handlePlayPause}
              className="rounded-full border border-sky-400 bg-sky-400 px-5 py-2 text-sm font-black text-zinc-950 transition hover:opacity-90"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <button
              type="button"
              onClick={goNext}
              className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-700"
            >
              Next
            </button>

            <button
              type="button"
              onClick={() => setShuffle((prev) => !prev)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                shuffle
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-300'
              }`}
            >
              Shuffle {shuffle ? 'On' : 'Off'}
            </button>

            <button
              type="button"
              onClick={() => setLoopTrack((prev) => !prev)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                loopTrack
                  ? 'border-sky-400 bg-sky-400/10 text-sky-300'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-300'
              }`}
            >
              Loop {loopTrack ? 'On' : 'Off'}
            </button>
          </div>

          <audio
            ref={audioRef}
            src={currentTrack.file}
            onEnded={handleTrackEnd}
            preload="metadata"
            className="hidden"
          />
        </div>
      </div>

      <div className="rounded-[28px] border border-zinc-800 bg-zinc-900/70 p-5">
        <p className="text-sm font-semibold text-zinc-400">Track Stack</p>

        <div className="mt-5 space-y-3">
          {tracks.map((track, index) => {
            const active = index === currentIndex

            return (
              <button
                key={track.file}
                type="button"
                onClick={() => changeTrack(index)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  active
                    ? 'border-sky-400 bg-sky-400/10'
                    : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                }`}
              >
                <div>
                  <p className={`text-sm font-semibold ${active ? 'text-sky-300' : 'text-zinc-100'}`}>
                    {track.title}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {track.artist}
                  </p>
                </div>

                <span className="text-xs text-zinc-500">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}