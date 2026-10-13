import React, { useState, useEffect } from 'react';
import { getColors, getTextSizes } from '../../utils/colorsAndText';
import StaffModal from '../StaffModal';
import siteData from '../../../SiteData.json';

const OurTeamSection = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const { title, subtext, founder, divisions } = siteData.sections.team;
  const members = divisions.filter(division => division.title !== 'Nutrition').flatMap(division => division.members);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const person = (staff, isFounder = false, memberIndex = -1) => (
    <button
      key={staff.name}
      type="button"
      aria-label={`Read ${staff.name}'s biography`}
      onClick={() => setSelectedStaff(staff)}
      className="navara-team-card"
      style={{
        appearance: 'none', background: 'transparent', border: 'none', borderRadius: '16px',
        padding: '12px 8px', color: colors.text, fontFamily: textSizes.base.fontFamily,
        textAlign: 'center', cursor: 'pointer', width: '100%', maxWidth: isFounder ? '340px' : '240px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gridColumn: isMobile && memberIndex === members.length - 1 && members.length % 2 === 1 ? '1 / -1' : undefined,
        '--team-accent': colors.primary,
      }}
    >
      <span style={{
        width: isFounder ? '156px' : (isMobile ? '112px' : '136px'),
        height: isFounder ? '156px' : (isMobile ? '112px' : '136px'),
        display: 'block', overflow: 'hidden', borderRadius: '50%', border: `4px solid ${colors.surface}`,
        boxShadow: '0 5px 18px rgba(0,0,0,0.10)', marginBottom: '18px',
      }}>
        <img className="navara-team-portrait" src={staff.photo} alt={staff.name} loading="lazy" decoding="async" style={{
          width: '100%', height: '100%', display: 'block', objectFit: 'cover',
          objectPosition: 'center',
          transform: 'none',
        }} />
      </span>
      <span style={{ fontSize: isFounder ? (isMobile ? '15px' : '17px') : (isMobile ? '16px' : '18px'), fontWeight: 700, lineHeight: 1.4, marginBottom: '6px', whiteSpace: isFounder ? 'nowrap' : 'normal' }}>
        {staff.name}
      </span>
      <span style={{ fontSize: isMobile ? '14px' : '15px', color: colors.primary, lineHeight: 1.5 }}>
        {staff.position}
      </span>
      <span aria-hidden="true" className="navara-team-bio-hint" style={{ color: colors.primary }}>
        <span className="navara-team-click-hint">Click to read bio</span>
        <span className="navara-team-tap-hint">Tap to read bio</span>
        <span style={{ marginLeft: '6px' }}>↗</span>
      </span>
    </button>
  );

  return (
    <>
      <style>{`
        .navara-team-card { transition: transform 220ms ease; }
        .navara-team-portrait { transition: filter 220ms ease; }
        .navara-team-bio-hint {
          display: block; margin-top: 12px; font-size: 12px; font-weight: 600;
          letter-spacing: 0.025em; line-height: 1.5;
          transition: opacity 180ms ease;
        }
        .navara-team-click-hint { display: none; }
        .navara-team-card:focus-visible {
          outline: 2px solid var(--team-accent); outline-offset: 4px;
          transform: translateY(-6px);
        }
        .navara-team-profiles:has(.navara-team-card:focus-visible)
          .navara-team-card:not(:focus-visible) .navara-team-portrait { filter: grayscale(1); }
        @media (hover: hover) and (pointer: fine) {
          .navara-team-bio-hint { opacity: 0; }
          .navara-team-click-hint { display: inline; }
          .navara-team-tap-hint { display: none; }
          .navara-team-card:hover { transform: translateY(-6px); }
          .navara-team-card:hover .navara-team-bio-hint,
          .navara-team-card:focus-visible .navara-team-bio-hint { opacity: 1; }
          .navara-team-profiles:has(.navara-team-card:hover)
            .navara-team-card:not(:hover):not(:focus-visible) .navara-team-portrait { filter: grayscale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .navara-team-card, .navara-team-portrait, .navara-team-bio-hint { transition: none; }
          .navara-team-card:hover, .navara-team-card:focus-visible { transform: none; }
        }
      `}</style>
      <section id="team" style={{ backgroundColor: colors.background, width: '100%', padding: isMobile ? '64px 20px' : '96px 40px', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <svg aria-hidden="true" viewBox="0 0 700 150" style={{ width: '104px', height: '26px', display: 'block', margin: '0 auto 18px' }}>
              <path d="M155 32 Q365 -48 625 91 Q382 -25 155 32Z" fill="#A7BDA9" />
              <path d="M0 145 Q329 -85 700 145 Q337 -57 0 145Z" fill="#56898C" />
              <path d="M90 145 Q378 -19 700 145 Q388 3 90 145Z" fill="#1B3B62" />
            </svg>

            <h2 style={{ fontFamily: textSizes.base.fontFamily, fontSize: isMobile ? '30px' : '36px', color: colors.primary, margin: '0 0 16px', fontWeight: 700, letterSpacing: '0.05em' }}>Meet the Team</h2>
            <p style={{ fontFamily: textSizes.base.fontFamily, fontSize: '18px', color: colors.textSecondary, lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>{subtext}</p>
          </div>
          <div className="navara-team-profiles">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: isMobile ? '28px' : '40px' }}>{person(founder, true)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))', gap: isMobile ? '24px 12px' : '24px', justifyItems: 'center', alignItems: 'start' }}>
            {members.map((member, index) => person(member, false, index))}
          </div>
          </div>
        </div>
      </section>
      {selectedStaff && <StaffModal staff={selectedStaff} isDarkMode={isDarkMode} onClose={() => setSelectedStaff(null)} />}
    </>
  );
};

export default OurTeamSection;
