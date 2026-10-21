import React, { useEffect, useState } from 'react';
import { useRequireUser } from '../../components/useRequireUser';
import AppNav from '../../components/AppNav';
import { getClient } from '../../lib/db';
import { CFG } from '../../config';

const card = { background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: 'var(--shadow-md)', marginBottom: 18 };
const num = { fontSize: 30, fontWeight: 800, color: 'var(--navy)' };
const lbl = { fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-2)' };
const h3s = { fontSize: 18, marginBottom: 12 };
const td = { padding: '8px 10px', fontSize: 13, borderBottom: '1px solid rgba(15,31,51,.07)', verticalAlign: 'top' };
const th = { ...td, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink-2)', textAlign: 'left' };

export default function Admin() {
  const user = useRequireUser();
  const [ov, setOv] = useState(null);
  const [members, setMembers] = useState(null);
  const [qstats, setQstats] = useState(null);
  const [stripe, setStripe] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    (async () => {
      try {
        const sb = await getClient();
        const [o, m, q] = await Promise.all([
          sb.rpc('admin_overview'),
          sb.rpc('admin_members', { p_limit: 25 }),
          sb.rpc('admin_question_stats', { p_min_attempts: 3, p_limit: 30 }),
        ]);
        if (o.error) throw o.error; if (m.error) throw m.error; if (q.error) throw q.error;
        setOv(o.data); setMembers(m.data); setQstats(q.data);
        const { data: { session } } = await sb.auth.getSession();
        const res = await fetch(CFG.supabaseUrl + '/functions/v1/admin-stripe-stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: CFG.supabaseAnonKey, Authorization: 'Bearer ' + session.access_token },
          body: '{}',
        });
        const sd = await res.json();
        if (sd.error) throw new Error(sd.error);
        setStripe(sd);
      } catch (e) { setErr(String(e.message || e)); }
    })();
  }, [user]);

  if (!user) return null;
  if (user.role !== 'admin') {
    return (<><AppNav active="admin" role={user.role} /><section className="section" style={{ paddingTop: 60, minHeight: '100vh' }}><div className="wrap">
      <h2>Owner access only.</h2><p style={{ color: 'var(--ink-2)' }}>This page is restricted to the site owner.</p></div></section></>);
  }

  return (<><AppNav active="admin" role={user.role} />
    <section className="section" style={{ paddingTop: 60, minHeight: '100vh' }}>
      <div className="wrap" style={{ maxWidth: 980 }}>
        <span className="eyebrow" style={{ color: 'var(--teal-3)' }}>Owner console</span>
        <h2 style={{ marginBottom: 22 }}>Pathways admin.</h2>
        {err && <div style={{ ...card, color: '#b3261e' }}>Load error: {err}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 18 }}>
          <div style={card}><div style={num}>{stripe ? '$' + (stripe.revenue_90d_usd ?? 0).toLocaleString() : '…'}</div><div style={lbl}>Revenue, 90 days</div></div>
          <div style={card}><div style={num}>{stripe ? stripe.active_subscriptions : '…'}</div><div style={lbl}>Active subscriptions</div></div>
          <div style={card}><div style={num}>{ov ? ov.members_total : '…'}</div><div style={lbl}>Members</div></div>
          <div style={card}><div style={num}>{ov ? ov.signups_7d : '…'}</div><div style={lbl}>Signups, 7 days</div></div>
          <div style={card}><div style={num}>{ov ? ov.attempts_7d : '…'}</div><div style={lbl}>Answers, 7 days</div></div>
          <div style={card}><div style={num}>{ov ? ov.correct_rate_30d + '%' : '…'}</div><div style={lbl}>Correct rate, 30d</div></div>
        </div>

        <div style={card}>
          <h3 style={h3s}>Members</h3>
          {ov && <p style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: -6 }}>
            Plans: {Object.entries(ov.by_plan || {}).map(([k, v]) => `${k} ${v}`).join(' · ') || 'none'} &nbsp;|&nbsp;
            Tracks: {Object.entries(ov.by_track || {}).map(([k, v]) => `${String(k).toUpperCase()} ${v}`).join(' · ') || 'none'} &nbsp;|&nbsp;
            Active this week: {ov.active_members_7d} &nbsp;|&nbsp;
            Answers 30d: {ov.attempts_30d} ({Object.entries(ov.attempts_by_kind_30d || {}).map(([k, v]) => `${k} ${v}`).join(', ')})
          </p>}
          <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Name</th><th style={th}>Email</th><th style={th}>Plan</th><th style={th}>Track</th><th style={th}>Joined</th></tr></thead>
            <tbody>{(members || []).map((m, i) => (
              <tr key={i}><td style={td}>{m.full_name || '-'}</td><td style={td}>{m.email}</td><td style={td}>{m.plan}</td><td style={td}>{(m.track || '').toUpperCase()}</td><td style={td}>{new Date(m.created_at).toLocaleDateString()}</td></tr>
            ))}</tbody>
          </table></div>
        </div>

        <div style={card}>
          <h3 style={h3s}>Subscriptions by price</h3>
          {stripe && Object.keys(stripe.subscriptions_by_price || {}).length === 0 && <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>No active subscriptions yet.</p>}
          {stripe && Object.entries(stripe.subscriptions_by_price || {}).map(([k, v]) => (
            <p key={k} style={{ fontSize: 14, margin: '4px 0' }}><b>{k}</b> - {v.count} active @ ${v.amount}/mo</p>
          ))}
          {stripe && <p style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 10 }}>Balance available: ${stripe.available_usd ?? 0} (pending ${stripe.pending_usd ?? 0}) · {stripe.charges_90d} paid charges in 90d</p>}
        </div>

        <div style={card}>
          <h3 style={h3s}>Recent charges</h3>
          <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Amount</th><th style={th}>Status</th><th style={th}>Name</th><th style={th}>When</th></tr></thead>
            <tbody>{(stripe ? stripe.recent_charges : []).map((c, i) => (
              <tr key={i}><td style={td}>${c.amount_usd}</td><td style={td}>{c.status}</td><td style={td}>{c.name || '-'}</td><td style={td}>{new Date(c.created * 1000).toLocaleString()}</td></tr>
            ))}</tbody>
          </table></div>
        </div>

        <div style={card}>
          <h3 style={h3s}>Question performance (weakest first, 3+ attempts)</h3>
          {qstats && qstats.length === 0 && <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>Not enough attempts yet - stats appear once members answer questions.</p>}
          <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>#</th><th style={th}>Track</th><th style={th}>Question</th><th style={th}>Tries</th><th style={th}>Correct</th><th style={th}>Avg s</th><th style={th}>Top misconception</th></tr></thead>
            <tbody>{(qstats || []).map((q) => (
              <tr key={q.question_id}><td style={td}>{q.question_id}</td><td style={td}>{q.track.toUpperCase()}</td><td style={td}>{q.body}…</td><td style={td}>{q.attempts}</td><td style={{ ...td, color: q.correct_rate < 50 ? '#b3261e' : 'inherit', fontWeight: q.correct_rate < 50 ? 700 : 400 }}>{q.correct_rate}%</td><td style={td}>{q.avg_ms ? Math.round(q.avg_ms / 1000) : '-'}</td><td style={td}>{q.top_misconception || '-'}</td></tr>
            ))}</tbody>
          </table></div>
        </div>
      </div>
    </section></>);
}
