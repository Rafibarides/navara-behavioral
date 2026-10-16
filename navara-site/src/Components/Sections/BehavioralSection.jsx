import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getColors, getTextSizes } from '../../utils/colorsAndText';

const PHASES = [
  { n: 1, name: 'Connection', weeks: 'Weeks 1-3', line: 'Think like a developmental psychologist. Calm and trust first, because strategy fails a dysregulated child.', color: '#B1C9B3', ink: '#1E324A' },
  { n: 2, name: 'Clarity', weeks: 'Weeks 4-7', line: 'Think like a behavior analyst. Learn what your child\u2019s behavior is really telling you.', color: '#5F8D9C', ink: '#FFFFFF' },
  { n: 3, name: 'Control', weeks: 'Weeks 8-10', line: 'Put your plan to work in the home you actually have, with support.', color: '#1E324A', ink: '#FFFFFF' },
  { n: 4, name: 'Carryover', weeks: 'Weeks 11-12', line: 'Make it last: school, grandparents, and the bad weeks.', color: 'linear-gradient(135deg, #B1C9B3, #5F8D9C 55%, #1E324A)', ink: '#FFFFFF' },
];

const BehavioralSection = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.12, ease: 'easeOut' } }),
  };

  return (
    <section
      id="behavior-method"
      style={{ backgroundColor: colors.background, width: '100vw', padding: isMobile ? '64px 20px' : '88px 20px', margin: 0, boxSizing: 'border-box' }}
    >
      <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center' }}>
        <svg aria-hidden="true" viewBox="100 115 1170 245" style={{ width: 'min(200px, 55%)', height: 'auto', marginBottom: 18 }}>
          <path fill="#B1C9B3" d="M395 165 L482 151 L565 145 L639 145 L740 153 L817 165 L909 186 L1004 215 L1104 252 L1075 236 L1009 206 L915 172 L815 147 L737 135 L635 129 L556 132 L506 138 L456 147 Z" />
          <path fill="#5F8D9C" d="M139 345 L206 305 L252 281 L304 258 L367 235 L439 215 L490 205 L557 196 L616 192 L692 192 L744 195 L826 205 L923 224 L1008 247 L1076 270 L1148 299 L1224 336 L1160 297 L1086 262 L1018 236 L945 213 L866 194 L788 181 L697 173 L617 173 L537 180 L476 190 L425 202 L361 222 L303 245 L245 274 L191 306 Z" />
          <path fill="#1E324A" d="M276 347 L344 315 L387 298 L449 278 L502 264 L556 253 L618 244 L692 238 L776 238 L880 247 L985 266 L1102 299 L1232 348 L1170 316 L1116 293 L1065 274 L1000 254 L952 242 L888 230 L843 224 L775 219 L703 219 L634 224 L572 233 L504 248 L459 261 L397 283 L328 315 Z" />
        </svg>

        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
          style={{ fontSize: isMobile ? textSizes['3xl'].fontSize : textSizes['4xl'].fontSize, fontFamily: textSizes['4xl'].fontFamily, color: colors.primary, fontWeight: 700, margin: '0 0 14px' }}>
          The Navara Behavior Method&trade;
        </motion.h2>
        <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
          style={{ maxWidth: 720, margin: '0 auto 44px', fontSize: textSizes.lg.fontSize, fontFamily: textSizes.lg.fontFamily, color: colors.text, lineHeight: 1.7 }}>
          A 12-week program that uses four phases to train <strong>YOU</strong>, the parent, to think like a BCBA and a developmental psychologist.</motion.p>

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: isMobile ? 18 : 22, textAlign: 'left' }}>
                    {PHASES.map((p, i) => (
            <motion.div key={p.name} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              style={{ position: 'relative', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 18, padding: '22px 20px 24px', boxShadow: '0 8px 26px rgba(27,59,98,0.07)', overflow: 'hidden', display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: isMobile ? 16 : 0, alignItems: isMobile ? 'flex-start' : 'stretch' }}>
              <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: p.color }} />
              <div style={{ width: 52, height: 52, flex: '0 0 52px', borderRadius: '50%', background: p.color, color: p.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, fontFamily: textSizes.lg.fontFamily, marginBottom: isMobile ? 0 : 16, boxShadow: '0 0 0 5px ' + colors.surface }}>
                {p.n}
              </div>
              <div>
                <div style={{ fontSize: textSizes.xl.fontSize, fontFamily: textSizes.xl.fontFamily, fontWeight: 700, color: colors.primary }}>{p.name}</div>
                <div style={{ fontSize: textSizes.xs.fontSize, fontFamily: textSizes.xs.fontFamily, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, margin: '2px 0 10px' }}>{p.weeks}</div>
                <p style={{ margin: 0, fontSize: textSizes.sm.fontSize, fontFamily: textSizes.sm.fontFamily, color: colors.text, lineHeight: 1.65 }}>{p.line}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
          <Link
            to="/services/behavior-method"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: isDarkMode ? colors.primary : '#1B3B62', color: isDarkMode ? '#1A2A40' : '#FFFFFF', padding: '14px 28px', borderRadius: 12, textDecoration: 'none', fontSize: textSizes.lg.fontSize, fontFamily: textSizes.lg.fontFamily, fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}
          >
            Learn More
            <i className="fas fa-arrow-right" style={{ fontSize: 16 }} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default BehavioralSection;
