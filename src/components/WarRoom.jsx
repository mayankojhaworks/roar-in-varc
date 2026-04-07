import React, { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import SupportFooter from './SupportFooter'
import PYQTracker from './PYQTracker' 

export default function WarRoom({ records = [], onAddRecord, onDeleteRecord, missions = [], missionState = {}, onOpenTest }) {
  const [showLedger, setShowLedger] = useState(false)
  const [formData, setFormData] = useState({
    type: 'Mock', singleSitting: 'Yes', name: '', slot: '', date: '',
    varcScore: '', varcPercentile: '', lrdiScore: '', lrdiPercentile: '',
    qaScore: '', qaPercentile: '', overallScore: '', overallPercentile: ''
  })

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.date || !formData.overallScore) return alert("Please fill at least Name, Date, and Overall Score")
    
    onAddRecord({
      id: Date.now().toString(),
      ...formData,
      varcScore: Number(formData.varcScore) || null,
      varcPercentile: Number(formData.varcPercentile) || null,
      lrdiScore: Number(formData.lrdiScore) || null,
      lrdiPercentile: Number(formData.lrdiPercentile) || null,
      qaScore: Number(formData.qaScore) || null,
      qaPercentile: Number(formData.qaPercentile) || null,
      overallScore: Number(formData.overallScore),
      overallPercentile: Number(formData.overallPercentile)
    })
    
    setFormData({ 
        type: 'Mock', singleSitting: 'Yes', name: '', slot: '', date: '', 
        varcScore: '', varcPercentile: '', lrdiScore: '', lrdiPercentile: '', 
        qaScore: '', qaPercentile: '', overallScore: '', overallPercentile: ''
    })
  }

  // --- STATS CALCULATIONS ---
  const validRecords = records.filter(r => r && r.type); 
  const mocksCompleted = validRecords.filter(r => r.type === 'Mock').length
  const pyqsCompleted = validRecords.filter(r => r.type === 'PYQ').length
  
  const bestPercentile = validRecords.length > 0 
    ? Math.max(...validRecords.map(r => Number(r.overallPercentile) || 0)).toFixed(2) 
    : 0

  const avgScore = validRecords.length > 0 
    ? (validRecords.reduce((acc, curr) => acc + (Number(curr.overallScore) || 0), 0) / validRecords.length).toFixed(1)
    : 0

  // --- PYQ ACCURACY CALCULATION ---
  const allPyqAnswers = Object.values(missionState).flatMap(day => Object.values(day.pyqAnswers || {}));
  const pyqAttempted = allPyqAnswers.length;
  const pyqCorrect = allPyqAnswers.filter(a => a.isCorrect).length;
  const pyqAccuracy = pyqAttempted > 0 ? Math.round((pyqCorrect / pyqAttempted) * 100) : 0;

  // Sort records by date for the charts
  const chartData = useMemo(() => {
    return [...validRecords]
      .filter(r => r.date) 
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(record => {
        const safeName = record.name || 'Unnamed'
        return {
          ...record,
          displayDate: new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
          shortName: safeName.length > 10 ? safeName.substring(0,10) + '...' : safeName
        }
      })
  }, [validRecords])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--base-cream)', border: '2px solid var(--main-charcoal)', padding: '10px', borderRadius: '8px', fontFamily: 'var(--font-sketch)', boxShadow: '4px 4px 0px rgba(0,0,0,0.1)', zIndex: 1000 }}>
          <p style={{ margin: '0 0 5px', fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: 0, color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', gap: '15px', paddingBottom: '20px' }}>
      <style>{`
        /* UPDATED GRID FOR 5 CARDS */
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr) 1.2fr; gap: 15px; flex-shrink: 0; }
        
        .stat-card { background: white; border: 2px solid var(--main-charcoal); border-radius: 12px; padding: 12px 10px; text-align: center; box-shadow: 4px 4px 0px var(--shadow-dark); }
        .stat-card p { margin: 0; font-size: 0.65rem; font-weight: bold; text-transform: uppercase; opacity: 0.6; letter-spacing: 0.5px; }
        .stat-card h3 { margin: 5px 0 0; font-size: 1.6rem; font-family: var(--font-sketch); color: var(--highlight-blue); }
        
        .war-room-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 15px; flex: 1; min-height: 0; }
        
        .fixed-island { display: flex; flex-direction: column; height: 100%; min-height: 0; overflow: hidden; }
        
        .scroll-area { flex: 1; overflow-y: auto; padding-right: 15px; margin-right: -5px; padding-bottom: 40px; }
        
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; color: var(--hover-peach); margin-bottom: 5px; letter-spacing: 0.5px; }
        .sketch-input { width: 100%; background: transparent; border: none; border-bottom: 2px dashed rgba(0,0,0,0.2); padding: 8px 5px; font-family: var(--font-sketch); font-size: 1rem; color: var(--main-charcoal); outline: none; transition: border-color 0.3s; }
        .sketch-input:focus { border-bottom-color: var(--highlight-blue); }
        
        .chart-wrapper { height: 250px; width: 100%; margin-bottom: 25px; flex-shrink: 0; }
        .chart-title { font-family: var(--font-sketch); font-size: 1.2rem; margin: 0 0 15px 0; border-bottom: 2px dashed rgba(0,0,0,0.1); padding-bottom: 5px; }

        .submit-btn { width: 100%; background: var(--highlight-blue); color: white; border: 2px solid var(--main-charcoal); padding: 12px; border-radius: 10px; font-family: var(--font-sketch); font-size: 1.1rem; font-weight: bold; cursor: pointer; box-shadow: 4px 4px 0px rgba(0,0,0,0.1); transition: all 0.2s; margin-top: 15px; margin-bottom: 15px; flex-shrink: 0; }
        .submit-btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0px rgba(0,0,0,0.1); }
        
        .section-box { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: rgba(0,0,0,0.02); padding: 10px; border-radius: 8px; margin-bottom: 15px; }

        /* MODAL STYLES FOR THE FLOATING SURFACE */
        .pyq-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(5px);
            display: flex; justify-content: center; align-items: center; z-index: 9999;
        }
        .pyq-modal-content {
            background: var(--base-cream); border-radius: 16px; position: relative;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: fadeIn 0.3s ease;
        }
        .pyq-close-btn {
            position: absolute; top: 15px; right: 15px; z-index: 100;
            background: var(--highlight-red); color: white; border: none; border-radius: 50%;
            width: 30px; height: 30px; font-weight: bold; cursor: pointer; transition: transform 0.2s;
            display: flex; align-items: center; justify-content: center;
        }
        .pyq-close-btn:hover { transform: scale(1.1); }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* MOBILE RESPONSIVENESS FOR WAR ROOM */
        @media (max-width: 768px) {
            .war-room-grid {
                grid-template-columns: 1fr !important; 
            }
            .stats-row {
                grid-template-columns: 1fr 1fr !important; 
            }
            .fixed-island {
                min-height: 500px; 
                margin-bottom: 20px;
            }
            /* Make the 5th card (PYQ Analytics) span the full width on mobile */
            .stats-row > div:nth-child(5) {
                grid-column: span 2;
            }
        }
      `}</style>

      {/* TOP STATS */}
      <div className="stats-row">
        <div className="stat-card"><p>Mocks Completed</p><h3>{mocksCompleted}/60</h3></div>
        <div className="stat-card"><p>PYQs Completed</p><h3>{pyqsCompleted}/22</h3></div>
        <div className="stat-card"><p>Best Percentile</p><h3 style={{color: 'var(--highlight-green)'}}>{bestPercentile}%</h3></div>
        <div className="stat-card"><p>Average Score</p><h3 style={{color: 'var(--highlight-lavender)'}}>{avgScore}</h3></div>
        
        {/* PYQ Analytics Card */}
        <div 
          className="stat-card" 
          onClick={() => setShowLedger(true)}
          style={{
            background: 'var(--main-charcoal)',
            borderColor: 'var(--main-charcoal)',
            borderRadius: '24px', 
            color: 'white',
            cursor: 'pointer',
            boxShadow: '4px 4px 0px var(--shadow-dark)',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '6px 6px 0px rgba(0,0,0,0.2)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '4px 4px 0px var(--shadow-dark)'; }}
        >
          <p style={{ color: 'white', opacity: 0.8 }}>PYQ Analytics</p>
          <h3 style={{ color: 'white', margin: '2px 0', fontSize: '1.25rem' }}>{pyqAccuracy}% Accuracy</h3>
          <span style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '2px', fontWeight: 'bold' }}>
            CLICK TO OPEN LEDGER
          </span>
        </div>
      </div>

      <div className="war-room-grid">
        
        {/* LEFT PANEL: DATA ENTRY FORM */}
        <div className="island sketch-border fixed-island">
          <h2 style={{ fontFamily: 'var(--font-sketch)', fontSize: '1.4rem', margin: '0 0 15px 0', color: 'var(--main-charcoal)', flexShrink: 0 }}>Enter test details</h2>
          
          <div className="scroll-area">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Exam Type</label>
                  <select name="type" value={formData.type} onChange={handleChange} className="sketch-input">
                    <option>Mock</option><option>PYQ</option><option>Sectional</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Single Sitting</label>
                  <select name="singleSitting" value={formData.singleSitting} onChange={handleChange} className="sketch-input">
                    <option>Yes</option><option>No</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Mock Name / Year</label>
                <input required name="name" value={formData.name} onChange={handleChange} placeholder="e.g. SIMCAT 1" className="sketch-input" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Date of Attempt</label>
                  <input required type="date" name="date" value={formData.date} onChange={handleChange} className="sketch-input" />
                </div>
                <div className="form-group">
                  <label>Slot / Number</label>
                  <input name="slot" value={formData.slot} onChange={handleChange} placeholder="e.g. Slot 2" className="sketch-input" />
                </div>
              </div>

              <div className="section-box">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>VARC Score</label>
                  <input type="number" name="varcScore" value={formData.varcScore} onChange={handleChange} className="sketch-input" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>VARC %ile</label>
                  <input type="number" step="0.01" name="varcPercentile" value={formData.varcPercentile} onChange={handleChange} className="sketch-input" />
                </div>
              </div>

              <div className="section-box">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>LRDI Score</label>
                  <input type="number" name="lrdiScore" value={formData.lrdiScore} onChange={handleChange} className="sketch-input" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>LRDI %ile</label>
                  <input type="number" step="0.01" name="lrdiPercentile" value={formData.lrdiPercentile} onChange={handleChange} className="sketch-input" />
                </div>
              </div>

              <div className="section-box">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>QA Score</label>
                  <input type="number" name="qaScore" value={formData.qaScore} onChange={handleChange} className="sketch-input" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>QA %ile</label>
                  <input type="number" step="0.01" name="qaPercentile" value={formData.qaPercentile} onChange={handleChange} className="sketch-input" />
                </div>
              </div>

              <div className="section-box" style={{ background: 'rgba(0,0,0,0.05)', border: '1px dashed rgba(0,0,0,0.1)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ color: 'var(--main-charcoal)' }}>Overall Score</label>
                  <input required type="number" name="overallScore" value={formData.overallScore} onChange={handleChange} className="sketch-input" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ color: 'var(--main-charcoal)' }}>Overall %ile</label>
                  <input type="number" step="0.01" name="overallPercentile" value={formData.overallPercentile} onChange={handleChange} className="sketch-input" />
                </div>
              </div>

              <button type="submit" className="submit-btn">LOG SCORE IN CLOUD</button>
            </form>
            <SupportFooter />
          </div>
        </div>

        {/* RIGHT PANEL: CHARTS */}
        <div className="island sketch-border fixed-island">
          
          <div className="scroll-area" style={{ display: 'flex', flexDirection: 'column' }}>
            {chartData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, fontFamily: 'var(--font-sketch)', fontSize: '1.2rem', minHeight: '300px' }}>
                Add records to generate Trajectory Charts
              </div>
            ) : (
              <>
                <div className="chart-wrapper">
                  <h3 className="chart-title">Score Trajectory</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" vertical={false} />
                      <XAxis dataKey="shortName" tick={{fontFamily: 'var(--font-sketch)', fontSize: 12}} stroke="var(--main-charcoal)" />
                      <YAxis tick={{fontFamily: 'var(--font-sketch)', fontSize: 12}} stroke="var(--main-charcoal)" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 'bold' }} />
                      <Line type="monotone" dataKey="overallScore" name="Overall" stroke="var(--main-charcoal)" strokeWidth={3} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="varcScore" name="VARC" stroke="var(--highlight-lavender)" strokeWidth={2} />
                      <Line type="monotone" dataKey="lrdiScore" name="LRDI" stroke="var(--hover-peach)" strokeWidth={2} />
                      <Line type="monotone" dataKey="qaScore" name="QA" stroke="var(--highlight-blue)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-wrapper">
                  <h3 className="chart-title">Percentile Trajectory</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" vertical={false} />
                      <XAxis dataKey="shortName" tick={{fontFamily: 'var(--font-sketch)', fontSize: 12}} stroke="var(--main-charcoal)" />
                      <YAxis domain={[0, 100]} tick={{fontFamily: 'var(--font-sketch)', fontSize: 12}} stroke="var(--main-charcoal)" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 'bold' }} />
                      <Line type="monotone" dataKey="overallPercentile" name="Overall" stroke="var(--highlight-green)" strokeWidth={3} />
                      <Line type="monotone" dataKey="varcPercentile" name="VARC" stroke="var(--highlight-lavender)" strokeWidth={2} />
                      <Line type="monotone" dataKey="lrdiPercentile" name="LRDI" stroke="var(--hover-peach)" strokeWidth={2} />
                      <Line type="monotone" dataKey="qaPercentile" name="QA" stroke="var(--highlight-blue)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* THE PYQ LEDGER MODAL ("NEW SURFACE") */}
      {showLedger && (
        <div className="pyq-modal-overlay" onClick={() => setShowLedger(false)}>
          <div className="island sketch-border pyq-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '95%', maxWidth: '1000px', height: '85vh', display: 'flex', flexDirection: 'column', padding: '30px 20px 20px 20px' }}>
            
            <button className="pyq-close-btn" onClick={() => setShowLedger(false)}>X</button>
            
            <h2 style={{ margin: '0 0 15px 10px', fontFamily: 'var(--font-sketch)', color: 'var(--highlight-blue)' }}>Detailed PYQ Performance Ledger</h2>
            
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <PYQTracker missions={missions} missionState={missionState} onOpenTest={onOpenTest} />
            </div>

          </div>
        </div>
      )}

    </div>
  )
}