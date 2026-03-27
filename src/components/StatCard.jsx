export default function StatCard({ label, value, color }) {
  return (
    <div className="island sketch-border" style={{ padding: '12px 15px', textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6, letterSpacing: '0.1em' }}>
        {label}
      </p>
      <p style={{ margin: '5px 0 0', fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-sketch)', color: color || 'var(--main-charcoal)' }}>
        {value}
      </p>
    </div>
  )
}