import React, { useEffect, useMemo, useState } from 'react'
import { compareDay, getTodayDateOnly, isSameDay } from '../utils/date'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toDateOnly(dateValue) {
  const date = new Date(dateValue)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(dateValue, days) {
  const date = toDateOnly(dateValue)
  date.setDate(date.getDate() + days)
  return date
}

function getDateKey(dateValue) {
  const date = toDateOnly(dateValue)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getWeekStart(dateValue) {
  const date = toDateOnly(dateValue)
  return addDays(date, -date.getDay())
}

function formatWeekRange(startDate) {
  const endDate = addDays(startDate, 6)
  const startMonth = startDate.toLocaleString('en-US', { month: 'short' })
  const endMonth = endDate.toLocaleString('en-US', { month: 'short' })

  if (startDate.getFullYear() === endDate.getFullYear() && startDate.getMonth() === endDate.getMonth()) {
    return `${startDate.getDate()} - ${endDate.getDate()} ${endMonth} ${endDate.getFullYear()}`
  }
  if (startDate.getFullYear() === endDate.getFullYear()) {
    return `${startDate.getDate()} ${startMonth} - ${endDate.getDate()} ${endMonth} ${endDate.getFullYear()}`
  }
  return `${startDate.getDate()} ${startMonth} ${startDate.getFullYear()} - ${endDate.getDate()} ${endMonth} ${endDate.getFullYear()}`
}

function getMissionStatus(missionDate, completed) {
  const today = getTodayDateOnly()
  const comparison = compareDay(missionDate, today)

  if (completed) return 'completed'
  
  const weekStartOfMission = getDateKey(getWeekStart(missionDate));
  const weekStartOfToday = getDateKey(getWeekStart(today));
  const isSameWeek = weekStartOfMission === weekStartOfToday;

  if (comparison < 0) return 'missed'
  if (comparison > 0) {
     if (isSameWeek) return 'upcoming' 
     return 'locked'
  }
  return 'active'
}

function getDefaultSelectedDay(missions) {
  const today = getTodayDateOnly()
  const found = missions.find((mission) => isSameDay(mission.date, today))
  return found ? found.dayNumber : missions[0]?.dayNumber ?? 1
}

export default function MissionGrid({ missions, missionState, onMissionUpdate }) {
  const [selectedDay, setSelectedDay] = useState(getDefaultSelectedDay(missions))
  const [selectedWeekKey, setSelectedWeekKey] = useState('')

  useEffect(() => {
    setSelectedDay(getDefaultSelectedDay(missions))
  }, [missions])

  const enrichedMissions = useMemo(() => {
    return missions.map((mission) => {
      const saved = missionState[mission.dayNumber] || {}
      const completed = Boolean(saved.completed)
      return {
        ...mission,
        status: getMissionStatus(mission.date, completed),
      }
    })
  }, [missions, missionState])

  const weeks = useMemo(() => {
    const weekMap = new Map()

    enrichedMissions.forEach((mission) => {
      const weekStart = getWeekStart(mission.date)
      const weekKey = getDateKey(weekStart)

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, { key: weekKey, startDate: weekStart, label: formatWeekRange(weekStart), missions: [] })
      }
      weekMap.get(weekKey).missions.push(mission)
    })

    return Array.from(weekMap.values())
      .sort((a, b) => a.startDate - b.startDate)
      .map((week) => ({
        ...week,
        slots: WEEKDAY_LABELS.map((_, weekdayIndex) => {
          return week.missions.find((mission) => toDateOnly(mission.date).getDay() === weekdayIndex) || null
        }),
      }))
  }, [enrichedMissions])

  const today = getTodayDateOnly()
  const currentWeekStartKey = getDateKey(getWeekStart(today))

  const latestAccessibleWeekIndex = useMemo(() => {
    const exactCurrentWeekIndex = weeks.findIndex((week) => week.key === currentWeekStartKey)
    if (exactCurrentWeekIndex !== -1) return exactCurrentWeekIndex

    let lastPastWeekIndex = 0
    weeks.forEach((week, index) => {
      if (week.startDate <= today) lastPastWeekIndex = index
    })
    return lastPastWeekIndex
  }, [weeks, currentWeekStartKey, today])

  const accessibleWeeks = weeks.slice(0, latestAccessibleWeekIndex + 1)
  const currentWeek = accessibleWeeks[accessibleWeeks.length - 1] || weeks[0]

  useEffect(() => {
    if (!currentWeek) return
    setSelectedWeekKey((previous) => {
      const isStillAccessible = accessibleWeeks.some((week) => week.key === previous)
      return isStillAccessible ? previous : currentWeek.key
    })
  }, [accessibleWeeks, currentWeek])

  const selectedWeek = accessibleWeeks.find((week) => week.key === selectedWeekKey) || currentWeek

  useEffect(() => {
    if (!selectedWeek) return

    const availableDayNumbers = selectedWeek.slots.filter(Boolean).map((mission) => mission.dayNumber)
    if (availableDayNumbers.includes(selectedDay)) return

    const todayMissionInWeek = selectedWeek.slots.find((mission) => mission && isSameDay(mission.date, today))
    const fallbackMission = todayMissionInWeek || selectedWeek.slots.find(Boolean)

    if (fallbackMission) {
      setSelectedDay(fallbackMission.dayNumber)
    }
  }, [selectedWeek, selectedDay, today])

  const selectedMission =
    selectedWeek?.slots.find((mission) => mission?.dayNumber === selectedDay) ||
    selectedWeek?.slots.find(Boolean) ||
    enrichedMissions[0]

  const selectedMissionState = missionState[selectedMission?.dayNumber] || {
    completed: false, crRemarks1: '', crRemarks2: '', vaRemarks1: '', vaRemarks2: '', rcRemarks1: '', rcRemarks2: '',
  }

  // --- FIX 3: CAT 2026 COUNTDOWN LOGIC ---
  const targetDate = new Date(2026, 10, 29); // Month is 0-indexed (10 = November)
  const planStartDate = new Date(2026, 2, 23); // (2 = March)
  const msPerDay = 1000 * 60 * 60 * 24;
  
  const totalDays = Math.round((targetDate - planStartDate) / msPerDay);
  const daysLeft = Math.round((targetDate - today) / msPerDay);
  
  const completedCount = enrichedMissions.filter((mission) => mission.status === 'completed').length
  const missedCount = enrichedMissions.filter((mission) => mission.status === 'missed').length
  const pendingCount = Math.max(0, daysLeft + missedCount);

  const updateField = (field, value) => {
    if (!selectedMission) return
    onMissionUpdate(selectedMission.dayNumber, { [field]: value })
  }

  const handleFindMissed = () => {
    const firstMissed = enrichedMissions.find(m => m.status === 'missed')
    if (firstMissed) {
       const weekStartKey = getDateKey(getWeekStart(firstMissed.date))
       setSelectedWeekKey(weekStartKey)
       setSelectedDay(firstMissed.dayNumber)
    }
  }

  if (!selectedMission) return null

  return (
    <>
      <style>{`
        .dashboard-grid {
            display: grid;
            grid-template-areas:
                "stats calendar"
                "reading practice";
            grid-template-columns: 1fr 1.8fr; 
            grid-template-rows: auto minmax(0, 1fr); 
            gap: 15px; 
            height: 100%;
        }

        .stats-container { grid-area: stats; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto auto auto; gap: 10px; }
        .stat-card { padding: 8px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
        .stat-value { font-size: 1.4rem; font-family: var(--font-sketch); font-weight: bold; line-height: 1; margin-bottom: 2px; }
        .stat-label { font-size: 0.6rem; text-transform: uppercase; opacity: 0.7; }
        
        .clickable-stat { grid-column: span 2; background-color: #FFF5F5; transition: all 0.2s ease; cursor: pointer; border: 2px dashed rgba(231, 76, 60, 0.4); }
        .clickable-stat:hover { background-color: #FFEBEB; border-color: var(--highlight-red); border-style: solid; }

        .calendar-container { grid-area: calendar; padding: 10px 15px; display: flex; flex-direction: column; justify-content: space-between; }
        .week-header { display: flex; justify-content: space-between; font-family: var(--font-sketch); font-size: 0.9rem; margin-bottom: 8px;}
        .days-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; flex-grow: 1;}
        .day-box {
            background: var(--base-cream); border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center;
            box-shadow: inset 2px 2px 5px var(--shadow-light), inset -2px -2px 5px var(--shadow-dark);
            transition: all 0.3s ease; border: 2px solid transparent; position: relative; padding: 5px 0;
        }
        .day-box.active { background: var(--highlight-lavender); color: #fff; box-shadow: 3px 3px 0px rgba(0,0,0,0.1); transform: translateY(-2px); }
        .day-box.missed-alert { border-color: var(--highlight-red); background: #FFF5F5; }
        .day-box .day-name { font-size: 0.65rem; text-transform: uppercase; }
        .day-box .day-num { font-size: 1.2rem; font-weight: 600; margin: -2px 0;}
        
        .day-indicator { font-size: 0.7rem; font-weight: 600; font-family: var(--font-sketch); position: absolute; bottom: 4px; }

        .reading-container { grid-area: reading; overflow-y: auto; padding-right: 5px; }
        .panel-title { font-family: var(--font-sketch); font-size: 1.2rem; border-bottom: 2px dashed rgba(0,0,0,0.2); padding-bottom: 10px; margin: 0 0 15px 0; display: flex; justify-content: space-between; align-items: center;}
        
        .done-btn {
            background: transparent; color: var(--main-charcoal); border: 2px solid var(--main-charcoal);
            border-radius: 8px; padding: 4px 12px; font-family: var(--font-sketch); font-size: 0.8rem; font-weight: bold;
            cursor: pointer; transition: all 0.2s; box-shadow: 2px 2px 0px var(--main-charcoal);
        }
        .done-btn:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0px var(--main-charcoal); }
        .done-btn.completed {
            background: var(--highlight-green); color: white; border-color: var(--highlight-green); box-shadow: none; transform: none;
        }

        .reading-item { margin-bottom: 15px; }
        .reading-item h4 { margin: 0 0 2px 0; font-size: 1rem; }
        
        .hover-title { color: var(--main-charcoal); text-decoration: none; transition: color 0.2s; }
        .hover-title:hover { color: var(--highlight-blue) !important; text-decoration: underline !important; }
        .practice-link { color: var(--hover-peach); text-decoration: none; transition: color 0.2s; cursor: pointer; font-weight: bold; }
        .practice-link:hover { color: var(--highlight-blue) !important; text-decoration: underline !important; }

        .practice-container { grid-area: practice; display: flex; flex-direction: column; overflow-y: auto; padding-right: 5px; }
        .practice-cards-wrapper { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; flex-grow: 1; padding-bottom: 5px; }

        .task-card {
            background: #FFFCF7; border: 1px solid rgba(0,0,0,0.05); border-radius: 10px; padding: 12px 15px;
            box-shadow: 2px 2px 8px rgba(0,0,0,0.03); position: relative; display: flex; flex-direction: column; transition: transform 0.3s;
        }
        .task-card:hover { transform: rotate(0.5deg) scale(1.01); }
        .task-card::after {
            content: ''; position: absolute; top: -4px; left: 50%; transform: translateX(-50%) rotate(-2deg);
            width: 30px; height: 10px; background: rgba(255, 154, 139, 0.4); border: 1px solid rgba(0,0,0,0.05);
        }
        .task-card label {
            font-family: var(--font-sans); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; color: var(--hover-peach);
        }

        .notebook-input {
            width: 100%; height: 44px; 
            background-color: transparent; border: none;
            background-image: linear-gradient(transparent, transparent 21px, rgba(0,0,0,0.08) 21px, rgba(0,0,0,0.08) 22px, transparent 22px);
            background-size: 100% 22px; line-height: 22px; font-family: var(--font-sketch); font-size: 1rem; color: var(--main-charcoal);
            resize: none; outline: none;
        }
      `}</style>

      <div className="dashboard-grid">
        
        {/* Stats */}
        <div className="stats-container">
            <div className="stat-card island sketch-border"><div className="stat-value" style={{color: '#E74C3C'}}>{daysLeft}</div><div className="stat-label">Days Left</div></div>
            <div className="stat-card island sketch-border"><div className="stat-value">{totalDays}</div><div className="stat-label">Total Days</div></div>
            <div className="stat-card island sketch-border"><div className="stat-value" style={{color: '#27AE60'}}>{completedCount}</div><div className="stat-label">Completed</div></div>
            <div className="stat-card island sketch-border"><div className="stat-value" style={{color: '#3498DB'}}>{pendingCount}</div><div className="stat-label">Pending</div></div>
            <div className="stat-card island sketch-border clickable-stat" onClick={handleFindMissed}>
                <div className="stat-value" style={{color: '#E74C3C'}}>{missedCount}</div><div className="stat-label">Days Missed (Click to view)</div>
            </div>
        </div>

        {/* Calendar */}
        <div className="calendar-container island sketch-border">
            <div className="week-header">
                <span style={{fontFamily: 'var(--font-sketch)'}}>Week {weeks.findIndex(w => w.key === selectedWeekKey) + 1} // {selectedWeek?.label}</span>
                <span style={{opacity: 0.6, fontSize: '0.75rem'}}>Mon - Sun</span>
            </div>
            <div className="days-row">
                {selectedWeek?.slots.map((mission, index) => {
                    if (!mission) {
                        const slotDate = addDays(selectedWeek.startDate, index);
                        return (
                            <div key={`empty-${index}`} className="day-box pending" style={{border: '1px dashed rgba(0,0,0,0.1)'}}>
                                <div className="day-name">{WEEKDAY_LABELS[index]}</div>
                                <div className="day-num">{slotDate.getDate()}</div>
                                <div className="day-indicator" style={{ opacity: 0.4 }}>-</div>
                            </div>
                        )
                    }

                    const isSelected = selectedDay === mission.dayNumber
                    let statusClass = ''
                    if (isSelected) statusClass = 'active'
                    else if (mission.status === 'completed') statusClass = 'completed'
                    else if (mission.status === 'missed') statusClass = 'missed'
                    else if (mission.status === 'locked' || mission.status === 'upcoming') statusClass = 'pending'

                    let indicatorLabel = mission.status
                    if (mission.status === 'active' || isSameDay(mission.date, today)) indicatorLabel = 'Today'

                    return (
                        <div 
                            key={mission.dayNumber} 
                            className={`day-box ${statusClass}`} 
                            onClick={() => {
                                if(mission.status !== 'locked') setSelectedDay(mission.dayNumber)
                            }}
                            style={{cursor: mission.status === 'locked' ? 'not-allowed' : 'pointer'}}
                        >
                            <div className="day-name">{WEEKDAY_LABELS[index]}</div>
                            <div className="day-num">{new Date(mission.date).getDate()}</div>
                            <div className="day-indicator" style={{color: mission.status === 'missed' && !isSelected ? '#E74C3C' : 'inherit'}}>
                                {indicatorLabel}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* Reading Area */}
        <div className="reading-container island sketch-border">
            <h2 className="panel-title">
                <span>Reading <span style={{opacity: 0.6, fontSize: '0.85rem'}}>Day {selectedMission.dayNumber}</span></span>
                
                {/* FIX 1: MARK AS DONE BUTTON */}
                <button 
                    onClick={() => updateField('completed', !selectedMissionState.completed)}
                    className={`done-btn ${selectedMissionState.completed ? 'completed' : ''}`}
                    disabled={selectedMission.status === 'locked'}
                    style={{ cursor: selectedMission.status === 'locked' ? 'not-allowed' : 'pointer' }}
                >
                    {selectedMissionState.completed ? '✓ DONE' : 'MARK AS DONE'}
                </button>
            </h2>
            
            {selectedMission.articles?.map((article, index) => (
                <div className="reading-item" key={index}>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '1rem' }}>
                        <a href={article.url} target="_blank" rel="noreferrer" className="hover-title" style={{ color: 'var(--main-charcoal)', textDecoration: 'none' }}>
                            {index + 1}. {article.title}
                        </a>
                    </h4>
                    <span style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {article.source || 'Reading Assignment'}
                    </span>
                </div>
            ))}
            {(!selectedMission.articles || selectedMission.articles.length === 0) && (
                <p style={{opacity: 0.6, fontStyle: 'italic', fontSize: '0.9rem'}}>No reading assigned for today.</p>
            )}
        </div>

        {/* Practice Area */}
        <div className="practice-container island sketch-border">
            <h2 className="panel-title">Practice Workspace <span>CR / VA / RC</span></h2>
            
            <div className="practice-cards-wrapper">
                {/* CR Cards */}
                {[0, 1].map((index) => {
                    const q = selectedMission.crQuestions?.[index];
                    return (
                        <div className="task-card" key={`cr-${index}`}>
                            <label>
                                {q?.url ? (
                                    <a href={q.url} target="_blank" rel="noreferrer" className="practice-link">
                                        CR {index + 1}: {q?.source || 'GMAT CLUB'} &#8599;
                                    </a>
                                ) : (
                                    `CR ${index + 1}: ${q?.source || 'GMAT CLUB'}`
                                )}
                            </label>
                            <textarea className="notebook-input" placeholder="Draft reasoning..." 
                                value={index === 0 ? selectedMissionState.crRemarks1 : selectedMissionState.crRemarks2}
                                onChange={(e) => updateField(index === 0 ? 'crRemarks1' : 'crRemarks2', e.target.value)}
                                disabled={selectedMission.status === 'locked'}
                            />
                        </div>
                    )
                })}

                {/* VA Cards */}
                {[0, 1].map((index) => {
                    const q = selectedMission.vaQuestions?.[index];
                    return (
                        <div className="task-card" key={`va-${index}`}>
                            <label>
                                {q?.url ? (
                                    <a href={q.url} target="_blank" rel="noreferrer" className="practice-link">
                                        VA {index + 1}: {q?.source || (index === 0 ? 'PARAJUMBLES' : 'SUMMARY')} &#8599;
                                    </a>
                                ) : (
                                    `VA ${index + 1}: ${q?.source || (index === 0 ? 'PARAJUMBLES' : 'SUMMARY')}`
                                )}
                            </label>
                            <textarea className="notebook-input" placeholder={index === 0 ? "Draft sequence..." : "Draft summary..."} 
                                value={index === 0 ? selectedMissionState.vaRemarks1 : selectedMissionState.vaRemarks2}
                                onChange={(e) => updateField(index === 0 ? 'vaRemarks1' : 'vaRemarks2', e.target.value)}
                                disabled={selectedMission.status === 'locked'}
                            />
                        </div>
                    )
                })}

                {/* RC Cards */}
                {[0, 1].map((index) => {
                    const q = index === 0 ? selectedMission.rcPassage : null;
                    return (
                        <div className="task-card" key={`rc-${index}`}>
                            <label>
                                {q?.url ? (
                                    <a href={q.url} target="_blank" rel="noreferrer" className="practice-link">
                                        RC {index + 1}: {q?.source || 'PASSAGE ANALYSIS'} &#8599;
                                    </a>
                                ) : (
                                    `RC ${index + 1}: ${q?.source || 'PASSAGE ANALYSIS'}`
                                )}
                            </label>
                            <textarea className="notebook-input" placeholder={`Summarize passage ${index + 1}...`} 
                                value={index === 0 ? selectedMissionState.rcRemarks1 : selectedMissionState.rcRemarks2}
                                onChange={(e) => updateField(index === 0 ? 'rcRemarks1' : 'rcRemarks2', e.target.value)}
                                disabled={selectedMission.status === 'locked'}
                            />
                        </div>
                    )
                })}
            </div>
        </div>

      </div>
    </>
  )
}