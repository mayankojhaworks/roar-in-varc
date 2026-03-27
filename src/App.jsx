import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase' // Double check your firebase.js path

import AppShell from './components/AppShell'
import DataBackup from './components/DataBackup'
import FocusBeats from './components/FocusBeats'
import MissionGrid from './components/MissionGrid'
import WarRoom from './components/WarRoom'
import missionPlan from './data/generated/missionPlan.json'
import { useLocalStorage } from './hooks/useLocalStorage'

export default function App() {
  const [activeTab, setActiveTab] = useState('crucible')
  const [user, setUser] = useState(null)
  
  // 1. Existing Local Storage Logic (DO NOT CHANGE)
  const [missionState, setMissionState] = useLocalStorage('roar-in-varc-missions', {})
  const [warRoomRecords, setWarRoomRecords] = useLocalStorage('roar-in-varc-war-room', [])

  // 2. Auth Listener: Detects login/logout
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        // If logged in, check if there's better data in the cloud
        await fetchFromCloud(currentUser.uid)
      }
    })
    return () => unsubscribe()
  }, [])

  // 3. Fetch from Cloud: Only runs once on login
  const fetchFromCloud = async (uid) => {
    try {
      const snap = await getDoc(doc(db, "users", uid))
      if (snap.exists()) {
        const data = snap.data()
        // Update local state with cloud data
        if (data.missionState) setMissionState(data.missionState)
        if (data.warRoomRecords) setWarRoomRecords(data.warRoomRecords)
      }
    } catch (e) { console.error("Sync Error", e) }
  }

  // 4. Save to Cloud: Helper function
  const pushToCloud = async (newMissions, newRecords) => {
    if (!auth.currentUser) return
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        missionState: newMissions,
        warRoomRecords: newRecords,
        lastUpdated: new Date().toISOString()
      }, { merge: true })
    } catch (e) { console.error("Save Error", e) }
  }

  // --- Handlers (Now including silent cloud push) ---

  const handleMissionUpdate = (dayNumber, patch) => {
    setMissionState((prev) => {
      const updated = { ...prev, [dayNumber]: { ...(prev[dayNumber] || {}), ...patch } }
      pushToCloud(updated, warRoomRecords) // Silent push
      return updated
    })
  }

  const handleAddRecord = (record) => {
    setWarRoomRecords((prev) => {
      const updated = [...prev, record]
      pushToCloud(missionState, updated)
      return updated
    })
  }

  const handleDeleteRecord = (recordId) => {
    setWarRoomRecords((prev) => {
      const updated = prev.filter((r) => r.id !== recordId)
      pushToCloud(missionState, updated)
      return updated
    })
  }

  const handleImportBackup = (payload) => {
    const ms = payload.missionState || {}
    const wr = payload.warRoomRecords || []
    setMissionState(ms)
    setWarRoomRecords(wr)
    pushToCloud(ms, wr)
  }

  const handleClearAllProgress = () => {
    if (window.confirm('Wipe local data? Cloud data is safe if you are logged in.')) {
      setMissionState({})
      setWarRoomRecords([])
    }
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      <div className={activeTab === 'crucible' ? 'block' : 'hidden'}>
        <MissionGrid missions={missionPlan} missionState={missionState} onMissionUpdate={handleMissionUpdate} />
      </div>

      <div className={activeTab === 'war-room' ? 'block' : 'hidden'}>
        <WarRoom records={warRoomRecords} onAddRecord={handleAddRecord} onDeleteRecord={handleDeleteRecord} />
      </div>

      <div className={activeTab === 'focus-beats' ? 'block' : 'hidden'}>
        <FocusBeats />
      </div>

      <div className={activeTab === 'data-backup' ? 'block' : 'hidden'}>
        <DataBackup
          user={user} // Make sure DataBackup expects this prop
          missionState={missionState}
          warRoomRecords={warRoomRecords}
          onImportBackup={handleImportBackup}
          onClearAllProgress={handleClearAllProgress}
        />
      </div>
    </AppShell>
  )
}