import React, { useRef, useState } from 'react'
import SupportFooter from './SupportFooter'

export default function DataBackup({ user, missionState, warRoomRecords, onImportBackup, onClearAllProgress }) {
  const [message, setMessage] = useState('')

  const handleExport = () => {
    const payload = { missionState, warRoomRecords };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roar-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    setMessage('Manual backup downloaded successfully!');
  };

  return (
    <section style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
        overflowY: 'auto', padding: '10px', display: 'flex', 
        flexDirection: 'column', gap: '25px' 
    }}>
      <style>{`
        .stamp-btn { 
            background: white; border: 2px solid var(--main-charcoal); 
            padding: 12px 24px; border-radius: 12px; font-family: var(--font-sketch); 
            font-weight: bold; cursor: pointer; box-shadow: 4px 4px 0px var(--main-charcoal); 
            transition: all 0.2s; 
        }
        .stamp-btn:hover { transform: translate(-1px, -1px); box-shadow: 6px 6px 0px var(--main-charcoal); }
        .btn-export { background: var(--highlight-blue) !important; color: white !important; }
        .sync-badge { 
            background: #E8F5E9; border: 1.5px solid #2E7D32; color: #2E7D32; 
            padding: 15px; border-radius: 12px; font-size: 0.95rem; 
            display: flex; align-items: flex-start; gap: 15px; margin-top: 15px; line-height: 1.5;
        }
        .guest-badge {
            background: #FFF5F5; border: 1.5px dashed var(--highlight-red); color: var(--main-charcoal); 
            padding: 15px; border-radius: 12px; font-size: 0.95rem; 
            display: flex; align-items: flex-start; gap: 15px; margin-top: 15px; line-height: 1.5;
        }
      `}</style>

      {/* Dynamic Status Island */}
      <div className="island sketch-border">
        <h2 style={{ fontFamily: 'var(--font-sketch)', fontSize: '1.8rem', margin: '0 0 5px 0' }}>Data Security</h2>
        
        {user ? (
          <div className="sync-badge">
            <span style={{ fontSize: '1.5rem' }}>☁️</span>
            <div>
                <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '5px' }}>Cloud Sync is Active</strong>
                Your Daily Plan progress and Mock Analytics are continuously backed up to your account (<strong>{user.email}</strong>). 
                You do not need to worry about losing your data. It will automatically load even if you switch devices!
            </div>
          </div>
        ) : (
          <div className="guest-badge">
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div>
                <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '5px', color: 'var(--highlight-red)' }}>Guest Mode Active</strong>
                Your data is currently only saved locally in this browser. If you clear your history, your progress will be lost. <strong>Please sign in using the header above to secure your data in the cloud.</strong>
            </div>
          </div>
        )}
      </div>

      {/* Manual Actions Island */}
      <div className="island sketch-border" style={{ padding: '25px' }}>
        <h3 style={{ fontFamily: 'var(--font-sketch)', fontSize: '1.4rem', margin: '0 0 15px' }}>Manual Overrides</h3>
        <p style={{ margin: '0 0 20px', fontSize: '0.9rem', opacity: 0.8 }}>
          Even with Cloud Sync active, you can always download a hard copy of your data for your own personal records.
        </p>
        
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <button onClick={handleExport} className="stamp-btn btn-export">
            Download JSON Backup
          </button>
          
          <button onClick={onClearAllProgress} className="stamp-btn" style={{ color: 'var(--highlight-red)', borderStyle: 'dashed' }}>
            Wipe Browser Data
          </button>
        </div>

        {message && (
          <p style={{ fontFamily: 'var(--font-sketch)', color: 'var(--highlight-green)', fontWeight: 'bold', marginTop: '15px' }}>
              {message}
          </p>
        )}
      </div>

      {/* The Global Footer */}
      <SupportFooter />
      
    </section>
  )
}