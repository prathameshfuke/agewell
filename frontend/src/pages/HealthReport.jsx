export default function HealthReport() {
  const rows = [
    { icon: '🫀', label: 'Blood Pressure', value: '124/82 mmHg' },
    { icon: '❤️', label: 'Heart Rate', value: '72 bpm' },
    { icon: '💧', label: 'Blood Sugar (Fasting)', value: '96 mg/dL' },
    { icon: '🍎', label: 'Cholesterol', value: '178 mg/dL' },
    { icon: '🫁', label: 'SpO₂', value: '98 %' },
    { icon: '🌡️', label: 'Body Temperature', value: '98.4 °F' },
    { icon: '⚖️', label: 'Weight', value: '68 kg' },
    { icon: '🛌', label: 'Sleep Duration', value: '7h 45m' },
  ]
  return (
    <div className="screen">
      <header className="topbar">
        <div className="left"><button className="link" onClick={()=>{ window.location.hash = '#/family/dashboard' }}>← Back</button></div>
        <div className="right"><div className="muted">Full Health Report</div></div>
      </header>

      <main className="hero hero-center">
        <div className="auth-card" style={{maxWidth: 640}}>
          <h2 className="title center">Vitals & Health Summary</h2>
          <div className="stack">
            {rows.map((r, i) => (
              <div key={i} className="input-group" style={{justifyContent:'space-between'}}>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  <span className="input-icon">{r.icon}</span>
                  <div className="muted">{r.label}</div>
                </div>
                <div style={{fontWeight:600}}>{r.value}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
