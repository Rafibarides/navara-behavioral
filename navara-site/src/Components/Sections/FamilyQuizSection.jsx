import React, { useEffect, useRef, useState } from 'react';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import CalendlyModal from '../CalendlyModal';
import { getColors, getTextSizes } from '../../utils/colorsAndText';

const questions = [
  { title: "What's hardest at home right now?", options: ['Meltdowns', 'Following directions and routines', 'Communication, play, social skills', 'Not sure, want a second opinion'] },
  { title: 'How often does it come up?', options: ['A few times a week', 'Most days', 'Many times a day'] },
  { title: 'How much is it affecting family life?', options: ['Some stress but we manage', 'Shapes a lot of our days', "We're worn out and need real help"] },
  { title: 'What would help most?', options: ['Advice on our situation', 'Tools I can learn as a parent', 'Hands-on support for my child'] },
  { title: 'How much time can you give each week?', options: ['An hour or two', 'A few hours, ready to learn', 'Support that fits around our routine'] },
];

const FamilyQuizSection = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const text = getTextSizes(isDarkMode);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [bookingOpen, setBookingOpen] = useState(false);
  const [responseReady, setResponseReady] = useState(false);
  const reduceMotion = useReducedMotion();
  const heading = useRef(null);
  const complete = step === questions.length;
  useEffect(() => {
    if (!complete) return;
    const timer = window.setTimeout(() => setResponseReady(true), 2000);
    return () => window.clearTimeout(timer);
  }, [complete]);

  useEffect(() => {
    if (responseReady) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }, [responseReady]);

  const buttonStyle = {
    font: 'inherit', fontWeight: 600, minHeight: 48, padding: '12px 22px',
    borderRadius: 12, border: 'none', cursor: 'pointer',
  };
  const moveTo = (nextStep) => {
    setResponseReady(false);
    setStep(nextStep);
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ behavior: 'instant', block: nextStep === questions.length ? 'start' : 'center' });
    });
  };

  return (
    <section id="family-quiz" aria-labelledby="family-quiz-title" style={{
      padding: '60px 20px', background: colors.background, color: colors.text,
      fontFamily: text.base.fontFamily,
    }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h2 id="family-quiz-title" style={{ color: colors.primary, fontSize: 'clamp(30px, 5vw, 36px)', textAlign: 'center', margin: '0 0 14px', lineHeight: 1.2 }}>
          Where should we start?
        </h2>
        <p style={{ fontSize: 17, lineHeight: 1.6, textAlign: 'center', maxWidth: 620, margin: '0 auto 32px', color: colors.textSecondary }}>
          Five quick questions, no wrong answers. Let's find a starting point for your family. No email needed.
        </p>
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 22, padding: 'clamp(20px, 4vw, 36px)', boxShadow: '0 8px 30px rgba(27,59,98,0.06)' }}>
          {complete && !responseReady ? (
            <div role="status" aria-live="polite" style={{ minHeight: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26 }}>
              <Motion.svg
                aria-hidden="true" viewBox="100 115 1170 245"
                style={{ width: 'min(240px, 80%)', height: 'auto', color: colors.primary }}
                animate={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: [0.35, 1, 0.35], scale: [0.97, 1.03, 0.97] }}
                transition={reduceMotion ? { duration: 0 } : { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <defs>
                  <mask id="quiz-navara-arcs" maskUnits="userSpaceOnUse" x="0" y="0" width="1369" height="839">
                    <image href="/logo-white.png" width="1369" height="839" />
                  </mask>
                </defs>
                <rect width="1369" height="839" fill="currentColor" mask="url(#quiz-navara-arcs)" />
              </Motion.svg>
              <p ref={heading} tabIndex={-1} style={{ color: colors.textSecondary, fontSize: 17, margin: 0, scrollMarginTop: 300 }}>
                One moment...
              </p>
            </div>
          ) : complete ? (
            <>
              <Motion.h3 ref={heading} tabIndex={-1}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ color: colors.primary, fontSize: 'clamp(30px, 5vw, 36px)', fontWeight: 700, textAlign: 'center', lineHeight: 1.3, margin: '0 0 20px', scrollMarginTop: 110 }}>
                We can help.
              </Motion.h3>
              <Motion.div initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.22 }}>
              <p style={{ fontSize: 17, lineHeight: 1.8, margin: '0 0 26px' }}>
                Based on your responses, we are definitely able to help. Options such as the Navara Behavior Method, Navara Direct ABA, and even a simple consulting session may be very helpful for you and your family. Please click below to schedule a 15-minute consultation, completely free of charge.
              </p>
              <button type="button" onClick={() => setBookingOpen(true)} style={{ ...buttonStyle, background: isDarkMode ? colors.primary : '#1B3B62', color: isDarkMode ? '#1A2A40' : '#FFFFFF', width: '100%', lineHeight: 1.5 }}>
                Schedule a free 15-minute consultation
              </button>
              <button type="button" onClick={() => { setAnswers({}); moveTo(0); }} style={{ ...buttonStyle, display: 'block', margin: '12px auto 0', background: 'transparent', color: colors.primary, textDecoration: 'underline' }}>
                Start again
              </button>
              </Motion.div>
            </>
          ) : (
            <>
              <p style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', margin: '0 0 16px' }}>Question {step + 1} of {questions.length}</p>
              <div aria-hidden="true" style={{ height: 5, background: colors.border, borderRadius: 5, marginBottom: 26 }}>
                <div style={{ height: '100%', width: `${((step + 1) / questions.length) * 100}%`, background: colors.primary, borderRadius: 5 }} />
              </div>
              <fieldset style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
                <legend ref={heading} tabIndex={-1} style={{ color: colors.primary, fontSize: 23, fontWeight: 600, lineHeight: 1.4, marginBottom: 20, padding: 0 }}>
                  {questions[step].title}
                </legend>
                <div style={{ display: 'grid', gap: 12 }}>
                  {questions[step].options.map((option, index) => (
                    <label key={`${step}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', minHeight: 48, boxSizing: 'border-box', borderRadius: 12, cursor: 'pointer', lineHeight: 1.6, border: `2px solid ${answers[step] === index ? colors.primary : colors.border}`, background: answers[step] === index ? (isDarkMode ? '#23344b' : '#edf3f8') : colors.surface }}>
                      <input type="radio" name={`family-question-${step}`} checked={answers[step] === index} onChange={() => setAnswers({ ...answers, [step]: index })} style={{ width: 18, height: 18, margin: 0, flexShrink: 0, accentColor: colors.primary }} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 26 }}>
                <button type="button" disabled={step === 0} onClick={() => moveTo(step - 1)} style={{ ...buttonStyle, background: 'transparent', color: colors.primary, opacity: step === 0 ? 0.4 : 1, cursor: step === 0 ? 'not-allowed' : 'pointer' }}>Back</button>
                <button type="button" disabled={answers[step] === undefined} onClick={() => moveTo(step + 1)} style={{ ...buttonStyle, background: isDarkMode ? colors.primary : '#1B3B62', color: isDarkMode ? '#1A2A40' : '#FFFFFF', opacity: answers[step] === undefined ? 0.45 : 1, cursor: answers[step] === undefined ? 'not-allowed' : 'pointer' }}>
                  {step === questions.length - 1 ? 'See our response' : 'Next'}
                </button>
              </div>
            </>
          )}
          <p style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 1.6, margin: '22px 0 0' }}>A friendly guide, not an assessment. Your answers stay on this page and are not sent to us.</p>
        </div>
      </div>
      <CalendlyModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} isDarkMode={isDarkMode} />
    </section>
  );
};

export default FamilyQuizSection;
