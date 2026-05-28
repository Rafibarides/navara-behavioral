import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getColors, getTextSizes } from '../../utils/colorsAndText';

const ServiceCardSection = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth > 768 && window.innerWidth <= 1024);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const divisions = [
    {
      title: 'Navara Behavior Support',
      tagline: 'Live · Accepting clients now',
      description: 'Evidence-based ABA, parent training, and behavioral consulting — no waitlists, no insurance.',
      icon: 'fas fa-brain',
      route: '/behavioral',
      live: true,
    },
    {
      title: 'Navara Diagnostics',
      tagline: 'Coming Soon',
      description: 'Comprehensive psychological evaluations, ASD and ADHD assessments, and diagnostic consultations.',
      icon: 'fas fa-stethoscope',
      route: '/diagnostics',
      live: false,
    },
    {
      title: 'Navara Wellness',
      tagline: 'Coming Soon',
      description: 'Individual therapy, group counseling, and process-focused therapeutic programs.',
      icon: 'fas fa-heart',
      route: '/wellness',
      live: false,
    },
    {
      title: 'Navara Nutrition',
      tagline: 'Coming Soon',
      description: 'Nutritional guidance and lifestyle support for neurodivergent children and their families.',
      icon: 'fas fa-leaf',
      route: '/nutrition',
      live: false,
    },
    {
      title: 'Navara Pathways',
      tagline: 'Coming Soon',
      description: 'Career exploration, personality assessments, and internship connections for teens and young adults.',
      icon: 'fas fa-compass',
      route: '/pathways',
      live: false,
    },
    {
      title: 'Navara Medical',
      tagline: 'Coming Soon',
      description: 'Psychiatric medication management and integrated behavioral-medical care.',
      icon: 'fas fa-user-md',
      route: '/medical',
      live: false,
    },
  ];

  const handleClick = (division) => {
    navigate(division.live ? division.route : '/divisions');
  };

  return (
    <section style={{
      backgroundColor: colors.surface,
      width: '100vw',
      padding: isMobile ? '60px 20px' : '80px 20px',
      margin: 0,
      boxSizing: 'border-box',
    }}>
      {/* Section Title */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '48px',
          maxWidth: '820px',
          margin: '0 auto 48px auto',
        }}
      >
        <h2 style={{
          fontSize: isMobile ? textSizes['3xl'].fontSize : textSizes['4xl'].fontSize,
          fontFamily: textSizes['4xl'].fontFamily,
          color: colors.primary,
          fontWeight: '700',
          marginBottom: '14px',
        }}>
          Our Divisions
        </h2>
        <p style={{
          fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
          fontFamily: textSizes.lg.fontFamily,
          color: colors.textSecondary,
          lineHeight: '1.6',
          margin: 0,
        }}>
          A multi-division behavioral health group. Navara Behavior Support is live today — five more
          divisions are on the way.
        </p>
      </div>

      {/* Division Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: '24px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {divisions.map((division, index) => (
          <div
            key={index}
            onClick={() => handleClick(division)}
            style={{
              position: 'relative',
              backgroundColor: colors.background,
              border: division.live
                ? `2px solid ${colors.primary}40`
                : `1px solid ${colors.border}`,
              borderRadius: '18px',
              padding: isMobile ? '24px' : '28px',
              boxShadow: division.live
                ? '0 6px 24px rgba(27, 59, 98, 0.1)'
                : '0 4px 16px rgba(0, 0, 0, 0.05)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              minHeight: '220px',
              opacity: division.live ? 1 : 0.8,
              overflow: 'hidden',
            }}
          >
            {/* Status badge */}
            {division.live ? (
              <div style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                color: 'white',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '10px',
                fontWeight: '700',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                boxShadow: '0 4px 12px rgba(27, 59, 98, 0.3)',
              }}>
                <span style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#7CFC7C',
                  boxShadow: '0 0 6px #7CFC7C',
                }} />
                Live
              </div>
            ) : (
              <div style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: colors.border + 'CC',
                backdropFilter: 'blur(6px)',
                color: colors.textSecondary,
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                <i className="fas fa-lock" style={{ fontSize: '9px' }} />
                Soon
              </div>
            )}

            {/* Icon */}
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: division.live
                ? `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}15)`
                : colors.border + '60',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '6px',
            }}>
              <i
                className={division.icon}
                style={{
                  fontSize: '22px',
                  color: division.live ? colors.primary : colors.textSecondary,
                }}
              />
            </div>

            <h3 style={{
              fontSize: textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.text,
              fontWeight: '700',
              margin: 0,
              lineHeight: '1.3',
            }}>
              {division.title}
            </h3>

            <p style={{
              fontSize: textSizes.sm.fontSize,
              fontFamily: textSizes.sm.fontFamily,
              color: division.live ? colors.primary : colors.textSecondary,
              fontWeight: '600',
              fontStyle: division.live ? 'normal' : 'italic',
              margin: 0,
            }}>
              {division.tagline}
            </p>

            <p style={{
              fontSize: textSizes.sm.fontSize,
              fontFamily: textSizes.sm.fontFamily,
              color: colors.text,
              lineHeight: '1.55',
              margin: 0,
              flex: 1,
            }}>
              {division.description}
            </p>

            {division.live && !isMobile && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: colors.primary,
                fontSize: textSizes.sm.fontSize,
                fontFamily: textSizes.sm.fontFamily,
                fontWeight: '600',
                marginTop: '4px',
              }}>
                Explore Division
                <i className="fas fa-arrow-right" style={{ fontSize: '11px' }} />
              </span>
            )}
          </div>
        ))}
      </div>

      {/* View all link */}
      <div
        style={{
          textAlign: 'center',
          marginTop: '40px',
        }}
      >
        <button
          onClick={() => navigate('/divisions')}
          style={{
            background: 'transparent',
            color: colors.primary,
            border: `2px solid ${colors.primary}`,
            borderRadius: '12px',
            padding: isMobile ? '12px 24px' : '14px 28px',
            fontSize: textSizes.base.fontSize,
            fontFamily: textSizes.base.fontFamily,
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.primary;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = colors.primary;
          }}
        >
          <i className="fas fa-th-large" />
          View All Divisions
        </button>
      </div>
    </section>
  );
};

export default ServiceCardSection;
