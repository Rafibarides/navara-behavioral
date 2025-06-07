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
      primary: '#1B3B62',        // Deep blue
      secondary: '#1A2A40',      // Darker blue
      accent: '#CBD9C5',         // Light green
      background: '#F2F2F2',     // Light gray background
      surface: '#FFFFFF',        // White surface
      text: '#595959',           // Dark gray text
      textSecondary: '#808080',  // Medium gray
      border: '#E0E0E0',         // Light border
    };
  }
};

// Text size system with consistent font family
export const getTextSizes = (isDarkMode = false) => {
  const baseFont = "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  
  if (isDarkMode) {
    return {
      xs: { fontSize: '12px', fontFamily: baseFont },
      sm: { fontSize: '14px', fontFamily: baseFont },
      base: { fontSize: '16px', fontFamily: baseFont },
      lg: { fontSize: '18px', fontFamily: baseFont },
      xl: { fontSize: '20px', fontFamily: baseFont },
      '2xl': { fontSize: '24px', fontFamily: baseFont },
      '3xl': { fontSize: '30px', fontFamily: baseFont },
      '4xl': { fontSize: '36px', fontFamily: baseFont },
      '5xl': { fontSize: '48px', fontFamily: baseFont },
      '6xl': { fontSize: '60px', fontFamily: baseFont }
    };
  } else {
    return {
      xs: { fontSize: '12px', fontFamily: baseFont },
      sm: { fontSize: '14px', fontFamily: baseFont },
      base: { fontSize: '16px', fontFamily: baseFont },
      lg: { fontSize: '18px', fontFamily: baseFont },
      xl: { fontSize: '20px', fontFamily: baseFont },
      '2xl': { fontSize: '24px', fontFamily: baseFont },
      '3xl': { fontSize: '30px', fontFamily: baseFont },
      '4xl': { fontSize: '36px', fontFamily: baseFont },
      '5xl': { fontSize: '48px', fontFamily: baseFont },
      '6xl': { fontSize: '60px', fontFamily: baseFont }
    };
  }
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
