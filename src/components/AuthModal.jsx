import { loginWithGoogle } from '../firebase';

export default function AuthModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
      }}
      onClick={onClose} /* Closes when clicking background */
    >
      <style>{`
        .modal-island {
            max-width: 400px; 
            width: 85%; 
            background: var(--base-cream);
            padding: 35px; 
            text-align: center; 
            border: 2px solid var(--main-charcoal);
            position: relative; 
            animation: modalSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 10px 10px 0px rgba(0,0,0,0.15);
        }
        @keyframes modalSlideIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        
        .modal-close {
            position: absolute; top: 15px; right: 15px; background: none; border: none;
            font-family: var(--font-sketch); font-size: 1.2rem; cursor: pointer; opacity: 0.4;
        }
        .modal-close:hover { opacity: 1; color: var(--highlight-red); }

        .google-signin-btn {
            /* THE FIX (Issue D): Force-locking the brand Blue and Font */
            background-color: #3498DB !important; 
            color: white !important; 
            border: 2px solid var(--main-charcoal) !important;
            padding: 14px 20px; 
            border-radius: 15px; 
            font-family: 'Architects Daughter', cursive, var(--font-sketch) !important;
            font-size: 1.1rem; 
            font-weight: bold; 
            width: 100%; 
            cursor: pointer;
            transition: all 0.2s; 
            box-shadow: 4px 4px 0px var(--main-charcoal);
            appearance: none;
            -webkit-appearance: none; /* Prevents mobile browser default styling */
        }
        .google-signin-btn:hover { 
            transform: translate(-2px, -2px); 
            box-shadow: 6px 6px 0px var(--main-charcoal); 
        }
        .google-signin-btn:active {
            transform: translate(2px, 2px);
            box-shadow: 0px 0px 0px var(--main-charcoal);
        }
      `}</style>

      <div className="island sketch-border modal-island" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <h2 style={{ fontFamily: 'var(--font-sketch)', fontSize: '1.8rem', margin: '0 0 10px 0', color: 'var(--main-charcoal)' }}>
            Wait, don't lose your ROAR!
        </h2>
        
        <p style={{ fontSize: '0.95rem', opacity: 0.8, lineHeight: 1.5, marginBottom: '30px', fontFamily: 'var(--font-sans)' }}>
            To ensure your <strong>mock scores</strong> and <strong>daily progress</strong> are saved forever, please sign in with your Google account.
        </p>

        <button 
            onClick={async () => {
                await loginWithGoogle();
                onClose();
            }} 
            className="google-signin-btn"
        >
            Sign in with Google
        </button>

        <p style={{ marginTop: '20px', fontSize: '0.75rem', opacity: 0.5, fontStyle: 'italic', fontFamily: 'var(--font-sans)' }}>
            We only save your prep data. Nothing else.
        </p>
      </div>
    </div>
  );
}