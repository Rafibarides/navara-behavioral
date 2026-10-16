import React, { useState } from 'react';
import AppNav from '../../components/AppNav';
import { Modal } from '../../components/Chrome';
import { useRequireUser } from '../../components/useRequireUser';
import { requestBookingUrl } from '../../lib/booking';

export default function Book() {
  const user = useRequireUser();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  const pickTime = async () => {
    setBusy(true);
    try {
      const url = await requestBookingUrl(user.track || 'rbt');
      if (url) window.open(url, '_blank', 'noopener');
      else setOpen(true);
    } finally { setBusy(false); }
  };
  return (<>
    <AppNav active="book" />
    <section className="section" style={{ paddingTop: 60, minHeight: '100vh' }}>
      <div className="wrap" style={{ maxWidth: 640 }}>
        <span className="eyebrow" style={{ color: 'var(--teal-3)' }}>Guided plan</span>
        <h2>Book a 1:1 session.</h2>
        <div className="panel" style={{ textAlign: 'center', marginTop: 26 }}>
          <div className="credit-bubble"><div><div className="n">2</div><div className="t">left</div></div></div>
          <h3 style={{ marginBottom: 8 }}>Sessions remaining this month</h3>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 600, marginBottom: 26 }}>Sessions are 45 minutes with a Navara behavior specialist. Bring a topic, a mock result, or just your stuck points.</p>
          <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={pickTime} disabled={busy}>Pick a time</button>
          <p style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600, marginTop: 18 }}>Demo: booking connects to a private Calendly event type at launch, after the credit check.</p>
        </div>
        <div className="panel" style={{ marginTop: 22 }}>
          <h3>Upcoming</h3>
          <div className="score-row"><span>Exam strategy with a behavior specialist</span><span className="pill pill-teal">Thu 4:00 PM (demo)</span></div>
        </div>
      </div>
    </section>
    <Modal open={open} onClose={() => setOpen(false)} title="Booking opens at launch">
      In the live product this checks your plan and remaining sessions on the server, deducts one credit, and opens your private booking link. Nothing is booked in this preview.
    </Modal>
  </>);
}
