import React from 'react';

// Preview-only marketing sections for the track pages (Nisan-approved ChatGPT/Tab picks).
// Rendered only under ?preview=1; public pages are unchanged.

export function Explainer({ title, lines, closing }) {
  return (
    <section className="section dark">
      <div className="wrap" style={{ maxWidth: 820 }}>
        <div className="section-head rv"><span className="eyebrow">Why Navara Pathways</span>
          <h2>{title}</h2>
        </div>
        <div className="stack">
          {lines.map((l, i) => <p key={i} className={"rv rv-d" + ((i % 3) + 1)} style={{ fontSize: 19, lineHeight: 1.65, color: 'rgba(255,255,255,.82)', fontWeight: i === 0 ? 700 : 500 }}>{l}</p>)}
          {closing && <p className="rv rv-d3" style={{ fontSize: 21, fontWeight: 800, color: '#fff', marginTop: 18 }}>{closing}</p>}
        </div>
      </div>
    </section>
  );
}

export function WhatYouGet({ checks }) {
  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 860 }}>
        <div className="section-head center rv"><span className="eyebrow" style={{ color: 'var(--teal-3)' }}>What you get</span>
          <h2>Everything on the table.</h2>
        </div>
        <ul className="checks">
          {checks.map((c, i) => (
            <li key={i} className={"rv rv-d" + ((i % 4) + 1) + (c.glow ? " glow-line" : "")}>
              <span className="ck">&#10003;</span>
              <span>{c.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function GuidedBlock({ eyebrow, heading, intro, bullets }) {
  return (
    <section className="section dark">
      <div className="wrap" style={{ maxWidth: 860 }}>
        <div className="section-head rv"><span className="eyebrow">{eyebrow}</span>
          <h2>{heading}</h2>
        </div>
        <p className="rv" style={{ fontSize: 18, lineHeight: 1.7, color: 'rgba(255,255,255,.82)', maxWidth: 640 }}>{intro}</p>
        <div className="steps" style={{ marginTop: 34 }}>
          {bullets.map((b, i) => (
            <div key={i} className={"step rv" + (i ? " rv-d" + i : "")}><div className="ic">&#10004;</div><h4>{b.h}</h4><p>{b.p}</p></div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function OneOnOne({ heading, body, foot }) {
  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 900, display: 'flex', gap: 48, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 340px' }}>
          <div className="section-head rv"><span className="eyebrow" style={{ color: 'var(--teal-3)' }}>Guided plans</span>
            <h2>{heading}</h2>
          </div>
          <p className="rv" style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--ink-1)' }}>{body}</p>
          {foot && <p className="rv rv-d1" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-0)', marginTop: 14 }}>{foot}</p>}
        </div>
        <div className="rv rv-d2" style={{ flex: '1 1 280px', minWidth: 260 }}>
          <div className="book-card">
            <div className="book-card-top">
              <span className="book-card-cal">&#128197;</span>
              <div>
                <b>1:1 session</b>
                <span>with your NCBS&#8482;</span>
              </div>
            </div>
            <div className="book-slot"><span>Thu 4:30 PM</span><i className="pulse-dot"></i></div>
            <div className="book-slot dim"><span>Fri 12:00 PM</span></div>
            <div className="book-slot dim"><span>Mon 6:15 PM</span></div>
            <div className="book-done">Booked <b>&#10003;</b></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ClosingCTA({ heading, body, primary, secondary, micro }) {
  return (
    <section className="section dark" style={{ textAlign: 'center' }}>
      <div className="wrap" style={{ maxWidth: 760 }}>
        <h2 className="rv" style={{ marginBottom: 16 }}>{heading}</h2>
        <p className="rv rv-d1" style={{ fontSize: 18, lineHeight: 1.7, color: 'rgba(255,255,255,.82)', margin: '0 auto 30px', maxWidth: 620 }}>{body}</p>
        <div className="rv rv-d2" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a className="btn btn-primary" href={primary.href}>{primary.label}</a>
          <a className="btn btn-ghost" href={secondary.href}>{secondary.label}</a>
        </div>
        {micro && <p className="rv rv-d3" style={{ marginTop: 20, fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,.55)' }}>{micro}</p>}
      </div>
    </section>
  );
}
