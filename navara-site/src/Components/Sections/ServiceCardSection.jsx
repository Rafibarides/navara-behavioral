import React, { useState, useEffect } from 'react';
import { getColors, getTextSizes } from '../../utils/colorsAndText';

const ServiceCardSection = ({ isDarkMode = false }) => {
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

  // Dynamic array for service cards
  const serviceCards = [
    {
      icon: 'fas fa-route',
      title: 'Navara Pathways',
      section: 'pathways'
    },
    {
      icon: 'fas fa-stethoscope',
      title: 'Navara Diagnostics',
      section: 'diagnostics'
    },
    {
      icon: 'fas fa-brain',
      title: 'Navara Behavioral',
      section: 'behavioral'
    }
  ];

  const handleLearnMore = (section) => {
    // This will navigate to specific sections later
    console.log(`Navigate to ${section} section`);
  };

  return (
    <section style={{
      backgroundColor: colors.surface,
      width: '100vw',
      padding: '80px 20px',
      margin: 0,
      boxSizing: 'border-box',
    }}>
      {/* Section Title */}
      <div style={{
        textAlign: 'center',
        marginBottom: '60px',
        maxWidth: '800px',
        margin: '0 auto 60px auto',
      }}>
        <h2 style={{
          fontSize: textSizes['4xl'],
          color: colors.primary,
          fontWeight: '700',
          marginBottom: '16px',
        }}>
          Our Services
        </h2>
        <p style={{
          fontSize: textSizes.lg,
          color: colors.textSecondary,
          lineHeight: '1.6',
        }}>
          Comprehensive support tailored to your family's unique needs
        </p>
      </div>

      {/* Service Cards Container */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: '30px',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
      }}>
        {serviceCards.map((service, index) => (
          <div
            key={index}
            style={{
              backgroundColor: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: '20px',
              padding: '40px 30px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minHeight: '280px',
              justifyContent: 'space-between',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
              e.currentTarget.style.borderColor = colors.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
              e.currentTarget.style.borderColor = colors.border;
            }}
          >
            {/* Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: colors.primary + '15',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
            }}>
              <i 
                className={service.icon}
                style={{
                  fontSize: '32px',
                  color: colors.primary,
                }}
              />
            </div>

            {/* Title */}
            <h3 style={{
              fontSize: textSizes['2xl'],
              color: colors.text,
              fontWeight: '600',
              marginBottom: '20px',
              lineHeight: '1.2',
            }}>
              {service.title}
            </h3>

            {/* Learn More Button */}
            <button
              onClick={() => handleLearnMore(service.section)}
              style={{
                backgroundColor: colors.primary,
                color: colors.surface,
                border: 'none',
                borderRadius: '25px',
                padding: '12px 24px',
                fontSize: textSizes.base,
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginTop: 'auto',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = colors.secondary;
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = colors.primary;
                e.target.style.transform = 'scale(1)';
              }}
            >
              Learn More
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ServiceCardSection;
