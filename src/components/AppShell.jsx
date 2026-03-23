import GlobalHeader from './GlobalHeader'
import SectionTabs from './SectionTabs'

export default function AppShell({ activeTab, onTabChange, children }) {
  return (
    <div className="min-h-screen bg-[#040608] text-zinc-100">
      <GlobalHeader />

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-[15rem] sm:pt-[15.5rem] lg:pt-[16rem]">
        <div className="mb-6 rounded-[28px] border border-zinc-800 bg-[linear-gradient(135deg,rgba(10,10,12,0.94),rgba(15,19,28,0.84))] p-4 shadow-[0_16px_50px_rgba(0,0,0,0.2)]">
          <SectionTabs activeTab={activeTab} onChange={onTabChange} />
        </div>

        {children}
      </main>
    </div>
  )
}