import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getColors, getTextSizes } from '../utils/colorsAndText';
import NavBarMenu from './NavBarMenu';
import FooterSection from './Sections/FooterSection';
import CalendlyModal from './CalendlyModal';
import siteData from '../../SiteData.json';

const BehavioralPage = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);

  // Get the behavioral service from siteData
  const behavioralService = siteData.sections.services.behavioral;

  // Check screen sizes on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth > 768 && window.innerWidth <= 1024);
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
      y: 30 
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
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

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Simplified typing animation
  const TypingText = ({ text, delay = 0 }) => {
    const words = text.split(' ');
    
    return (
      <motion.span
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
        transition={{
          staggerChildren: 0.08,
          delayChildren: delay,
        }}
      >
        {words.map((word, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.3,
              delay: index * 0.08 + delay,
              ease: "easeOut"
            }}
            style={{ display: 'inline-block', marginRight: '0.3em' }}
          >
            {word}
          </motion.span>
        ))}
      </motion.span>
    );
  };

  if (!behavioralService) return null;

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      background: colors.background,
      boxSizing: 'border-box',
    }}>
      {/* Navigation */}
      <NavBarMenu isDarkMode={isDarkMode} />

      {/* Hero Section */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          ...sectionStyle,
          background: `linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}10)`,
          paddingTop: '120px',
          position: 'relative',
        }}
      >
        <div style={containerStyle}>
          <motion.h1 variants={itemVariants} style={{
            fontSize: isMobile ? textSizes['2xl'].fontSize : isTablet ? textSizes['3xl'].fontSize : textSizes['4xl'].fontSize,
            fontFamily: textSizes['4xl'].fontFamily,
            color: colors.primary,
            fontWeight: '700',
            marginBottom: '24px',
            textAlign: 'center',
            lineHeight: '1.2',
          }}>
            From chaos to clarity. From frustration to connection.
          </motion.h1>

          <motion.p variants={itemVariants} style={{
            fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
            fontFamily: textSizes.lg.fontFamily,
            color: colors.text,
            lineHeight: '1.8',
            textAlign: 'center',
            maxWidth: '800px',
            margin: '0 auto 48px auto',
          }}>
            Personalized behavior support rooted in science, strengthened by compassion.
          </motion.p>

          <motion.div variants={itemVariants} style={{
            display: 'flex',
            justifyContent: 'center',
            gap: isMobile ? '16px' : '24px',
            flexWrap: 'wrap',
            marginBottom: '40px',
          }}>
            <button
              onClick={() => scrollToSection('navara-method')}
              style={{
                ...buttonStyle,
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                color: 'white',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
              }}
            >
              <i className="fas fa-graduation-cap" style={{ marginRight: '8px' }} />
              Explore the Navara Behavior Method
            </button>

            <button
              onClick={() => scrollToSection('coaching-options')}
              style={{
                ...buttonStyle,
                background: 'transparent',
                color: colors.primary,
                border: `2px solid ${colors.primary}`,
              }}
              onMouseEnter={(e) => {
                e.target.style.background = colors.primary;
                e.target.style.color = 'white';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = colors.primary;
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <i className="fas fa-user-md" style={{ marginRight: '8px' }} />
              Book 1:1 Coaching with David
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* Section 1: The Navara Behavior Method™️ */}
      <motion.section 
        id="navara-method"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={{
          ...sectionStyle,
          backgroundColor: colors.surface,
        }}
      >
        <div style={containerStyle}>
          <motion.h2 variants={itemVariants} style={{
            fontSize: isMobile ? textSizes['2xl'].fontSize : isTablet ? textSizes['3xl'].fontSize : textSizes['3xl'].fontSize,
            fontFamily: textSizes['3xl'].fontFamily,
            color: colors.primary,
            fontWeight: '700',
            marginBottom: '24px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}>
            <i className="fas fa-brain" style={{ color: colors.accent }} />
            Our Flagship 12-Week Parent-Led Behavior Program
          </motion.h2>

          <motion.div variants={itemVariants} style={{
            ...cardStyle,
            marginBottom: '40px',
          }}>
            <motion.p variants={itemVariants} style={{
              fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              lineHeight: '1.8',
              marginBottom: '32px',
              textAlign: 'center',
            }}>
              A comprehensive, parent-empowerment model to help you understand your child's behavior, build deep connection, and apply practical, lasting strategies that actually work — without relying on generic agency-based ABA.
            </motion.p>

            <motion.h3 variants={itemVariants} style={{
              fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
              fontFamily: textSizes.xl.fontFamily,
              color: colors.primary,
              fontWeight: '600',
              marginBottom: '20px',
            }}>
              What's Included:
            </motion.h3>

            <motion.ul variants={itemVariants} style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              lineHeight: '1.8',
              marginBottom: '32px',
              paddingLeft: isMobile ? '20px' : '24px',
            }}>
              <li style={{ marginBottom: '8px' }}>12 Weekly 1:1 parent coaching sessions (60–75 min)</li>
              <li style={{ marginBottom: '8px' }}>Full parent-facing Functional Behavior Assessment (FBA)</li>
              <li style={{ marginBottom: '8px' }}>Personalized home-based behavior plan (co-created with you)</li>
              <li style={{ marginBottom: '8px' }}>Custom tools, visuals, and data collection systems</li>
              <li style={{ marginBottom: '8px' }}>Weekly check-ins + bonus support calls</li>
              <li style={{ marginBottom: '8px' }}>Written summary of progress</li>
            </motion.ul>

            <motion.div variants={itemVariants} style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '24px',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '32px',
            }}>
              <button
                onClick={() => setIsCalendlyModalOpen(true)}
                style={{
                  ...buttonStyle,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                }}
              >
                <i className="fas fa-info-circle" style={{ marginRight: '8px' }} />
                See Full Program Details
              </button>

              <div style={{
                background: `rgba(255, 255, 255, ${isDarkMode ? '0.05' : '0.8'})`,
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${colors.primary}30`,
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: isMobile ? textSizes.sm.fontSize : textSizes.base.fontSize,
                  fontFamily: textSizes.base.fontFamily,
                  color: colors.text,
                  marginBottom: '8px',
                }}>
                  <i className="fas fa-dollar-sign" style={{ marginRight: '4px' }} />
                  Investment:
                </div>
                <div style={{
                  fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
                  fontFamily: textSizes.xl.fontFamily,
                  color: colors.primary,
                  fontWeight: '700',
                  marginBottom: '4px',
                }}>
                  $3,500 total
                </div>
                <div style={{
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.text,
                }}>
                  Payment plans available
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Section 2: 1:1 Behavior Coaching Options */}
      <motion.section 
        id="coaching-options"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={sectionStyle}
      >
        <div style={containerStyle}>
          <motion.h2 variants={itemVariants} style={{
            fontSize: isMobile ? textSizes['2xl'].fontSize : isTablet ? textSizes['3xl'].fontSize : textSizes['3xl'].fontSize,
            fontFamily: textSizes['3xl'].fontFamily,
            color: colors.primary,
            fontWeight: '700',
            marginBottom: '24px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}>
            <i className="fas fa-users" style={{ color: colors.accent }} />
            Prefer to take it one step at a time?
          </motion.h2>

          <motion.p variants={itemVariants} style={{
            fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
            fontFamily: textSizes.base.fontFamily,
            color: colors.text,
            lineHeight: '1.8',
            textAlign: 'center',
            maxWidth: '900px',
            margin: '0 auto 48px auto',
          }}>
            Book individual 45-minute virtual coaching sessions for targeted support on parenting challenges, behavior issues, or school-related concerns. All sessions include real-time feedback, skill building, and collaborative planning — designed to help you move forward with clarity and confidence.
            </motion.p>

          {/* David Option */}
          <motion.div variants={itemVariants} style={{
            ...cardStyle,
            marginBottom: '32px',
          }}>
            <motion.h3 variants={itemVariants} style={{
              fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
              fontFamily: textSizes.xl.fontFamily,
              color: colors.primary,
              fontWeight: '600',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <i className="fas fa-user-tie" style={{ color: colors.accent }} />
              Option 1: With David Nisan Fetman, M.A., BCBA
            </motion.h3>

            <motion.p variants={itemVariants} style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              lineHeight: '1.8',
              marginBottom: '20px',
            }}>
              Doctoral-level clinician and founder of Navara Behavioral Group
            </motion.p>

            <motion.div variants={itemVariants} style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '16px',
              marginBottom: '20px',
            }}>
              <div style={{
                background: `rgba(255, 255, 255, ${isDarkMode ? '0.05' : '0.8'})`,
                borderRadius: '8px',
                padding: '12px 16px',
                border: `1px solid ${colors.primary}30`,
                flex: 1,
              }}>
                <div style={{
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.text,
                }}>
                  First Session:
                </div>
                <div style={{
                  fontSize: textSizes.lg.fontSize,
                  fontFamily: textSizes.lg.fontFamily,
                  color: colors.primary,
                  fontWeight: '700',
                }}>
                  $175
                </div>
          </div>

              <div style={{
                background: `rgba(255, 255, 255, ${isDarkMode ? '0.05' : '0.8'})`,
                borderRadius: '8px',
                padding: '12px 16px',
                border: `1px solid ${colors.primary}30`,
                flex: 1,
              }}>
                <div style={{
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.text,
                }}>
                  Follow-Up Sessions:
                </div>
                <div style={{
                  fontSize: textSizes.lg.fontSize,
                  fontFamily: textSizes.lg.fontFamily,
                  color: colors.primary,
                  fontWeight: '700',
                }}>
                  $140
                </div>
              </div>
            </motion.div>

            <motion.p variants={itemVariants} style={{
              fontSize: textSizes.sm.fontSize,
              fontFamily: textSizes.sm.fontFamily,
              color: colors.text,
              marginBottom: '24px',
              fontStyle: 'italic',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <i className="fas fa-star" style={{ color: colors.accent }} />
              Best for families looking for high-level strategy, diagnostic clarity, or deeper clinical insight.
            </motion.p>

            <motion.div variants={itemVariants} style={{
              display: 'flex',
              justifyContent: 'center',
            }}>
              <button
                onClick={() => setIsCalendlyModalOpen(true)}
                style={{
                  ...buttonStyle,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                }}
              >
                <i className="fas fa-calendar-check" style={{ marginRight: '8px' }} />
                Book with David
              </button>
            </motion.div>
          </motion.div>

          {/* BCBA Option */}
          <motion.div variants={itemVariants} style={{
            ...cardStyle,
            marginBottom: '32px',
          }}>
            <motion.h3 variants={itemVariants} style={{
              fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
              fontFamily: textSizes.xl.fontFamily,
              color: colors.primary,
              fontWeight: '600',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <i className="fas fa-user-graduate" style={{ color: colors.accent }} />
              Option 2: With an Experienced BCBA
            </motion.h3>

            <motion.p variants={itemVariants} style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              lineHeight: '1.8',
              marginBottom: '20px',
            }}>
              Sessions with one of our trusted, master's-level Board Certified Behavior Analysts
            </motion.p>

            <motion.div variants={itemVariants} style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '16px',
              marginBottom: '20px',
            }}>
              <div style={{
                background: `rgba(255, 255, 255, ${isDarkMode ? '0.05' : '0.8'})`,
                borderRadius: '8px',
                padding: '12px 16px',
                border: `1px solid ${colors.primary}30`,
                flex: 1,
              }}>
                <div style={{
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.text,
                }}>
                  First Session:
                </div>
                <div style={{
                  fontSize: textSizes.lg.fontSize,
                  fontFamily: textSizes.lg.fontFamily,
                  color: colors.primary,
                  fontWeight: '700',
                }}>
                  $110
                </div>
              </div>

              <div style={{
                background: `rgba(255, 255, 255, ${isDarkMode ? '0.05' : '0.8'})`,
                borderRadius: '8px',
                padding: '12px 16px',
                border: `1px solid ${colors.primary}30`,
                flex: 1,
              }}>
                <div style={{
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.text,
                }}>
                  Follow-Up Sessions:
                </div>
                <div style={{
                  fontSize: textSizes.lg.fontSize,
                  fontFamily: textSizes.lg.fontFamily,
                  color: colors.primary,
                  fontWeight: '700',
                }}>
                  $95
                </div>
          </div>
            </motion.div>

            <motion.p variants={itemVariants} style={{
              fontSize: textSizes.sm.fontSize,
              fontFamily: textSizes.sm.fontFamily,
              color: colors.text,
              marginBottom: '24px',
              fontStyle: 'italic',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <i className="fas fa-star" style={{ color: colors.accent }} />
              Best for ongoing behavior support, program troubleshooting, and day-to-day strategy.
            </motion.p>

            <motion.div variants={itemVariants} style={{
              display: 'flex',
              justifyContent: 'center',
            }}>
              <button
                onClick={() => setIsCalendlyModalOpen(true)}
                style={{
                  ...buttonStyle,
                  background: 'transparent',
                  color: colors.primary,
                  border: `2px solid ${colors.primary}`,
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = colors.primary;
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = colors.primary;
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <i className="fas fa-calendar-plus" style={{ marginRight: '8px' }} />
                Book with a Navara BCBA
              </button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Section 3: Other Behavior Support Services (Coming Soon) */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={{
          ...sectionStyle,
          backgroundColor: colors.surface,
        }}
      >
        <div style={containerStyle}>
          <motion.h2 variants={itemVariants} style={{
            fontSize: isMobile ? textSizes['2xl'].fontSize : isTablet ? textSizes['3xl'].fontSize : textSizes['3xl'].fontSize,
            fontFamily: textSizes['3xl'].fontFamily,
            color: colors.primary,
            fontWeight: '700',
            marginBottom: '24px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}>
            <i className="fas fa-clock" style={{ color: colors.accent }} />
            Coming Soon from Navara Behavior Group
          </motion.h2>

          <motion.div variants={itemVariants} style={{
            ...cardStyle,
            marginBottom: '32px',
          }}>
            <motion.h3 variants={itemVariants} style={{
              fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
              fontFamily: textSizes.xl.fontFamily,
              color: colors.primary,
              fontWeight: '600',
              marginBottom: '24px',
            }}>
              Future Offerings:
            </motion.h3>

            <motion.ul variants={itemVariants} style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
            color: colors.text,
            lineHeight: '1.8',
              marginBottom: '32px',
              paddingLeft: isMobile ? '20px' : '24px',
              listStyle: 'none',
            }}>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-book" style={{ color: colors.accent, minWidth: '16px' }} />
                <span><strong>Behavior Bootcamp:</strong> 4-week crash course for new parents</span>
              </li>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-school" style={{ color: colors.accent, minWidth: '16px' }} />
                <span><strong>School Advocacy Coaching:</strong> Help navigating IEPs, BIPs, and team meetings</span>
              </li>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-users" style={{ color: colors.accent, minWidth: '16px' }} />
                <span><strong>Sibling & Family Integration Sessions</strong></span>
              </li>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-stethoscope" style={{ color: colors.accent, minWidth: '16px' }} />
                <span><strong>Clinician Consultation Packages</strong> for therapists, OTs, and teachers</span>
              </li>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-chalkboard-teacher" style={{ color: colors.accent, minWidth: '16px' }} />
                <span><strong>Workshops & Webinars:</strong> For parent groups, synagogues, schools</span>
              </li>
            </motion.ul>

          <motion.div variants={itemVariants} style={{
            display: 'flex',
            justifyContent: 'center',
          }}>
            <button
              onClick={() => setIsCalendlyModalOpen(true)}
              style={{
                  ...buttonStyle,
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                color: 'white',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
              }}
            >
                <i className="fas fa-list-alt" style={{ marginRight: '8px' }} />
                Join Waitlist or Request a Workshop
            </button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Section 4: Why Navara Behavior Method Works */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={sectionStyle}
      >
        <div style={containerStyle}>
          <motion.h2 variants={itemVariants} style={{
            fontSize: isMobile ? textSizes['2xl'].fontSize : isTablet ? textSizes['3xl'].fontSize : textSizes['3xl'].fontSize,
            fontFamily: textSizes['3xl'].fontFamily,
            color: colors.primary,
            fontWeight: '700',
            marginBottom: '40px',
            textAlign: 'center',
            display: 'flex',
                alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}>
            <i className="fas fa-award" style={{ color: colors.accent }} />
            Why Families Choose Navara
          </motion.h2>

          <motion.div variants={itemVariants} style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr',
            gap: '24px',
            marginBottom: '40px',
          }}>
            <div style={{
              ...cardStyle,
              marginBottom: 0,
            }}>
              <h3 style={{
                fontSize: textSizes.lg.fontSize,
                fontFamily: textSizes.lg.fontFamily,
                color: colors.primary,
                fontWeight: '600',
                marginBottom: '12px',
              }}>
                Parent-centered, not technician-driven
              </h3>
              <p style={{
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                color: colors.text,
                lineHeight: '1.6',
                margin: 0,
              }}>
                We empower you as the expert on your child, rather than creating dependency on outside providers.
              </p>
            </div>

            <div style={{
              ...cardStyle,
              marginBottom: 0,
            }}>
              <h3 style={{
                fontSize: textSizes.lg.fontSize,
                fontFamily: textSizes.lg.fontFamily,
                color: colors.primary,
                fontWeight: '600',
                marginBottom: '12px',
              }}>
                Doctoral-level expertise with real-world warmth
              </h3>
              <p style={{
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                color: colors.text,
                lineHeight: '1.6',
                margin: 0,
              }}>
                High-level clinical knowledge delivered with compassion and practical application.
              </p>
            </div>

            <div style={{
              ...cardStyle,
              marginBottom: 0,
            }}>
              <h3 style={{
                fontSize: textSizes.lg.fontSize,
                fontFamily: textSizes.lg.fontFamily,
                color: colors.primary,
                fontWeight: '600',
                marginBottom: '12px',
              }}>
                Integrative model: ABA, attachment, emotion coaching
              </h3>
              <p style={{
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                color: colors.text,
                lineHeight: '1.6',
                margin: 0,
              }}>
                We blend evidence-based behavioral science with emotional connection and family dynamics.
              </p>
            </div>

            <div style={{
              ...cardStyle,
              marginBottom: 0,
            }}>
              <h3 style={{
                fontSize: textSizes.lg.fontSize,
                fontFamily: textSizes.lg.fontFamily,
                color: colors.primary,
                fontWeight: '600',
                marginBottom: '12px',
              }}>
                No long waitlists, no agency bureaucracy
              </h3>
              <p style={{
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                color: colors.text,
                lineHeight: '1.6',
                margin: 0,
              }}>
                Direct access to expert clinicians without the delays and red tape of large agencies.
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} style={{
            ...cardStyle,
            textAlign: 'center',
            background: `linear-gradient(135deg, ${colors.primary}10, ${colors.secondary}05)`,
            border: `2px solid ${colors.primary}20`,
          }}>
            <h3 style={{
              fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
              fontFamily: textSizes.xl.fontFamily,
              color: colors.primary,
              fontWeight: '700',
              marginBottom: '16px',
            }}>
              You leave confident, not dependent
            </h3>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              lineHeight: '1.8',
              margin: 0,
            }}>
              Our goal is to equip you with the tools and knowledge to handle challenges independently, creating lasting change that doesn't require ongoing professional support.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <FooterSection isDarkMode={isDarkMode} />

      {/* Calendly Modal */}
      <CalendlyModal 
        isOpen={isCalendlyModalOpen}
        onClose={() => setIsCalendlyModalOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default BehavioralPage; 