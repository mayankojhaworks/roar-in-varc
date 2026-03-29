import { useState, useEffect, useMemo } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase' 
import AppShell from './components/AppShell'
import DataBackup from './components/DataBackup'
import FocusBeats from './components/FocusBeats'
import MissionGrid from './components/MissionGrid'
import WarRoom from './components/WarRoom'
import missionPlanRaw from './data/generated/missionPlan.json' 
import { useLocalStorage } from './hooks/useLocalStorage'

export default function App() {
  const [activeTab, setActiveTab] = useState('crucible')
  const [user, setUser] = useState(null)
  
  const [missionState, setMissionState] = useLocalStorage('roar-in-varc-missions', {})
  const [warRoomRecords, setWarRoomRecords] = useLocalStorage('roar-in-varc-war-room', [])

  const missionPlan = useMemo(() => {
    const START_DATE = new Date(2026, 2, 28); 
    return missionPlanRaw.map(mission => {
      const d = new Date(START_DATE);
      d.setDate(d.getDate() + (mission.dayNumber - 1));
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      return {
        ...mission,
        date: `${year}-${month}-${day}T00:00:00` 
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
      
      {/* THE FIX: Unlocking global scrolling on mobile devices */}
      <style>{`
        .tab-wrapper {
            height: calc(100vh - 120px);
            display: flex;
            flex-direction: column;
        }
        .tab-scroll-area {
            flex: 1;
            overflow-y: auto;
            padding: 10px 10px 80px 10px;
        }
        .tab-relative {
            position: relative;
            height: calc(100vh - 120px);
            width: 100%;
        }

        /* Completely liberates the mobile view from fixed heights */
        @media (max-width: 768px) {
            body, html, #root {
                height: auto !important;
                min-height: 100vh;
                overflow: visible !important;
            }
            div[style*="100vh"] {
                height: auto !important;
                min-height: 100vh !important;
            }
            .tab-wrapper, .tab-relative {
                height: auto !important;
                overflow: visible !important;
            }
            .tab-scroll-area {
                overflow: visible !important;
                padding-bottom: 50px !important;
            }
        }
      `}</style>

      {/* TAB: DAILY PLAN */}
      {activeTab === 'crucible' && (
        <div className="tab-wrapper">
          <div className="tab-scroll-area">
            <MissionGrid missions={missionPlan} missionState={missionState} onMissionUpdate={handleMissionUpdate} />
          </div>
        </div>
      )}

      {/* TAB: MOCK ANALYTICS */}
      {activeTab === 'war-room' && (
        <div className="tab-relative">
          <WarRoom records={warRoomRecords} onAddRecord={handleAddRecord} onDeleteRecord={handleDeleteRecord} missions={missionPlan} missionState={missionState} />
        </div>
      )}

      {/* TAB: STUDY AUDIO */}
      {activeTab === 'focus-beats' && (
        <div className="tab-relative">
          <FocusBeats />
        </div>
      )}

      {/* TAB: DATA BACKUP */}
      {activeTab === 'data-backup' && (
        <div style={{ paddingBottom: '80px' }}>
          <DataBackup
            user={user} 
            missionState={missionState}
            warRoomRecords={warRoomRecords}
            onImportBackup={handleImportBackup}
            onClearAllProgress={handleClearAllProgress}
          />
        </div>
      )}
      
    </AppShell>
  )
}