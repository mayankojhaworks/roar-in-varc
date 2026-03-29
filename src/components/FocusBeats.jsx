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

const Icons = {
  Play: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3.5c-.5-.3-1.1-.3-1.6 0-.5.3-.9.9-.9 1.5v14c0 .6.4 1.2.9 1.5.5.3 1.1.3 1.6 0l13-7c.5-.3.8-.8.8-1.5s-.3-1.2-.8-1.5l-13-7z" />
    </svg>
  ),
  Pause: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
    </svg>
  ),
  Next: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4l10 8-10 8M19 4v16" />
    </svg>
  ),
  Prev: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 20L9 12l10-8M5 20V4" />
    </svg>
  )
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

  const fadeTo = (targetVolume, duration = 500) => {
    return new Promise((resolve) => {
      const audio = audioRef.current
      if (!audio) { resolve(); return; }
      if (fadeIntervalRef.current) window.clearInterval(fadeIntervalRef.current)
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
    } catch { setIsPlaying(false) }
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
    if (isPlaying) startPlayback()
    else { audio.pause(); audio.volume = 0.45; }
  }, [currentIndex])

  const changeTrack = async (nextIndex) => {
    const audio = audioRef.current
    if (!audio || isTransitioningRef.current) {
      setCurrentIndex(nextIndex); return;
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
      if (!updatedAudio) { isTransitioningRef.current = false; return; }
      updatedAudio.currentTime = 0
      updatedAudio.volume = wasPlaying ? 0 : 0.45
      if (wasPlaying) {
        try {
          await updatedAudio.play()
          await fadeTo(0.45, 500)
          setIsPlaying(true)
        } catch { setIsPlaying(false) }
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
    if (isPlaying) await pausePlayback()
    else await startPlayback()
  }

  return (
    <section className="focus-beats-layout">
      <style>{`
        .focus-beats-layout {
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
        }

        .focus-beats-island {
            display: flex;
            flex-direction: column;
            height: 100%;
            min-height: 0; 
            overflow: hidden; 
        }

        .playlist-scroll-area {
            flex: 1;
            overflow-y: auto;
            padding-bottom: 20px;
        }

        /* THE FIX: Unlinking the rigid grid on mobile so you can scroll smoothly */
        @media (max-width: 768px) {
            .focus-beats-layout {
                display: flex;
                flex-direction: column;
                overflow-y: auto; /* Makes the whole page scrollable */
                padding-bottom: 40px;
            }
            .player-island {
                height: auto; 
                flex-shrink: 0; /* Prevents the player from crushing */
                padding: 20px !important;
                overflow: visible !important;
            }
            .focus-beats-island {
                height: auto;
                overflow: visible;
            }
            .playlist-scroll-area {
                overflow-y: visible; /* Disables internal scroll, moves it to the parent */
                padding-bottom: 0;
            }
        }

        /* Existing Styles */
        .player-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--hover-peach); letter-spacing: 0.2em; }
        
        .main-control-btn {
          background: var(--base-cream); 
          border: 2px solid var(--main-charcoal);
          padding: 12px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 4px 4px 0px var(--main-charcoal);
          color: var(--main-charcoal);
        }
        
        .main-control-btn:hover {
          transform: translate(-1px, -1px);
          box-shadow: 6px 6px 0px var(--main-charcoal);
          color: var(--highlight-blue);
        }

        .play-pause-btn:hover {
          color: #FFEB3B !important;
        }

        .main-control-btn:active {
          transform: translate(3px, 3px);
          box-shadow: 1px 1px 0px var(--main-charcoal);
        }

        .play-pause-btn {
          width: 70px; height: 70px;
          background: var(--highlight-blue);
          color: white;
        }

        .secondary-btn {
          background: none;
          border: 1.5px dashed var(--main-charcoal);
          padding: 6px 14px;
          border-radius: 12px;
          font-family: var(--font-sketch);
          font-size: 0.85rem;
          transition: all 0.2s;
          opacity: 0.6;
        }

        .secondary-btn.active {
          opacity: 1;
          border-style: solid;
          background: var(--hover-peach);
          color: white;
          border-color: var(--main-charcoal);
        }

        .track-list-item {
          background: none; border: none; padding: 14px 20px; width: 100%; text-align: left;
          border-bottom: 1px solid rgba(0,0,0,0.05); transition: all 0.3s; cursor: pointer;
          display: flex; justify-content: space-between; align-items: center;
          position: relative; z-index: 1;
        }

        .track-list-item.active::before {
          content: ''; position: absolute; top: 10%; left: 5%; width: 90%; height: 80%;
          background: rgba(125, 124, 207, 0.15);
          transform: skew(-2deg) rotate(-0.5deg);
          border-radius: 4px;
          z-index: -1;
        }

        .tape-element {
          border: 2px solid var(--main-charcoal);
          border-radius: 8px;
          padding: 30px;
          position: relative;
          background: white;
          box-shadow: inset 0 0 15px rgba(0,0,0,0.05);
        }

        .tape-element::after {
          content: ''; position: absolute; top: 10px; right: 10px; width: 15px; height: 15px;
          border: 1.5px solid var(--main-charcoal); border-radius: 50%; opacity: 0.2;
        }
      `}</style>

      {/* Player Section */}
      <div className="island sketch-border focus-beats-island player-island" style={{ padding: '30px', justifyContent: 'center' }}>
        
        <div className="tape-element music-player-card">
          <h2 style={{ fontFamily: 'var(--font-sketch)', fontSize: '2.2rem', margin: '0 0 8px 0', color: 'var(--main-charcoal)', lineHeight: 1 }}>
            {currentTrack.title}
          </h2>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '1.2rem', fontFamily: 'var(--font-sketch)' }}>{currentTrack.artist}</p>
          
          <div style={{ marginTop: '15px', padding: '5px 12px', border: '1.5px solid var(--main-charcoal)', borderRadius: '4px', display: 'inline-block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', transform: 'rotate(-1deg)' }}>
            TYPE: {currentTrack.type}
          </div>
        </div>

        {/* Playback Controls */}
        <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px' }}>
          <button type="button" onClick={goPrev} className="main-control-btn" title="Previous">
            <Icons.Prev />
          </button>
          
          <button type="button" onClick={handlePlayPause} className="main-control-btn play-pause-btn" title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Icons.Pause /> : <Icons.Play />}
          </button>
          
          <button type="button" onClick={goNext} className="main-control-btn" title="Next">
            <Icons.Next />
          </button>
        </div>

        {/* Logic Controls */}
        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <button 
            type="button" 
            onClick={() => setShuffle(p => !p)} 
            className={`secondary-btn ${shuffle ? 'active' : ''}`}
          >
            {shuffle ? '✓ Shuffle Active' : 'Shuffle Off'}
          </button>
          <button 
            type="button" 
            onClick={() => setLoopTrack(p => !p)} 
            className={`secondary-btn ${loopTrack ? 'active' : ''}`}
          >
            {loopTrack ? '✓ Loop Active' : 'Loop Off'}
          </button>
        </div>

        <audio
          ref={audioRef}
          src={currentTrack.file}
          onEnded={() => !loopTrack && goNext()}
          preload="metadata"
          className="hidden"
        />
      </div>

      {/* Playlist Section */}
      <div className="island sketch-border no-hover-lift focus-beats-island" style={{ padding: '0' }}>
        <div style={{ padding: '20px 25px 10px' }}>
            <p className="player-label">Soundtrack Log</p>
        </div>
        
        <div className="playlist-scroll-area">
          {tracks.map((track, index) => {
            const active = index === currentIndex
            return (
              <button
                key={track.file}
                type="button"
                onClick={() => changeTrack(index)}
                className={`track-list-item ${active ? 'active' : ''}`}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: active ? 800 : 500, fontSize: '1rem', color: active ? 'var(--highlight-lavender)' : 'inherit' }}>
                    {track.title}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {track.artist}
                  </p>
                </div>
                <span style={{ fontFamily: 'var(--font-sketch)', opacity: 0.4, fontSize: '0.9rem' }}>
                    #{String(index + 1).padStart(2, '0')}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}