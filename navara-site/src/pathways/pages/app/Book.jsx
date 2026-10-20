import React, { useEffect, useState } from 'react';
import AppNav from '../../components/AppNav';
import { Modal } from '../../components/Chrome';
import { useRequireUser } from '../../components/useRequireUser';
import { requestBookingUrl } from '../../lib/booking';
import { sessionCredits } from '../../lib/db';
import { DEMO } from '../../config';

export default function Book() {
  const user = useRequireUser();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [credits, setCredits] = useState(null);
  useEffect(() => { if (user) sessionCredits().then(setCredits); }, [user]);
  if (!user) return null;
  const pickTime = async () => {
    setBusy(true);
    try {
      const url = await requestBookingUrl(user.track || 'rbt');
      if (url) { window.open(url, '_blank', 'noopener'); sessionCredits().then(setCredits); }
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
          <div className="credit-bubble"><div><div className="n">{credits === null ? '-' : credits}</div><div className="t">left</div></div></div>
          <h3 style={{ marginBottom: 8 }}>Sessions remaining this month</h3>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 600, marginBottom: 26 }}>Sessions are 45 minutes with a Navara behavior specialist. Bring a topic, a mock result, or just your stuck points.</p>
          <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={pickTime} disabled={busy}>{busy ? 'Checking...' : 'Pick a time'}</button>
          {(DEMO || (user && user.demo)) && <p style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600, marginTop: 18 }}>Demo: booking connects to a private Calendly event type after the live credit check.</p>}
        </div>
      </div>
    </section>
    <Modal open={open} onClose={() => setOpen(false)} title="No session credits available">
      Booking needs a Guided plan with a session credit remaining this month. If you are on the Guided plan and believe this is an error, reply to any Navara email and we will fix it.
    </Modal>
  </>);
}
