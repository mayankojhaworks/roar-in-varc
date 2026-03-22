const tabs = [
    { key: 'crucible', label: '300-Day Crucible' },
    { key: 'war-room', label: 'War Room' },
    { key: 'focus-beats', label: 'Focus Beats' },
    { key: 'data-backup', label: 'Data Backup' },
  ]
  
  export default function SectionTabs({ activeTab, onChange }) {
    return (
      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
  
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'border-sky-400 bg-sky-400/10 text-sky-300'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    )
  }