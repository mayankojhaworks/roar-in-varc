export default function LineChartCard({ title, data, suffix = '' }) {
    if (!data.length) {
      return (
        <div className="rounded-[28px] border border-zinc-800 bg-zinc-900/70 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            {title}
          </p>
          <div className="mt-6 flex h-56 items-center justify-center rounded-2xl border border-dashed border-zinc-800 text-sm text-zinc-500">
            Add records to unlock the chart
          </div>
        </div>
      )
    }
  
    const width = 640
    const height = 240
    const padding = 28
  
    const values = data.map((item) => Number(item.value) || 0)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const stepX = data.length === 1 ? 0 : (width - padding * 2) / (data.length - 1)
  
    const points = data
      .map((item, index) => {
        const value = Number(item.value) || 0
        const x = padding + index * stepX
        const y = height - padding - ((value - min) / range) * (height - padding * 2)
        return `${x},${y}`
      })
      .join(' ')
  
    const lastValue = values[values.length - 1]
  
    return (
      <div className="rounded-[28px] border border-zinc-800 bg-zinc-900/70 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            {title}
          </p>
  
          <div className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
            Latest: {lastValue}
            {suffix}
          </div>
        </div>
  
        <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full">
            {[0, 1, 2, 3].map((row) => {
              const y = padding + (row * (height - padding * 2)) / 3
              return (
                <line
                  key={row}
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="rgba(63,63,70,0.5)"
                  strokeWidth="1"
                />
              )
            })}
  
            <polyline
              fill="none"
              stroke="#7dd3fc"
              strokeWidth="3"
              points={points}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
  
            {data.map((item, index) => {
              const value = Number(item.value) || 0
              const x = padding + index * stepX
              const y = height - padding - ((value - min) / range) * (height - padding * 2)
  
              return <circle key={`${item.label}-${index}`} cx={x} cy={y} r="4" fill="#34d399" />
            })}
          </svg>
        </div>
  
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
          <span>Min: {min}{suffix}</span>
          <span>Max: {max}{suffix}</span>
        </div>
      </div>
    )
  }