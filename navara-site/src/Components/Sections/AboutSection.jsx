import React, { useEffect, useRef, useState } from 'react';
import { getColors } from '../../utils/colorsAndText';
import siteData from '../../../SiteData.json';

const differences = [
  ['Understanding before instruction', 'We look at what behavior is communicating and the context around it.'],
  ['A plan shaped around your family', 'Your child, your priorities and routines guide the work, not a template.'],
  ['Parents at the center', 'We translate behavioral science into clear steps you can use beyond the session.'],
  ['Focused care, limited enrollment', "Our team includes multiple behavior specialists, and we limit enrollment to protect each family's attention."],
];

const AboutSection = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const sectionRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [wordIndex, setWordIndex] = useState(0);
  const heroWords = siteData.sections.about.heroWords;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => setWordIndex(index => (index + 1) % heroWords.length), 3000);
    return () => window.clearInterval(timer);
  }, [reducedMotion, heroWords.length]);

  useEffect(() => {
    const nodes = sectionRef.current.querySelectorAll('[data-about-reveal]');
    if (reducedMotion || !('IntersectionObserver' in window)) {
      nodes.forEach(node => node.classList.add('is-seen'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-seen');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <section id="about" ref={sectionRef} className="navara-about" style={{
      '--about-bg': colors.surface, '--about-ink': colors.primary,
      '--about-text': colors.text, '--about-muted': colors.textSecondary,
      '--about-border': colors.border, '--about-card': isDarkMode ? '#253332' : '#f3f7f4',
    }}>
      <style>{`
        .navara-about { background:var(--about-bg); color:var(--about-text); padding:110px 40px; font-family:'Montserrat',sans-serif; overflow:hidden; }
        .navara-about * { box-sizing:border-box; }
        .navara-about .about-wrap { max-width:1120px; margin:auto; }
        .navara-about .about-kicker { font-size:11px; font-weight:700; letter-spacing:.18em; color:var(--about-muted); margin:0 0 18px; text-transform:uppercase; }
        .navara-about h2 { font-size:clamp(30px,3.5vw,48px); line-height:1.16; letter-spacing:-.035em; color:var(--about-ink); margin:0 0 24px; }
        .navara-about p { font-size:16px; line-height:1.85; margin:0 0 20px; }
        .navara-about .about-intro { max-width:780px; text-align:center; margin:0 auto 88px; }
        .navara-about .about-word { min-height:72px; font-size:clamp(42px,5vw,64px); line-height:1.1; font-weight:800; color:var(--about-ink); letter-spacing:-.04em; margin-bottom:34px; }
        .navara-about .about-word span { display:inline-block; animation:about-word-in .65s ease both; }
        .navara-about .about-founder { display:grid; grid-template-columns:340px 1fr; gap:70px; align-items:center; margin-bottom:90px; }
        .navara-about .about-photo { position:relative; padding:18px; }
        .navara-about .about-photo img { width:100%; aspect-ratio:4/5; object-fit:cover; object-position:center; display:block; border-radius:160px 160px 24px 24px; }
        .navara-about .about-photo:before { content:''; position:absolute; inset:0; border:1px solid #91aaa0; border-radius:180px 180px 32px 32px; transform:rotate(-4deg); }
        .navara-about .about-photo-caption { text-align:center; font-size:12px; line-height:1.6; margin:24px 0 0; color:var(--about-muted); }
        .navara-about .about-photo-caption strong { display:block; color:var(--about-ink); font-size:14px; }
        .navara-about .about-vision { display:grid; grid-template-columns:1fr 1.1fr; gap:70px; padding:54px 0; border-top:1px solid var(--about-border); border-bottom:1px solid var(--about-border); margin-bottom:94px; }
        .navara-about .about-quote { color:var(--about-ink); padding-left:20px; border-left:2px solid #87aa99; }
        .navara-about .about-different-header { text-align:center; max-width:650px; margin:0 auto 40px; }
        .navara-about .about-arcs { width:160px; height:92px; display:block; margin:0 auto 24px; overflow:visible; }
        .navara-about .about-arcs path { fill:none; stroke-width:8; stroke-linecap:round; stroke-dasharray:1; stroke-dashoffset:1; transition:stroke-dashoffset 1.4s cubic-bezier(.2,.7,.2,1); }
        .navara-about .is-seen .about-arcs path { stroke-dashoffset:0; }
        .navara-about .about-arcs path:nth-child(2) { transition-delay:.14s; }
        .navara-about .about-arcs path:nth-child(3) { transition-delay:.28s; }
        .navara-about .about-different-subtitle { color:var(--about-muted); }
        .navara-about .about-panels { position:relative; display:grid; grid-template-columns:repeat(4,1fr); gap:16px; padding-top:24px; }
        .navara-about .about-panels:before { content:''; position:absolute; top:0; left:0; width:100%; height:2px; background:linear-gradient(90deg,#a7baa2,#6e9e9d,#1b3b62); transform:scaleX(0); transform-origin:left; transition:transform 1.3s ease; }
        .navara-about .about-panels.is-seen:before { transform:scaleX(1); }
        .navara-about .about-panel { position:relative; padding:28px 24px; border:1px solid var(--about-border); border-radius:20px; background:var(--about-card); transition:transform .3s ease,box-shadow .3s ease; }
        .navara-about .about-number { font-size:12px; font-weight:700; letter-spacing:.12em; color:var(--about-muted); display:block; margin-bottom:30px; }
        .navara-about .about-panel h3 { color:var(--about-ink); font-size:19px; line-height:1.35; margin:0 0 16px; letter-spacing:-.02em; }
        .navara-about .about-panel p { font-size:14px; line-height:1.75; margin:0; }
        .navara-about [data-about-reveal] { opacity:0; transform:translateY(22px); transition:opacity .7s ease,transform .7s ease; }
        .navara-about [data-about-reveal].is-seen { opacity:1; transform:none; }
        .navara-about .about-panel[data-about-reveal] { transition-delay:var(--reveal-delay,0s); }
        @media(hover:hover) { .navara-about .about-panel.is-seen:hover { transform:translateY(-5px); box-shadow:0 12px 26px #17394d12; } }
        @keyframes about-word-in { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
        @media(max-width:900px) { .navara-about .about-founder { grid-template-columns:260px 1fr; gap:32px; } .navara-about .about-panels { grid-template-columns:repeat(2,1fr); } .navara-about .about-vision { gap:32px; } }
        @media(max-width:600px) { .navara-about { padding:72px 22px; } .navara-about .about-intro { margin-bottom:56px; } .navara-about .about-word { min-height:50px; margin-bottom:26px; } .navara-about .about-founder,.navara-about .about-vision { grid-template-columns:1fr; gap:32px; margin-bottom:58px; } .navara-about .about-photo { width:260px; margin:auto; } .navara-about .about-vision { padding:38px 0; gap:8px; } .navara-about .about-panels { grid-template-columns:1fr; gap:14px; padding:0 0 0 18px; } .navara-about .about-panels:before { width:2px; height:100%; transform:scaleY(0); transform-origin:top; background:linear-gradient(#a7baa2,#6e9e9d,#1b3b62); } .navara-about .about-panels.is-seen:before { transform:scaleY(1); } .navara-about .about-panel { padding:24px; } .navara-about .about-number { margin-bottom:14px; } .navara-about p { font-size:15px; } }
        @media(prefers-reduced-motion:reduce) { .navara-about *, .navara-about *:before { animation:none!important; transition:none!important; } .navara-about [data-about-reveal] { opacity:1!important; transform:none!important; } .navara-about .about-arcs path { stroke-dashoffset:0; } .navara-about .about-panels:before { transform:none!important; } }
      `}</style>
      <div className="about-wrap">
        <div className="about-intro" data-about-reveal>
          <div className="about-word" aria-hidden="true"><span key={reducedMotion ? 'static' : wordIndex}>{heroWords[reducedMotion ? 0 : wordIndex]}</span></div>
          <p className="about-kicker">About Navara</p>
          <h2>Clinical depth. A more personal kind of care.</h2>
          <p>Navara Behavioral Group began with a conviction: families deserve support that makes sense in the life they actually live. Behavioral science should help parents understand their child, make clear decisions, and respond with confidence. It should not leave them with a plan that only makes sense in a session.</p>
        </div>
        <div className="about-founder">
          <div className="about-photo" data-about-reveal>
            <img src={siteData.sections.team.founder.photo} alt="David Nisan Fetman" loading="lazy" />
            <p className="about-photo-caption"><strong>David Nisan Fetman<br /><span style={{ whiteSpace: 'nowrap' }}>MA, BCBA</span></strong>Founder &amp; Clinical Director</p>
          </div>
          <div data-about-reveal>
            <p className="about-kicker">The founder</p>
            <h2>Built from experience. Guided by connection.</h2>
            <p>David Nisan Fetman, MA, BCBA, known as Nisan, founded Navara after nearly a decade in behavioral healthcare. A Board Certified Behavior Analyst, clinical leader, and psychology doctoral candidate, he brings together behavioral science, clinical psychology, and a practical understanding of family life.</p>
            <p>He is pursuing a doctorate in psychology and a second master's degree in clinical psychopharmacology, while working toward the BCBA-D designation. That depth of training supports a simple conviction: connection comes before compliance.</p>
          </div>
        </div>
        <div className="about-vision" data-about-reveal>
          <div><p className="about-kicker">The vision</p><h2>Close the gap between expertise and everyday life.</h2></div>
          <div>
            <p>A family can receive sound clinical advice and still be left asking, "What do we do when this happens at home?" Navara was founded to close that gap. Our vision is to place parents at the center of care, bring clarity to complex behavior, and turn clinical understanding into practical support for daily life.</p>
            <p className="about-quote">We are building a practice around the family, rather than asking the family to fit a standard model.</p>
          </div>
        </div>
        <div className="about-different-header" data-about-reveal>
          <svg className="about-arcs" viewBox="0 0 160 92" aria-hidden="true">
            <path pathLength="1" d="M8 82 A72 72 0 0 1 152 82" stroke="#a7baa2" />
            <path pathLength="1" d="M28 82 A52 52 0 0 1 132 82" stroke="#6e9e9d" />
            <path pathLength="1" d="M48 82 A32 32 0 0 1 112 82" stroke={colors.primary} />
          </svg>
          <h2>What Makes Us Different?</h2>
          <p className="about-different-subtitle">Thoughtful by design. Personal in practice.</p>
        </div>
        <div className="about-panels" data-about-reveal>
          {differences.map(([title, text], index) => (
            <article className="about-panel" data-about-reveal key={title} style={{ '--reveal-delay': `${index * .09}s` }}>
              <span className="about-number">0{index + 1}</span><h3>{title}</h3><p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
export default AboutSection;
