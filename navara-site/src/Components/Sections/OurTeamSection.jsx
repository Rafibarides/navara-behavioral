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
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
      style={{
        appearance: 'none', background: 'transparent', border: 'none', borderRadius: '16px',
        padding: '12px 8px', color: colors.text, fontFamily: textSizes.base.fontFamily,
        textAlign: 'center', cursor: 'pointer', width: '100%', maxWidth: isFounder ? '340px' : '240px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gridColumn: isMobile && memberIndex === members.length - 1 && members.length % 2 === 1 ? '1 / -1' : undefined,
        transition: 'transform 180ms ease',
      }}
    >
      <span style={{
        width: isFounder ? '156px' : (isMobile ? '112px' : '136px'),
        height: isFounder ? '156px' : (isMobile ? '112px' : '136px'),
        display: 'block', overflow: 'hidden', borderRadius: '50%', border: `4px solid ${colors.surface}`,
        boxShadow: '0 5px 18px rgba(0,0,0,0.10)', marginBottom: '18px',
      }}>
        <img src={staff.photo} alt={staff.name} loading="lazy" decoding="async" style={{
          width: '100%', height: '100%', display: 'block', objectFit: 'cover',
          objectPosition: staff.name.startsWith('Sarah') ? 'center 15%' : 'center',
          transform: staff.name.startsWith('Sarah') ? 'translateX(8px) scale(1.16)' : 'none',
        }} />
      </span>
      <span style={{ fontSize: isFounder ? (isMobile ? '15px' : '17px') : (isMobile ? '16px' : '18px'), fontWeight: 700, lineHeight: 1.4, marginBottom: '6px', whiteSpace: isFounder ? 'nowrap' : 'normal' }}>
        {staff.name}
      </span>
      <span style={{ fontSize: isMobile ? '14px' : '15px', color: colors.primary, lineHeight: 1.5 }}>
        {staff.position}
      </span>
    </button>
  );

  return (
    <>
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
            <p style={{ fontFamily: textSizes.base.fontFamily, fontSize: '14px', color: colors.textSecondary, margin: '14px 0 0' }}>Click on a profile to read the bio.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: isMobile ? '28px' : '40px' }}>{person(founder, true)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))', gap: isMobile ? '24px 12px' : '24px', justifyItems: 'center', alignItems: 'start' }}>
            {members.map((member, index) => person(member, false, index))}
          </div>
        </div>
      </section>
      {selectedStaff && <StaffModal staff={selectedStaff} isDarkMode={isDarkMode} onClose={() => setSelectedStaff(null)} />}
    </>
  );
};

export default OurTeamSection;
