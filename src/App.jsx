import { useState, useEffect, useMemo } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase' 
import AppShell from './components/AppShell'
import DataBackup from './components/DataBackup'
import FocusBeats from './components/FocusBeats'
import MissionGrid from './components/MissionGrid'
import WarRoom from './components/WarRoom'
import missionPlanRaw from './data/generated/missionPlan.json' // <-- We import it as RAW now
import { useLocalStorage } from './hooks/useLocalStorage'

export default function App() {
  const [activeTab, setActiveTab] = useState('crucible')
  const [user, setUser] = useState(null)
  
  const [missionState, setMissionState] = useLocalStorage('roar-in-varc-missions', {})
  const [warRoomRecords, setWarRoomRecords] = useLocalStorage('roar-in-varc-war-room', [])

  // --- THE TIME SHIFTER: FORCES THE PLAN TO START ON MARCH 28, 2026 ---
  const missionPlan = useMemo(() => {
    const START_DATE = new Date(2026, 2, 28); // Month is 0-indexed (2 = March)
    return missionPlanRaw.map(mission => {
      const d = new Date(START_DATE);
      d.setDate(d.getDate() + (mission.dayNumber - 1));
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      return {
        ...mission,
        date: `${year}-${month}-${day}T00:00:00` // Clean, browser-safe format
      };
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        await fetchFromCloud(currentUser.uid)
      }
    })
    return () => unsubscribe()
  }, [])

  const fetchFromCloud = async (uid) => {
    try {
      const snap = await getDoc(doc(db, "users", uid))
      if (snap.exists()) {
        const data = snap.data()
        if (data.missionState) setMissionState(data.missionState)
        if (data.warRoomRecords) setWarRoomRecords(data.warRoomRecords)
      }
    } catch (e) { console.error("Sync Error", e) }
  }

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

  const handleMissionUpdate = (dayNumber, patch) => {
    setMissionState((prev) => {
      const updated = { ...prev, [dayNumber]: { ...(prev[dayNumber] || {}), ...patch } }
      pushToCloud(updated, warRoomRecords)
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
      
      {/* TAB: DAILY PLAN - Fixed scroll container */}
      <div className={activeTab === 'crucible' ? 'block' : 'hidden'} style={{ height: 'calc(100vh - 120px)', overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ paddingBottom: '40px', minHeight: '100%' }}>
          <MissionGrid missions={missionPlan} missionState={missionState} onMissionUpdate={handleMissionUpdate} />
        </div>
      </div>

      {/* TAB: MOCK ANALYTICS */}
      <div className={activeTab === 'war-room' ? 'block' : 'hidden'}>
        <WarRoom records={warRoomRecords} onAddRecord={handleAddRecord} onDeleteRecord={handleDeleteRecord} missions={missionPlan} missionState={missionState} />
      </div>

      {/* TAB: STUDY AUDIO */}
      <div className={activeTab === 'focus-beats' ? 'block' : 'hidden'}>
        <FocusBeats />
      </div>

      {/* TAB: DATA BACKUP */}
      <div className={activeTab === 'data-backup' ? 'block' : 'hidden'}>
        <DataBackup
          user={user} 
          missionState={missionState}
          warRoomRecords={warRoomRecords}
          onImportBackup={handleImportBackup}
          onClearAllProgress={handleClearAllProgress}
        />
      </div>
      
    </AppShell>
  )
}