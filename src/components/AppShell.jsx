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
      `}</style>

      <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', padding: '15px', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '1500px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%', gap: '15px' }}>
          
          <GlobalHeader activeTab={activeTab} onTabChange={onTabChange} />

          {/* This main wrapper is now locked in place */}
          <main style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
            {children}
          </main>

        </div>
      </div>
    </>
  )
}