import GlobalHeader from './GlobalHeader'

export default function AppShell({ activeTab, onTabChange, children }) {
  return (
    <>
      <style>{`
        /* --- Global Setup --- */
        :root {
            --base-cream: #F5F0E6;
            --main-charcoal: #333333;
            --highlight-lavender: #7D7CCF;
            --highlight-red: #E74C3C;
            --highlight-blue: #3498DB;
            --highlight-green: #27AE60;
            --hover-peach: #FF9A8B; 
            --shadow-light: rgba(255, 255, 255, 0.9);
            --shadow-dark: rgba(0, 0, 0, 0.08);
            --font-sans: 'Poppins', sans-serif;
            --font-sketch: 'Architects Daughter', cursive;
        }

        body {
            margin: 0;
            font-family: var(--font-sans) !important;
            background-color: var(--base-cream) !important;
            color: var(--main-charcoal) !important;
            overflow: hidden !important; 
            cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><circle cx='16' cy='16' r='4' fill='%23333333' /><circle cx='16' cy='16' r='12' fill='none' stroke='%23FF9A8B' stroke-width='2' stroke-dasharray='4 3' /></svg>") 16 16, auto !important;
        }

        a, button, input, textarea, select, .day-box, .clickable-stat {
            cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><circle cx='16' cy='16' r='6' fill='%23FF9A8B' /><circle cx='16' cy='16' r='14' fill='none' stroke='%23333333' stroke-width='2' stroke-dasharray='6 2' /></svg>") 16 16, pointer !important;
        }

        .island {
            background: var(--base-cream);
            border-radius: 15px;
            box-shadow: -6px -6px 12px var(--shadow-light), 6px 6px 12px var(--shadow-dark);
            border: 2px solid transparent;
            transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease, border-color 0.4s ease; 
            padding: 15px; 
            display: flex;
            flex-direction: column;
        }

        .island:hover:not(.top-nav), .day-box:hover:not(.active) {
            transform: translateY(-4px); 
            box-shadow: -8px -8px 16px var(--shadow-light), 10px 10px 20px rgba(255, 154, 139, 0.25); 
        }

        .sketch-border { position: relative; }
        .sketch-border::before {
            content: ''; position: absolute; top: 2px; left: 2px; right: 2px; bottom: 2px;
            border: 1.5px solid var(--main-charcoal); border-radius: inherit;
            transform: rotate(-0.2deg); pointer-events: none; opacity: 0.15; z-index: 1; transition: all 0.4s ease;
        }
        .island:hover.sketch-border::before {
            border-color: var(--hover-peach); opacity: 0.8; transform: rotate(0deg) scale(1.005);
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--hover-peach); }

        /* THE FIX: Mobile-Only UI Enhancements */
        @media (max-width: 768px) {
            /* 1. Target the nav links inside GlobalHeader */
            .top-nav button {
                /* Force the sketch font on mobile */
                font-family: var(--font-sketch) !important;
                font-size: 0.85rem !important;
                
                /* Turn them into buttons */
                border: 1.5px dashed rgba(0,0,0,0.2) !important;
                border-radius: 8px !important;
                padding: 6px 10px !important;
                background: transparent !important;
                margin: 0 !important;
                
                /* Layout adjustments so they fit in a row */
                flex: 1 1 40% !important;
                text-align: center !important;
            }

            /* 2. Highlight the active button */
            .top-nav button.active-nav-btn {
                border: 1.5px solid var(--main-charcoal) !important;
                background: var(--hover-peach) !important;
                color: white !important;
                font-weight: bold !important;
                transform: scale(1.02);
            }

            /* 3. Re-arrange the nav container to wrap nicely */
            .nav-links-container {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 8px !important;
                justify-content: center !important;
                width: 100% !important;
                padding-bottom: 5px !important;
                border-bottom: 2px dashed rgba(0,0,0,0.1) !important;
                margin-bottom: 10px !important;
            }
        }
      `}</style>

      <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', padding: '15px', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '1500px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%', gap: '15px' }}>
          
          <GlobalHeader activeTab={activeTab} onTabChange={onTabChange} />

          <main style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
            {children}
          </main>

        </div>
      </div>
    </>
  )
}