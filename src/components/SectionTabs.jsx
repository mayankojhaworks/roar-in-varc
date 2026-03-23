const tabs = [
    { key: 'crucible', label: 'Daily Plan' },
    { key: 'war-room', label: 'Mock Analytics' },
    { key: 'focus-beats', label: 'Study Audio' },
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
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 ${
                isActive
                  ? 'border-sky-400 bg-sky-400/12 text-sky-300 shadow-[0_10px_24px_rgba(56,189,248,0.12)]'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900 hover:text-zinc-100'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    )
  }