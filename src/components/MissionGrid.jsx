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
    <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[28px] border border-zinc-800 bg-zinc-900/70 p-4">
        <div className="mb-4">
          <h2 className="text-xl font-black text-zinc-100">300-Day Crucible</h2>
          <p className="mt-1 text-sm text-zinc-400">Select a mission card to open the day.</p>
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

      <div className="rounded-[28px] border border-zinc-800 bg-zinc-900/70 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Mission Detail</p>
            <h3 className="mt-2 text-2xl font-black text-zinc-100">
              Day {selectedMission.dayNumber}
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              {formatDisplayDate(selectedMission.date)}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
              selectedMission.status === 'completed'
                ? 'border border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                : selectedMission.status === 'missed'
                ? 'border border-red-900 bg-red-950/20 text-zinc-200'
                : selectedMission.status === 'locked'
                ? 'border border-zinc-800 bg-zinc-900 text-zinc-500'
                : 'border border-sky-400/50 bg-sky-400/10 text-sky-300'
            }`}
          >
            {selectedMission.status}
          </span>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Articles
            </p>
            <div className="space-y-2">
              {selectedMission.articles.map((article, index) => (
                <a
                  key={`${article.url}-${index}`}
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-200 transition hover:border-sky-400 hover:text-sky-300"
                >
                  <div>
  <p>{index + 1}. {article.title}</p>
  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">
    {article.source}
  </p>
</div>
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              GMAT Club CR Questions
            </p>

            <div className="space-y-4">
              {selectedMission.crQuestions.map((question, index) => (
                <div
                  key={`${question.url}-${index}`}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4"
                >
                  <a
                    href={question.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-zinc-100 transition hover:text-sky-300"
                  >
                    <div>
  <p>CR {index + 1}: {question.title}</p>
  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">
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
                    className="mt-3 min-h-[110px] w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              GMAT Club RC Passage
            </p>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <a
                href={selectedMission.rcPassage?.url || '#'}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-zinc-100 transition hover:text-sky-300"
              >
                <div>
  <p>RC: {selectedMission.rcPassage?.title || 'Add RC link'}</p>
  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">
    {selectedMission.rcPassage?.source || ''}
  </p>
</div>
              </a>

              <textarea
                value={selectedMissionState.rcRemarks}
                onChange={(event) => updateField('rcRemarks', event.target.value)}
                disabled={selectedMission.status === 'locked'}
                placeholder="Write RC remarks here..."
                className="mt-3 min-h-[120px] w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <p className="mt-3 text-xs leading-5 text-zinc-500">
                {LEGAL_DISCLAIMER}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleCompleted}
            disabled={selectedMission.status === 'locked'}
            className={`w-full rounded-2xl px-4 py-3 text-sm font-bold transition ${
              selectedMission.status === 'locked'
                ? 'cursor-not-allowed border border-zinc-800 bg-zinc-900 text-zinc-500'
                : selectedMissionState.completed
                ? 'border border-emerald-500 bg-emerald-500 text-zinc-950'
                : 'border border-sky-400 bg-sky-400 text-zinc-950 hover:opacity-90'
            }`}
          >
            {selectedMissionState.completed ? 'Mark as Incomplete' : 'Complete Mission'}
          </button>
        </div>
      </div>
    </section>
  )
}