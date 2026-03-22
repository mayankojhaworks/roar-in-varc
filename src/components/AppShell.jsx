import GlobalHeader from './GlobalHeader'
import SectionTabs from './SectionTabs'

export default function AppShell({ activeTab, onTabChange, children }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <GlobalHeader />

      <main className="mx-auto max-w-7xl px-4 pb-10 pt-[12.5rem] sm:pt-[12rem] lg:pt-[11.5rem]">
        <div className="mb-6 rounded-[28px] border border-zinc-800 bg-zinc-900/60 p-4">
          <SectionTabs activeTab={activeTab} onChange={onTabChange} />
        </div>

        {children}
      </main>
    </div>
  )
}