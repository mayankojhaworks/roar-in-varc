import { useCountdown } from '../hooks/useCountdown'

export default function CountdownPill({ label, date }) {
  const { days, hours, minutes, seconds } = useCountdown(date)

  return (
    <div
      style={{
        background: '#f5efe6',
        borderRadius: '24px',
        border: '1px solid rgba(47, 42, 38, 0.08)',
        boxShadow:
          '-6px -6px 12px rgba(255,255,255,0.72), 6px 6px 14px rgba(185,170,150,0.35)',
        padding: '18px 20px',
        minHeight: '168px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: '"Segoe Print", "Comic Sans MS", cursive',
            fontSize: '14px',
            color: '#6e655d',
            marginBottom: '4px',
          }}
        >
          countdown
        </div>

        <p
          style={{
            margin: 0,
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#2f2a26',
          }}
        >
          {label}
        </p>
      </div>

      <div style={{ marginTop: '18px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontSize: '76px',
              lineHeight: 0.88,
              fontWeight: 900,
              letterSpacing: '-0.05em',
              color: '#9c8cff',
            }}
          >
            {days}
          </span>

          <span
            style={{
              fontFamily: '"Segoe Print", "Comic Sans MS", cursive',
              fontSize: '28px',
              lineHeight: 1,
              color: '#2f2a26',
              paddingBottom: '9px',
            }}
          >
            days
          </span>
        </div>

        <p
          style={{
            margin: '10px 0 0',
            fontSize: '15px',
            fontWeight: 600,
            color: '#2f2a26',
          }}
        >
          {String(hours).padStart(2, '0')}h : {String(minutes).padStart(2, '0')}m :{' '}
          {String(seconds).padStart(2, '0')}s
        </p>
      </div>
    </div>
  )
}