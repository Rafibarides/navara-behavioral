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
  const [coverage, setCoverage] = useState(null);
  const [areas, setAreas] = useState(null);
  const [queue, setQueue] = useState(null);
  const [queueTotal, setQueueTotal] = useState(null);
  const [stripe, setStripe] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    (async () => {
      try {
        const sb = await getClient();
        const [o, m, q, c, a, rq] = await Promise.all([
          sb.rpc('admin_overview'),
          sb.rpc('admin_members', { p_limit: 25 }),
          sb.rpc('admin_question_stats', { p_min_attempts: 3, p_limit: 30 }),
          sb.rpc('admin_content_quality'),
          sb.rpc('admin_area_coverage'),
          sb.rpc('admin_review_queue', { p_status: 'open' }, { count: 'exact' }),
        ]);
        if (o.error) throw o.error; if (m.error) throw m.error; if (q.error) throw q.error; if (c.error) throw c.error; if (a.error) throw a.error; if (rq.error) throw rq.error; rq.countExact = rq.count;
        setOv(o.data); setMembers(m.data); setQstats(q.data); setCoverage(c.data); setAreas(a.data); setQueue(rq.data); setQueueTotal(rq.count);
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
        <div style={card}>
          <h3 style={h3s}>Misconception coverage (content audit)</h3>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: -6 }}>
            Review order for the expert content pass: most-missed tags first, then thinnest coverage. Counts are inventory, not validation - every tag is still pending expert review. A tag with under 3 items is thin: a member can rarely face that trap on enough distinct questions for a pattern to form honestly. No variant items exist yet. Labels counts the distinct authored distinctions (confuses_with) a tag carries across questions; more than 1 means the review should confirm one display label for that tag.
          </p>
          {coverage && (
            <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>
              {['rbt', 'bcba'].map((t) => {
                const rows = coverage.filter((r) => r.track === t);
                const thin = rows.filter((r) => r.items < 3).length;
                const ml = rows.filter((r) => r.label_variants > 1).length;
                return t.toUpperCase() + ': ' + rows.length + ' tags (' + thin + ' thin, ' + ml + ' multi-label)';
              }).join(' | ')}
            </p>
          )}
          <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Track</th><th style={th}>Misconception</th><th style={th}>Items</th><th style={th}>Labels</th><th style={th}>Areas</th><th style={th}>Misses 30d</th><th style={th}>Members 30d</th></tr></thead>
            <tbody>{(coverage || []).slice(0, 50).map((r) => (
              <tr key={r.track + r.tag}>
                <td style={td}>{r.track.toUpperCase()}</td>
                <td style={td}>{r.tag.replace(/_/g, ' ')}</td>
                <td style={{ ...td, fontWeight: r.items < 3 ? 700 : 400, color: r.items < 3 ? '#b3261e' : 'inherit' }}>{r.items}{r.items < 3 ? ' (thin)' : ''}</td>
                <td style={{ ...td, fontWeight: r.label_variants > 1 ? 700 : 400, color: r.label_variants > 1 ? '#b3261e' : 'inherit' }}>{r.label_variants}</td>
                <td style={td}>{(r.areas || []).slice(0, 2).join(', ')}{(r.areas || []).length > 2 ? ' +' + (r.areas.length - 2) : ''}</td>
                <td style={td}>{r.misses_30d}</td>
                <td style={td}>{r.members_missed_30d}</td>
              </tr>
            ))}</tbody>
          </table></div>
          {coverage && coverage.length > 50 && <p style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 8 }}>Showing 50 of {coverage.length} tags, most-missed first.</p>}
        </div>

        <div style={card}>
          <h3 style={h3s}>Content review queue (unreviewed candidates)</h3>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: -6 }}>
            Machine-generated audit candidates from a model pilot pass and mechanical checks. Every row is a candidate, not a finding: "verified" means only that quoted text was byte-checked against the live bank, not that the concern is valid. Nothing here changes content, keys, tags, or member evidence on its own - a human reviewer confirms or rejects each row. Known noise: numeric checks can miss word-form numerals ("Three" vs "3"); citation and contrast-word checks over-flagged in v1 and their v1 rows are retired.
          </p>
          {queue && (
            <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>
              {queueTotal === null ? queue.length : queueTotal} open candidates. Severity mix in the first {queue.length} (most urgent first): {['blocker','high','medium','low'].map((sv) => sv + ' ' + queue.filter((r) => r.severity === sv).length).join(', ')}. Model pilot rows are quote byte-checked; mechanical rows are unverified.
            </p>
          )}
          <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Item</th><th style={th}>Flag</th><th style={th}>Severity</th><th style={th}>Source</th><th style={th}>Quote check</th><th style={th}>Suggested route</th><th style={th}>Rationale</th></tr></thead>
            <tbody>{(queue || []).slice(0, 40).map((r) => (
              <tr key={r.flag_id}>
                <td style={td}>{r.track.toUpperCase()} #{r.item_id}{r.option_id !== null && r.option_id !== undefined ? ' opt ' + (Number(r.option_id) + 1) : ''}</td>
                <td style={td}>{r.flag.replace(/_/g, ' ')}</td>
                <td style={{ ...td, fontWeight: (r.severity === 'blocker' || r.severity === 'high') ? 700 : 400, color: r.severity === 'blocker' ? '#b3261e' : r.severity === 'high' ? '#9a6a00' : 'inherit' }}>{r.severity}</td>
                <td style={td}>{r.detector === 'model' ? 'model pilot' : 'mechanical'}</td>
                <td style={td}>{r.detector === 'model' ? (r.verification_status === 'source_verified' ? 'byte-checked' : r.verification_status.replace(/_/g, ' ')) : 'n/a'}</td>
                <td style={td}>{r.route ? 'suggestion: ' + r.route.replace(/_/g, ' ') : '-'}</td>
                <td style={{ ...td, maxWidth: 380 }}>{r.rationale && r.rationale.length > 220 ? r.rationale.slice(0, 220) + '…' : r.rationale}</td>
              </tr>
            ))}</tbody>
          </table></div>
          {queue && queue.length > 40 && <p style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 8 }}>Showing 40 of {queueTotal === null ? queue.length : queueTotal} open candidates, blockers and expert-pass rows first.</p>}
        </div>

        <div style={card}>
          <h3 style={h3s}>Coverage by area</h3>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: -6 }}>
            Published questions, distinct misconception tags, and thin tags (under 3 items) per exam area. Thin-heavy areas are where new items are most needed before strong patterns can form. Inventory only, pending the expert pass.
          </p>
          <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Track</th><th style={th}>Area</th><th style={th}>Questions</th><th style={th}>Tags</th><th style={th}>Thin tags</th></tr></thead>
            <tbody>{(areas || []).map((r) => (
              <tr key={r.track + r.area}>
                <td style={td}>{r.track.toUpperCase()}</td>
                <td style={td}>{r.area}</td>
                <td style={td}>{r.questions}</td>
                <td style={td}>{r.tags}</td>
                <td style={{ ...td, fontWeight: r.thin_tags > 0 ? 700 : 400, color: r.thin_tags > 0 ? '#b3261e' : 'inherit' }}>{r.thin_tags}</td>
              </tr>
            ))}</tbody>
          </table></div>
        </div>
      </div>
    </section></>);
}
