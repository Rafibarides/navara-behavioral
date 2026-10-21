import React, { useEffect, useRef, useState } from 'react';

// Preview content approved by the owner (Oct 21) - now the public default.
export function usePreview() {
  return true;
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
    line: 'Timed mocks with pace feedback. Guided plans add monthly 1:1 sessions.',
  },
];

const SECTIONS_PREVIEW = [
  {
    clip: '/inside/clip1.mp4',
    poster: '/inside/poster1.jpg',
    headline: 'Your readiness at a glance.',
    line: 'Know what\u2019s solid. See what needs work. Choose your next study hour with purpose.',
  },
  {
    clip: '/inside/clip2.mp4',
    poster: '/inside/poster2.jpg',
    headline: 'One question. Full reasoning.',
    line: 'Every option explained - why the right answer is right, and why the tempting ones tempt.',
  },
  {
    clip: '/inside/clip3.mp4',
    poster: '/inside/poster3.jpg',
    headline: 'Exam pace, zero surprises.',
    line: 'Timed mocks with pace feedback. Guided plans add monthly 1:1 sessions.',
  },
];

export default function Showcase() {
  const preview = usePreview();
  const sections = preview ? SECTIONS_PREVIEW : SECTIONS;
  return (<>
    <section className="section dark" style={{ paddingTop: 90 }}>
      <div className="wrap">
        <div className="section-head center rv in">
          <span className="eyebrow" style={{ color: 'var(--teal-3)' }}>Inside the member area</span>
          <h2>{preview ? 'Step inside your study space.' : 'See what studying here feels like.'}</h2>
          {preview && <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 17, marginTop: 8 }}>See exactly what you'll use every day, before you join.</p>}
        </div>
        {sections.map((s, i) => (
          <Reveal key={s.clip} text style={{
            display: 'flex', flexDirection: i % 2 ? 'row-reverse' : 'row', gap: 48,
            alignItems: 'center', margin: '64px 0', flexWrap: 'wrap',
          }}>
            <div style={{ flex: '1 1 320px', minWidth: 280 }}>
              <h3 style={{ fontSize: 30, marginBottom: 12, color: '#fff' }}>{s.headline}</h3>
              <p style={{ fontSize: 16, lineHeight: 1.6 }}>{s.line}</p>
            </div>
            <div className={"showcase-float" + (i % 2 ? " showcase-float-alt" : "")} style={{ flex: '1 1 420px', minWidth: 300 }}>
              <div style={{ position: 'relative', aspectRatio: '16 / 9', borderRadius: 16, overflow: 'hidden', background: '#0d2233', boxShadow: '0 24px 60px rgba(10,30,50,.35)' }}>
                <img src={s.poster} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <video src={s.clip} autoPlay loop muted playsInline preload="metadata"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            </div>
          </Reveal>
        ))}
        <Reveal text style={{ textAlign: 'center', margin: '80px 0 20px' }}>
          <h3 style={{ fontSize: 32, marginBottom: 10, color: '#fff' }}>Ready when you are.</h3>
          <p style={{ marginBottom: 26 }}>Take the free 10-question sample quiz - no account needed.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a className="btn btn-primary" href="/pathways/sample-quiz">Try the free quiz</a>
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
