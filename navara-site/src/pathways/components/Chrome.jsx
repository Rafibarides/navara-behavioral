import React, { useEffect, useRef, useState } from 'react';
import MainSiteFooter from '../../Components/Sections/FooterSection';
import MainSiteNav from '../../Components/NavBarMenu';

export function Arcs({ className }) {
  return (
    <svg className={className} viewBox="100 115 1170 245" aria-hidden="true">
      <path fill="#B1C9B3" d="M395 165 L482 151 L565 145 L639 145 L740 153 L817 165 L909 186 L1004 215 L1104 252 L1075 236 L1009 206 L915 172 L815 147 L737 135 L635 129 L556 132 L506 138 L456 147 Z"/>
      <path fill="#5F8D9C" d="M139 345 L206 305 L252 281 L304 258 L367 235 L439 215 L490 205 L557 196 L616 192 L692 192 L744 195 L826 205 L923 224 L1008 247 L1076 270 L1148 299 L1224 336 L1160 297 L1086 262 L1018 236 L945 213 L866 194 L788 181 L697 173 L617 173 L537 180 L476 190 L425 202 L361 222 L303 245 L245 274 L191 306 Z"/>
      <path fill="#1E324A" d="M276 347 L344 315 L387 298 L449 278 L502 264 L556 253 L618 244 L692 238 L776 238 L880 247 L985 266 L1102 299 L1232 348 L1170 316 L1116 293 L1065 274 L1000 254 L952 242 L888 230 L843 224 L775 219 L703 219 L634 224 L572 233 L504 248 L459 261 L397 283 L328 315 Z"/>
    </svg>
  );
}

export function Nav({ links, app }) {
  const ref = useRef(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onScroll = () => ref.current && ref.current.classList.toggle('scrolled', window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (mounted && !app) {
    return (
      <div className="pw-unified">
        <MainSiteNav isDarkMode={false} forceSolidPill />
        <div className="pw-subnav">
          <div className="wrap pw-subnav-inner">
            <a className="pw-subnav-tag" href="/pathways">Pathways</a>
            <div className="pw-subnav-links">{links}</div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <nav className={'nav' + (app ? ' app-nav' : '')} ref={ref} style={app ? { position: 'sticky' } : undefined}>
      <div className="wrap nav-inner">
        <a className="brand" href={app ? '/pathways' : '/'}>
          <Arcs className="" />
          <span className="brand-name">Navara<small>Pathways</small></span>
        </a>
        <div className="nav-links">{links}<a className="nav-phone" href="tel:+18777628272">877-7NAVARA</a></div>
      </div>
    </nav>
  );
}

export function Footer() {
  return (<>
    <MainSiteFooter isDarkMode={false} />
    <div style={{ background: '#1A2A40', color: 'rgba(255,255,255,.55)', fontSize: 12.5, lineHeight: 1.6, padding: '0 40px 34px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: 22 }}>
        Navara Pathways is not affiliated with, endorsed by, or sponsored by the Behavior Analyst Certification Board (BACB). RBT&reg;, BCBA&reg;, and BACB&reg; are registered certification marks of the BACB. This program offers preparation for the RBT and BCBA certification exams; it does not provide BACB supervision or fieldwork hours. All practice questions are original works of Navara Behavioral Group.
      </div>
    </div>
  </>);
}

// Wires scroll reveals, counters, progress bars, and rising headlines for any page.
export function usePathwaysEffects(deps = []) {
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    document.querySelectorAll('.rv').forEach((el) => io.observe(el));
    const co = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; co.unobserve(e.target);
      const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || '';
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = end.toLocaleString() + suf; return; }
      const t0 = performance.now(), dur = 1600;
      (function tick(t) { const p = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * ease).toLocaleString() + suf;
        if (p < 1) requestAnimationFrame(tick); })(t0);
    }), { threshold: 0.4 });
    document.querySelectorAll('[data-count]').forEach((el) => co.observe(el));
    const po = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.style.width = e.target.dataset.w + '%'; po.unobserve(e.target); }
    }), { threshold: 0.3 });
    document.querySelectorAll('.prog .bar i').forEach((el) => po.observe(el));
    document.querySelectorAll('[data-rise]').forEach((h) => {
      if (h.dataset.risen) return; h.dataset.risen = '1';
      let i = 0;
      const wrapWords = (node, inheritClass) => {
        if (node.nodeType === 3) {
          const frag = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const outer = document.createElement('span');
            outer.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:bottom';
            const inner = document.createElement('span');
            inner.className = inheritClass ? 'rise ' + inheritClass : 'rise';
            inner.style.animationDelay = (i++ * 0.09) + 's';
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          return frag;
        }
        if (node.nodeType === 1) {
          const frag = document.createDocumentFragment();
          const cls = (inheritClass ? inheritClass + ' ' : '') + (node.className || '');
          [...node.childNodes].forEach((c) => frag.appendChild(wrapWords(c, cls.trim())));
          return frag;
        }
        return document.createTextNode('');
      };
      const frag = document.createDocumentFragment();
      [...h.childNodes].forEach((n) => frag.appendChild(wrapWords(n, '')));
      h.innerHTML = '';
      h.appendChild(frag);
    });
    const t = setTimeout(() => {
      const st = document.createElement('style');
      st.textContent = '.rise,.qcard,.rv{animation:none!important;opacity:1!important;transform:none!important}';
      document.head.appendChild(st);
    }, 2500);
    return () => clearTimeout(t);
  }, deps);
}

export function SampleFlag() {
  return <span className="sample-flag">Sample questions - members unlock the full 1,000-question banks</span>;
}

export function Modal({ id, open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="modal-veil open" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{children}</p>
        <button className="btn btn-navy" style={{ justifyContent: 'center', width: '100%' }} onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}
