import React, { useState, useEffect } from 'react';
import { getColors, getTextSizes } from '../../utils/colorsAndText';

const WelcomeSection = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);

  // Array of welcome phrases
  const welcomePhrases = [
    "We are here to help",
    "Change starts here",
    "Your journey begins now",
    "Supporting families forward",
    "Building brighter futures",
    "Empowering growth together"
  ];

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Start fade out
      setIsVisible(false);
      
      // After fade out completes, change text and fade in
      setTimeout(() => {
        setCurrentPhraseIndex((prevIndex) => 
          (prevIndex + 1) % welcomePhrases.length
        );
        setIsVisible(true);
      }, 500); // Half second for fade out
      
    }, 4000); // Change phrase every 4 seconds

    return () => clearInterval(interval);
  }, [welcomePhrases.length]);

  return (
    <section 
      id="welcome-section"
      style={{
        position: 'relative',
        height: '50vh',
        minHeight: '400px',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        margin: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 1,
        }}
      >
        <source src="assets/background-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Dark blue overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: `${colors.secondary}D9`, // Dark blue with 70% opacity
        zIndex: 1,
      }} />

      {/* Logo in top left corner */}
      <img 
        src="/assets/logo-white.png" 
        alt="Navara Logo"
        style={{
          position: 'absolute',
          top: '20px',
          left: '2rem',
          height: '50px',
          width: 'auto',
          zIndex: 3,
        }}
      />

      {/* Content Overlay */}
      <div style={{
        position: 'relative',
        zIndex: 3,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Animated Welcome Text */}
        <h1 style={{ 
          fontSize: textSizes['4xl'].fontSize,
          fontFamily: textSizes['4xl'].fontFamily,
          margin: 0,
          textAlign: 'center',
          color: 'white',
          fontWeight: '700',
          letterSpacing: '0.02em',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.5s ease-in-out',
          minHeight: '1.2em', // Prevent layout shift during transitions
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {welcomePhrases[currentPhraseIndex]}
        </h1>
      </div>
    </section>
  );
};

export default WelcomeSection;
