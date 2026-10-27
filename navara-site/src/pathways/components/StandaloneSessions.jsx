import React from 'react';
const links = {
  rbt: 'https://calendly.com/nisan-navarabehavioralgroup/rbt-standalone-exam-prep-1-1',
  bcba: 'https://calendly.com/nisan-navarabehavioralgroup/bcba-standalone-exam-prep-1-1',
};
export default function StandaloneSessions({ track = null }) {
  const tracks = track ? [track] : ['rbt', 'bcba'];
  return <section className="section" aria-labelledby="standalone-session-heading"><div className="wrap" style={{ maxWidth: 900 }}>
    <div className="section-head"><span className="eyebrow" style={{ color: 'var(--teal-3)' }}>One-on-one exam prep</span><h2 id="standalone-session-heading">Book a separate 1:1 session.</h2></div>
    <p>45 minutes for $195. No monthly subscription required. Choose an available time, then pay securely through Calendly.</p>
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 22 }}>{tracks.map(t => <a key={t} className="btn btn-navy" href={links[t]} target="_blank" rel="noopener noreferrer">Book {t.toUpperCase()} 1:1 - $195</a>)}</div>
    <p style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 18 }}>The 24-hour cancellation and rescheduling terms are shown before booking. Refunds are handled manually. This is separate from the session included with Guided membership.</p>
  </div></section>;
}
