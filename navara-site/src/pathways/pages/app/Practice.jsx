import React, { useEffect, useState } from 'react';
import AppNav from '../../components/AppNav';
import { SampleFlag } from '../../components/Chrome';
import Quiz from '../../components/Quiz';
import { useRequireUser } from '../../components/useRequireUser';
import { fetchQuestions, fetchSample, fetchAdaptiveSet, fetchMemberEvidenceState, fetchMissedQuestions, DEMO_EVIDENCE } from '../../lib/db';
import { DEMO } from '../../config';

const pretty = (s) => { const t = String(s || '').replace(/_/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1); };
// Stable neutral display: the humanized tag only. The per-question authored distinctions
// (confuses_with) stay on their questions; picking one as the tag's heading would drift
// between visits for tags that carry several, and canonize one variant without review.
const cardTitle = (p) => pretty(p.tag);

export default function Practice() {
  const user = useRequireUser();
  const [qs, setQs] = useState(null);
  const [live, setLive] = useState(false);
  const [evidence, setEvidence] = useState([]);
  const [target, setTarget] = useState(null);
  const [setStatus, setSetStatus] = useState('loading');
  useEffect(() => {
    if (!user) return;
    let on = true;
    setQs(null); setTarget(null); setEvidence([]); setLive(false); setSetStatus('loading');
    const track = user.track;
    const params = new URLSearchParams(window.location.search);
    const tag = params.get('tag');
    const review = params.get('review') === '1';
    (async () => {
      try {
        if (user.trackSet === false || !['rbt','bcba'].includes(track)) { if (on) setSetStatus('track_required'); return; }
        const demo = DEMO || user.demo;
        const state = demo ? { status: 'ready', rows: DEMO_EVIDENCE } : await fetchMemberEvidenceState(user);
        if (!on) return;
        if (state.status === 'track_required') { setSetStatus('track_required'); return; }
        if (state.status === 'unavailable') throw state.error;
        const ev = state.rows;
        setEvidence(ev);
        const hit = tag && ev.find((p) => p.tag === tag);
        // An explicit review/target is never silently exchanged for another quiz.
        if (tag && !hit) { setSetStatus('empty'); return; }
        let rows;
        if (hit) {
          rows = review ? await fetchMissedQuestions(hit.tag) : await fetchAdaptiveSet({ track, misconceptions: [hit.tag], limit: 10 });
        } else rows = demo ? await fetchSample({ track, limit: 10 }) : await fetchQuestions({ track, limit: 12 });
        if (!on) return;
        if (!Array.isArray(rows)) throw new Error('Invalid question response');
        if (!rows.length) { setSetStatus('empty'); return; }
        setTarget(hit ? { ...hit, review } : null); setQs(rows); setLive(!demo); setSetStatus('ready');
      } catch { if (on) { setQs(null); setTarget(null); setSetStatus('unavailable'); } }
    })();
    return () => { on = false; };
  }, [user?.id, user?.track, user?.trackSet, user?.demo]);
  if (!user) return null;
  if (setStatus !== 'ready') return <><AppNav active="practice" /><section className="section" style={{paddingTop:60,minHeight:'100vh'}}><div className="wrap quiz-shell"><h2>Practice</h2><p role={setStatus === 'unavailable' ? 'alert' : 'status'} style={{fontWeight:600}}>{setStatus === 'loading' ? 'Loading your set...' : setStatus === 'track_required' ? 'Select your exam track before practicing.' : setStatus === 'empty' ? 'No questions are available for this request. No other set has been substituted.' : 'This practice set is unavailable. No other set has been substituted. Please try again later.'}</p><a href="/pathways/app/dashboard">Back to dashboard</a></div></section></>;

  return (<>
    <AppNav active="practice" />
    <section className="section" style={{ paddingTop: 60, minHeight: '100vh' }}>
      <div className="wrap quiz-shell">
        {target && target.review ? (<>
          <span className="eyebrow" style={{ color: 'var(--teal-3)' }}>Review - the exact questions you missed</span>
          <h2>Your misses tagged &ldquo;{cardTitle(target)}&rdquo;.</h2>
          <p style={{ color: 'var(--ink-2)', fontWeight: 600, marginBottom: 26 }}>
            These are the {qs ? qs.length : ''} questions where your selected answer carried this assigned tag in the last 30 days, most recent first. Retake them and read the explanations.
          </p>
        </>) : target ? (<>
          <span className="eyebrow" style={{ color: 'var(--teal-3)' }}>Targeted set - built from your recorded misses</span>
          <h2>More questions tagged &ldquo;{cardTitle(target)}&rdquo;.</h2>
          <p style={{ color: 'var(--ink-2)', fontWeight: 600, marginBottom: 26 }}>
            Your selected answers carried this assigned tag on {target.misses} recorded {target.misses === 1 ? 'miss' : 'misses'} across {target.items} different questions in the last 30 days. This set is more questions whose answer options carry the same tag.
          </p>
        </>) : (<>
          <span className="eyebrow" style={{ color: 'var(--teal-3)' }}>{live ? 'Practice - live bank' : 'Practice (sample bank)'}</span>
          <h2>Practice by topic.</h2>
          <p style={{ color: 'var(--ink-2)', fontWeight: 600, marginBottom: 26 }}>
            {live
              ? 'Untimed sets with instant, option-specific feedback from the full bank.'
              : 'Untimed sets with instant explanations. These are the labeled sample questions; members practice from the full 500-question bank on their track (1,000 across both).'}
          </p>
          {evidence.length > 0 && (
            <div className="panel" style={{ marginBottom: 22, borderLeft: '4px solid var(--teal-3)' }}>
              <b style={{ fontSize: 15 }}>Sets built from your recorded misses</b>
              <p style={{ margin: '4px 0 12px', fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 600 }}>More questions carrying the assigned tags from your recent incorrect answers.</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {evidence.slice(0, 3).map((p) => (
                  <a key={p.tag} className="btn btn-navy btn-sm" href={'/pathways/app/practice?tag=' + encodeURIComponent(p.tag)}>{pretty(p.tag)}</a>
                ))}
              </div>
            </div>
          )}
        </>)}
        {!live && !target && <div style={{ textAlign: 'left', marginBottom: 20 }}><SampleFlag /></div>}
        {qs
          ? <Quiz key={(target ? target.tag + (target.review ? '-review' : '') : String(user.track)) + live} questions={qs} title={target ? (target.review ? 'Review set' : 'Targeted set') : live ? 'Practice set' : 'Sample practice set'} kind={target && !target.review ? 'targeted' : 'practice'} cta={target ? 'Back to practice' : 'Back to dashboard'} ctaHref={target ? '/pathways/app/practice' : '/pathways/app/dashboard'} />
          : <p style={{ fontWeight: 600, color: 'var(--ink-2)' }}>Loading your set...</p>}
      </div>
    </section>
  </>);
}
