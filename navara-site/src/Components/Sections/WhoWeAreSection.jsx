import React, { useState, useEffect } from 'react';
import { getColors, getTextSizes } from '../../utils/colorsAndText';

const WhoWeAreSection = ({ isDarkMode = false }) => {
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

  // Dynamic array for strips - easily expandable
  const strips = [
    {
      photo: '/src/assets/NAVARA7.jpg',
      title: 'Who We Are',
      text: 'Navara was founded to bridge the gap between families and the support they actually need. We provide high-quality diagnostic evaluations, evidence-based behavior support, and guided career exploration, all under one streamlined, client-focused model.'
    },
    {
      photo: '/src/assets/NAVARA8.jpg',
      title: 'We exist to simplify the process',
      text: 'Whether it\'s understanding a child\'s development, managing challenging behaviors, or navigating early career decisions, our goal is to give families and young adults the tools, clarity, and confidence they need to move forward.'
    }
  ];

  // Mobile Layout - Text-Pic-Text-Pic sandwich
  if (isMobile) {
    return (
      <section style={{
        backgroundColor: colors.background,
        width: '100vw',
        padding: '40px 0',
      }}>
        {strips.map((strip, index) => (
          <div key={index}>
            {/* Text Section */}
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                maxWidth: '600px',
                margin: '0 auto',
              }}
            >
              <h2
                style={{
                  fontSize: textSizes['2xl'],
                  color: colors.primary,
                  marginBottom: '24px',
                  fontWeight: '700',
                  lineHeight: '1.2',
                }}
              >
                {strip.title}
              </h2>
              <p
                style={{
                  fontSize: textSizes.base,
                  color: colors.text,
                  lineHeight: '1.6',
                  margin: 0,
                }}
              >
                {strip.text}
              </p>
            </div>

            {/* Photo Section */}
            <div
              style={{
                padding: '0 20px 40px 20px',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <img
                src={strip.photo}
                alt={strip.title}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  height: '300px',
                  objectFit: 'cover',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                }}
              />
            </div>
          </div>
        ))}
      </section>
    );
  }

  // Desktop Layout - Alternating sides
  return (
    <section style={{
      backgroundColor: colors.background,
      width: '100vw',
      padding: '60px 0',
      margin: 0,
      boxSizing: 'border-box',
      overflowX: 'hidden', // Prevent horizontal overflow
    }}>
      {strips.map((strip, index) => {
        const isPhotoRight = index % 2 === 0;
        
        return (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              minHeight: '500px',
              width: '100%',
              maxWidth: '1200px', // Constrain maximum width
              margin: '0 auto', // Center the content
              padding: '0 40px',
              boxSizing: 'border-box',
            }}
          >
            {/* Content Section */}
            <div
              style={{
                flex: 1,
                padding: '40px',
                order: isPhotoRight ? 1 : 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                maxWidth: '600px',
                margin: '0 auto',
              }}
            >
              <h2
                style={{
                  fontSize: textSizes['3xl'],
                  color: colors.primary,
                  marginBottom: '24px',
                  fontWeight: '700',
                  lineHeight: '1.2',
                }}
              >
                {strip.title}
              </h2>
              <p
                style={{
                  fontSize: textSizes.lg,
                  color: colors.text,
                  lineHeight: '1.6',
                  margin: 0,
                }}
              >
                {strip.text}
              </p>
            </div>

            {/* Photo Section */}
            <div
              style={{
                flex: '0 0 400px', // Fixed width for photos
                height: '500px', // Match strip height
                order: isPhotoRight ? 2 : 1,
              }}
            >
              <img
                src={strip.photo}
                alt={strip.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover', // Prevents deformation, allows cropping
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                }}
              />
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default WhoWeAreSection;
