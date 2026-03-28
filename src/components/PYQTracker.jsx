import React, { useMemo, useState } from 'react';
import pyqData from '../data/pyqDataV4.json';
import { getTodayDateOnly, compareDay } from '../utils/date';

// --- DATA PREPARATION ---
const vaQuestions = pyqData.filter(q => q.type === 'VA');
const rawRcQuestions = pyqData.filter(q => q.type === 'RC');
const rcSets = [];
const passageMap = new Map();
rawRcQuestions.forEach(q => {
  if (!passageMap.has(q.passage)) {
    passageMap.set(q.passage, { passage: q.passage, questions: [] });
    rcSets.push(passageMap.get(q.passage));
  }
  passageMap.get(q.passage).questions.push(q);
});

export default function PYQTracker({ missions, missionState }) {
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const tableData = useMemo(() => {
    const today = getTodayDateOnly();
    const data = [];
    vaQuestions.forEach((q, index) => data.push({ ...q, dayNum: Math.floor(index / 2) + 1 }));
    rcSets.forEach((set, index) => set.questions.forEach(q => data.push({ ...q, dayNum: index + 1 })));

    return data.map(q => {
      const savedAnswer = missionState[q.dayNum]?.pyqAnswers?.[q.id];
      const missionDateObj = missions.find(m => m.dayNumber === q.dayNum);
      let status = 'Upcoming', result = '-';
      if (savedAnswer) {
        status = 'Attempted';
        result = savedAnswer.isCorrect ? 'Correct' : 'Incorrect';
      } else if (missionDateObj && compareDay(missionDateObj.date, today) < 0) status = 'Missed';
      return { ...q, status, result };
    }).sort((a, b) => a.dayNum - b.dayNum); 
  }, [missions, missionState]);

  const filteredData = tableData.filter(row => (filterType === 'All' || row.type === filterType) && (filterStatus === 'All' || row.status === filterStatus));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%', width: '100%' }}>
      
      {/* FILTER BAR */}
      <div style={{ display: 'flex', gap: '15px' }}>
          <div className="island sketch-border" style={{ padding: '8px 15px', display: 'flex', gap: '10px', alignItems: 'center', background: '#fff' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--hover-peach)' }}>TYPE:</span>
              {['All', 'VA', 'RC'].map(t => <button key={t} onClick={() => setFilterType(t)} style={{ padding: '3px 12px', borderRadius: '12px', border: '1px solid var(--main-charcoal)', background: filterType === t ? 'var(--main-charcoal)' : 'transparent', color: filterType === t ? '#fff' : 'var(--main-charcoal)', cursor: 'pointer', fontSize: '0.8rem' }}>{t}</button>)}
          </div>
          <div className="island sketch-border" style={{ padding: '8px 15px', display: 'flex', gap: '10px', alignItems: 'center', background: '#fff' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--hover-peach)' }}>STATUS:</span>
              {['All', 'Attempted', 'Missed', 'Upcoming'].map(s => <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '3px 12px', borderRadius: '12px', border: '1px solid var(--main-charcoal)', background: filterStatus === s ? 'var(--main-charcoal)' : 'transparent', color: filterStatus === s ? '#fff' : 'var(--main-charcoal)', cursor: 'pointer', fontSize: '0.8rem' }}>{s}</button>)}
          </div>
      </div>

      {/* THE TABLE */}
      <div className="island sketch-border" style={{ flex: 1, overflowY: 'auto', background: '#fff', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#FDFBF7', zIndex: 10, borderBottom: '2px solid rgba(0,0,0,0.05)' }}>
                  <tr><th style={{ padding: '15px' }}>Day</th><th style={{ padding: '15px' }}>Question Code</th><th style={{ padding: '15px' }}>Type</th><th style={{ padding: '15px' }}>Status</th><th style={{ padding: '15px' }}>Result</th></tr>
              </thead>
              <tbody>
                  {filteredData.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                          <td style={{ padding: '12px 15px' }}>Day {row.dayNum}</td>
                          <td style={{ padding: '12px 15px', color: 'var(--highlight-blue)', fontFamily: 'monospace' }}>{row.id}</td>
                          <td style={{ padding: '12px 15px' }}><span style={{ padding: '2px 8px', borderRadius: '4px', background: row.type === 'RC' ? 'rgba(52, 152, 219, 0.1)' : 'rgba(155, 89, 182, 0.1)', color: row.type === 'RC' ? 'var(--highlight-blue)' : '#8e44ad', fontSize: '0.7rem', fontWeight: 'bold' }}>{row.type}</span></td>
                          <td style={{ padding: '12px 15px' }}><span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold', background: row.status === 'Attempted' ? 'var(--main-charcoal)' : (row.status === 'Missed' ? '#FFF5F5' : '#F8F9FA'), color: row.status === 'Attempted' ? '#fff' : (row.status === 'Missed' ? 'var(--highlight-red)' : '#6c757d') }}>{row.status}</span></td>
                          <td style={{ padding: '12px 15px' }}>{row.result === 'Correct' ? '✅ Correct' : row.result === 'Incorrect' ? '❌ Incorrect' : '-'}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
}