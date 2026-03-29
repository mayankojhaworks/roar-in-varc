import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, logout } from '../firebase' 
import SectionTabs from './SectionTabs'
import AuthModal from './AuthModal' 
import ThemeToggle from './ThemeToggle' 
import { HEADER_CTA_HREF } from '../utils/constants'

export default function GlobalHeader({ activeTab, onTabChange }) {
  const [user, setUser] = useState(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      // THE BULLETPROOF FIX: If a user is detected, forcefully close the modal!
      if (currentUser) {
          setIsAuthModalOpen(false)
      }
    })
    return () => unsubscribe()
  }, [])

  return (
    <header className="island sketch-border top-nav no-hover-lift" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '15px 25px', borderRadius: '30px', gap: '15px' }}>
      
      {/* Title Section */}
      <div className="brand-title" style={{ fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.5px', margin: 0, display: 'flex', alignItems: 'baseline', gap: '5px' }}>
        ROAR IN VARC <span className="brand-subtitle" style={{ fontFamily: 'var(--font-sketch)', fontSize: '1rem', opacity: 0.7 }}>By Mayank Ojha</span>
      </div>
      
      {/* Navigation Tabs */}
      <SectionTabs activeTab={activeTab} onChange={onTabChange} />

      {/* Buttons & Login Section */}
      <div className="header-controls" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        
        <ThemeToggle />

        <a href={HEADER_CTA_HREF} target="_blank" rel="noreferrer" className="linkedin-btn" style={{ padding: '6px 18px', fontSize: '0.9rem' }}>
          Connect on LinkedIn
        </a>

        {/* Login / Sync Status Area */}
        <div className="sync-area" style={{ borderLeft: '1.5px dashed rgba(0,0,0,0.15)', paddingLeft: '20px', height: '30px', display: 'flex', alignItems: 'center' }}>
            {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase', fontWeight: 700 }}>Signed in as</p>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontFamily: 'var(--font-sketch)', fontWeight: 'bold', color: 'var(--highlight-blue)' }}>
                            {user.displayName.split(' ')[0]}
                        </p>
                    </div>
                    <button 
                        onClick={logout} 
                        style={{ background: 'none', border: '1px solid var(--highlight-red)', borderRadius: '12px', padding: '2px 8px', fontSize: '0.65rem', color: 'var(--highlight-red)', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        LOGOUT
                    </button>
                </div>
            ) : (
                <button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="sync-text-btn"
                    style={{ background: 'none', border: 'none', fontFamily: 'var(--font-sketch)', fontSize: '1rem', color: 'var(--highlight-blue)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                    Sign in to Sync Progress
                </button>
            )}
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <style>{`
        .linkedin-btn {
          background: transparent; color: var(--highlight-blue); border: 1.5px solid var(--highlight-blue);
          border-radius: 20px; font-family: var(--font-sketch); text-decoration: none; transition: all 0.3s ease;
          display: inline-block; text-align: center;
        }
        .linkedin-btn:hover { background-color: var(--highlight-blue) !important; color: #fff !important; transform: translateY(-2px); }

        /* --- MOBILE RESPONSIVENESS FIXES --- */
        @media (max-width: 768px) {
            .header-controls {
                flex-wrap: wrap !important;
                justify-content: center !important;
                gap: 12px !important;
            }
            .brand-title {
                flex-direction: column !important;
                align-items: center !important;
                gap: 0 !important;
            }
            .brand-subtitle {
                font-size: 0.85rem !important;
            }
            .linkedin-btn {
                font-size: 0.75rem !important;
                padding: 4px 12px !important;
            }
            .sync-area {
                border-left: none !important;
                padding-left: 0 !important;
                height: auto !important;
                width: 100%;
                justify-content: center;
                margin-top: 5px;
            }
            .sync-text-btn {
                font-size: 0.9rem !important;
            }
        }
      `}</style>
    </header>
  )
}