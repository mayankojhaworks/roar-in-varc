import { useMemo, useState } from 'react'
import LineChartCard from './LineChartCard'
import StatCard from './StatCard'
import { formatDisplayDate } from '../utils/date'

function createEmptySection() {
  return {
    attempted: '',
    correct: '',
    incorrect: '',
    score: '',
    percentile: '',
  }
}

function createEmptyForm() {
  return {
    examType: 'Mock',
    examName: '',
    examNumberOrSlot: '',
    attemptDate: '',
    singleSitting: 'Yes',
    overallScore: '',
    overallPercentile: '',
    sections: {
      varc: createEmptySection(),
      lrdi: createEmptySection(),
      qa: createEmptySection(),
    },
  }
}

function toNumber(value) {
  return value === '' || value === null || value === undefined ? 0 : Number(value)
}

function average(values) {
  if (!values.length) return 0
  const total = values.reduce((sum, current) => sum + current, 0)
  return (total / values.length).toFixed(1)
}

function buildRecordTitle(record) {
  return [record.examName, record.examNumberOrSlot].filter(Boolean).join(' • ')
}

export default function WarRoom({ records, onAddRecord, onDeleteRecord }) {
  const [form, setForm] = useState(createEmptyForm())

  const sortedRecords = useMemo(() => {
    return [...records].sort((first, second) => {
      return new Date(first.attemptDate) - new Date(second.attemptDate)
    })
  }, [records])

  const mockCount = records.filter((record) => record.examType === 'Mock').length
  const pyqCount = records.filter((record) => record.examType === 'PYQ').length

  const bestPercentile = records.length
    ? Math.max(...records.map((record) => toNumber(record.overallPercentile)))
    : 0

  const averageScore = records.length
    ? average(records.map((record) => toNumber(record.overallScore)))
    : 0

  const latestRecord = sortedRecords[sortedRecords.length - 1]

  const scoreSeries = sortedRecords.map((record, index) => ({
    label: record.attemptDate || `Attempt ${index + 1}`,
    value: toNumber(record.overallScore),
  }))

  const percentileSeries = sortedRecords.map((record, index) => ({
    label: record.attemptDate || `Attempt ${index + 1}`,
    value: toNumber(record.overallPercentile),
  }))

  const sectionSummary = ['varc', 'lrdi', 'qa'].map((sectionKey) => {
    const avgScore = average(sortedRecords.map((record) => toNumber(record.sections?.[sectionKey]?.score)))
    const avgPercentile = average(
      sortedRecords.map((record) => toNumber(record.sections?.[sectionKey]?.percentile))
    )

    return {
      key: sectionKey,
      label: sectionKey.toUpperCase(),
      avgScore,
      avgPercentile,
    }
  })

  const handleRootChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSectionChange = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: {
          ...prev.sections[section],
          [field]: value,
        },
      },
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const record = {
      ...form,
      id:
        globalThis.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    }

    onAddRecord(record)
    setForm(createEmptyForm())
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mocks Completed" value={`${mockCount}/60`} accent="blue" />
        <StatCard label="PYQs Completed" value={`${pyqCount}/22`} />
        <StatCard label="Best Percentile" value={bestPercentile} accent="green" />
        <StatCard
          label="Average Overall Score"
          value={averageScore}
          subtext={latestRecord ? `Latest: ${buildRecordTitle(latestRecord)}` : 'No entries yet'}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-zinc-800 bg-zinc-900/70 p-5"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Data Entry
          </p>
          <h2 className="mt-2 text-2xl font-black text-zinc-100">War Room Intake</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Exam Type
              </label>
              <select
                value={form.examType}
                onChange={(event) => handleRootChange('examType', event.target.value)}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-sky-400"
              >
                <option value="Mock">Mock</option>
                <option value="PYQ">PYQ</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Single Sitting
              </label>
              <select
                value={form.singleSitting}
                onChange={(event) => handleRootChange('singleSitting', event.target.value)}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-sky-400"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Mock Name / PYQ Year
              </label>
              <input
                value={form.examName}
                onChange={(event) => handleRootChange('examName', event.target.value)}
                placeholder="e.g. TIME AIMCAT / 2024"
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-sky-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Mock Number / Slot
              </label>
              <input
                value={form.examNumberOrSlot}
                onChange={(event) => handleRootChange('examNumberOrSlot', event.target.value)}
                placeholder="e.g. 12 / Slot 2"
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-sky-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Date of Attempt
              </label>
              <input
                type="date"
                value={form.attemptDate}
                onChange={(event) => handleRootChange('attemptDate', event.target.value)}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Overall Score
              </label>
              <input
                type="number"
                step="0.1"
                value={form.overallScore}
                onChange={(event) => handleRootChange('overallScore', event.target.value)}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-sky-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Overall Percentile
              </label>
              <input
                type="number"
                step="0.1"
                value={form.overallPercentile}
                onChange={(event) => handleRootChange('overallPercentile', event.target.value)}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {[
              { key: 'varc', label: 'VARC' },
              { key: 'lrdi', label: 'LRDI' },
              { key: 'qa', label: 'QA' },
            ].map((section) => (
              <div
                key={section.key}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4"
              >
                <p className="mb-4 text-sm font-bold text-zinc-100">{section.label}</p>

                <div className="grid gap-3 md:grid-cols-5">
                  {['attempted', 'correct', 'incorrect', 'score', 'percentile'].map((field) => (
                    <div key={field}>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        {field}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={form.sections[section.key][field]}
                        onChange={(event) =>
                          handleSectionChange(section.key, field, event.target.value)
                        }
                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-sky-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-2xl border border-sky-400 bg-sky-400 px-4 py-3 text-sm font-black text-zinc-950 transition hover:opacity-90"
          >
            Save War Room Entry
          </button>
        </form>

        <div className="space-y-6">
          <LineChartCard title="Overall Score Trajectory" data={scoreSeries} />
          <LineChartCard title="Overall Percentile Trajectory" data={percentileSeries} suffix="%" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {sectionSummary.map((section) => (
          <div
            key={section.key}
            className="rounded-[24px] border border-zinc-800 bg-zinc-900/70 p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              {section.label}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-zinc-400">Avg Score</span>
              <span className="text-lg font-bold text-zinc-100">{section.avgScore}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-zinc-400">Avg Percentile</span>
              <span className="text-lg font-bold text-emerald-400">{section.avgPercentile}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[28px] border border-zinc-800 bg-zinc-900/70 p-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Attempt Log
          </p>
          <h3 className="mt-2 text-xl font-black text-zinc-100">Saved Records</h3>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-zinc-500">
                <th className="px-3">Type</th>
                <th className="px-3">Name</th>
                <th className="px-3">Date</th>
                <th className="px-3">Score</th>
                <th className="px-3">%ile</th>
                <th className="px-3">Sitting</th>
                <th className="px-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecords.map((record) => (
                <tr key={record.id} className="rounded-2xl bg-zinc-950/60 text-sm text-zinc-200">
                  <td className="rounded-l-2xl px-3 py-3">{record.examType}</td>
                  <td className="px-3 py-3">{buildRecordTitle(record)}</td>
                  <td className="px-3 py-3">
                    {record.attemptDate ? formatDisplayDate(record.attemptDate) : '-'}
                  </td>
                  <td className="px-3 py-3">{record.overallScore}</td>
                  <td className="px-3 py-3">{record.overallPercentile}</td>
                  <td className="px-3 py-3">{record.singleSitting}</td>
                  <td className="rounded-r-2xl px-3 py-3">
                    <button
                      type="button"
                      onClick={() => onDeleteRecord(record.id)}
                      className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 transition hover:border-red-800 hover:bg-red-950/20 hover:text-zinc-100"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {!sortedRecords.length ? (
                <tr>
                  <td colSpan="7" className="px-3 py-8 text-center text-sm text-zinc-500">
                    No entries saved yet
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}