import React, { useState, useEffect } from 'react';
import { getColors, getTextSizes } from '../../utils/colorsAndText';

const AboutSection = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section style={{
      backgroundColor: colors.surface,
      width: '100vw',
      padding: isMobile ? '80px 20px' : '120px 40px',
      margin: 0,
      boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        textAlign: 'center',
      }}>
        {/* Hero Tagline */}
        <div style={{
          marginBottom: isMobile ? '60px' : '80px',
        }}>
          <h1 style={{
            fontSize: isMobile ? textSizes['4xl'] : textSizes['6xl'],
            color: colors.primary,
            fontWeight: '800',
            lineHeight: '1.1',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            Clarity. Direction. Change.
          </h1>
        </div>

        {/* Main Content */}
        <div style={{
          marginBottom: isMobile ? '60px' : '80px',
          textAlign: 'left',
        }}>
          <p style={{
            fontSize: isMobile ? textSizes.lg : textSizes.xl,
            color: colors.text,
            lineHeight: '1.7',
            marginBottom: '32px',
          }}>
            Navara was founded to bridge the gap between families and the support they actually need. We provide high-quality diagnostic evaluations, evidence-based behavior support, and guided career exploration—all under one streamlined, client-focused model.
          </p>

          <p style={{
            fontSize: isMobile ? textSizes.lg : textSizes.xl,
            color: colors.text,
            lineHeight: '1.7',
            margin: 0,
          }}>
            We exist to simplify the process of getting help. Whether it's understanding a child's development, managing challenging behaviors, or navigating early career decisions, our goal is to give families and young adults the tools, clarity, and confidence they need to move forward.
          </p>
        </div>

        {/* What Makes Us Different Section */}
        <div style={{
          backgroundColor: colors.accent + '15',
          borderRadius: '20px',
          padding: isMobile ? '40px 30px' : '60px 50px',
          border: `1px solid ${colors.accent + '30'}`,
        }}>
          <h2 style={{
            fontSize: isMobile ? textSizes['2xl'] : textSizes['3xl'],
            color: colors.primary,
            fontWeight: '700',
            marginBottom: '24px',
            textAlign: 'center',
          }}>
            What Makes Us Different
          </h2>

          <p style={{
            fontSize: isMobile ? textSizes.base : textSizes.lg,
            color: colors.text,
            lineHeight: '1.7',
            margin: 0,
            textAlign: 'left',
          }}>
            We don't believe in long waitlists, cookie-cutter solutions, or overly complicated systems. At Navara, you get direct access to licensed professionals, concise communication, and actionable plans that actually work—because we know your time and trust matter.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
