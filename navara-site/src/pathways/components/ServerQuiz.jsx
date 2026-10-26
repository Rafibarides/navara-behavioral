import React, { useEffect, useRef, useState } from 'react';
// Expand only complete, explicitly labeled ABC triples for display; authored text is untouched.
export function displayOption(text) {
  const value = String(text || '');
  if (!/^A:\s/.test(value) || !/\bB:\s/.test(value) || !/\bC:\s/.test(value)) return value;
  return value.replace(/^A:\s/, 'Antecedent: ').replace(/\bB:\s/, 'Behavior: ').replace(/\bC:\s/, 'Consequence: ');
}
// Correctness, saved choice and explanations come only from confirmed server receipts.
export default function ServerQuiz({ deliveries, client, track, onNewSet }) {
  const [i, setI] = useState(0), [selected, setSelected] = useState(null), [answer, setAnswer] = useState(null);
  const [pending, setPending] = useState(false), [error, setError] = useState(null), [done, setDone] = useState(false);
  const [results, setResults] = useState([]);
  const request = useRef(null), lock = useRef(false), resultsCard = useRef(null);
  const q = deliveries[i];
  const saved = results.filter(r => r.answer.outcome !== 'content_changed');
  const correct = saved.filter(r => r.answer.correct).length;
  useEffect(() => { if (done) { resultsCard.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); resultsCard.current?.focus({ preventScroll: true }); } }, [done]);
  const topics = saved.reduce((acc, r) => { const area = r.question.area; if (area) { acc[area] ||= { n: 0, c: 0 }; acc[area].n++; if (r.answer.correct) acc[area].c++; } return acc; }, Object.create(null));
  useEffect(() => {
    if (done || (!saved.length && !pending && !error)) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    const leave = event => {
      const link = event.target.closest?.('a[href]');
      if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || link.target === '_blank') return;
      if (!window.confirm(`Leave this set? ${saved.length} checked answer${saved.length === 1 ? ' is' : 's are'} saved.${pending || error ? ' Your latest answer is not confirmed saved.' : ''} This set will not resume.`)) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener('beforeunload', warn); document.addEventListener('click', leave, true);
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', leave, true); };
  }, [done, saved.length, pending, error]);
  async function submit() {
    if (lock.current || answer || selected === null) return;
    lock.current = true; setPending(true); setError(null);
    request.current ||= client.answer({ track, item_delivery_id: q.item_delivery_id, chosen_index: selected });
    try {
      const value = await request.current.send();
      if (!['accepted', 'replayed', 'already_answered', 'content_changed'].includes(value.outcome)) throw Error('Invalid server result');
      setAnswer(value); setResults(rows => [...rows, { question: q, answer: value }]);
    } catch (e) { setError(e.message || 'Answer unavailable'); }
    finally { lock.current = false; setPending(false); }
  }
  function next() { request.current = null; setAnswer(null); setSelected(null); setError(null); if (i + 1 === deliveries.length) setDone(true); else setI(i + 1); }
  if (done) return <div className="qcard set-results" ref={resultsCard} tabIndex={-1}>
    <span className="eyebrow">Practice results</span><h3>Set complete</h3>
    <p className="result-score">{correct} / {saved.length} <span>correct</span></p>
    {saved.length > 0 && saved.every(r => r.question.area) && <p className="results-topics">{Object.entries(topics).map(([area, v]) => `${area}: ${v.c} / ${v.n} correct`).join(' · ')}</p>}
    <p>{saved.length} checked answer{saved.length === 1 ? '' : 's'} confirmed saved to your progress.</p>
    {saved.length < deliveries.length && <p role="status">{deliveries.length - saved.length} changed question{deliveries.length - saved.length === 1 ? ' was' : 's were'} not graded and {deliveries.length - saved.length === 1 ? 'is' : 'are'} not included in your score.</p>}
    <h4 className="miss-review-heading">Review your misses</h4>
    {saved.some(r => !r.answer.correct) ? saved.filter(r => !r.answer.correct).map(({ question, answer: receipt }) => <details className="miss-review" key={question.item_delivery_id}>
      <summary>{question.stem}</summary>
      <p><b>Your answer ({String.fromCharCode(65 + receipt.chosen_index)}):</b> {displayOption(question.options.find(o => o.index === receipt.chosen_index)?.text) || 'See your saved explanation below.'}</p>
      <p><b>Correct answer ({String.fromCharCode(65 + receipt.feedback.correct_index)}):</b> {displayOption(question.options.find(o => o.index === receipt.feedback.correct_index)?.text)}</p>
      {receipt.feedback.options.map(o => <p className="option-explanation" key={o.index}><b>{String.fromCharCode(65 + o.index)}{o.index === receipt.feedback.correct_index ? ' (correct)' : ''}:</b> {o.explanation}</p>)}
    </details>) : <p>{saved.length ? 'No misses in this set. Keep practicing to see more of your exam track.' : 'No graded answers to review in this set.'}</p>}
    <div className="result-actions">{onNewSet && <button className="btn btn-navy" onClick={onNewSet}>Start another set</button>}<a className="btn btn-outline" href="/pathways/app/dashboard">Back to dashboard</a></div>
  </div>;
  const graded = answer && answer.outcome !== 'content_changed';
  const choice = graded ? answer.chosen_index : selected;
  return <div className="qcard">
    <div className="q-meta">Question {i + 1} of {deliveries.length}</div><div className="q-text">{q.stem}</div>
    <div className="opts">{q.options.map(o => {
      const right = graded && o.index === answer.feedback.correct_index;
      const wrong = graded && o.index === choice && !right;
      return <button className={'opt' + (choice === o.index ? ' selected' : '') + (right ? ' answer-right' : '') + (wrong ? ' answer-wrong' : '')} aria-pressed={choice === o.index} key={o.index} disabled={pending || !!answer || !!request.current} onClick={() => setSelected(o.index)}>
        <span className="option-letter">{String.fromCharCode(65 + o.index)}.</span> {displayOption(o.text)}{right && <b className="answer-label"> ✓ Correct answer</b>}{wrong && <b className="answer-label"> ✕ Your saved answer</b>}
      </button>;
    })}</div>
    {pending && <p className="save-status" role="status">Saving your answer...</p>}
    {error && <p className="save-error" role="alert">{error}. Your answer is not confirmed saved. Retry sends the same answer, not a new attempt.</p>}
    {answer && <div className={'explain learner-feedback ' + (graded ? (answer.correct ? 'feedback-right' : 'feedback-wrong') : '')}>
      {answer.outcome === 'content_changed' ? <p>This question changed. Your answer was not graded and will not count toward this set's score.</p> : <>
        <h4>{answer.correct ? '✓ Correct' : `✕ Not quite. The correct answer is ${String.fromCharCode(65 + answer.feedback.correct_index)}.`}</h4>
        {answer.outcome === 'already_answered' && <p>A prior answer was already saved. Your score and review use that saved answer, not this new choice.</p>}
        {answer.feedback?.options?.map(o => <p className="option-explanation" key={o.index}><b>{String.fromCharCode(65 + o.index)}{o.index === answer.feedback.correct_index ? ' (correct)' : ''}:</b> {o.explanation}</p>)}
      </>}
    </div>}
    <div className="q-nav">{answer ? <button className="btn btn-navy btn-sm" onClick={next}>{i + 1 === deliveries.length ? 'See results' : 'Next question'}</button> : <button className="btn btn-navy btn-sm" disabled={pending || selected === null} onClick={submit}>{error ? 'Retry same answer' : 'Check answer'}</button>}</div>
  </div>;
}
