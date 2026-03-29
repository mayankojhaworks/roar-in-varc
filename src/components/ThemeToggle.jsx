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
    <button 
      className={`theme-btn ${isDark ? 'night' : 'day'}`} 
      onClick={toggleTheme} 
      aria-label="Toggle Dark Mode"
    >
      <style>{`
        .theme-btn {
          /* THE FIX: Fixed dimensions and flex-shrink prevent stretching on mobile */
          width: 58px !important;
          height: 28px !important;
          flex-shrink: 0;
          border-radius: 20px;
          border: 2px solid var(--main-charcoal);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          padding: 0;
          background: #87CEEB; /* Default Day Sky */
          box-shadow: 3px 3px 0px var(--main-charcoal);
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .theme-btn.night {
          background: #1A1A2E; /* Night Sky */
        }

        /* The Knob (Sun/Moon) */
        .celestial-knob {
          position: absolute;
          top: 2px;
          left: 3px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #FFD700; /* Sun */
          border: 1.5px solid #DAA520;
          transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          box-sizing: border-box;
        }

        /* Night State for Knob */
        .night .celestial-knob {
          transform: translateX(28px);
          background: #1A1A2E; /* Match sky */
          border-color: #FFF;
          box-shadow: inset -6px 0px 0 0 #FFF; /* Becomes a Crescent Moon */
        }

        /* Stars (only visible in night) */
        .stars {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          opacity: 0;
          transition: opacity 0.5s;
        }
        .night .stars { opacity: 1; }
        .star {
          position: absolute; background: white; border-radius: 50%;
        }

        .theme-btn:hover { transform: scale(1.05); }
        .theme-btn:active { transform: scale(0.95); }

        @media (max-width: 768px) {
          .theme-btn {
             transform: scale(0.9); /* Slightly smaller on mobile to look elegant */
          }
        }
      `}</style>
      
      <div className="stars">
        <div className="star" style={{ top: '5px', left: '10px', width: '2px', height: '2px' }}></div>
        <div className="star" style={{ top: '15px', left: '15px', width: '1px', height: '1px' }}></div>
        <div className="star" style={{ top: '8px', left: '30px', width: '2px', height: '2px' }}></div>
      </div>
      
      <div className="celestial-knob"></div>
    </button>
  );
}