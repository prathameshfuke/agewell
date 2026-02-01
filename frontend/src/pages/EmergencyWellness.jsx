export default function EmergencyWellness(){
  return (
    <div className="screen">
      <header className="topbar">
        <div className="left"><button className="link" onClick={()=>{ window.location.hash = '#/elder/dashboard' }}>← Back</button></div>
        <div className="right"><div className="muted">Emergency & Wellness</div></div>
      </header>

      <main className="dash">
        <section className="card span-2" style={{background:'#fee2e2', border:'1px solid #fecaca'}}>
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            <div className="title" style={{color:'#991b1b'}}>Emergency Assistance</div>
            <div className="muted">Press button below if you need immediate help</div>
            <button className="btn danger large">📞 CALL EMERGENCY</button>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div className="title">Quick Contacts</div>
          </div>
          <div className="list" style={{gap:12}}>
            <div className="card" style={{background:'#eef2ff'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:700}}>Sarah Johnson</div>
                  <div className="muted small">Daughter</div>
                </div>
                <button className="btn primary small">📞 Call Sarah Johnson</button>
              </div>
            </div>
            <div className="card" style={{background:'#eef2ff'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:700}}>Maneesh</div>
                  <div className="muted small">Son</div>
                </div>
                <button className="btn primary small">📞 Call Maneesh</button>
              </div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div className="title">Medical Professionals</div>
          </div>
          <div className="list" style={{gap:12}}>
            <div className="card" style={{background:'#ecfdf5'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:700}}>Dr. Rajiv Sharma</div>
                  <div className="muted small">Primary Care</div>
                </div>
                <button className="btn success small">📞 Call Doctor</button>
              </div>
            </div>
            <div className="card" style={{background:'#ecfdf5'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:700}}>Dr. Manish Malhotra</div>
                  <div className="muted small">Cardiologist</div>
                </div>
                <button className="btn success small">📞 Call Doctor</button>
              </div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header"><div className="title">Wellness Check-In</div></div>
          <div className="list" style={{gap:12}}>
            <div className="card" style={{background:'#faf5ff', border:'1px solid #e9d5ff'}}>
              <div className="muted small">Daily wellness check-ins are enabled.</div>
              <div className="muted small">Last check-in: Today at 9:00 AM • Status: Feeling Good ✓</div>
              <div style={{height:8}}/>
              <button className="btn primary">Start Daily Survey</button>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header"><div className="title">Recent Events</div></div>
          <div className="list" style={{gap:12}}>
            <div className="card" style={{background:'#fffbeb', border:'1px solid #fef3c7'}}>
              <div style={{fontWeight:600}}>Fall Detected • Dec 10, 2024 at 2:30 PM</div>
              <div className="muted small">Fall detected in bedroom. Family contacted and situation resolved.</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
