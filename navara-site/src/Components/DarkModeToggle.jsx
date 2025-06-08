import React from 'react';
import { getColors, getTextSizes } from '../utils/colorsAndText';

const DarkModeToggle = ({ isDarkMode, toggleDarkMode }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);

  console.log(colors);
  console.log(textSizes);

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
    }}>
      <i 
        className={isDarkMode ? 'fas fa-sun' : 'fas fa-moon'}
        onClick={toggleDarkMode}
        style={{
          fontSize: '20px',
          color: 'white',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08))',
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.filter = 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3))';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.filter = 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))';
        }}
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      />
    </div>
  );
};

export default DarkModeToggle; 