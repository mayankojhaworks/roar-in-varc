import { useState, useEffect, useMemo } from 'react'
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

import { auth, db } from './firebase'
import { useLocalStorage } from './hooks/useLocalStorage'

import AppShell from './components/AppShell'
import FocusBeats from './components/FocusBeats'
import MissionGrid from './components/MissionGrid'
import ReadingAmigo from './components/reading-amigo/ReadingAmigo'
import AntiBrainrot from './components/anti-brainrot/AntiBrainrot'
import WarRoom from './components/WarRoom'
import QuantsSmurfs from './components/QuantsSmurfs'

import missionPlanRaw from './data/generated/missionPlan.json'

export default function App() {
  const [activeTab, setActiveTab] = useState('crucible')

  // THE SWITCHBOARD: Controls the Test Launcher
  const [pendingTestLaunch, setPendingTestLaunch] = useState(null)

  const [missionState, setMissionState] = useLocalStorage('roar-in-varc-missions', {})
  const [warRoomRecords, setWarRoomRecords] = useLocalStorage('roar-in-varc-war-room', [])

  const missionPlan = useMemo(() => {
    // UPDATED START DATE: April 7, 2026
    const START_DATE = new Date(2026, 3, 7)

    return missionPlanRaw.map((mission) => {
      const d = new Date(START_DATE)
      d.setDate(d.getDate() + (mission.dayNumber - 1))

      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')

      return {
        ...mission,
        date: `${year}-${month}-${day}T00:00:00`,
      }
    })
  }, [])

  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          await fetchFromCloud(result.user.uid)
        }
      })
      .catch((error) => {
        console.error('Redirect catch error:', error)
      })

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {

      if (currentUser) {
        await fetchFromCloud(currentUser.uid)
      }
    })

    return () => unsubscribe()
  }, [])

  const fetchFromCloud = async (uid) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid))

      if (snap.exists()) {
        const data = snap.data()

        if (data.missionState) setMissionState(data.missionState)
        if (data.warRoomRecords) setWarRoomRecords(data.warRoomRecords)
      }
    } catch (error) {
      console.error('Sync Error', error)
    }
  }

  const pushToCloud = async (newMissions, newRecords) => {
    if (!auth.currentUser) return

    try {
      await setDoc(
        doc(db, 'users', auth.currentUser.uid),
        {
          missionState: newMissions,
          warRoomRecords: newRecords,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      )
    } catch (error) {
      console.error('Save Error', error)
    }
  }

  const handleMissionUpdate = (dayNumber, patch) => {
    setMissionState((prev) => {
      const updated = {
        ...prev,
        [dayNumber]: {
          ...(prev[dayNumber] || {}),
          ...patch,
        },
      }

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
      const updated = prev.filter((record) => record.id !== recordId)

      pushToCloud(missionState, updated)
      return updated
    })
  }

  const handleOpenTest = (dayNum, type, index) => {
    setPendingTestLaunch({ dayNum, type, index })
    setActiveTab('crucible')
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      <style>{`
        .tab-wrapper {
          height: calc(100dvh - 220px);
          display: flex;
          flex-direction: column;
        }

        .tab-scroll-area {
          flex: 1;
          overflow-y: auto;
          padding-bottom: 20px;
        }

        .tab-relative {
          position: relative;
          height: calc(100dvh - 220px);
          width: 100%;
        }

        .reading-amigo-host {
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .tab-wrapper,
          .tab-relative {
            height: calc(100dvh - 280px) !important;
          }

          .tab-relative > div {
            overflow-y: auto !important;
          }

          .tab-scroll-area {
            padding-bottom: 40px !important;
          }

          .reading-amigo-host {
            overflow: hidden !important;
          }
        }
      `}</style>

      {/* TAB: DAILY PLAN */}
      {activeTab === 'crucible' && (
        <div className="tab-wrapper">
          <div className="tab-scroll-area">
            <MissionGrid
              missions={missionPlan}
              missionState={missionState}
              onMissionUpdate={handleMissionUpdate}
              pendingTestLaunch={pendingTestLaunch}
              setPendingTestLaunch={setPendingTestLaunch}
            />
          </div>
        </div>
      )}

      {/* TAB: MOCK ANALYTICS */}
      {activeTab === 'war-room' && (
        <div className="tab-relative">
          <WarRoom
            records={warRoomRecords}
            onAddRecord={handleAddRecord}
            onDeleteRecord={handleDeleteRecord}
            missions={missionPlan}
            missionState={missionState}
            onOpenTest={handleOpenTest}
          />
        </div>
      )}

      {/* TAB: STUDY AUDIO */}
      <div
        className="tab-relative"
        style={{ display: activeTab === 'focus-beats' ? 'block' : 'none' }}
      >
        <FocusBeats />
      </div>

      {/* TAB: READING AMIGO */}
      {activeTab === 'reading-amigo' && (
        <div className="tab-relative reading-amigo-host">
          <ReadingAmigo />
        </div>
      )}

      {/* TAB: ANTI BRAINROT */}
      {activeTab === 'anti-brainrot' && <AntiBrainrot />}

      {/* TAB: QUANTS SMURFS — independent CAT Quant practice workspace */}
      {activeTab === 'quants-smurfs' && (
        <div className="tab-relative">
          <QuantsSmurfs />
        </div>
      )}

    </AppShell>
  )
}
