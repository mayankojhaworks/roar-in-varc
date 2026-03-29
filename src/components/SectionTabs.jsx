const tabs = [
  { key: 'crucible', label: 'Daily Plan' },
  { key: 'war-room', label: 'Mock Analytics' },
  { key: 'focus-beats', label: 'Study Audio' },
  { key: 'data-backup', label: 'Data Backup' },
]

export default function SectionTabs({ activeTab, onChange }) {
  return (
    <nav
      aria-label="Primary"
      className="nav-links-container" /* THE FIX: Applied mobile container class */
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <style>{`
        .nav-tab-link {
          background: none; border: none; padding: 0; margin: 0;
          color: rgba(51, 51, 51, 0.6); /* muted charcoal */
          font-family: var(--font-sketch);
          font-size: 1.05rem;
          transition: all 0.3s ease;
          border-bottom: 2px solid transparent;
        }
        .nav-tab-link:hover, .nav-tab-link.active {
          color: var(--main-charcoal);
          border-bottom: 2px solid var(--hover-peach);
        }
      `}</style>
      
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key

        return (
          <button
            key={tab.key}
            type="button"
            /* THE FIX: Added active-nav-btn for mobile targeting */
            className={`nav-tab-link ${isActive ? 'active active-nav-btn' : ''}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}