import React, { useState } from 'react';
import { recordAttempt } from '../lib/db';

// Interactive quiz engine with real-time, choice-specific feedback:
// wrong picks show why that option was tempting + what rules it out;
// every attempt (with misconception tag) is recorded for pattern diagnostics.
export default function Quiz({ questions, title, cta = 'See the plans', ctaHref = '/pathways/plans' }) {
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [done, setDone] = useState(false);
  const [round, setRound] = useState(0);

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="qcard q-score" key={'score' + round}>
        <div className="q-meta" style={{ justifyContent: 'center' }}><span>{title} complete</span></div>
        <div className="big">{pct}%</div>
        <p style={{ color: 'var(--ink-2)', fontWeight: 600, margin: '8px 0 26px' }}>
          {score} of {questions.length} correct. In the full program every question carries feedback specific to the option you picked, and your patterns feed your study plan.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a className="btn btn-primary" href={ctaHref}>{cta}</a>
          <button className="btn btn-navy" onClick={() => { setI(0); setScore(0); setPicked(null); setDone(false); setRound(r => r + 1); }}>Try again</button>
        </div>
      </div>
    );
  }
  const q = questions[i];
  const pick = (k) => {
    setPicked(k);
    const correct = k === q.a;
    if (correct) setScore(s => s + 1);
    recordAttempt({ question: q.q.slice(0, 64), area: q.area, chosen: k, correct, misconception: correct ? null : (q.opts[k].misc || null) }).catch(() => {});
  };
  return (
    <div className="qcard" key={i + '-' + round}>
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
          return <button key={k} className={cls} disabled={picked !== null} onClick={() => pick(k)}>{String.fromCharCode(65 + k)}. {o.t}</button>;
        })}
      </div>
      {picked !== null && (
        <div className="explain">
          {picked === q.a
            ? <><b>Correct.</b>{q.opts[q.a].exp}</>
            : <>
                <b>Not quite.</b>{q.opts[picked].why}
                {q.opts[picked].conf ? <> You may be confusing this with <b>{q.opts[picked].conf.replace(/_/g, ' ')}</b>.</> : null}
                {' '}The right answer is {q.opts[q.a].t}. {q.opts[q.a].exp}
                {q.opts[picked].rem ? <><br /><span style={{ fontWeight: 700 }}>Review:</span> {q.opts[picked].rem}</> : null}
              </>}
        </div>
      )}
      <div className="q-nav">
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)' }}>Score: {score}/{picked !== null ? i + 1 : i}</span>
        <button className="btn btn-navy btn-sm" style={{ visibility: picked !== null ? 'visible' : 'hidden' }}
          onClick={() => { if (i === questions.length - 1) setDone(true); else { setI(i + 1); setPicked(null); } }}>
          {i === questions.length - 1 ? 'See results' : 'Next question'} &rarr;
        </button>
      </div>
    </div>
  );
}
