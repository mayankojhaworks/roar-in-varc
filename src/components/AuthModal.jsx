import { loginWithGoogle } from '../firebase';

export default function AuthModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <style>{`
        .modal-island {
            max-width: 420px; width: 90%; background: var(--base-cream);
            padding: 40px; text-align: center; border: 2px solid var(--main-charcoal);
            position: relative; animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 10px 10px 0px rgba(0,0,0,0.1);
        }
        @keyframes slideIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        
        .modal-close {
            position: absolute; top: 15px; right: 15px; background: none; border: none;
            font-family: var(--font-sketch); font-size: 1.2rem; cursor: pointer; opacity: 0.4;
        }
        .modal-close:hover { opacity: 1; color: var(--highlight-red); }

        .google-signin-btn {
            background: var(--highlight-blue); color: white; border: 2px solid var(--main-charcoal);
            padding: 14px 20px; border-radius: 15px; font-family: var(--font-sketch);
            font-size: 1.1rem; font-weight: bold; width: 100%; cursor: pointer;
            transition: all 0.2s; box-shadow: 4px 4px 0px rgba(0,0,0,0.1);
        }
        .google-signin-btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0px rgba(0,0,0,0.1); }
      `}</style>

      <div className="island sketch-border modal-island">
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <h2 style={{ fontFamily: 'var(--font-sketch)', fontSize: '2rem', margin: '0 0 10px 0', color: 'var(--main-charcoal)' }}>
            Wait, don't lose your ROAR!
        </h2>
        
        <p style={{ fontSize: '1rem', opacity: 0.8, lineHeight: 1.6, marginBottom: '30px' }}>
            To ensure your <strong>mock scores</strong> and <strong>daily progress</strong> are saved forever (even if you switch devices), please sign in with your Google account.
        </p>

        <button 
            onClick={async () => {
                try {
                    await loginWithGoogle();
                    onClose();
                } catch (err) {
                    console.error("Login failed", err);
                }
            }}
            className="google-signin-btn"
        >
            Sign in with Google
        </button>

        <p style={{ marginTop: '20px', fontSize: '0.75rem', opacity: 0.5, fontStyle: 'italic' }}>
            We only save your prep data. Nothing else.
        </p>
      </div>
    </div>
  );
}