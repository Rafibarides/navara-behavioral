import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getColors, getTextSizes } from '../utils/colorsAndText';
import NavBarMenu from './NavBarMenu';
import FooterSection from './Sections/FooterSection';
import CalendlyModal from './CalendlyModal';

const DivisionsPage = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth > 768 && window.innerWidth <= 1024);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const divisions = [
    {
      id: 'behavioral',
      title: 'Navara Behavior Support',
      tagline: 'Our flagship division — fully operational.',
      description: 'Evidence-based ABA, parent training, and behavioral consulting for families who want real results.',
      icon: 'fas fa-brain',
      route: '/behavioral',
      live: true,
    },
    {
      id: 'diagnostics',
      title: 'Navara Diagnostics',
      tagline: 'Coming Soon',
      description: 'Comprehensive psychological evaluations, ASD assessments, ADHD testing, and diagnostic consultations.',
      icon: 'fas fa-stethoscope',
      route: '/diagnostics',
      live: false,
    },
    {
      id: 'wellness',
      title: 'Navara Wellness',
      tagline: 'Coming Soon',
      description: 'Individual therapy, group counseling, and process-focused therapeutic programs.',
      icon: 'fas fa-heart',
      route: '/wellness',
      live: false,
    },
    {
      id: 'nutrition',
      title: 'Navara Nutrition',
      tagline: 'Coming Soon',
      description: 'Nutritional guidance and lifestyle support tailored to neurodivergent children and their families.',
      icon: 'fas fa-leaf',
      route: '/nutrition',
      live: false,
    },
    {
      id: 'pathways',
      title: 'Navara Pathways',
      tagline: 'Coming Soon',
      description: 'Career exploration, personality and career assessments, and internship connections for teens and young adults.',
      icon: 'fas fa-compass',
      route: '/pathways',
      live: false,
    },
    {
      id: 'medical',
      title: 'Navara Medical',
      tagline: 'Coming Soon',
      description: 'Psychiatric medication management and integrated behavioral-medical care.',
      icon: 'fas fa-user-md',
      route: '/medical',
      live: false,
    },
  ];

  const handleCardClick = (division) => {
    if (division.live) {
      navigate(division.route);
    }
  };

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      background: colors.background,
      boxSizing: 'border-box',
    }}>
      {/* Hero */}
      <section
        id="welcome-section"
        style={{
          position: 'relative',
          height: isMobile ? '30vh' : '55vh',
          minHeight: isMobile ? '240px' : '420px',
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
            objectPosition: isMobile ? 'right center' : 'center',
            zIndex: 1,
          }}
        >
          <source src="/assets/background-video.mp4" type="video/mp4" />
        </video>

        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: `${colors.secondary}D9`,
          zIndex: 1,
        }} />

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

        <div style={{
          position: 'relative',
          zIndex: 3,
          textAlign: 'center',
          maxWidth: '900px',
        }}>
          <h1 style={{
            fontSize: isMobile ? textSizes['3xl'].fontSize : textSizes['5xl'].fontSize,
            fontFamily: textSizes['5xl'].fontFamily,
            color: 'white',
            fontWeight: '700',
            margin: '0 0 16px 0',
            letterSpacing: '0.02em',
          }}>
            Our Divisions
          </h1>
          <p style={{
            fontSize: isMobile ? textSizes.base.fontSize : textSizes.xl.fontSize,
            fontFamily: textSizes.lg.fontFamily,
            color: 'rgba(255, 255, 255, 0.92)',
            margin: 0,
            lineHeight: '1.5',
            maxWidth: '720px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            A multi-division behavioral health group built around what families actually need.
          </p>
        </div>
      </section>

      <NavBarMenu isDarkMode={isDarkMode} />

      {/* Intro */}
      <section style={{
        width: '100vw',
        padding: isMobile ? '60px 20px 30px 20px' : '90px 40px 40px 40px',
        background: colors.background,
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: isMobile ? textSizes['2xl'].fontSize : textSizes['3xl'].fontSize,
            fontFamily: textSizes['3xl'].fontFamily,
            color: colors.primary,
            fontWeight: '700',
            marginBottom: '20px',
          }}>
            One group. Six divisions. Built around real outcomes.
          </h2>
          <p style={{
            fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
            fontFamily: textSizes.lg.fontFamily,
            color: colors.text,
            lineHeight: '1.7',
            margin: 0,
          }}>
            Navara Behavior Support is live and accepting clients today. The remaining divisions
            are launching in the coming months — designed with the same direct-access, no-waitlist
            philosophy that defines our work.
          </p>
        </div>
      </section>

      {/* Cards */}
      <section
        style={{
          width: '100vw',
          padding: isMobile ? '20px 20px 60px 20px' : '40px 40px 100px 40px',
          background: colors.background,
        }}
      >
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: '28px',
        }}>
          {divisions.map((division) => (
            <div
              key={division.id}
              onClick={() => handleCardClick(division)}
              style={{
                position: 'relative',
                backgroundColor: colors.surface,
                borderRadius: '20px',
                padding: isMobile ? '28px 24px' : '36px 28px',
                border: division.live
                  ? `2px solid ${colors.primary}40`
                  : `1px solid ${colors.border}`,
                boxShadow: division.live
                  ? '0 8px 32px rgba(27, 59, 98, 0.12)'
                  : '0 4px 16px rgba(0, 0, 0, 0.05)',
                cursor: division.live ? 'pointer' : 'default',
                opacity: division.live ? 1 : 0.78,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '280px',
              }}
            >
              {/* Lock overlay for coming soon */}
              {!division.live && (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: colors.border + '80',
                  backdropFilter: 'blur(6px)',
                  borderRadius: '20px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: colors.textSecondary,
                  zIndex: 2,
                }}>
                  <i className="fas fa-lock" style={{ fontSize: '10px' }} />
                  Coming Soon
                </div>
              )}

              {/* Live badge */}
              {division.live && (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'white',
                  zIndex: 2,
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
              )}

              {/* Icon */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: division.live
                  ? `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}15)`
                  : colors.border + '40',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}>
                <i
                  className={division.icon}
                  style={{
                    fontSize: '28px',
                    color: division.live ? colors.primary : colors.textSecondary,
                  }}
                />
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: textSizes.xl.fontSize,
                fontFamily: textSizes.xl.fontFamily,
                color: colors.text,
                fontWeight: '700',
                marginBottom: '6px',
                margin: '0 0 8px 0',
              }}>
                {division.title}
              </h3>

              {/* Tagline */}
              <p style={{
                fontSize: textSizes.sm.fontSize,
                fontFamily: textSizes.sm.fontFamily,
                color: division.live ? colors.primary : colors.textSecondary,
                fontWeight: '600',
                fontStyle: division.live ? 'normal' : 'italic',
                margin: '0 0 16px 0',
                letterSpacing: '0.02em',
              }}>
                {division.tagline}
              </p>

              {/* Description */}
              <p style={{
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                color: colors.text,
                lineHeight: '1.6',
                margin: 0,
                flex: 1,
              }}>
                {division.description}
              </p>

              {/* CTA */}
              <div style={{ marginTop: '24px' }}>
                {division.live ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: colors.primary,
                    fontSize: textSizes.base.fontSize,
                    fontFamily: textSizes.base.fontFamily,
                    fontWeight: '600',
                  }}>
                    Explore Division
                    <i className="fas fa-arrow-right" style={{ fontSize: '13px' }} />
                  </span>
                ) : (
                  <span style={{
                    color: colors.textSecondary,
                    fontSize: textSizes.sm.fontSize,
                    fontFamily: textSizes.sm.fontFamily,
                    fontStyle: 'italic',
                  }}>
                    Launching soon — stay tuned.
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        width: '100vw',
        padding: isMobile ? '40px 20px 80px 20px' : '60px 40px 120px 40px',
        background: `linear-gradient(135deg, ${colors.primary}10, ${colors.secondary}08)`,
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: isMobile ? textSizes['2xl'].fontSize : textSizes['3xl'].fontSize,
            fontFamily: textSizes['3xl'].fontFamily,
            color: colors.primary,
            fontWeight: '700',
            marginBottom: '16px',
          }}>
            Ready to take the next step?
          </h2>
          <p style={{
            fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
            fontFamily: textSizes.lg.fontFamily,
            color: colors.text,
            lineHeight: '1.7',
            marginBottom: '32px',
          }}>
            Book a free 15-minute consultation with our team. We'll help you understand which
            division (or combination) is the right fit for your family.
          </p>
          <button
            onClick={() => setIsCalendlyModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              padding: isMobile ? '14px 28px' : '16px 36px',
              fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(27, 59, 98, 0.3)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(27, 59, 98, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(27, 59, 98, 0.3)';
            }}
          >
            <i className="fas fa-calendar-check" />
            Book Your Free 15-Minute Consultation
          </button>
        </div>
      </section>

      <FooterSection isDarkMode={isDarkMode} />

      <CalendlyModal
        isOpen={isCalendlyModalOpen}
        onClose={() => setIsCalendlyModalOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default DivisionsPage;
