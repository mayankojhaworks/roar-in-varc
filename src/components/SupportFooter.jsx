import React from 'react'

export default function SupportFooter() {
  return (
    <div style={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        paddingTop: '30px', 
        paddingBottom: '20px',
        marginTop: 'auto'
    }}>
      <div className="island sketch-border" style={{ 
          padding: '15px 30px', 
          background: 'rgba(255, 154, 139, 0.05)', 
          border: '1.5px dashed var(--hover-peach)',
          textAlign: 'center'
      }}>
        <p style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-sketch)', fontSize: '1.2rem', color: 'var(--main-charcoal)', fontWeight: 'bold' }}>
            ☕ Buy me a coffee
        </p>
        <p style={{ margin: 0, fontSize: '0.9rem', fontFamily: 'var(--font-sans)', fontWeight: 'bold', color: 'var(--highlight-blue)', letterSpacing: '0.5px' }}>
            UPI ID: mayank-ojha-2000@axisb
        </p>
      </div>
    </div>
  )
}