import React, { useEffect, useRef, useState } from 'react';

// Preview gate: everything on this page renders only when the URL carries
// ?preview=1, so production visitors see no change while we review new blocks.
export function usePreview() {
  const [on] = useState(() => typeof window !== 'undefined' && /[?&]preview=1\b/.test(window.location.search));
  return on;
}

function Reveal({ children, style, text }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setVis(true)), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(36px)',
      transition: 'opacity .7s ease, transform .7s ease' + (text ? ', color 1s ease .1s' : ''),
      ...(text ? { color: vis ? 'rgba(255,255,255,.88)' : 'rgba(255,255,255,.55)' } : {}),
      ...style,
    }}>{children}</div>
  );
}

const SECTIONS = [
  {
    clip: '/inside/clip1.mp4',
    poster: '/inside/poster1.jpg',
    headline: 'Know exactly where you stand.',
    line: 'Your dashboard tracks progress by topic, so the next hour of studying goes where it counts.',
  },
  {
    clip: '/inside/clip2.mp4',
    poster: '/inside/poster2.jpg',
    headline: 'Every answer teaches.',
    line: 'Untimed practice with instant explanations - why the right answer is right, and why the tempting one tempted you.',
  },
  {
    clip: '/inside/clip3.mp4',
    poster: '/inside/poster3.jpg',
    headline: 'Walk in ready.',
    line: 'Timed mocks under exam conditions. Guided plans add 1:1 time with an NCBS.',
  },
];

export default function Showcase() {
  return (<>
    <section className="section dark" style={{ paddingTop: 90 }}>
      <div className="wrap">
        <div className="section-head center rv in">
          <span className="eyebrow" style={{ color: 'var(--teal-3)' }}>Inside the member area</span>
          <h2>See what studying here feels like.</h2>
        </div>
        {SECTIONS.map((s, i) => (
          <Reveal key={s.clip} text style={{
            display: 'flex', flexDirection: i % 2 ? 'row-reverse' : 'row', gap: 48,
            alignItems: 'center', margin: '64px 0', flexWrap: 'wrap',
          }}>
            <div style={{ flex: '1 1 320px', minWidth: 280 }}>
              <h3 style={{ fontSize: 30, marginBottom: 12, color: '#fff' }}>{s.headline}</h3>
              <p style={{ fontSize: 16, lineHeight: 1.6 }}>{s.line}</p>
            </div>
            <div style={{ flex: '1 1 420px', minWidth: 300 }}>
              <video src={s.clip} poster={s.poster} autoPlay loop muted playsInline preload="metadata"
                style={{ width: '100%', borderRadius: 16, boxShadow: '0 24px 60px rgba(10,30,50,.35)', display: 'block' }} />
            </div>
          </Reveal>
        ))}
        <Reveal text style={{ textAlign: 'center', margin: '80px 0 20px' }}>
          <h3 style={{ fontSize: 32, marginBottom: 10, color: '#fff' }}>Ready when you are.</h3>
          <p style={{ marginBottom: 26 }}>Create a free account - the sample quiz is waiting inside.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a className="btn btn-primary" href="/pathways/login">Create account</a>
            <a className="btn btn-ghost" href="/pathways/plans">See plans</a>
          </div>
        </Reveal>
      </div>
    </section>
  </>);
}

// Sticky mobile CTA shown only in preview mode on track pages.
export function StickySampleCTA({ label, href }) {
  return (
    <a href={href} className="showcase-sticky-cta" style={{
      position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 90,
      display: 'none', textAlign: 'center', padding: '14px 18px', borderRadius: 14,
      background: 'var(--navy)', color: '#fff', fontWeight: 700, fontSize: 15,
      boxShadow: '0 12px 30px rgba(10,30,50,.35)', textDecoration: 'none',
    }}>{label}</a>
  );
}
