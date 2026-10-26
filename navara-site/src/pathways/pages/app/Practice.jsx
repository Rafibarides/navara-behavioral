import React, { useEffect, useState } from 'react';
import AppNav from '../../components/AppNav';
import { SampleFlag } from '../../components/Chrome';
import Quiz from '../../components/Quiz';
import { useRequireUser } from '../../components/useRequireUser';
import { fetchQuestions, fetchSample, fetchAdaptiveSet, fetchMemberEvidence, DEMO_EVIDENCE } from '../../lib/db';
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
  useEffect(() => {
    if (!user) return;
    let on = true;
    const track = user.track || 'rbt';
    const tag = new URLSearchParams(window.location.search).get('tag');
    (async () => {
      let ev = [];
      if (user.demo) ev = DEMO_EVIDENCE;
      else { try { ev = (await fetchMemberEvidence()) || []; } catch { ev = []; } }
      if (!on) return;
      setEvidence(ev);
      const hit = tag && ev.find((p) => p.tag === tag);
      if (hit) {
        try {
          const rows = await fetchAdaptiveSet({ track, misconceptions: [hit.tag], limit: 10 });
          if (on && rows && rows.length) { setTarget(hit); setQs(rows); setLive(true); return; }
        } catch { /* fall through to the general set */ }
      }
      try {
        const rows = await fetchQuestions({ track, limit: 12 });
        if (!on) return;
        if (!DEMO && rows && rows.length > 0) { setQs(rows); setLive(true); }
        else { const s = await fetchSample({ track, limit: 10 }); if (on) setQs(s); }
      } catch {
        const s = await fetchSample({ track: 'rbt', limit: 10 }); if (on) setQs(s);
      }
    })();
    return () => { on = false; };
  }, [user]);
  if (!user) return null;
  return (<>
    <AppNav active="practice" />
    <section className="section" style={{ paddingTop: 60, minHeight: '100vh' }}>
      <div className="wrap quiz-shell">
        {target ? (<>
          <span className="eyebrow" style={{ color: 'var(--teal-3)' }}>Targeted set - built from your recorded misses</span>
          <h2>{cardTitle(target)}.</h2>
          <p style={{ color: 'var(--ink-2)', fontWeight: 600, marginBottom: 26 }}>
            Your recorded misses carried this tag {target.misses} times across {target.items} different questions in the last 30 days. This set is more questions with the same tag. Tags are author-assigned and not yet expert-reviewed - a pointer for your review, not a diagnosis.
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
              <p style={{ margin: '4px 0 12px', fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 600 }}>More questions carrying the tags on your recent misses. Tags are pointers for review, not a diagnosis.</p>
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
          ? <Quiz key={(target ? target.tag : String(user.track)) + live} questions={qs} title={target ? 'Targeted set' : live ? 'Practice set' : 'Sample practice set'} kind={target ? 'targeted' : 'practice'} cta={target ? 'Back to practice' : 'Back to dashboard'} ctaHref={target ? '/pathways/app/practice' : '/pathways/app/dashboard'} />
          : <p style={{ fontWeight: 600, color: 'var(--ink-2)' }}>Loading your set...</p>}
      </div>
    </section>
  </>);
}
