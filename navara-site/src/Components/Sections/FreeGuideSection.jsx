import React from 'react';
import { getColors } from '../../utils/colorsAndText';

const FreeGuideSection = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  return (
    <section
      id="free-parent-guide"
      style={{
        backgroundColor: colors.background,
        width: '100vw',
        padding: '80px 20px',
        margin: 0,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(28px, 5vw, 56px)',
        }}
      >
        <a
          href="/navara-parent-guide.pdf"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open the free parent guide PDF"
          style={{ flexShrink: 0 }}
        >
          <img
            src="/navara-parent-guide-cover.png"
            alt="Cover of the free Navara parent guide: Calmer days at home, one small step at a time"
            style={{
              width: 'min(300px, 74vw)',
              borderRadius: 12,
              boxShadow: '0 14px 40px rgba(27,59,98,0.25)',
              display: 'block',
            }}
          />
        </a>
        <div style={{ maxWidth: 460, textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: 999,
              background: '#CBD9C5',
              color: '#1A2A40',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.12em',
              marginBottom: 16,
            }}
          >
            FREE PARENT GUIDE
          </div>
          <h2
            style={{
              color: colors.text,
              fontSize: 'clamp(26px, 4vw, 36px)',
              fontWeight: 700,
              lineHeight: 1.25,
              margin: '0 0 14px',
            }}
          >
            Calmer days at home, one small step at a time.
          </h2>
          <p
            style={{
              color: colors.textSecondary,
              fontSize: 16,
              lineHeight: 1.7,
              margin: '0 0 26px',
            }}
          >
            Five practical steps with short scripts, everyday examples, and a
            one-routine worksheet. A gentle starting point for parents of young
            children, from Navara Behavioral Group.
          </p>
          <a
            href="/navara-parent-guide.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '15px 30px',
              borderRadius: 999,
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: 700,
              textDecoration: 'none',
              minHeight: 48,
              boxSizing: 'border-box',
            }}
          >
            Download the free guide
          </a>
          <p
            style={{
              color: colors.textSecondary,
              fontSize: 13,
              margin: '14px 0 0',
            }}
          >
            Free PDF. No email or sign-up needed.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FreeGuideSection;
