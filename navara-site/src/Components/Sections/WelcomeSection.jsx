import React from 'react';
import { getColors, getTextSizes } from '../../utils/colorsAndText';

const WelcomeSection = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);

  return (
    <section 
      style={{
        backgroundColor: colors.surface,
        color: colors.text,
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        margin: 0,
        boxSizing: 'border-box',
      }}
    >
      <h1 style={{ 
        fontSize: textSizes['5xl'], 
        margin: 0,
        textAlign: 'center',
        color: colors.primary,
        fontWeight: '700',
      }}>
        Hello World
      </h1>
    </section>
  );
};

export default WelcomeSection;
