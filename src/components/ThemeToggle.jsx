import React, { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  // Check saved preference on load
  useEffect(() => {
    const savedTheme = localStorage.getItem('roar-theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('roar-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('roar-theme', 'light');
    }
  };

  return (
    <button className={`theme-btn ${isDark ? 'night' : 'day'}`} onClick={toggleTheme} aria-label="Toggle Dark Mode">
      <style>{`
        .theme-btn {
          width: 64px;
          height: 32px;
          border-radius: 30px;
          border: 2px solid var(--main-charcoal);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          padding: 0;
          box-shadow: 2px 2px 0px var(--main-charcoal);
          transition: all 0.3s ease;
        }
        .theme-btn:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0px var(--main-charcoal); }
        .theme-btn:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0px var(--main-charcoal); }

        /* The Sky Background */
        .sky {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          transition: background 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .day .sky { background: #87CEEB; } /* Day Sky */
        .night .sky { background: #1A1A2E; } /* Night Sky */

        /* The Celestial Bodies Container */
        .celestial-container {
          position: absolute;
          width: 100%; height: 100%;
          transition: transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .day .celestial-container { transform: translateY(0); }
        .night .celestial-container { transform: translateY(-100%); }

        /* The Sun (Visible in Day) */
        .sun {
          position: absolute; top: 4px; left: 6px;
          width: 20px; height: 20px;
          background: #FFD700;
          border-radius: 50%;
          border: 2px solid #DAA520;
          box-sizing: border-box;
        }

        /* The Moon (Visible in Night - pushed down below the sun initially) */
        .moon {
          position: absolute; top: 104%; right: 6px; /* 100% pushes it exactly one frame down */
          width: 20px; height: 20px;
          background: transparent;
          border-radius: 50%;
          box-shadow: inset -6px 0px 0 0 #FFF; /* Creates the crescent shape */
          box-sizing: border-box;
        }
      `}</style>
      
      <div className="sky">
        <div className="celestial-container">
          <div className="sun"></div>
          <div className="moon"></div>
        </div>
      </div>
    </button>
  );
}