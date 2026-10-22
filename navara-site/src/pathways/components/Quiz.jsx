import React, { useRef, useState } from 'react';
import { recordAttempt } from '../lib/db';
import { signIn } from '../lib/auth';
import { DEMO } from '../config';

// Interactive quiz engine with real-time, choice-specific feedback:
// wrong picks show why that option was tempting + what rules it out;
// every attempt (with misconception tag) is recorded for pattern diagnostics.
// Completion screen: score gauge, per-area breakdown, readiness note,
// and an optional email capture (emailCta) that sends a sign-in link.

// Branded shareable score card (canvas PNG). Score facts only - no readiness claims.
function downloadScoreCard({ title, score, total }) {
  const c = document.createElement('canvas');
  c.width = 1200; c.height = 630;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 1200, 630);
  g.addColorStop(0, '#10233c'); g.addColorStop(0.55, '#1B3B62'); g.addColorStop(1, '#173038');
  x.fillStyle = g; x.fillRect(0, 0, 1200, 630);
  x.strokeStyle = 'rgba(177,201,179,.5)'; x.lineWidth = 10;
  x.beginPath(); x.moveTo(650, 500); x.quadraticCurveTo(900, 250, 1220, 330); x.stroke();
  x.strokeStyle = 'rgba(95,141,156,.55)';
  x.beginPath(); x.moveTo(600, 545); x.quadraticCurveTo(880, 300, 1230, 400); x.stroke();
  x.fillStyle = '#B1C9B3'; x.font = '700 34px Montserrat, sans-serif';
  x.fillText('NAVARA PATHWAYS', 70, 100);
  x.fillStyle = '#ffffff'; x.font = '800 120px Montserrat, sans-serif';
  x.fillText(score + '/' + total, 70, 290);
  x.fillStyle = 'rgba(255,255,255,.85)'; x.font = '600 40px Montserrat, sans-serif';
  x.fillText('on the free ' + title.replace(/ sample$/i, '') + ' sample quiz', 70, 360);
  x.fillStyle = 'rgba(255,255,255,.65)'; x.font = '600 30px Montserrat, sans-serif';
  x.fillText('Think you can beat it? navarabehavioralgroup.com/pathways', 70, 560);
  const a = document.createElement('a');
  a.download = 'navara-pathways-score.png';
  a.href = c.toDataURL('image/png');
  a.click();
}

export default function Quiz({ questions, title, cta = 'See the plans', ctaHref = '/pathways/plans', emailCta = false, kind = 'sample', onAnswer = null }) {
  const v2 = true;
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [done, setDone] = useState(false);
  const [round, setRound] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const shownAt = useRef(Date.now());

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const areas = {};
    answers.forEach(({ area, correct }) => {
      areas[area] = areas[area] || { n: 0, c: 0 };
      areas[area].n += 1;
      if (correct) areas[area].c += 1;
    });
    const readiness = pct >= 80
      ? 'Strong sample performance. The full banks go deeper - timed mocks will tell you if it holds under pressure.'
      : pct >= 60
        ? 'A workable foundation with real gaps. Targeted practice on your weak areas is the fastest way up from here.'
        : 'This is exactly where guided practice pays off: every wrong answer in the full program tells you why it tempted you.';
    const save = async (e) => {
      e.preventDefault();
      if (!email) return;
      try { await signIn(email); } catch { /* still show the confirmation */ }
      setSent(true);
    };
    return (
      <div className="qcard q-score" key={'score' + round}>
        <div className="q-meta" style={{ justifyContent: 'center' }}><span>{title} complete</span></div>
        <div className="big">{pct}%</div>
        <p style={{ color: 'var(--ink-2)', fontWeight: 600, margin: '8px 0 6px' }}>
          {score} of {questions.length} correct.
        </p>
        <p style={{ color: 'var(--ink-2)', fontWeight: 600, margin: '0 0 22px', fontSize: 14 }}>{readiness}</p>
        {Object.keys(areas).length > 1 && (
          <div style={{ textAlign: 'left', marginBottom: 24 }}>
            {Object.entries(areas).map(([area, v]) => {
              const p = Math.round((v.c / v.n) * 100);
              return (
                <div className="prog" key={area}>
                  <div className="row"><span>{area}</span><span>{v.c}/{v.n}</span></div>
                  <div className="bar"><i style={{ width: p + '%' }}></i></div>
                </div>
              );
            })}
          </div>
        )}
        {emailCta && !sent && (
          <form onSubmit={save} style={{ marginBottom: 22 }}>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Save these results and keep practicing free:</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                     style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(27,59,98,.25)', minWidth: 240, font: 'inherit' }} />
              <button className="btn btn-navy" type="submit">{DEMO ? 'Save my results' : 'Email me a sign-in link'}</button>
            </div>
          </form>
        )}
        {emailCta && sent && (
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--teal-3)', marginBottom: 22 }}>
            {DEMO ? 'Results saved to your demo account.' : 'Check your inbox - your sign-in link is on its way.'}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a className="btn btn-primary" href={ctaHref}>{cta}</a>
          <button className="btn btn-navy" onClick={() => { setI(0); setScore(0); setPicked(null); setDone(false); setAnswers([]); setRound(r => r + 1); }}>Try again</button>
          <button className="btn btn-ghost" onClick={() => downloadScoreCard({ title, score, total: questions.length })}>Share my score card</button>
        </div>
      </div>
    );
  }
  const q = questions[i];
  const pick = (k) => {
    const ms = Date.now() - shownAt.current;
    setPicked(k);
    const correct = k === q.a;
    if (correct) setScore(s => s + 1);
    setAnswers(a => [...a, { area: q.area, correct }]);
    if (onAnswer) onAnswer();
    recordAttempt({
      questionId: q.id || null, chosenOption: k, correct, kind,
      misconception: correct ? null : (q.opts[k].misc || null),
      confusesWith: correct ? null : (q.opts[k].conf || null),
      ms,
    }).catch(() => {});
  };
  const next = () => {
    shownAt.current = Date.now();
    if (i === questions.length - 1) setDone(true);
    else { setI(i + 1); setPicked(null); }
  };
  return (
    <div className={'qcard' + (v2 ? ' qv2' : '')} key={i + '-' + round}>
      <div className="q-meta"><span>Question {i + 1} of {questions.length}</span><span>{q.area}</span></div>
      <div className="q-bar"><i style={{ width: (i / questions.length) * 100 + '%' }}></i></div>
      <div className="q-text">{q.q}</div>
      <div className="opts">
        {q.opts.map((o, k) => {
          let cls = 'opt';
          if (picked !== null) {
            if (k === q.a) cls += ' correct';
            else if (k === picked) cls += ' wrong';
          }
          return (
            <button key={k} className={cls} disabled={picked !== null} onClick={() => pick(k)}>
              <span>{String.fromCharCode(65 + k)}. {o.t}</span>
              {v2 && picked !== null && k === q.a ? <span className="chip chip-ok">Correct</span> : null}
              {v2 && picked !== null && k === picked && picked !== q.a ? <span className="chip chip-tempt">Tempting</span> : null}
            </button>
          );
        })}
      </div>
      {picked !== null && v2 && (
        <div className="explain explain-v2">
          <div className="why-h why-ok">Why {String.fromCharCode(65 + q.a)} is right</div>
          <p>{q.opts[q.a].exp}</p>
          {picked !== q.a && (<>
            <div className="why-h why-tempt">Why {String.fromCharCode(65 + picked)} tempted you</div>
            <p>{q.opts[picked].why}{q.opts[picked].tempt ? ' ' + q.opts[picked].tempt : ''}</p>
            {q.opts[picked].conf ? <p className="why-conf">You may be confusing this with <span className="term">{q.opts[picked].conf.replace(/_/g, ' ')}</span>.</p> : null}
            {q.opts[picked].rem ? <p className="why-rem"><b>Review:</b> {q.opts[picked].rem}</p> : null}
            {q.opts.some((o) => o.exp) && (
              <div className="why-all">
                <div className="why-h why-tempt">Every option</div>
                {q.opts.map((o, k) => o.exp && (
                  <p key={k} className="why-opt"><b>{String.fromCharCode(65 + k)}{k === q.a ? ' (correct)' : ''}:</b> {o.exp}</p>
                ))}
              </div>
            )}
          </>)}
        </div>
      )}
      {picked !== null && !v2 && (
        <div className="explain">
          {picked === q.a
            ? <><b className="verdict">Correct.</b>{q.opts[q.a].exp}</>
            : <>
                <b className="verdict">Not quite.</b>{q.opts[picked].why}
                {q.opts[picked].tempt ? <> <i>Why it tempts:</i> {q.opts[picked].tempt}</> : null}
                {q.opts[picked].conf ? <> You may be confusing this with <span className="term">{q.opts[picked].conf.replace(/_/g, ' ')}</span>.</> : null}
                {' '}The right answer is {String.fromCharCode(65 + q.a)}. {q.opts[q.a].exp}
                {q.opts[picked].rem ? <><br /><span style={{ fontWeight: 700 }}>Review:</span> {q.opts[picked].rem}</> : null}
              </>}
        </div>
      )}
      <div className="q-nav">
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)' }}>Score: {score}/{picked !== null ? i + 1 : i}</span>
        <button className="btn btn-navy btn-sm" style={{ visibility: picked !== null ? 'visible' : 'hidden' }} onClick={next}>
          {i === questions.length - 1 ? 'See results' : 'Next question'} &rarr;
        </button>
      </div>
    </div>
  );
}
