import React from 'react';
import { getColors, getTextSizes } from '../../utils/colorsAndText';

// Preview-only entry point to Navara Pathways. Renders only with ?preview=1.
// Do not ungate without Nisan's approval.
const PathwaysPreviewBand = ({ isDarkMode = false }) => {
  if (typeof window === 'undefined' || !/[?&]preview=1\b/.test(window.location.search)) return null;
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  return (
    <section style={{
      width: '100%', padding: '44px 24px',
      background: 'linear-gradient(120deg, rgba(27,59,98,.06), rgba(95,141,156,.12))',
      boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: 980, margin: '0 auto', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 24, flexWrap: 'wrap',
      }}>
        <div style={{ flex: '1 1 320px' }}>
          <p style={{
            fontSize: textSizes.xl.fontSize, fontFamily: textSizes.xl.fontFamily,
            fontWeight: 700, color: colors.secondary, margin: '0 0 6px',
          }}>Interested in the ABA field?</p>
          <p style={{
            fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily,
            color: colors.text, margin: 0, lineHeight: 1.55,
          }}>Studying for the RBT or BCBA exam? Explore Navara's resources.</p>
        </div>
        <a href="/pathways" style={{
          display: 'inline-block', padding: '13px 26px', borderRadius: 999,
          background: colors.secondary, color: '#fff', fontWeight: 700,
          fontSize: textSizes.base.fontSize, textDecoration: 'none',
          boxShadow: '0 10px 24px -10px rgba(27,59,98,.5)', whiteSpace: 'nowrap',
        }}>Explore Navara Pathways</a>
      </div>
    </section>
  );
};

export default PathwaysPreviewBand;
