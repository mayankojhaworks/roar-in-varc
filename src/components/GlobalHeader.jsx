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
      if (currentUser) setIsAuthModalOpen(false)
    })
    return () => unsubscribe()
  }, [])

  return (
    <header className="island sketch-border top-nav no-hover-lift" style={{ 
      position: 'relative', 
      flexShrink: 0, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '20px 25px', 
      borderRadius: '30px', 
      gap: '12px', 
      overflow: 'hidden',
      background: 'var(--bg-cream)' 
    }}>
      
      {/* --- Branding Section --- */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <div className="brand-title" style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>
          ROAR IN VARC <span className="brand-subtitle" style={{ fontFamily: 'var(--font-sketch)', fontSize: '1rem', opacity: 0.6, fontWeight: 400 }}>By Mayank Ojha</span>
        </div>
        <div className="brand-tagline" style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Your daily VARC practice workspace & mock tracker
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <SectionTabs activeTab={activeTab} onChange={onTabChange} />

      {/* Controls & Sync Area */}
      <div className="header-controls" style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '20px', alignItems: 'center' }}>
        <ThemeToggle />
        <a href={HEADER_CTA_HREF} target="_blank" rel="noreferrer" className="linkedin-btn">
          Connect on LinkedIn
        </a>
        
        <div className="sync-area" style={{ borderLeft: '1.5px dashed rgba(0,0,0,0.1)', paddingLeft: '20px', display: 'flex', alignItems: 'center' }}>
            {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontFamily: 'var(--font-sketch)', fontWeight: 'bold', color: 'var(--highlight-blue)' }}>
                            {user.displayName?.split(' ')[0] || 'User'}
                        </p>
                    </div>
                    <button onClick={logout} className="logout-mini-btn">
                        EXIT
                    </button>
                </div>
            ) : (
                <button onClick={() => setIsAuthModalOpen(true)} className="sync-text-link">
                    Sign in to Sync Progress
                </button>
            )}
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <style>{`
        .linkedin-btn { 
          padding: 6px 18px; font-size: 0.85rem; border-radius: 20px; 
          border: 1.5px solid var(--highlight-blue); color: var(--highlight-blue);
          text-decoration: none; font-family: var(--font-sketch); font-weight: 600; transition: all 0.2s;
          background: transparent;
        }
        .linkedin-btn:hover { background: var(--highlight-blue); color: #fff; transform: translateY(-1px); }
        
        .logout-mini-btn { 
          background: none; border: 1.2px solid var(--highlight-red); color: var(--highlight-red); 
          font-size: 0.65rem; padding: 2px 10px; border-radius: 6px; cursor: pointer; font-weight: 800;
          transition: all 0.2s;
        }
        .logout-mini-btn:hover { background: var(--highlight-red); color: #fff; }

        .sync-text-link { 
          background: none; border: none; color: var(--highlight-blue); 
          font-size: 0.9rem; font-family: var(--font-sketch); text-decoration: underline; cursor: pointer;
          padding: 0;
        }

        @media (max-width: 768px) {
            .brand-tagline { font-size: 0.7rem !important; }
            .header-controls { flex-wrap: wrap; justify-content: center; gap: 15px; }
            .sync-area { border-left: none; padding-left: 0; width: 100%; justify-content: center; }
        }
      `}</style>
    </header>
  )
}