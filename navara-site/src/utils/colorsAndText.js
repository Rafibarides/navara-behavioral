// Color system with light and dark mode variants
export const getColors = (isDarkMode = false) => {
  if (isDarkMode) {
    return {
      primary: '#4A6FA5',        // Lighter version of #1B3B62
      secondary: '#3D4F73',      // Lighter version of #1A2A40
      accent: '#A8C4A0',         // Slightly darker version of #CBD9C5
      background: '#1A1A1A',     // Dark background
      surface: '#2D2D2D',        // Dark surface
      text: '#F2F2F2',           // Light text
      textSecondary: '#B0B0B0',  // Secondary text
      border: '#404040',         // Dark border
    };
  } else {
    return {
      primary: '#1B3B62',        // Original dark blue
      secondary: '#1A2A40',      // Original darker blue
      accent: '#CBD9C5',         // Original light green/sage
      background: '#F2F2F2',     // Original light gray
      surface: '#FFFFFF',        // Pure white for surfaces
      text: '#1A2A40',           // Dark text
      textSecondary: '#595959',  // Original medium gray
      border: '#E0E0E0',         // Light border
    };
  }
};

// Text size system with responsive variants
export const getTextSizes = (isDarkMode = false) => {
  const baseSize = isDarkMode ? 1.02 : 1; // Slightly larger text in dark mode for readability
  
  return {
    xs: `${0.75 * baseSize}rem`,      // 12px
    sm: `${0.875 * baseSize}rem`,     // 14px
    base: `${1 * baseSize}rem`,       // 16px
    lg: `${1.125 * baseSize}rem`,     // 18px
    xl: `${1.25 * baseSize}rem`,      // 20px
    '2xl': `${1.5 * baseSize}rem`,    // 24px
    '3xl': `${1.875 * baseSize}rem`,  // 30px
    '4xl': `${2.25 * baseSize}rem`,   // 36px
    '5xl': `${3 * baseSize}rem`,      // 48px
    '6xl': `${3.75 * baseSize}rem`,   // 60px
  };
};

// Convenience function to get complete theme
export const getTheme = (isDarkMode = false) => ({
  colors: getColors(isDarkMode),
  textSizes: getTextSizes(isDarkMode),
  isDarkMode,
});

// Export individual color values for easy access
export const COLORS = {
  light: getColors(false),
  dark: getColors(true),
};

export const TEXT_SIZES = {
  light: getTextSizes(false),
  dark: getTextSizes(true),
};
