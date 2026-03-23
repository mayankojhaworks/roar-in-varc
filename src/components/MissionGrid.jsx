import { useEffect, useMemo, useState } from 'react'
import MissionCard from './MissionCard'
import {
  compareDay,
  formatDisplayDate,
  formatShortDate,
  getTodayDateOnly,
  isSameDay,
} from '../utils/date'
import { LEGAL_DISCLAIMER } from '../utils/constants'

function getMissionStatus(missionDate, completed) {
  const today = getTodayDateOnly()
  const comparison = compareDay(missionDate, today)

  if (completed) return 'completed'
  if (comparison > 0) return 'locked'
  if (comparison < 0) return 'missed'
  return 'active'
}

function getDefaultSelectedDay(missions) {
  const today = getTodayDateOnly()
  const found = missions.find((mission) => isSameDay(mission.date, today))
  return found ? found.dayNumber : 1
}

export default function MissionGrid({
  missions,
  missionState,
  onMissionUpdate,
}) {
  const [selectedDay, setSelectedDay] = useState(getDefaultSelectedDay(missions))

  useEffect(() => {
    setSelectedDay(getDefaultSelectedDay(missions))
  }, [missions])

  const enrichedMissions = useMemo(() => {
    return missions.map((mission) => {
      const saved = missionState[mission.dayNumber] || {}
      const completed = Boolean(saved.completed)

      return {
        ...mission,
        shortDate: formatShortDate(mission.date),
        status: getMissionStatus(mission.date, completed),
      }
    })
  }, [missions, missionState])

  const selectedMission =
    enrichedMissions.find((mission) => mission.dayNumber === selectedDay) ||
    enrichedMissions[0]

  const selectedMissionState = missionState[selectedMission.dayNumber] || {
    completed: false,
    crRemarks1: '',
    crRemarks2: '',
    rcRemarks: '',
  }

  const totalDays = enrichedMissions.length
  const completedCount = enrichedMissions.filter((mission) => mission.status === 'completed').length
  const missedCount = enrichedMissions.filter((mission) => mission.status === 'missed').length
  const lockedCount = enrichedMissions.filter((mission) => mission.status === 'locked').length

  const updateField = (field, value) => {
    onMissionUpdate(selectedMission.dayNumber, {
      [field]: value,
    })
  }

  const toggleCompleted = () => {
    if (selectedMission.status === 'locked') return

    onMissionUpdate(selectedMission.dayNumber, {
      completed: !selectedMissionState.completed,
    })
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Plan Length', value: totalDays, tone: 'text-zinc-100' },
          { label: 'Completed', value: completedCount, tone: 'text-emerald-300' },
          { label: 'Pending / Locked', value: missedCount + lockedCount, tone: 'text-sky-300' },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[24px] border border-zinc-800 bg-[linear-gradient(135deg,rgba(10,10,12,0.94),rgba(15,19,28,0.84))] px-5 py-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              {item.label}
            </p>
            <p className={`mt-3 text-3xl font-black ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-zinc-800 bg-[linear-gradient(135deg,rgba(10,10,12,0.96),rgba(15,19,28,0.88))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <div className="mb-5">
            <h2 className="text-2xl font-black text-zinc-100">Daily Plan</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Open any day to review reading links, critical reasoning practice, and your own notes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {enrichedMissions.map((mission) => (
              <MissionCard
                key={mission.dayNumber}
                mission={mission}
                stateLabel={mission.status}
                isSelected={selectedDay === mission.dayNumber}
                onSelect={() => setSelectedDay(mission.dayNumber)}
              />
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-zinc-800 bg-[linear-gradient(135deg,rgba(10,10,12,0.96),rgba(15,19,28,0.88))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
                Selected Day
              </p>
              <h3 className="mt-3 text-3xl font-black text-zinc-100">
                Day {selectedMission.dayNumber}
              </h3>
              <p className="mt-2 text-base text-zinc-400">
                {formatDisplayDate(selectedMission.date)}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                selectedMission.status === 'completed'
                  ? 'border border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                  : selectedMission.status === 'missed'
                    ? 'border border-red-900 bg-red-950/20 text-red-200'
                    : selectedMission.status === 'locked'
                      ? 'border border-zinc-700 bg-zinc-900 text-zinc-500'
                      : 'border border-sky-400/50 bg-sky-400/10 text-sky-300'
              }`}
            >
              {selectedMission.status}
            </span>
          </div>

          <div className="mt-8 space-y-7">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Reading
              </p>

              <div className="space-y-3">
                {selectedMission.articles.map((article, index) => (
                  <a
                    key={`${article.url}-${index}`}
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group block rounded-[24px] border border-zinc-800 bg-zinc-950/80 px-5 py-4 text-sm text-zinc-200 transition duration-200 hover:-translate-y-0.5 hover:border-sky-400/60 hover:bg-zinc-950"
                  >
                    <p className="text-xl font-semibold leading-7 text-zinc-100 transition group-hover:text-sky-300">
                      {index + 1}. {article.title}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {article.source}
                    </p>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Critical Reasoning
              </p>

              <div className="space-y-4">
                {selectedMission.crQuestions.map((question, index) => (
                  <div
                    key={`${question.url}-${index}`}
                    className="rounded-[24px] border border-zinc-800 bg-zinc-950/70 p-5 transition duration-200 hover:border-zinc-700"
                  >
                    <a
                      href={question.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group block text-sm font-semibold text-zinc-100"
                    >
                      <div>
                        <p className="text-xl font-semibold text-zinc-100 transition group-hover:text-sky-300">
                          CR {index + 1}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                          {question.source}
                        </p>
                      </div>
                    </a>

                    <textarea
                      value={index === 0 ? selectedMissionState.crRemarks1 : selectedMissionState.crRemarks2}
                      onChange={(event) =>
                        updateField(index === 0 ? 'crRemarks1' : 'crRemarks2', event.target.value)
                      }
                      disabled={selectedMission.status === 'locked'}
                      placeholder="Write CR remarks here..."
                      className="mt-4 min-h-[118px] w-full rounded-[22px] border border-zinc-800 bg-[#06080b] px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Reading Comprehension
              </p>

              <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/70 p-5">
                {selectedMission.rcPassage ? (
                  <a
                    href={selectedMission.rcPassage.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group block text-sm font-semibold text-zinc-100"
                  >
                    <div>
                      <p className="text-xl font-semibold text-zinc-100 transition group-hover:text-sky-300">
                        RC: {selectedMission.rcPassage.title}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                        {selectedMission.rcPassage.source}
                      </p>
                    </div>
                  </a>
                ) : (
                  <div>
                    <p className="text-base font-semibold text-zinc-300">No RC link added yet</p>
                    <p className="mt-2 text-sm text-zinc-500">
                      Add links to content/raw/rc.txt whenever you want to enable this section.
                    </p>
                  </div>
                )}

                <textarea
                  value={selectedMissionState.rcRemarks}
                  onChange={(event) => updateField('rcRemarks', event.target.value)}
                  disabled={selectedMission.status === 'locked'}
                  placeholder="Write RC remarks here..."
                  className="mt-4 min-h-[120px] w-full rounded-[22px] border border-zinc-800 bg-[#06080b] px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <p className="mt-4 text-xs leading-5 text-zinc-500">
                  {LEGAL_DISCLAIMER}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleCompleted}
              disabled={selectedMission.status === 'locked'}
              className={`w-full rounded-[24px] px-4 py-3 text-sm font-bold transition duration-200 hover:-translate-y-0.5 ${
                selectedMission.status === 'locked'
                  ? 'cursor-not-allowed border border-zinc-800 bg-zinc-900 text-zinc-500'
                  : selectedMissionState.completed
                    ? 'border border-emerald-500 bg-emerald-500 text-zinc-950 shadow-[0_14px_30px_rgba(5,46,34,0.28)]'
                    : 'border border-sky-400 bg-sky-400 text-zinc-950 shadow-[0_14px_30px_rgba(8,47,73,0.28)] hover:opacity-95'
              }`}
            >
              {selectedMissionState.completed ? 'Mark Day Incomplete' : 'Mark Day Complete'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}