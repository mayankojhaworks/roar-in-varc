import { useState, useEffect, useMemo } from 'react'
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth'
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
    getRedirectResult(auth).then(async (result) => {
        if (result && result.user) {
            setUser(result.user);
            await fetchFromCloud(result.user.uid);
        }
    }).catch((error) => console.error("Redirect catch error:", error));

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
      
      {/* THE FIX: The "Picture Frame" Architecture */}
      <style>{`
        /* 1. Lock the outer browser window so it CANNOT scroll or bounce */
        body, html, #root {
            height: 100%;
            height: 100dvh;
            overflow: hidden !important;
            overscroll-behavior: none;
            margin: 0;
            padding: 0;
        }

        /* 2. The "Picture Frame" - Fixed size, never stretches, crops overflows */
        .tab-frame {
            height: calc(100dvh - 130px); /* Subtracts Desktop Header */
            width: 100%;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden; 
        }

        /* 3. The "Canvas" - Scrolls purely inside the frame */
        .tab-scroll-inside {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding-bottom: 30px;
        }

        /* 4. Mobile specific frame sizing (taller stacked header) */
        @media (max-width: 768px) {
            .tab-frame {
                height: calc(100dvh - 240px); /* Subtracts Mobile Header */
            }
            .tab-scroll-inside {
                padding-bottom: 50px;
            }
        }
      `}</style>

      {/* TAB: DAILY PLAN (Scrolling Canvas) */}
      {activeTab === 'crucible' && (
        <div className="tab-frame">
          <div className="tab-scroll-inside">
            <MissionGrid missions={missionPlan} missionState={missionState} onMissionUpdate={handleMissionUpdate} />
          </div>
        </div>
      )}

      {/* TAB: MOCK ANALYTICS (Internal scroll handled inside WarRoom) */}
      {activeTab === 'war-room' && (
        <div className="tab-frame">
          <WarRoom records={warRoomRecords} onAddRecord={handleAddRecord} onDeleteRecord={handleDeleteRecord} missions={missionPlan} missionState={missionState} />
        </div>
      )}

      {/* TAB: STUDY AUDIO (Internal scroll handled inside FocusBeats) */}
      {activeTab === 'focus-beats' && (
        <div className="tab-frame">
          <FocusBeats />
        </div>
      )}

      {/* TAB: DATA BACKUP (Scrolling Canvas) */}
      {activeTab === 'data-backup' && (
        <div className="tab-frame">
          <div className="tab-scroll-inside">
            <DataBackup
              user={user} 
              missionState={missionState}
              warRoomRecords={warRoomRecords}
              onImportBackup={handleImportBackup}
              onClearAllProgress={handleClearAllProgress}
            />
          </div>
        </div>
      )}
      
    </AppShell>
  )
}