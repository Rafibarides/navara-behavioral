import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getColors, getTextSizes } from '../utils/colorsAndText';
import NavBarMenu from './NavBarMenu';
import FooterSection from './Sections/FooterSection';
import ContactSection from './Sections/ContactSection';

const ConsultingPage = ({ isDarkMode = false }) => {

  const [autoRevealCount, setAutoRevealCount] = useState(0);
  useEffect(() => {
    const start = setTimeout(() => setAutoRevealCount(1), 2500);
    return () => { clearTimeout(start); };
  }, []);
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
  const [isTablet, setIsTablet] = useState(() => window.matchMedia('(min-width: 769px) and (max-width: 1024px)').matches);
  const navigate = useNavigate();

  // Check screen sizes on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
      setIsTablet(window.matchMedia('(min-width: 769px) and (max-width: 1024px)').matches);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const sectionStyle = {
    backgroundColor: colors.background,
    width: '100vw',
    margin: 0,
    boxSizing: 'border-box',
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: isMobile ? '40px 20px' : isTablet ? '60px 30px' : '80px 40px',
  };

  const cardStyle = {
    background: `rgba(255, 255, 255, ${isDarkMode ? '0.1' : '0.9'})`,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: isMobile ? '24px' : isTablet ? '28px' : '32px',
    marginBottom: '32px',
    border: `1px solid rgba(255, 255, 255, ${isDarkMode ? '0.2' : '0.3'})`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  };

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: isMobile ? '12px 20px' : '14px 28px',
    borderRadius: '12px',
    border: 'none',
    fontSize: isMobile ? textSizes.sm.fontSize : textSizes.base.fontSize,
    fontFamily: textSizes.base.fontFamily,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
    textDecoration: 'none',
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
      {/* Welcome Section Style Hero */}
      <section 
        id="welcome-section"
        style={{
          position: 'relative',
          height: isMobile ? '25vh' : '50vh',
          minHeight: isMobile ? '200px' : '400px',
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
            objectPosition: isMobile ? 'right center' : 'center',
            zIndex: 1,
          }}
        >
          <source src="/assets/background-video.mp4" type="video/mp4" />
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

        {/* Service Logo in top left corner */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '2rem',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          zIndex: 3,
        }}>
          <img 
            src="/assets/service-logos/behavioral.png" 
            alt="Behavioral Logo"
            style={{
              height: '50px',
              width: 'auto',
              filter: 'brightness(0) invert(1)', // Makes the logo completely white
            }}
          />
        </div>

        {/* Content Overlay */}
        <div style={{
          position: 'relative',
          zIndex: 3,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isMobile ? 'translateY(10px)' : 'none',
        }}>
          {/* Behavioral Text */}
          <h1 style={{ 
            fontSize: isMobile ? textSizes['2xl'].fontSize : textSizes['4xl'].fontSize,
            fontFamily: isMobile ? textSizes['2xl'].fontFamily : textSizes['4xl'].fontFamily,
            margin: 0,
            textAlign: 'center',
            color: 'white',
            fontWeight: '700',
            letterSpacing: '0.02em',
            minHeight: isMobile ? '1em' : '1.2em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            Behavioral Consulting
          </h1>
        </div>
      </section>

      {/* Navigation */}
      <NavBarMenu isDarkMode={isDarkMode} />

      {/* Service 3: Behavioral Consulting */}
      <motion.section
        id="service-consulting"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        animate={autoRevealCount >= 1 ? "visible" : undefined}
        viewport={{ once: true, amount: isMobile ? 0.01 : 0.2 }}
        style={{
          ...sectionStyle,
          background: `linear-gradient(135deg, ${colors.primary}08, ${colors.secondary}04)`,
        }}
      >
        <div style={containerStyle}>
          <motion.h2 variants={itemVariants} style={{
            fontSize: isMobile ? textSizes['2xl'].fontSize : textSizes['3xl'].fontSize,
            fontFamily: textSizes['3xl'].fontFamily,
            color: colors.primary,
            fontWeight: '700',
            marginBottom: '16px',
            textAlign: 'center',
          }}>
            Behavioral Consulting
          </motion.h2>

          <motion.p variants={itemVariants} style={{
            fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
            fontFamily: textSizes.xl.fontFamily,
            color: colors.text,
            fontWeight: '600',
            textAlign: 'center',
            margin: '0 auto 28px auto',
            maxWidth: '820px',
            lineHeight: '1.4',
          }}>
            Direct access to expert-level behavioral guidance — for the families and professionals who want answers, not a waiting list.
          </motion.p>

          <motion.div variants={itemVariants} style={{
            maxWidth: '820px',
            margin: '0 auto 40px auto',
          }}>
            <p style={{
              fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.text,
              lineHeight: '1.7',
              marginBottom: '20px',
            }}>
              Sometimes you don't need a full program. You need someone who knows what they're looking
              at, can cut through the noise, and give you a clear direction.
            </p>
            <p style={{
              fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.text,
              lineHeight: '1.7',
              margin: 0,
            }}>
              Behavioral Consulting at Navara is a single, focused session with David Nisan Fetman,
              M.A., BCBA — designed for those who value precision, discretion, and time.
            </p>
          </motion.div>

          {/* Two cards: Families / Professionals */}
          <motion.div variants={itemVariants} style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '24px',
            maxWidth: '1100px',
            margin: '0 auto 40px auto',
          }}>
            {/* For Families */}
            <div style={{
              background: `rgba(255, 255, 255, ${isDarkMode ? '0.05' : '0.9'})`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: isMobile ? '28px 24px' : '36px 32px',
              border: `1px solid rgba(255, 255, 255, ${isDarkMode ? '0.2' : '0.3'})`,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}15)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <i className="fas fa-home" style={{ fontSize: '22px', color: colors.primary }} />
                </div>
                <h3 style={{
                  fontSize: textSizes.xl.fontSize,
                  fontFamily: textSizes.xl.fontFamily,
                  color: colors.primary,
                  fontWeight: '700',
                  margin: 0,
                }}>
                  For Families
                </h3>
              </div>
              <p style={{
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                color: colors.text,
                lineHeight: '1.7',
                marginBottom: '20px',
              }}>
                You have questions. You've done the research. You just want a straight answer from
                someone who has seen it before and knows what works.
              </p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}>
                {[
                  "A focused 45-minute session to discuss your child's behavior, your concerns, and a clear path forward",
                  'No intake process, no waitlist, no commitment beyond the session itself',
                  'Ideal as a standalone consult or as a first step before enrolling in the Navara Behavior Method™ or Navara Direct ABA™',
                ].map((item, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      marginBottom: '10px',
                      fontSize: textSizes.sm.fontSize,
                      fontFamily: textSizes.sm.fontFamily,
                      color: colors.text,
                      lineHeight: '1.6',
                    }}
                  >
                    <i className="fas fa-check" style={{ color: colors.primary, fontSize: '12px', marginTop: '4px', flexShrink: 0 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Professionals */}
            <div style={{
              background: `rgba(255, 255, 255, ${isDarkMode ? '0.05' : '0.9'})`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: isMobile ? '28px 24px' : '36px 32px',
              border: `1px solid rgba(255, 255, 255, ${isDarkMode ? '0.2' : '0.3'})`,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}15)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <i className="fas fa-briefcase-medical" style={{ fontSize: '22px', color: colors.primary }} />
                </div>
                <h3 style={{
                  fontSize: textSizes.xl.fontSize,
                  fontFamily: textSizes.xl.fontFamily,
                  color: colors.primary,
                  fontWeight: '700',
                  margin: 0,
                }}>
                  For Professionals
                </h3>
              </div>
              <p style={{
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                color: colors.text,
                lineHeight: '1.7',
                marginBottom: '20px',
              }}>
                Navara offers case consultation and behavioral guidance to select professionals seeking an
                expert perspective.
              </p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}>
                {[
                  'Psychiatrists, psychologists, and pediatricians seeking behavioral context for complex cases',
                  'BCBAs looking for case consultation or a second opinion',
                  'Educators and school psychologists navigating challenging behavioral presentations',
                ].map((item, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      marginBottom: '10px',
                      fontSize: textSizes.sm.fontSize,
                      fontFamily: textSizes.sm.fontFamily,
                      color: colors.text,
                      lineHeight: '1.6',
                    }}
                  >
                    <i className="fas fa-check" style={{ color: colors.primary, fontSize: '12px', marginTop: '4px', flexShrink: 0 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p style={{
                fontSize: textSizes.sm.fontSize,
                fontFamily: textSizes.sm.fontFamily,
                color: colors.textSecondary,
                fontStyle: 'italic',
                margin: '16px 0 0 0',
              }}>
                Sessions are confidential, focused, and built around your specific clinical question.
              </p>
            </div>
          </motion.div>

          {/* Pricing + CTA */}
          <motion.div variants={itemVariants} style={{
            maxWidth: '640px',
            margin: '0 auto',
            textAlign: 'center',
            padding: isMobile ? '32px 24px' : '40px',
            background: `linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}10)`,
            borderRadius: '20px',
            border: `1px solid ${colors.primary}30`,
          }}>
            <div style={{
              fontSize: textSizes.sm.fontSize,
              fontFamily: textSizes.sm.fontFamily,
              color: colors.textSecondary,
              fontWeight: '600',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Session Investment
            </div>
            <div style={{
              fontSize: isMobile ? textSizes['2xl'].fontSize : textSizes['3xl'].fontSize,
              fontFamily: textSizes['3xl'].fontFamily,
              color: colors.primary,
              fontWeight: '800',
              marginBottom: '6px',
            }}>
              $150
              <span style={{
                fontSize: textSizes.base.fontSize,
                fontWeight: '500',
                color: colors.textSecondary,
                marginLeft: '6px',
              }}>
                / 45-minute session
              </span>
            </div>
            <p style={{
              fontSize: textSizes.sm.fontSize,
              fontFamily: textSizes.sm.fontFamily,
              color: colors.textSecondary,
              fontStyle: 'italic',
              margin: '0 0 24px 0',
            }}>
              Limited availability. Serious inquiries only.
            </p>
            <a
              href="https://calendly.com/navarabehavioralgroup-info/free-15-minute-consultation"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...buttonStyle,
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                color: 'white',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
              }}
            >
              <i className="fas fa-comments" style={{ marginRight: '8px' }} />
              Request a Consulting Session
            </a>
          </motion.div>
        </div>
      </motion.section>

      {/* Cross-links to other services */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: isMobile ? 0.01 : 0.2 }}
        style={{
          ...sectionStyle,
          paddingBottom: 0,
          backgroundColor: colors.surface,
        }}
      >
        <div style={{ ...containerStyle, paddingBottom: '8px', textAlign: 'center' }}>
          <motion.h2 variants={itemVariants} style={{
            fontSize: isMobile ? textSizes['2xl'].fontSize : textSizes['3xl'].fontSize,
            fontFamily: textSizes['3xl'].fontFamily,
            color: colors.primary,
            fontWeight: '700',
            marginBottom: '16px',
          }}>
            Looking for something different?
          </motion.h2>
          <motion.div variants={itemVariants} style={{ marginBottom: '20px' }}>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              lineHeight: '1.6',
              marginBottom: '12px',
            }}>
Need more than one session? The Navara Behavior Method™ trains you over 12 weeks to understand and run the plan yourself.
            </p>
            <button
              onClick={() => navigate('/services/parent-training')}
              style={{
                ...buttonStyle,
                background: isDarkMode ? 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06))' : 'linear-gradient(135deg, rgba(235,239,243,0.72), rgba(245,247,250,0.45))',
                backdropFilter: 'blur(18px) saturate(160%)',
                WebkitBackdropFilter: 'blur(18px) saturate(160%)',
                borderRadius: '999px',
                color: isDarkMode ? '#e5e7eb' : '#555b64',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(255,255,255,0.3), 0 5px 14px rgba(45,55,70,0.10)',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(205,213,222,0.65)'}`,
                transform: 'none',
              }}
            >
Explore the 12-Week Program
            </button>
          </motion.div>
          <motion.div variants={itemVariants} style={{ marginBottom: '20px' }}>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              lineHeight: '1.6',
              marginBottom: '12px',
            }}>
Want a behavior analyst working directly with your child? Navara Direct ABA™ brings a BCBA into your home.
            </p>
            <button
              onClick={() => navigate('/services/direct-aba')}
              style={{
                ...buttonStyle,
                background: isDarkMode ? 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06))' : 'linear-gradient(135deg, rgba(235,239,243,0.72), rgba(245,247,250,0.45))',
                backdropFilter: 'blur(18px) saturate(160%)',
                WebkitBackdropFilter: 'blur(18px) saturate(160%)',
                borderRadius: '999px',
                color: isDarkMode ? '#e5e7eb' : '#555b64',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(255,255,255,0.3), 0 5px 14px rgba(45,55,70,0.10)',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(205,213,222,0.65)'}`,
                transform: 'none',
              }}
            >
Explore Direct ABA
            </button>
          </motion.div>
        </div>
      </motion.section>
      {/* Contact Section */}
      <ContactSection isDarkMode={isDarkMode} servicePage />

      {/* Footer */}
      <FooterSection isDarkMode={isDarkMode} />
    </div>
  );
};

export default ConsultingPage;
