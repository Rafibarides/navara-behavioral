import React, { useState, useEffect, useRef } from 'react';
import { getColors, getTextSizes } from '../../utils/colorsAndText';

const AboutSection = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [isDifferentSectionVisible, setIsDifferentSectionVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPermanentlyExpanded, setIsPermanentlyExpanded] = useState(false);
  const [typedText, setTypedText] = useState('');
  const sectionRef = useRef(null);

  // Array of words to cycle through
  const heroWords = ["Clarity.", "Direction.", "Change."];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Text to type out
  const fullText = "What Makes Us Different?";

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cycle through words
  useEffect(() => {
    const interval = setInterval(() => {
      // Start fade out
      setIsVisible(false);
      
      // After fade out completes, change word and fade in
      setTimeout(() => {
        setCurrentWordIndex((prevIndex) => 
          (prevIndex + 1) % heroWords.length
        );
        setIsVisible(true);
      }, 400); // Fade out duration
      
    }, 2500); // Change word every 2.5 seconds

    return () => clearInterval(interval);
  }, [heroWords.length]);

  // Typing animation for "What Makes Us Different?"
  useEffect(() => {
    if (isDifferentSectionVisible && typedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(fullText.slice(0, typedText.length + 1));
      }, 80); // Typing speed
      
      return () => clearTimeout(timeout);
    }
  }, [isDifferentSectionVisible, typedText, fullText]);

  // Intersection Observer for content animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsContentVisible(true);
            // Start typing animation after main content appears
            setTimeout(() => {
              setIsDifferentSectionVisible(true);
            }, 800);
          } else {
            // Reset when section leaves view
            setIsContentVisible(false);
            setIsDifferentSectionVisible(false);
            setIsHovered(false);
            setIsPermanentlyExpanded(false);
            setTypedText('');
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    setIsPermanentlyExpanded(true);
  };

  const shouldShowContent = isHovered || isPermanentlyExpanded;

  return (
    <section 
      id="about"
      ref={sectionRef}
      style={{
        backgroundColor: colors.surface,
        width: '100vw',
        padding: isMobile ? '80px 20px' : '120px 40px',
        margin: 0,
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        textAlign: 'center',
      }}>
        {/* Animated Hero Tagline */}
        <div style={{
          marginBottom: isMobile ? '60px' : '80px',
          minHeight: isMobile ? '80px' : '120px', // Prevent layout shift
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <h1 style={{
            fontSize: isMobile ? textSizes['4xl'].fontSize : textSizes['6xl'].fontSize,
            fontFamily: isMobile ? textSizes['4xl'].fontFamily : textSizes['6xl'].fontFamily,
            color: colors.primary,
            fontWeight: '800',
            lineHeight: '1.1',
            margin: 0,
            letterSpacing: '-0.02em',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.4s ease-in-out',
          }}>
            {heroWords[currentWordIndex]}
          </h1>
        </div>

        {/* Main Content with Animation */}
        <div style={{
          marginBottom: isMobile ? '60px' : '80px',
          textAlign: 'left',
        }}>
          <p style={{
            fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
            fontFamily: isMobile ? textSizes.lg.fontFamily : textSizes.xl.fontFamily,
            color: colors.text,
            lineHeight: '1.7',
            marginBottom: '32px',
            opacity: isContentVisible ? 1 : 0,
            transform: isContentVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease-out 0.2s', // 0.2s delay
          }}>
            Navara was founded to bridge the gap between families and the support they actually need. We provide high-quality diagnostic evaluations, evidence-based behavior support, and guided career exploration—all under one streamlined, client-focused model.
          </p>

          <p style={{
            fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
            fontFamily: isMobile ? textSizes.lg.fontFamily : textSizes.xl.fontFamily,
            color: colors.text,
            lineHeight: '1.7',
            margin: 0,
            opacity: isContentVisible ? 1 : 0,
            transform: isContentVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease-out 0.4s', // 0.4s delay for stagger effect
          }}>
            We exist to simplify the process of getting help. Whether it's understanding a child's development, managing challenging behaviors, or navigating early career decisions, our goal is to give families and young adults the tools, clarity, and confidence they need to move forward.
          </p>
        </div>

        {/* Interactive What Makes Us Different Section */}
        <div style={{
          backgroundColor: colors.accent + '15',
          borderRadius: '20px',
          padding: isMobile ? '40px 30px' : '60px 50px',
          border: `1px solid ${colors.accent + '30'}`,
          opacity: isDifferentSectionVisible ? 1 : 0,
          transform: isDifferentSectionVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s ease-out 0.6s', // 0.6s delay
          cursor: isPermanentlyExpanded ? 'default' : 'pointer',
          overflow: 'hidden',
        }}>
          <h2 
            style={{
              fontSize: isMobile ? textSizes['2xl'].fontSize : textSizes['3xl'].fontSize,
              fontFamily: isMobile ? textSizes['2xl'].fontFamily : textSizes['3xl'].fontFamily,
              color: colors.primary,
              fontWeight: '700',
              marginBottom: shouldShowContent ? '24px' : '0',
              textAlign: 'center',
              transition: 'all 0.4s ease-out',
              position: 'relative',
            }}
            onMouseEnter={() => !isPermanentlyExpanded && setIsHovered(true)}
            onMouseLeave={() => !isPermanentlyExpanded && setIsHovered(false)}
            onClick={handleClick}
          >
            {typedText}
            {typedText.length < fullText.length && (
              <span style={{
                opacity: Math.sin(Date.now() / 500) > 0 ? 1 : 0,
                transition: 'opacity 0.1s',
                color: colors.primary,
              }}>|</span>
            )}
          </h2>

          <div style={{
            maxHeight: shouldShowContent ? '200px' : '0',
            opacity: shouldShowContent ? 1 : 0,
            transition: 'all 0.6s ease-out',
            overflow: 'hidden',
          }}>
            <p style={{
              fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
              fontFamily: isMobile ? textSizes.base.fontFamily : textSizes.lg.fontFamily,
              color: colors.text,
              lineHeight: '1.7',
              margin: 0,
              textAlign: 'left',
              transform: shouldShowContent ? 'translateY(0)' : 'translateY(20px)',
              transition: 'transform 0.4s ease-out 0.2s',
            }}>
              We don't believe in long waitlists, cookie-cutter solutions, or overly complicated systems. At Navara, you get direct access to licensed professionals, concise communication, and actionable plans that actually work—because we know your time and trust matter.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
