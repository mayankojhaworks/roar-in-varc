import { useRef, useState } from 'react'

export default function DataBackup({
  missionState,
  warRoomRecords,
  onImportBackup,
  onClearAllProgress,
}) {
  const fileInputRef = useRef(null)
  const [message, setMessage] = useState('')

  const completedCount = Object.values(missionState).filter(
    (item) => item?.completed
  ).length

  const handleExport = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      missionState,
      warRoomRecords,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })

    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const today = new Date().toISOString().slice(0, 10)

    anchor.href = url
    anchor.download = `roar-in-varc-backup-${today}.json`
    anchor.click()

    window.URL.revokeObjectURL(url)
    setMessage('Backup exported successfully.')
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = JSON.parse(text)

      const nextMissionState =
        parsed && typeof parsed.missionState === 'object' && parsed.missionState !== null
          ? parsed.missionState
          : {}

      const nextWarRoomRecords = Array.isArray(parsed?.warRoomRecords)
        ? parsed.warRoomRecords
        : []

      onImportBackup({
        missionState: nextMissionState,
        warRoomRecords: nextWarRoomRecords,
      })

      setMessage('Backup imported successfully.')
    } catch {
      setMessage('Import failed. Please choose a valid backup JSON file.')
    }

    event.target.value = ''
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-zinc-800 bg-zinc-900/70 p-6">
        <h2 className="text-2xl font-black text-zinc-100">Data Backup</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
          Export or restore your personal progress data. This includes mission completion,
          remarks, and War Room records stored in your browser.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-900/70 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Current Progress
          </p>

          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <p>Completed missions: <span className="font-bold text-zinc-100">{completedCount}</span></p>
            <p>War Room records: <span className="font-bold text-zinc-100">{warRoomRecords.length}</span></p>
          </div>
        </div>

        <div className="rounded-[24px] border border-zinc-800 bg-zinc-900/70 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Backup Actions
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="rounded-2xl border border-sky-400 bg-sky-400 px-5 py-3 text-sm font-black text-zinc-950 transition hover:opacity-90"
            >
              Export Backup
            </button>

            <button
              type="button"
              onClick={handleImportClick}
              className="rounded-2xl border border-zinc-700 bg-zinc-950 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500"
            >
              Import Backup
            </button>

            <button
              type="button"
              onClick={onClearAllProgress}
              className="rounded-2xl border border-red-900 bg-red-950/30 px-5 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-950/50"
            >
              Clear Progress
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      ) : null}
    </section>
  )
}