import React, { useEffect, useMemo, useState } from 'react'
import { compareDay, getTodayDateOnly, isSameDay } from '../utils/date'
import pyqData from '../data/pyqDataV4.json' // Keeps the cache-busting file!

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// --- DATA PREPARATION ---
const vaQuestions = pyqData.filter(q => q.type === 'VA')
const rawRcQuestions = pyqData.filter(q => q.type === 'RC')

// Group RC questions by their passage so they appear as a set
const rcSets = []
const passageMap = new Map()
rawRcQuestions.forEach(q => {
  if (!passageMap.has(q.passage)) {
    passageMap.set(q.passage, { passage: q.passage, questions: [] })
    rcSets.push(passageMap.get(q.passage))
  }
  passageMap.get(q.passage).questions.push(q)
})

// --- HELPER FUNCTIONS ---
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
  if (startDate.getFullYear() === endDate.getFullYear() && startDate.getMonth() === endDate.getMonth()) return `${startDate.getDate()} - ${endDate.getDate()} ${endMonth} ${endDate.getFullYear()}`
  if (startDate.getFullYear() === endDate.getFullYear()) return `${startDate.getDate()} ${startMonth} - ${endDate.getDate()} ${endMonth} ${endDate.getFullYear()}`
  return `${startDate.getDate()} ${startMonth} ${startDate.getFullYear()} - ${endDate.getDate()} ${endMonth} ${endDate.getFullYear()}`
}

function getMissionStatus(missionDate, completed) {
  const today = getTodayDateOnly()
  const comparison = compareDay(missionDate, today)
  if (completed) return 'completed'
  const weekStartOfMission = getDateKey(getWeekStart(missionDate));
  const weekStartOfToday = getDateKey(getWeekStart(today));
  if (comparison < 0) return 'missed'
  if (comparison > 0) return (weekStartOfMission === weekStartOfToday) ? 'upcoming' : 'locked'
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
  
  // --- PYQ MODAL STATES ---
  const [activePyq, setActivePyq] = useState(null)
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => setSelectedDay(getDefaultSelectedDay(missions)), [missions])

  const enrichedMissions = useMemo(() => {
    return missions.map((mission) => {
      const saved = missionState[mission.dayNumber] || {}
      return { ...mission, status: getMissionStatus(mission.date, Boolean(saved.completed)) }
    })
  }, [missions, missionState])

  const weeks = useMemo(() => {
    const weekMap = new Map()
    enrichedMissions.forEach((mission) => {
      const weekStart = getWeekStart(mission.date)
      const weekKey = getDateKey(weekStart)
      if (!weekMap.has(weekKey)) weekMap.set(weekKey, { key: weekKey, startDate: weekStart, label: formatWeekRange(weekStart), missions: [] })
      weekMap.get(weekKey).missions.push(mission)
    })
    return Array.from(weekMap.values())
      .sort((a, b) => a.startDate - b.startDate)
      .map((week) => ({
        ...week,
        slots: WEEKDAY_LABELS.map((_, weekdayIndex) => week.missions.find((mission) => toDateOnly(mission.date).getDay() === weekdayIndex) || null),
      }))
  }, [enrichedMissions])

  const today = getTodayDateOnly()
  const currentWeekStartKey = getDateKey(getWeekStart(today))

  const latestAccessibleWeekIndex = useMemo(() => {
    const exactCurrentWeekIndex = weeks.findIndex((week) => week.key === currentWeekStartKey)
    if (exactCurrentWeekIndex !== -1) return exactCurrentWeekIndex
    let lastPastWeekIndex = 0
    weeks.forEach((week, index) => { if (week.startDate <= today) lastPastWeekIndex = index })
    return lastPastWeekIndex
  }, [weeks, currentWeekStartKey, today])

  const accessibleWeeks = weeks.slice(0, latestAccessibleWeekIndex + 1)
  const currentWeek = accessibleWeeks[accessibleWeeks.length - 1] || weeks[0]

  useEffect(() => {
    if (!currentWeek) return
    setSelectedWeekKey((previous) => accessibleWeeks.some((week) => week.key === previous) ? previous : currentWeek.key)
  }, [accessibleWeeks, currentWeek])

  const selectedWeek = accessibleWeeks.find((week) => week.key === selectedWeekKey) || currentWeek

  useEffect(() => {
    if (!selectedWeek) return
    const availableDayNumbers = selectedWeek.slots.filter(Boolean).map((mission) => mission.dayNumber)
    if (availableDayNumbers.includes(selectedDay)) return
    const fallbackMission = selectedWeek.slots.find((mission) => mission && isSameDay(mission.date, today)) || selectedWeek.slots.find(Boolean)
    if (fallbackMission) setSelectedDay(fallbackMission.dayNumber)
  }, [selectedWeek, selectedDay, today])

  const selectedMission = selectedWeek?.slots.find((mission) => mission?.dayNumber === selectedDay) || selectedWeek?.slots.find(Boolean) || enrichedMissions[0]
  const selectedMissionState = missionState[selectedMission?.dayNumber] || { completed: false, crRemarks1: '', crRemarks2: '', vaRemarks1: '', vaRemarks2: '', rcRemarks1: '', rcRemarks2: '', pyqAnswers: {} }

  // --- STATS MATH FIX ---
  const targetDate = new Date(2026, 10, 29); 
  const planStartDate = new Date(2026, 2, 28); // Locked to March 28
  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.round((targetDate - planStartDate) / msPerDay);
  const daysLeft = Math.max(0, Math.round((targetDate - today) / msPerDay));
  const completedCount = enrichedMissions.filter((mission) => mission.status === 'completed').length;
  const missedCount = enrichedMissions.filter((mission) => mission.status === 'missed').length;
  const pendingCount = totalDays - completedCount; // Flawless pending math

  const updateField = (field, value) => {
    if (!selectedMission) return
    onMissionUpdate(selectedMission.dayNumber, { [field]: value })
  }

  const handleFindMissed = () => {
    const firstMissed = enrichedMissions.find(m => m.status === 'missed')
    if (firstMissed) {
       setSelectedWeekKey(getDateKey(getWeekStart(firstMissed.date)))
       setSelectedDay(firstMissed.dayNumber)
    }
  }

  // --- PYQ TIMER LOGIC ---
  useEffect(() => {
    if (!activePyq || timeLeft <= 0 || isSubmitted) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [activePyq, timeLeft, isSubmitted]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const checkIsCorrect = (q, indexOrValue) => {
    if (q.options && q.options.length > 0) {
      const ansStr = String(q.correctAnswer).replace(/[^\d]/g, '');
      return parseInt(ansStr) === (parseInt(indexOrValue) + 1);
    } else {
      return String(q.correctAnswer).trim().toLowerCase() === String(indexOrValue).trim().toLowerCase();
    }
  }

  const openPyqModal = (type, index) => {
    if (selectedMission.status === 'locked') return; // Prevents opening future days. Past/Missed days are allowed!
    
    let preloadedAnswers = {};
    let allSubmitted = false;
    const savedAnswers = selectedMissionState.pyqAnswers || {};

    if (type === 'VA') {
      const globalIndex = ((selectedMission.dayNumber - 1) * 2 + index) % vaQuestions.length;
      const q = vaQuestions[globalIndex];
      setActivePyq({ type: 'VA', data: q });
      setTimeLeft(3 * 60);

      if (savedAnswers[q.id]) {
          preloadedAnswers[0] = savedAnswers[q.id].selected;
          allSubmitted = true;
      }
    } else {
      const globalIndex = ((selectedMission.dayNumber - 1) * 1 + index) % rcSets.length; // Now strictly 1 RC per day
      const set = rcSets[globalIndex];
      setActivePyq({ type: 'RC', data: set });
      setTimeLeft(10 * 60);

      let anySaved = false;
      set.questions.forEach((q, i) => {
          if (savedAnswers[q.id]) {
              preloadedAnswers[i] = savedAnswers[q.id].selected;
              anySaved = true;
          }
      });
      if (anySaved) allSubmitted = true;
    }
    
    setCurrentQIndex(0);
    setUserAnswers(preloadedAnswers);
    setIsSubmitted(allSubmitted);
  }

  const handleOptionSelect = (val) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [currentQIndex]: val }));
  }

  const handlePyqSubmit = () => {
      if (isSubmitted) return;
      const newAnswers = {};
      
      if (activePyq.type === 'VA') {
          const q = activePyq.data;
          if (userAnswers[0] !== undefined && userAnswers[0] !== '') {
              newAnswers[q.id] = { selected: userAnswers[0], isCorrect: checkIsCorrect(q, userAnswers[0]) };
          }
      } else {
          activePyq.data.questions.forEach((q, i) => {
              if (userAnswers[i] !== undefined && userAnswers[i] !== '') {
                  newAnswers[q.id] = { selected: userAnswers[i], isCorrect: checkIsCorrect(q, userAnswers[i]) };
              }
          });
      }

      updateField('pyqAnswers', { ...(selectedMissionState.pyqAnswers || {}), ...newAnswers });
      setIsSubmitted(true);
  }

  if (!selectedMission) return null

  // Resolve current active question
  let currentQuestion = null;
  let questionsCount = 1;
  if (activePyq) {
      if (activePyq.type === 'VA') currentQuestion = activePyq.data;
      else {
          currentQuestion = activePyq.data.questions[currentQIndex];
          questionsCount = activePyq.data.questions.length;
      }
  }

  return (
    <>
      <style>{`
        /* CSS MIN-HEIGHT FIX */
        .dashboard-grid {
            display: grid;
            grid-template-areas: "stats calendar" "reading practice";
            grid-template-columns: 1fr 1.8fr; 
            grid-template-rows: auto minmax(0, 1fr); gap: 15px; min-height: 100%;
        }

        .stats-container { grid-area: stats; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .stat-card { padding: 8px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
        .stat-value { font-size: 1.4rem; font-family: var(--font-sketch); font-weight: bold; line-height: 1; margin-bottom: 2px; }
        .stat-label { font-size: 0.6rem; text-transform: uppercase; opacity: 0.7; }
        .clickable-stat { grid-column: span 2; background-color: #FFF5F5; cursor: pointer; border: 2px dashed rgba(231, 76, 60, 0.4); }
        .clickable-stat:hover { background-color: #FFEBEB; border-style: solid; border-color: var(--highlight-red); }

        .calendar-container { grid-area: calendar; padding: 10px 15px; display: flex; flex-direction: column; justify-content: space-between; }
        .week-header { display: flex; justify-content: space-between; font-family: var(--font-sketch); font-size: 0.9rem; margin-bottom: 8px;}
        .days-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; flex-grow: 1;}
        .day-box {
            background: var(--base-cream); border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center;
            box-shadow: inset 2px 2px 5px var(--shadow-light), inset -2px -2px 5px var(--shadow-dark); border: 2px solid transparent; position: relative; padding: 5px 0;
        }
        .day-box.active { background: var(--highlight-lavender); color: #fff; box-shadow: 3px 3px 0px rgba(0,0,0,0.1); transform: translateY(-2px); }
        .day-box.missed-alert { border-color: var(--highlight-red); background: #FFF5F5; }
        .day-box .day-name { font-size: 0.65rem; text-transform: uppercase; }
        .day-box .day-num { font-size: 1.2rem; font-weight: 600; margin: -2px 0;}
        .day-indicator { font-size: 0.7rem; font-weight: 600; font-family: var(--font-sketch); position: absolute; bottom: 4px; }

        .reading-container { grid-area: reading; overflow-y: auto; padding-right: 5px; }
        .panel-title { font-family: var(--font-sketch); font-size: 1.2rem; border-bottom: 2px dashed rgba(0,0,0,0.2); padding-bottom: 10px; margin: 0 0 15px 0; display: flex; justify-content: space-between; align-items: center;}
        
        .done-btn {
            background: transparent; color: var(--main-charcoal); border: 2px solid var(--main-charcoal); border-radius: 8px; padding: 4px 12px; font-family: var(--font-sketch); font-size: 0.8rem; font-weight: bold; cursor: pointer; transition: all 0.2s; box-shadow: 2px 2px 0px var(--main-charcoal);
        }
        .done-btn:hover:not(:disabled) { transform: translate(-1px, -1px); box-shadow: 3px 3px 0px var(--main-charcoal); }
        .done-btn.completed { background: var(--highlight-green); color: white; border-color: var(--highlight-green); box-shadow: none; transform: none; }
        .done-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .reading-item { margin-bottom: 15px; }
        .reading-item h4 { margin: 0 0 2px 0; font-size: 1rem; }
        .hover-title { color: var(--main-charcoal); text-decoration: none; transition: color 0.2s; }
        .hover-title:hover { color: var(--highlight-blue) !important; text-decoration: underline !important; }
        .practice-link { color: var(--hover-peach); text-decoration: none; transition: color 0.2s; cursor: pointer; font-weight: bold; display: flex; justify-content: space-between;}
        .practice-link:hover { color: var(--highlight-blue) !important; text-decoration: underline !important; }

        .practice-container { grid-area: practice; display: flex; flex-direction: column; overflow-y: auto; padding-right: 5px; }
        .practice-cards-wrapper { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; flex-grow: 1; padding-bottom: 5px; }
        .task-card {
            background: #FFFCF7; border: 1px solid rgba(0,0,0,0.05); border-radius: 10px; padding: 12px 15px; box-shadow: 2px 2px 8px rgba(0,0,0,0.03); position: relative; display: flex; flex-direction: column; transition: transform 0.3s;
        }
        .task-card:hover { transform: rotate(0.5deg) scale(1.01); }
        .task-card::after { content: ''; position: absolute; top: -4px; left: 50%; transform: translateX(-50%) rotate(-2deg); width: 30px; height: 10px; background: rgba(255, 154, 139, 0.4); border: 1px solid rgba(0,0,0,0.05); }
        .task-card label { font-family: var(--font-sans); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; color: var(--hover-peach); }
        .notebook-input { width: 100%; height: 44px; background-color: transparent; border: none; background-image: linear-gradient(transparent, transparent 21px, rgba(0,0,0,0.08) 21px, rgba(0,0,0,0.08) 22px, transparent 22px); background-size: 100% 22px; line-height: 22px; font-family: var(--font-sketch); font-size: 1rem; color: var(--main-charcoal); resize: none; outline: none; }

        /* NEW MODAL STYLES */
        .pyq-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 9999;
        }
        .pyq-modal-content {
            background: var(--base-cream); border-radius: 16px; padding: 25px 35px; position: relative;
            display: flex; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }
        .pyq-modal-content.rc-mode { width: 95%; max-width: 1200px; height: 90vh; }
        .pyq-modal-content.va-mode { width: 95%; max-width: 800px; max-height: 85vh; }
        
        .pyq-body { display: flex; gap: 30px; overflow: hidden; flex: 1; margin-top: 15px; }
        .pyq-passage-pane { flex: 1; overflow-y: auto; padding-right: 20px; border-right: 2px dashed rgba(0,0,0,0.2); }
        .pyq-question-pane { flex: 1; overflow-y: auto; padding-right: 10px; display: flex; flex-direction: column; }
        
        .pyq-close-btn {
            background: var(--highlight-red); color: white; border: none; border-radius: 50%;
            width: 30px; height: 30px; font-weight: bold; cursor: pointer; transition: transform 0.2s;
            display: flex; align-items: center; justify-content: center;
        }
        .pyq-close-btn:hover { transform: scale(1.1); }
        
        /* FIX 1: OPTIONS FORMATTING FIX */
        .pyq-option-btn {
            display: block; width: 100%; text-align: left; padding: 12px 15px; border-radius: 8px; 
            transition: all 0.2s; color: var(--main-charcoal); font-size: 0.95rem; line-height: 1.4;
            white-space: pre-wrap; word-break: break-word; margin-bottom: 10px;
        }
        .pyq-option-btn:hover:not(:disabled) { transform: translateX(5px); }
        .secondary-btn {
            background: transparent; border: 2px dashed var(--main-charcoal); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-family: var(--font-sketch); font-weight: bold; transition: all 0.2s;
        }
        .secondary-btn:hover:not(:disabled) { background: var(--hover-peach); color: white; border-style: solid; border-color: transparent; }
        .secondary-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      `}</style>

      <div className="dashboard-grid">
        {/* Stats */}
        <div className="stats-container">
            <div className="stat-card island sketch-border"><div className="stat-value" style={{color: '#E74C3C'}}>{daysLeft}</div><div className="stat-label">Days Left</div></div>
            <div className="stat-card island sketch-border"><div className="stat-value">{totalDays}</div><div className="stat-label">Total Days</div></div>
            <div className="stat-card island sketch-border"><div className="stat-value" style={{color: '#27AE60'}}>{completedCount}</div><div className="stat-label">Completed</div></div>
            <div className="stat-card island sketch-border"><div className="stat-value" style={{color: '#3498DB'}}>{pendingCount}</div><div className="stat-label">Pending</div></div>
            <div className="stat-card island sketch-border clickable-stat" onClick={handleFindMissed}><div className="stat-value" style={{color: '#E74C3C'}}>{missedCount}</div><div className="stat-label">Days Missed (Click to view)</div></div>
        </div>

        {/* Calendar */}
        <div className="calendar-container island sketch-border">
            <div className="week-header">
                <span style={{fontFamily: 'var(--font-sketch)'}}>Week {weeks.findIndex(w => w.key === selectedWeekKey) + 1} // {selectedWeek?.label}</span>
                <span style={{opacity: 0.6, fontSize: '0.75rem'}}>Mon - Sun</span>
            </div>
            <div className="days-row">
                {selectedWeek?.slots.map((mission, index) => {
                    if (!mission) return <div key={`empty-${index}`} className="day-box pending" style={{border: '1px dashed rgba(0,0,0,0.1)'}}><div className="day-name">{WEEKDAY_LABELS[index]}</div><div className="day-num">{addDays(selectedWeek.startDate, index).getDate()}</div><div className="day-indicator" style={{ opacity: 0.4 }}>-</div></div>
                    const isSelected = selectedDay === mission.dayNumber
                    let statusClass = isSelected ? 'active' : (mission.status === 'completed' ? 'completed' : (mission.status === 'missed' ? 'missed' : 'pending'))
                    let indicatorLabel = (mission.status === 'active' || isSameDay(mission.date, today)) ? 'Today' : mission.status
                    return (
                        <div key={mission.dayNumber} className={`day-box ${statusClass}`} onClick={() => { if(mission.status !== 'locked') setSelectedDay(mission.dayNumber) }} style={{cursor: mission.status === 'locked' ? 'not-allowed' : 'pointer'}}>
                            <div className="day-name">{WEEKDAY_LABELS[index]}</div>
                            <div className="day-num">{new Date(mission.date).getDate()}</div>
                            <div className="day-indicator" style={{color: mission.status === 'missed' && !isSelected ? '#E74C3C' : 'inherit'}}>{indicatorLabel}</div>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* Reading Area */}
        <div className="reading-container island sketch-border">
            <h2 className="panel-title">
                <span>Reading <span style={{opacity: 0.6, fontSize: '0.85rem'}}>Day {selectedMission.dayNumber}</span></span>
                <button onClick={() => updateField('completed', !selectedMissionState.completed)} className={`done-btn ${selectedMissionState.completed ? 'completed' : ''}`} disabled={selectedMission.status === 'locked'}>
                    {selectedMissionState.completed ? '✓ DONE' : 'MARK AS DONE'}
                </button>
            </h2>
            {selectedMission.articles?.map((article, index) => (
                <div className="reading-item" key={index}>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '1rem' }}><a href={article.url} target="_blank" rel="noreferrer" className="hover-title" style={{ color: 'var(--main-charcoal)', textDecoration: 'none' }}>{index + 1}. {article.title}</a></h4>
                    <span style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{article.source || 'Reading Assignment'}</span>
                </div>
            ))}
            {(!selectedMission.articles || selectedMission.articles.length === 0) && <p style={{opacity: 0.6, fontStyle: 'italic', fontSize: '0.9rem'}}>No reading assigned for today.</p>}
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
                            <label>{q?.url ? <a href={q.url} target="_blank" rel="noreferrer" className="practice-link">CR {index + 1}: {q?.source || 'GMAT CLUB'} &#8599;</a> : `CR ${index + 1}: ${q?.source || 'GMAT CLUB'}`}</label>
                            <textarea className="notebook-input" placeholder="Draft reasoning..." value={index === 0 ? selectedMissionState.crRemarks1 : selectedMissionState.crRemarks2} onChange={(e) => updateField(index === 0 ? 'crRemarks1' : 'crRemarks2', e.target.value)} disabled={selectedMission.status === 'locked'} />
                        </div>
                    )
                })}

                {/* VA Cards (WITH PROGRESS INDICATORS) */}
                {[0, 1].map((index) => {
                    const globalIndex = ((selectedMission.dayNumber - 1) * 2 + index) % vaQuestions.length;
                    const q = vaQuestions[globalIndex];
                    const saved = (selectedMissionState.pyqAnswers || {})[q.id];
                    const indicator = saved ? (saved.isCorrect ? '✅' : '❌') : '';

                    return (
                        <div className="task-card" key={`va-${index}`}>
                            <label>
                                <span className="practice-link" onClick={() => openPyqModal('VA', index)}>
                                    <span>VA {index + 1}: CAT PYQ &#8599;</span>
                                    <span style={{ fontSize: '0.9rem' }}>{indicator}</span>
                                </span>
                            </label>
                            <textarea className="notebook-input" placeholder={index === 0 ? "Draft sequence..." : "Draft summary..."} value={index === 0 ? selectedMissionState.vaRemarks1 : selectedMissionState.vaRemarks2} onChange={(e) => updateField(index === 0 ? 'vaRemarks1' : 'vaRemarks2', e.target.value)} disabled={selectedMission.status === 'locked'} />
                        </div>
                    )
                })}

                {/* RC Card (1 PER DAY, WITH SCORE TRACKING) */}
                {[0].map((index) => {
                    const globalIndex = ((selectedMission.dayNumber - 1) * 1 + index) % rcSets.length;
                    const set = rcSets[globalIndex];
                    const attempts = set.questions.map(q => (selectedMissionState.pyqAnswers || {})[q.id]).filter(Boolean);
                    const score = attempts.filter(a => a.isCorrect).length;
                    const indicator = attempts.length > 0 ? `<Score: ${score}/${set.questions.length}>` : '';

                    return (
                        <div className="task-card" key={`rc-${index}`} style={{ gridColumn: 'span 2' }}>
                            <label>
                                <span className="practice-link" onClick={() => openPyqModal('RC', index)}>
                                    <span>RC PASSAGE: {set.questions[0].id.split('-')[0]} {set.questions[0].id.split('-')[1]} &#8599;</span>
                                    <span style={{ color: 'var(--highlight-green)', fontSize: '0.85rem' }}>{indicator}</span>
                                </span>
                            </label>
                            <textarea className="notebook-input" placeholder={`Summarize passage thoughts...`} value={index === 0 ? selectedMissionState.rcRemarks1 : selectedMissionState.rcRemarks2} onChange={(e) => updateField(index === 0 ? 'rcRemarks1' : 'rcRemarks2', e.target.value)} disabled={selectedMission.status === 'locked'} />
                        </div>
                    )
                })}
            </div>
        </div>
      </div>

      {/* --- THE ENHANCED PYQ SOLVING MODAL --- */}
      {activePyq && (
        <div className="pyq-modal-overlay" onClick={() => setActivePyq(null)}>
            <div className={`island sketch-border pyq-modal-content ${activePyq.type === 'RC' ? 'rc-mode' : 'va-mode'}`} onClick={(e) => e.stopPropagation()}>
                
                {/* Header with Timer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed var(--main-charcoal)', paddingBottom: '10px' }}>
                    <h2 style={{ margin: 0, color: 'var(--highlight-blue)' }}>
                        {activePyq.type === 'RC' ? `RC Passage (${currentQIndex + 1} of ${questionsCount})` : currentQuestion.id}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'var(--font-sketch)', color: timeLeft <= 60 && !isSubmitted ? 'var(--highlight-red)' : 'var(--main-charcoal)', animation: timeLeft <= 60 && !isSubmitted ? 'pulse 1s infinite' : 'none' }}>
                            {isSubmitted ? '🏁' : '⏱'} {formatTime(timeLeft)}
                        </div>
                        <button className="pyq-close-btn" onClick={() => setActivePyq(null)}>X</button>
                    </div>
                </div>

                {/* Body (Split Screen for RC, Single Column for VA) */}
                <div className="pyq-body" style={{ flexDirection: activePyq.type === 'RC' ? 'row' : 'column' }}>
                    
                    {/* Left Pane: Passage (RC Only) */}
                    {activePyq.type === 'RC' && (
                        <div className="pyq-passage-pane">
                            <div style={{ lineHeight: '1.8', fontSize: '0.95rem', whiteSpace: 'pre-wrap', color: 'var(--main-charcoal)' }}>
                                {activePyq.data.passage}
                            </div>
                        </div>
                    )}

                    {/* Right Pane: Question & Options */}
                    <div className="pyq-question-pane" style={{ width: activePyq.type === 'RC' ? '50%' : '100%' }}>
                        <p style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '20px' }}>
                            {currentQuestion.question}
                        </p>

                        {/* Options Rendering */}
                        {currentQuestion.options && currentQuestion.options.length > 0 ? (
                            <div style={{ display: 'block', marginBottom: '20px' }}>
                                {currentQuestion.options.map((opt, i) => {
                                    const isSelected = userAnswers[currentQIndex] === i;
                                    const isCorrect = checkIsCorrect(currentQuestion, i);
                                    let bg = 'transparent';
                                    let border = '2px solid rgba(0,0,0,0.1)';
                                    
                                    if (isSubmitted) {
                                        if (isCorrect) { bg = 'rgba(39, 174, 96, 0.15)'; border = '2px solid var(--highlight-green)'; }
                                        else if (isSelected) { bg = 'rgba(231, 76, 60, 0.15)'; border = '2px solid var(--highlight-red)'; }
                                    } else if (isSelected) {
                                        bg = 'rgba(52, 152, 219, 0.15)'; border = '2px solid var(--highlight-blue)';
                                    }

                                    return (
                                        <button 
                                            key={i} 
                                            onClick={() => handleOptionSelect(i)}
                                            className="pyq-option-btn"
                                            style={{ border, background: bg, cursor: isSubmitted ? 'default' : 'pointer' }}
                                            disabled={isSubmitted}
                                        >
                                            <strong>Option {i + 1}:</strong> {opt}
                                        </button>
                                    )
                                })}
                            </div>
                        ) : (
                            <div style={{ marginBottom: '20px' }}>
                                <input 
                                    type="text" 
                                    className="notebook-input" 
                                    placeholder="Type your answer (e.g., 2143)..."
                                    value={userAnswers[currentQIndex] || ''}
                                    onChange={(e) => handleOptionSelect(e.target.value)}
                                    disabled={isSubmitted}
                                    style={{ borderBottom: '2px solid var(--main-charcoal)', padding: '10px' }}
                                />
                                {isSubmitted && (
                                    <p style={{ color: checkIsCorrect(currentQuestion, userAnswers[currentQIndex]) ? 'var(--highlight-green)' : 'var(--highlight-red)', fontWeight: 'bold', marginTop: '10px' }}>
                                        Correct Answer: {currentQuestion.correctAnswer}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Controls Bottom Bar */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '20px', borderTop: '2px dashed rgba(0,0,0,0.1)' }}>
                            {activePyq.type === 'RC' && (
                                <>
                                    <button className="secondary-btn" onClick={() => setCurrentQIndex(p => p - 1)} disabled={currentQIndex === 0}>&larr; Prev</button>
                                    <button className="secondary-btn" onClick={() => setCurrentQIndex(p => p + 1)} disabled={currentQIndex === questionsCount - 1}>Next &rarr;</button>
                                </>
                            )}
                            <button 
                                className={`done-btn ${isSubmitted ? 'completed' : ''}`} 
                                style={{ flex: 1, padding: '12px', fontSize: '1rem', borderStyle: isSubmitted ? 'solid' : 'dashed' }}
                                onClick={handlePyqSubmit}
                                disabled={isSubmitted}
                            >
                                {isSubmitted ? 'TEST COMPLETED' : (activePyq.type === 'RC' ? 'SUBMIT FULL SET' : 'SUBMIT ANSWER')}
                            </button>
                        </div>

                        {/* Explanation Area */}
                        {isSubmitted && (
                            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px' }}>
                                <p style={{ margin: '0 0 10px 0', color: 'var(--highlight-blue)', fontWeight: 'bold' }}>Explanation:</p>
                                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--main-charcoal)', whiteSpace: 'pre-wrap' }}>{currentQuestion.explanation}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </>
  )
}