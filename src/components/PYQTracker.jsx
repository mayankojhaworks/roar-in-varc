import React, { useMemo, useState } from 'react';
import pyqData from '../data/pyqDataV4.json';

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

// --- FOOLPROOF TIME MATH (matches MissionGrid) ---
const getZeroedTime = (dateParam) => {
  const d = dateParam ? new Date(dateParam) : new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

export default function PYQTracker({ missions, missionState, onOpenTest }) {
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const tableData = useMemo(() => {
    const todayTime = getZeroedTime();
    const data = [];
    
    // Attach original index so we know exactly which test to open
    vaQuestions.forEach((q, index) => data.push({ ...q, dayNum: Math.floor(index / 2) + 1, originalIndex: index }));
    rcSets.forEach((set, index) => set.questions.forEach(q => data.push({ ...q, dayNum: index + 1, originalIndex: index })));

    return data.map(q => {
      const savedAnswer = missionState[q.dayNum]?.pyqAnswers?.[q.id];
      const missionDateObj = missions.find(m => m.dayNumber === q.dayNum);
      
      let status = 'Upcoming', result = '-';
      
      if (savedAnswer) {
        status = 'Attempted';
        result = savedAnswer.isCorrect ? 'Correct' : 'Incorrect';
      } else if (missionDateObj) {
        // THE FIX: Foolproof date comparison
        const missionTime = getZeroedTime(missionDateObj.date);
        if (missionTime < todayTime) {
            status = 'Missed';
        }
      }
      
      return { ...q, status, result, missionDateObj };
    }).sort((a, b) => a.dayNum - b.dayNum); 
  }, [missions, missionState]);

  const filteredData = tableData.filter(row => (filterType === 'All' || row.type === filterType) && (filterStatus === 'All' || row.status === filterStatus));

  // THE FIX: Interactive row clicks
  const handleRowClick = (row) => {
      if (row.status === 'Upcoming') {
          if (row.missionDateObj) {
              const todayTime = getZeroedTime();
              const missionTime = getZeroedTime(row.missionDateObj.date);
              const diffDays = Math.round((missionTime - todayTime) / (1000 * 60 * 60 * 24));
              alert(`Upcoming (in ${diffDays} days)!`);
          } else {
              alert('Upcoming!');
          }
      } else {
          // Missed or Attempted
          if (onOpenTest) {
              onOpenTest(row.dayNum, row.type, row.originalIndex);
          } else {
              alert(`Test launcher ready!\n\nTo make this open the modal, pass an 'onOpenTest' function down from your main App file to tell MissionGrid to switch to Day ${row.dayNum} and open this test.`);
          }
      }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%', width: '100%' }}>
      
      {/* FILTER BAR */}
      <div style={{ display: 'flex', gap: '15px' }}>
          <div className="island sketch-border" style={{ padding: '8px 15px', display: 'flex', gap: '10px', alignItems: 'center', background: '#fff' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--hover-peach)' }}>TYPE:</span>
              {['All', 'VA', 'RC'].map(t => <button key={t} onClick={() => setFilterType(t)} style={{ padding: '3px 12px', borderRadius: '12px', border: '1px solid var(--main-charcoal)', background: filterType === t ? 'var(--main-charcoal)' : 'transparent', color: filterType === t ? '#fff' : 'var(--main-charcoal)', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }}>{t}</button>)}
          </div>
          <div className="island sketch-border" style={{ padding: '8px 15px', display: 'flex', gap: '10px', alignItems: 'center', background: '#fff' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--hover-peach)' }}>STATUS:</span>
              {['All', 'Attempted', 'Missed', 'Upcoming'].map(s => <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '3px 12px', borderRadius: '12px', border: '1px solid var(--main-charcoal)', background: filterStatus === s ? 'var(--main-charcoal)' : 'transparent', color: filterStatus === s ? '#fff' : 'var(--main-charcoal)', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }}>{s}</button>)}
          </div>
      </div>

      {/* THE TABLE */}
      <div className="island sketch-border" style={{ flex: 1, overflowY: 'auto', background: '#fff', padding: 0 }}>
          {/* THE FIX: Added hover CSS so rows look clickable */}
          <style>{`
              .tracker-row { border-bottom: 1px solid rgba(0,0,0,0.04); transition: background 0.2s; cursor: pointer; }
              .tracker-row:hover { background: #F8F9FA; }
          `}</style>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#FDFBF7', zIndex: 10, borderBottom: '2px solid rgba(0,0,0,0.05)' }}>
                  <tr><th style={{ padding: '15px' }}>Day</th><th style={{ padding: '15px' }}>Question Code</th><th style={{ padding: '15px' }}>Type</th><th style={{ padding: '15px' }}>Status</th><th style={{ padding: '15px' }}>Result</th></tr>
              </thead>
              <tbody>
                  {filteredData.map((row, i) => (
                      <tr key={i} className="tracker-row" onClick={() => handleRowClick(row)}>
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