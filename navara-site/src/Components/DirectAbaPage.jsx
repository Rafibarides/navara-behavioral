import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getColors, getTextSizes } from '../utils/colorsAndText';
import NavBarMenu from './NavBarMenu';
import FooterSection from './Sections/FooterSection';
import ContactSection from './Sections/ContactSection';

const DirectAbaPage = ({ isDarkMode = false }) => {

  const [autoRevealCount, setAutoRevealCount] = useState(0);
  useEffect(() => {
    const start = setTimeout(() => setAutoRevealCount(1), 1000);
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
          height: isMobile ? '14vh' : '24vh',
          minHeight: isMobile ? '110px' : '190px',
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

      </section>

      {/* Navigation */}
      <NavBarMenu isDarkMode={isDarkMode} />

      {/* Service 2: Navara Direct ABA™ */}
      <motion.section
        id="service-direct-aba"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        animate={autoRevealCount >= 1 ? "visible" : undefined}
        viewport={{ once: true, amount: 0.01 }}
        style={sectionStyle}
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
            Navara Direct ABA™
          </motion.h2>

          <motion.p variants={itemVariants} style={{
            fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
            fontFamily: textSizes.xl.fontFamily,
            color: colors.text,
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: '24px',
            maxWidth: '780px',
            margin: '0 auto 24px auto',
            lineHeight: '1.4',
          }}>
            Private ABA therapy, led directly by a BCBA — structured, flexible, and built around your family.
          </motion.p>

          <motion.div variants={itemVariants} style={{
            maxWidth: '820px',
            margin: '0 auto 24px auto',
          }}>
            <p style={{
              fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.text,
              lineHeight: '1.7',
              marginBottom: '20px',
            }}>
              Navara Direct ABA is a private ABA service designed for families who want
              targeted, high-quality support without the delays, limitations, or one-size-fits-all
              structure that often comes with traditional ABA programs.
            </p>
            <p style={{
              fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.text,
              lineHeight: '1.7',
              marginBottom: '20px',
            }}>
              Every session is led by a Board Certified Behavior Analyst. Every plan is individualized.
              Because we are a private practice, we can move at your pace, adjust in
              real time, and stay focused on what actually matters for your child and your family.
            </p>
            <p style={{
              fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.textSecondary,
              lineHeight: '1.7',
              fontStyle: 'italic',
              textAlign: 'center',
              marginBottom: '40px',
            }}>
              We offer three levels of support so you can choose the structure that fits your family's needs.
            </p>
          </motion.div>

          {/* Three Plans Grid */}
          <motion.div variants={itemVariants} style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : 'repeat(3, 1fr)',
            gap: '24px',
            maxWidth: '1200px',
            margin: '0 auto 40px auto',
          }}>
            {[
              {
                name: 'Essential Plan',
                tagline: 'Consistent Guidance. Clear Direction.',
                description: 'Designed for families who want professional support and a clear plan, and feel comfortable carrying strategies through between sessions.',
                includes: [
                  '1 weekly in-home session (60 minutes)',
                  'Direct BCBA-led intervention',
                  'Individualized behavior plan development and guidance',
                  'Dedicated parent coaching segment within each session (approx. 15–20 minutes)',
                  'Clear weekly action steps',
                ],
                price: '$1,200',
                pricePeriod: '/month',
                featured: false,
                note: null,
              },
              {
                name: 'Advanced Plan',
                tagline: 'Ongoing Support. Active Progress.',
                description: 'Ideal for families who want more consistent touchpoints, between-session guidance, and the ability to adjust strategies in real time.',
                includes: [
                  '1 weekly in-home session (60 minutes)',
                  'Direct BCBA-led intervention',
                  'Ongoing behavior plan development and refinement',
                  'Weekly virtual parent coaching session (45 minutes)',
                  'Between-session communication (text/email) for guidance and adjustments',
                  'Structured weekly targets and accountability',
                ],
                price: '$1,900',
                pricePeriod: '/month',
                featured: true,
                note: null,
              },
              {
                name: 'Comprehensive Plan',
                tagline: 'Comprehensive Support. Consistent Implementation.',
                description: 'For families who require a higher level of structure and in-home consistency. Combines direct BCBA sessions with dedicated paraprofessional support throughout the week — ensuring strategies are implemented consistently, not just during sessions.',
                includes: [
                  '2 weekly in-home BCBA sessions (60 minutes each)',
                  '6 hours/week of in-home behavioral support (paraprofessional)',
                  'Weekly parent coaching session (45 minutes)',
                  'Ongoing program oversight, coordination, and plan refinement',
                ],
                price: '$6,400',
                pricePeriod: '/month',
                featured: false,
                note: 'Limited availability. Please inquire for details.',
              },
            ].map((plan, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                style={{
                  background: plan.featured
                    ? `linear-gradient(135deg, ${colors.primary}12, ${colors.secondary}08)`
                    : `rgba(255, 255, 255, ${isDarkMode ? '0.05' : '0.9'})`,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  padding: isMobile ? '28px 24px' : '32px 28px',
                  border: plan.featured
                    ? `2px solid ${colors.primary}60`
                    : `1px solid rgba(255, 255, 255, ${isDarkMode ? '0.2' : '0.3'})`,
                  boxShadow: plan.featured
                    ? '0 16px 48px rgba(27, 59, 98, 0.18)'
                    : '0 8px 32px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {plan.featured && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    color: 'white',
                    padding: '5px 16px',
                    borderRadius: '999px',
                    fontSize: '10px',
                    fontWeight: '700',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 12px rgba(27, 59, 98, 0.3)',
                  }}>
                    Most Popular
                  </div>
                )}
                <h3 style={{
                  fontSize: textSizes.xl.fontSize,
                  fontFamily: textSizes.xl.fontFamily,
                  color: colors.primary,
                  fontWeight: '700',
                  margin: '0 0 6px 0',
                  textAlign: 'center',
                }}>
                  {plan.name}
                </h3>
                <p style={{
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.text,
                  fontStyle: 'italic',
                  textAlign: 'center',
                  margin: '0 0 20px 0',
                }}>
                  {plan.tagline}
                </p>

                {/* Price */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: '20px',
                  paddingBottom: '20px',
                  borderBottom: `1px solid ${colors.border}80`,
                }}>
                  <span style={{
                    fontSize: textSizes['3xl'].fontSize,
                    fontFamily: textSizes['3xl'].fontFamily,
                    color: colors.primary,
                    fontWeight: '800',
                  }}>
                    {plan.price}
                  </span>
                  <span style={{
                    fontSize: textSizes.base.fontSize,
                    fontFamily: textSizes.base.fontFamily,
                    color: colors.textSecondary,
                    fontWeight: '500',
                    marginLeft: '4px',
                  }}>
                    {plan.pricePeriod}
                  </span>
                </div>

                <p style={{
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.text,
                  lineHeight: '1.6',
                  marginBottom: '20px',
                }}>
                  {plan.description}
                </p>

                <div style={{
                  fontSize: textSizes.xs.fontSize,
                  fontFamily: textSizes.xs.fontFamily,
                  color: colors.primary,
                  fontWeight: '700',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                }}>
                  Includes
                </div>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 20px 0',
                  flex: 1,
                }}>
                  {plan.includes.map((item, itemIdx) => (
                    <li
                      key={itemIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        marginBottom: '10px',
                        fontSize: textSizes.sm.fontSize,
                        fontFamily: textSizes.sm.fontFamily,
                        color: colors.text,
                        lineHeight: '1.5',
                      }}
                    >
                      <i
                        className="fas fa-check"
                        style={{
                          color: colors.primary,
                          fontSize: '12px',
                          marginTop: '4px',
                          flexShrink: 0,
                        }}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {plan.note && (
                  <p style={{
                    fontSize: textSizes.xs.fontSize,
                    fontFamily: textSizes.xs.fontFamily,
                    color: colors.textSecondary,
                    fontStyle: 'italic',
                    textAlign: 'center',
                    margin: '0 0 16px 0',
                  }}>
                    {plan.note}
                  </p>
                )}

                <a
                  href="https://calendly.com/navarabehavioralgroup-info/free-15-minute-consultation"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: plan.featured
                      ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                      : 'transparent',
                    color: plan.featured ? 'white' : colors.primary,
                    border: plan.featured ? 'none' : `2px solid ${colors.primary}`,
                    borderRadius: '12px',
                    padding: '12px 18px',
                    fontSize: textSizes.sm.fontSize,
                    fontFamily: textSizes.sm.fontFamily,
                    fontWeight: '600',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <i className="fas fa-calendar-check" />
                  Book Free Consultation
                </a>
              </motion.div>
            ))}
          </motion.div>

          {/* Additional Support */}
          <motion.div variants={itemVariants} style={{
            maxWidth: '820px',
            margin: '0 auto',
            padding: isMobile ? '24px' : '32px',
            background: `rgba(255, 255, 255, ${isDarkMode ? '0.05' : '0.7'})`,
            borderRadius: '16px',
            border: `1px solid ${colors.border}`,
          }}>
            <h4 style={{
              fontSize: textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.primary,
              fontWeight: '700',
              margin: '0 0 12px 0',
            }}>
              Additional Support
            </h4>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              margin: '0 0 12px 0',
              lineHeight: '1.6',
            }}>
              The following services are available as needed across any plan:
            </p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}>
              {[
                'School collaboration — observations, teacher consultations, and coordination',
                'Additional sessions',
              ].map((item, idx) => (
                <li
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '6px 0',
                    fontSize: textSizes.base.fontSize,
                    fontFamily: textSizes.base.fontFamily,
                    color: colors.text,
                  }}
                >
                  <i className="fas fa-circle" style={{ fontSize: '6px', color: colors.primary, marginTop: '9px' }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p style={{
              fontSize: textSizes.sm.fontSize,
              fontFamily: textSizes.sm.fontFamily,
              color: colors.textSecondary,
              margin: '12px 0 0 0',
              fontStyle: 'italic',
            }}>
              Available upon request.
            </p>
          </motion.div>

          {/* Not sure CTA */}
          <motion.div variants={itemVariants} style={{
            maxWidth: '720px',
            margin: '40px auto 0 auto',
            textAlign: 'center',
            padding: isMobile ? '28px 24px' : '36px',
            background: `linear-gradient(135deg, ${colors.primary}12, ${colors.secondary}08)`,
            borderRadius: '20px',
            border: `1px solid ${colors.primary}25`,
          }}>
            <h4 style={{
              fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
              fontFamily: textSizes.xl.fontFamily,
              color: colors.primary,
              fontWeight: '700',
              margin: '0 0 12px 0',
            }}>
              Not sure which plan is right for you?
            </h4>
            <p style={{
              fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.text,
              lineHeight: '1.7',
              margin: '0 0 24px 0',
            }}>
              Every family situation is different. We start with a brief conversation to understand your goals and find the right fit.
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
              <i className="fas fa-calendar-check" style={{ marginRight: '8px' }} />
              Book Your Free 15-Minute Consultation
            </a>
          </motion.div>
        </div>
      </motion.section>

      {/* Cross-links to other services */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.01 }}
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
Want to learn to handle the behavior yourself? The Navara Behavior Method™ trains you in 12 weeks, so the progress does not depend on a therapist in the room.
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
Not ready for a program? Start with a single Behavioral Consulting session and get straight answers first.
            </p>
            <button
              onClick={() => navigate('/services/consulting')}
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
Book a One-Time Consult
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

export default DirectAbaPage;
