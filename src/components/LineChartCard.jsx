export default function LineChartCard({ title, data, suffix = '' }) {
  const width = 640; const height = 200; const padding = 30;

  if (!data.length) {
    return (
      <div className="island sketch-border no-hover-lift" style={{ height: '240px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ opacity: 0.4, fontFamily: 'var(--font-sketch)' }}>Add records to generate {title}</p>
      </div>
    );
  }

  const values = data.map((d) => Number(d.value) || 0)
  const min = Math.min(...values); const max = Math.max(...values)
  const range = max - min || 1
  const stepX = data.length === 1 ? 0 : (width - padding * 2) / (data.length - 1)

  const points = data.map((d, i) => {
    const x = padding + i * stepX
    const y = height - padding - ((Number(d.value) - min) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="island sketch-border" style={{ padding: '15px' }}>
      <p className="form-label" style={{ marginBottom: '10px' }}>{title}</p>
      <div style={{ background: '#FFF', borderRadius: '10px', padding: '10px', border: '1px solid rgba(0,0,0,0.05)' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '160px' }}>
          {[0, 1, 2].map((r) => {
            const y = padding + (r * (height - padding * 2)) / 2
            return <line key={r} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
          })}
          <polyline fill="none" stroke="var(--highlight-blue)" strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" />
          {data.map((d, i) => {
            const x = padding + i * stepX
            const y = height - padding - ((Number(d.value) - min) / range) * (height - padding * 2)
            return <circle key={i} cx={x} cy={y} r="4" fill="var(--highlight-green)" />
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.7rem', opacity: 0.6 }}>
        <span>Min: {min}{suffix}</span><span>Max: {max}{suffix}</span>
      </div>
    </div>
  )
}