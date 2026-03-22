import { useState } from 'react'
import AppShell from './components/AppShell'
import DataBackup from './components/DataBackup'
import FocusBeats from './components/FocusBeats'
import MissionGrid from './components/MissionGrid'
import WarRoom from './components/WarRoom'
import missionPlan from './data/generated/missionPlan.json'
import { useLocalStorage } from './hooks/useLocalStorage'

export default function App() {
  const [activeTab, setActiveTab] = useState('crucible')
  const [missionState, setMissionState] = useLocalStorage('roar-in-varc-missions', {})
  const [warRoomRecords, setWarRoomRecords] = useLocalStorage('roar-in-varc-war-room', [])

  const handleMissionUpdate = (dayNumber, patch) => {
    setMissionState((prev) => ({
      ...prev,
      [dayNumber]: {
        ...(prev[dayNumber] || {}),
        ...patch,
      },
    }))
  }

  const handleAddRecord = (record) => {
    setWarRoomRecords((prev) => [...prev, record])
  }

  const handleDeleteRecord = (recordId) => {
    setWarRoomRecords((prev) => prev.filter((record) => record.id !== recordId))
  }

  const handleImportBackup = (payload) => {
    setMissionState(payload.missionState || {})
    setWarRoomRecords(payload.warRoomRecords || [])
  }

  const handleClearAllProgress = () => {
    const confirmed = window.confirm(
      'This will remove your saved mission progress and War Room records from this browser. Continue?'
    )

    if (!confirmed) return

    setMissionState({})
    setWarRoomRecords([])
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'crucible' ? (
        <MissionGrid
          missions={missionPlan}
          missionState={missionState}
          onMissionUpdate={handleMissionUpdate}
        />
      ) : null}

      {activeTab === 'war-room' ? (
        <WarRoom
          records={warRoomRecords}
          onAddRecord={handleAddRecord}
          onDeleteRecord={handleDeleteRecord}
        />
      ) : null}

      {activeTab === 'focus-beats' ? <FocusBeats /> : null}

      {activeTab === 'data-backup' ? (
        <DataBackup
          missionState={missionState}
          warRoomRecords={warRoomRecords}
          onImportBackup={handleImportBackup}
          onClearAllProgress={handleClearAllProgress}
        />
      ) : null}
    </AppShell>
  )
}