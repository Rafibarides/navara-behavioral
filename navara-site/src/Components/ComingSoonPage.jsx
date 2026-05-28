import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getColors, getTextSizes } from '../utils/colorsAndText';
import NavBarMenu from './NavBarMenu';
import FooterSection from './Sections/FooterSection';
import CalendlyModal from './CalendlyModal';

/**
 * Generic Coming Soon placeholder for future Navara divisions.
 * Each division passes its own title, description, icon, and offerings.
 * These pages are intentionally not linked from main nav (per launch plan)
 * but live at stable URLs so they're ready when divisions go live.
 */
const ComingSoonPage = ({
  isDarkMode = false,
  title,
  tagline,
  description,
  icon,
  offerings = [],
  accentColorOverride,
}) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const accent = accentColorOverride || colors.primary;

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
            zIndex: 1,
          }}
        >
          <source src="assets/background-video.mp4" type="video/mp4" />
        </video>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: `${colors.secondary}E0`,
          zIndex: 1,
        }} />
        <img
          src="assets/logo-white.png"
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
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(10px)',
            borderRadius: '999px',
            padding: '8px 18px',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.95)',
            border: '1px solid rgba(255,255,255,0.2)',
            marginBottom: '24px',
          }}>
            <i className="fas fa-lock" style={{ fontSize: '11px' }} />
            Coming Soon
          </div>
          <h1 style={{
            fontSize: isMobile ? textSizes['3xl'].fontSize : textSizes['5xl'].fontSize,
            fontFamily: textSizes['5xl'].fontFamily,
            color: 'white',
            fontWeight: '700',
            margin: '0 0 16px 0',
            letterSpacing: '0.02em',
          }}>
            {title}
          </h1>
          {tagline && (
            <p style={{
              fontSize: isMobile ? textSizes.base.fontSize : textSizes.xl.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: 'rgba(255,255,255,0.92)',
              margin: 0,
              lineHeight: '1.5',
              maxWidth: '720px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              {tagline}
            </p>
          )}
        </div>
      </section>

      <NavBarMenu isDarkMode={isDarkMode} />

      {/* Content */}
      <section style={{
        width: '100vw',
        padding: isMobile ? '60px 20px' : '100px 40px',
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '32px',
              alignItems: isMobile ? 'flex-start' : 'center',
              marginBottom: '48px',
            }}
          >
            <div style={{
              width: isMobile ? '72px' : '96px',
              height: isMobile ? '72px' : '96px',
              minWidth: isMobile ? '72px' : '96px',
              borderRadius: '24px',
              background: `linear-gradient(135deg, ${accent}25, ${accent}10)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${accent}30`,
            }}>
              <i className={icon} style={{ fontSize: isMobile ? '32px' : '44px', color: accent }} />
            </div>
            <p style={{
              fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.text,
              lineHeight: '1.7',
              margin: 0,
            }}>
              {description}
            </p>
          </motion.div>

          {offerings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              style={{
                background: colors.surface,
                borderRadius: '20px',
                padding: isMobile ? '28px 24px' : '40px',
                border: `1px solid ${colors.border}`,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                marginBottom: '48px',
              }}
            >
              <h2 style={{
                fontSize: isMobile ? textSizes.xl.fontSize : textSizes['2xl'].fontSize,
                fontFamily: textSizes['2xl'].fontFamily,
                color: colors.primary,
                fontWeight: '700',
                margin: '0 0 24px 0',
              }}>
                What we're building
              </h2>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}>
                {offerings.map((item, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px 0',
                      borderBottom: idx === offerings.length - 1 ? 'none' : `1px solid ${colors.border}80`,
                      fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
                      fontFamily: textSizes.lg.fontFamily,
                      color: colors.text,
                      lineHeight: '1.6',
                    }}
                  >
                    <i
                      className="fas fa-check-circle"
                      style={{
                        color: accent,
                        fontSize: '18px',
                        marginTop: '3px',
                        flexShrink: 0,
                      }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{
              background: `linear-gradient(135deg, ${colors.primary}10, ${colors.secondary}08)`,
              borderRadius: '20px',
              padding: isMobile ? '32px 24px' : '48px',
              textAlign: 'center',
              border: `1px solid ${colors.primary}20`,
            }}
          >
            <h3 style={{
              fontSize: isMobile ? textSizes.xl.fontSize : textSizes['2xl'].fontSize,
              fontFamily: textSizes['2xl'].fontFamily,
              color: colors.primary,
              fontWeight: '700',
              margin: '0 0 12px 0',
            }}>
              Want to be first in line?
            </h3>
            <p style={{
              fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.text,
              lineHeight: '1.7',
              margin: '0 0 24px 0',
            }}>
              Book a free 15-minute consultation. We'll share our launch timeline and let you
              know how this division fits into your family's bigger picture.
            </p>
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '12px',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <button
                onClick={() => setIsCalendlyModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: isMobile ? '14px 24px' : '14px 28px',
                  fontSize: textSizes.base.fontSize,
                  fontFamily: textSizes.base.fontFamily,
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(27, 59, 98, 0.3)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <i className="fas fa-calendar-check" />
                Book Your Free 15-Minute Consultation
              </button>
              <button
                onClick={() => navigate('/divisions')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'transparent',
                  color: colors.primary,
                  border: `2px solid ${colors.primary}`,
                  borderRadius: '12px',
                  padding: isMobile ? '12px 22px' : '12px 26px',
                  fontSize: textSizes.base.fontSize,
                  fontFamily: textSizes.base.fontFamily,
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                <i className="fas fa-arrow-left" />
                Back to Divisions
              </button>
            </div>
          </motion.div>
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

export default ComingSoonPage;
