import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getColors, getTextSizes } from '../utils/colorsAndText';
import NavBarMenu from './NavBarMenu';
import FooterSection from './Sections/FooterSection';
import ContactSection from './Sections/ContactSection';
import CalendlyModal from './CalendlyModal';
import siteData from '../../SiteData.json';

const WellnessPage = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);

  // Get the wellness service from siteData
  const wellnessService = siteData.sections.services.wellness;

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

  const imageVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      rotate: -5
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        duration: 1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
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

  const pillStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '20px',
    background: `rgba(255, 255, 255, ${isDarkMode ? '0.1' : '0.8'})`,
    border: `1px solid ${colors.primary}30`,
    fontSize: textSizes.sm.fontSize,
    fontFamily: textSizes.sm.fontFamily,
    color: colors.text,
    marginBottom: '8px',
    marginRight: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    transform: 'scale(1)',
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!wellnessService) return null;

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
          <source src="assets/background-video.mp4" type="video/mp4" />
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

        {/* Wellness Logo in top left corner */}
        <img 
          src="assets/service-logos/behavioral.png" 
          alt="Wellness Logo"
          style={{
            position: 'absolute',
            top: '20px',
            left: '2rem',
            height: '50px',
            width: 'auto',
            zIndex: 3,
            filter: 'brightness(0) invert(1)', // Makes the logo completely white
          }}
        />

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
          {/* Wellness Text */}
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
            Wellness
          </h1>
        </div>
      </section>

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
          <motion.div variants={itemVariants} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '20px' : '40px',
            flexDirection: isMobile ? 'column' : 'row',
            marginBottom: '48px',
          }}>
            <motion.img 
              variants={imageVariants}
              src="/assets/NAVARA1.jpg"
              alt="Therapy and wellness support"
              style={{
                width: isMobile ? '200px' : '300px',
                height: isMobile ? '200px' : '300px',
                borderRadius: '20px',
                objectFit: 'cover',
                border: `4px solid ${colors.primary}30`,
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              }}
            />
            <motion.div style={{ textAlign: isMobile ? 'center' : 'left', maxWidth: '600px' }}>
              <motion.h1 variants={itemVariants} style={{
                fontSize: isMobile ? textSizes['2xl'].fontSize : isTablet ? textSizes['3xl'].fontSize : textSizes['4xl'].fontSize,
                fontFamily: textSizes['4xl'].fontFamily,
                color: colors.primary,
                fontWeight: '700',
                marginBottom: '24px',
                lineHeight: '1.2',
              }}>
                Therapy That Works for Real Life.
              </motion.h1>

              <motion.p variants={itemVariants} style={{
                fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
                fontFamily: textSizes.lg.fontFamily,
                color: colors.text,
                lineHeight: '1.8',
                marginBottom: '32px',
              }}>
                Private, personalized support from licensed therapists - no insurance hassle, no waiting lists, no judgment.
              </motion.p>

              <motion.div variants={itemVariants} style={{
                display: 'flex',
                gap: isMobile ? '16px' : '24px',
                flexWrap: 'wrap',
                justifyContent: isMobile ? 'center' : 'flex-start',
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
                  Book a Free 15-Minute Consult
                </button>

                <button
                  onClick={() => scrollToSection('therapists')}
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
                  Meet Your Therapist
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Section 1: What Makes Us Different */}
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
          }}>
            We're not a clinic. We're a clarity-driven wellness experience.
          </motion.h2>

          <motion.div variants={itemVariants} style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
            gap: '24px',
            marginBottom: '40px',
          }}>
            <motion.div 
              variants={itemVariants} 
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              style={{
                ...cardStyle,
                marginBottom: 0,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03) translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
              }}
            >
              <motion.div
                variants={floatingVariants}
                animate="animate"
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  fontSize: '40px',
                  color: `${colors.primary}15`,
                  zIndex: 0,
                }}
              >
                <i className="fas fa-brain" />
              </motion.div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <i className="fas fa-brain" style={{
                  fontSize: '48px',
                  color: colors.primary,
                  marginBottom: '16px',
                  display: 'block',
                }} />
                <h3 style={{
                  fontSize: textSizes.lg.fontSize,
                  fontFamily: textSizes.lg.fontFamily,
                  color: colors.primary,
                  fontWeight: '600',
                  marginBottom: '12px',
                }}>
                  Licensed Therapists
                </h3>
                <p style={{
                  fontSize: textSizes.base.fontSize,
                  fontFamily: textSizes.base.fontFamily,
                  color: colors.text,
                  lineHeight: '1.6',
                  margin: 0,
                }}>
                  Compassionate, experienced, and aligned with your goals.
                </p>
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants} 
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              style={{
                ...cardStyle,
                marginBottom: 0,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03) translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
              }}
            >
              <motion.div
                variants={floatingVariants}
                animate="animate"
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  fontSize: '40px',
                  color: `${colors.secondary}15`,
                  zIndex: 0,
                }}
              >
                <i className="fas fa-file-invoice-dollar" />
              </motion.div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <i className="fas fa-file-invoice-dollar" style={{
                  fontSize: '48px',
                  color: colors.secondary,
                  marginBottom: '16px',
                  display: 'block',
                }} />
                <h3 style={{
                  fontSize: textSizes.lg.fontSize,
                  fontFamily: textSizes.lg.fontFamily,
                  color: colors.primary,
                  fontWeight: '600',
                  marginBottom: '12px',
                }}>
                  No Insurance Needed
                </h3>
                <p style={{
                  fontSize: textSizes.base.fontSize,
                  fontFamily: textSizes.base.fontFamily,
                  color: colors.text,
                  lineHeight: '1.6',
                  margin: 0,
                }}>
                  Flat, transparent rates. No labels. No diagnosis required.
                </p>
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants} 
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              style={{
                ...cardStyle,
                marginBottom: 0,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03) translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
              }}
            >
              <motion.div
                variants={floatingVariants}
                animate="animate"
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  fontSize: '40px',
                  color: `${colors.accent}15`,
                  zIndex: 0,
                }}
              >
                <i className="fas fa-compass" />
              </motion.div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <i className="fas fa-compass" style={{
                  fontSize: '48px',
                  color: colors.accent,
                  marginBottom: '16px',
                  display: 'block',
                }} />
                <h3 style={{
                  fontSize: textSizes.lg.fontSize,
                  fontFamily: textSizes.lg.fontFamily,
                  color: colors.primary,
                  fontWeight: '600',
                  marginBottom: '12px',
                }}>
                  Whole-Person Approach
                </h3>
                <p style={{
                  fontSize: textSizes.base.fontSize,
                  fontFamily: textSizes.base.fontFamily,
                  color: colors.text,
                  lineHeight: '1.6',
                  margin: 0,
                }}>
                  Therapy that meets you where you are - whether you're overwhelmed, stuck, healing, or growing.
                </p>
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants} 
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              style={{
                ...cardStyle,
                marginBottom: 0,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03) translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
              }}
            >
              <motion.div
                variants={floatingVariants}
                animate="animate"
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  fontSize: '40px',
                  color: `${colors.primary}15`,
                  zIndex: 0,
                }}
              >
                <i className="fas fa-calendar-alt" />
              </motion.div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <i className="fas fa-calendar-alt" style={{
                  fontSize: '48px',
                  color: colors.primary,
                  marginBottom: '16px',
                  display: 'block',
                }} />
                <h3 style={{
                  fontSize: textSizes.lg.fontSize,
                  fontFamily: textSizes.lg.fontFamily,
                  color: colors.primary,
                  fontWeight: '600',
                  marginBottom: '12px',
                }}>
                  Easy Scheduling
                </h3>
                <p style={{
                  fontSize: textSizes.base.fontSize,
                  fontFamily: textSizes.base.fontFamily,
                  color: colors.text,
                  lineHeight: '1.6',
                  margin: 0,
                }}>
                  Quick consults, flexible hours, no bureaucracy.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Section 2: Who It's For */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={sectionStyle}
      >
        <div style={containerStyle}>
          <motion.div variants={itemVariants} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '20px' : '40px',
            flexDirection: isMobile ? 'column' : 'row-reverse',
            marginBottom: '48px',
          }}>
            <motion.img 
              variants={imageVariants}
              src="/assets/NAVARA2.jpg"
              alt="Support for what matters"
              style={{
                width: isMobile ? '200px' : '250px',
                height: isMobile ? '200px' : '250px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: `4px solid ${colors.secondary}30`,
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                transform: 'rotate(3deg)',
              }}
            />
            <motion.div style={{ textAlign: isMobile ? 'center' : 'left', maxWidth: '600px' }}>
              <motion.h2 variants={itemVariants} style={{
                fontSize: isMobile ? textSizes['2xl'].fontSize : isTablet ? textSizes['3xl'].fontSize : textSizes['3xl'].fontSize,
                fontFamily: textSizes['3xl'].fontFamily,
                color: colors.primary,
                fontWeight: '700',
                marginBottom: '32px',
              }}>
                Support for what actually matters to you.
              </motion.h2>

              <motion.div variants={itemVariants} style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '32px',
              }}>
                {[
                  'Anxiety that won\'t turn off',
                  'Burnout and emotional overload',
                  'Parenting stress, resentment, or doubt',
                  'Identity work, self-worth, or trauma',
                  'Executive dysfunction, ADHD, and overwhelm',
                  'Healing after loss, betrayal, or disconnection',
                  'Support for neurodivergent adults navigating life'
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    style={pillStyle}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.05) translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1) translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <i className="fas fa-check-circle" style={{ color: colors.primary }} />
                    {item}
                  </motion.div>
                ))}
              </motion.div>

              <motion.div variants={itemVariants}>
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
                  <i className="fas fa-comments" style={{ marginRight: '8px' }} />
                  Ready to talk? Schedule a Free Consult
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Section 3: Meet Our Clinicians */}
      <motion.section 
        id="therapists"
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
            marginBottom: '48px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}>
            <i className="fas fa-user-friends" style={{ color: colors.accent }} />
            Meet your therapist.
          </motion.h2>

          <motion.div variants={itemVariants} style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '48px',
          }}>
            {/* David Nisan Fetman */}
            <motion.div variants={itemVariants} style={{
              ...cardStyle,
              marginBottom: 0,
              textAlign: 'center',
              maxWidth: '400px',
            }}>
              <motion.img 
                variants={imageVariants}
                src="https://images.squarespace-cdn.com/content/v1/651998e05a97287d391f2a87/1697150819979-Z3WGUUI1CNLX738QSMA5/LosAngeles-Headshots-for-Women-KarenVaisman-photography-headshots-LA-female-professional-headshots-near-me-9-tny.jpg"
                alt="Sharon Choudhury"
                style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  margin: '0 auto 20px auto',
                  display: 'block',
                  border: `3px solid ${colors.primary}30`,
                }}
              />
              <h3 style={{
                fontSize: textSizes.lg.fontSize,
                fontFamily: textSizes.lg.fontFamily,
                color: colors.primary,
                fontWeight: '600',
                marginBottom: '8px',
              }}>
                Sharon Choudhury, LMSW
              </h3>
              <div style={{
                fontSize: textSizes.sm.fontSize,
                fontFamily: textSizes.sm.fontFamily,
                color: colors.secondary,
                fontWeight: '500',
                marginBottom: '16px',
              }}>
                Licensed Master Social Worker
              </div>
              <p style={{
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                color: colors.text,
                lineHeight: '1.6',
                marginBottom: '20px',
              }}>
                Sharon Choudhury, LMSW is a therapist with a Master's in Social Work from Columbia University. She specializes in trauma-informed care, anxiety, depression, and cultural identity issues, using a person-centered, evidence-based approach.
              </p>
              <button
                onClick={() => setIsCalendlyModalOpen(true)}
                style={{
                  ...buttonStyle,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  color: 'white',
                  fontSize: textSizes.sm.fontSize,
                  padding: '12px 24px',
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
                Book a Session with Sharon
              </button>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants} style={{
            textAlign: 'center',
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
              Schedule a Consultation
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* Section 4: Pricing */}
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
            marginBottom: '24px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}>
            <i className="fas fa-dollar-sign" style={{ color: colors.accent }} />
            Simple, transparent pricing - no insurance games.
          </motion.h2>

          <motion.div variants={itemVariants} style={{
            ...cardStyle,
            marginBottom: '40px',
          }}>
            <motion.div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
              gap: '24px',
              alignItems: 'center',
            }}>
              <div>
                <h3 style={{
                  fontSize: textSizes.xl.fontSize,
                  fontFamily: textSizes.xl.fontFamily,
                  color: colors.primary,
                  fontWeight: '600',
                  marginBottom: '16px',
                }}>
                  Service
                </h3>
              </div>
              <div>
                <h3 style={{
                  fontSize: textSizes.xl.fontSize,
                  fontFamily: textSizes.xl.fontFamily,
                  color: colors.primary,
                  fontWeight: '600',
                  marginBottom: '16px',
                  textAlign: isMobile ? 'left' : 'right',
                }}>
                  Price
                </h3>
              </div>
            </motion.div>

            {[
              { service: '50-Minute Session', price: '$100' },
              { service: 'First Intake Session', price: '$120' },
              { service: '4-Session Bundle', price: '$380', note: '($95/session)' },
              { service: 'Sliding Scale', price: 'Available on request', note: '(limited slots)' },
            ].map((item, index) => (
              <motion.div key={index} variants={itemVariants} style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
                gap: '24px',
                alignItems: 'center',
                padding: '16px 0',
                borderTop: index === 0 ? 'none' : `1px solid ${colors.border}`,
              }}>
                <div>
                  <div style={{
                    fontSize: textSizes.base.fontSize,
                    fontFamily: textSizes.base.fontFamily,
                    color: colors.text,
                    fontWeight: '500',
                  }}>
                    {item.service}
                  </div>
                </div>
                <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                  <div style={{
                    fontSize: textSizes.lg.fontSize,
                    fontFamily: textSizes.lg.fontFamily,
                    color: colors.primary,
                    fontWeight: '700',
                  }}>
                    {item.price}
                  </div>
                  {item.note && (
                    <div style={{
                      fontSize: textSizes.sm.fontSize,
                      fontFamily: textSizes.sm.fontFamily,
                      color: colors.textSecondary,
                      fontStyle: 'italic',
                    }}>
                      {item.note}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            <motion.div variants={itemVariants} style={{
              marginTop: '32px',
              padding: '20px',
              background: `rgba(255, 255, 255, ${isDarkMode ? '0.05' : '0.8'})`,
              borderRadius: '12px',
              border: `1px solid ${colors.primary}30`,
            }}>
              <h4 style={{
                fontSize: textSizes.lg.fontSize,
                fontFamily: textSizes.lg.fontFamily,
                color: colors.primary,
                fontWeight: '600',
                marginBottom: '12px',
              }}>
                Important Notes:
              </h4>
              <ul style={{
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                color: colors.text,
                lineHeight: '1.6',
                paddingLeft: '20px',
                margin: 0,
              }}>
                <li>We do not accept insurance</li>
                <li>HSA/FSA cards accepted</li>
                <li>Good Faith Estimates available upon request</li>
              </ul>
            </motion.div>

            <motion.div variants={itemVariants} style={{
              display: 'flex',
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
                <i className="fas fa-phone" style={{ marginRight: '8px' }} />
                Book a Free 15-Minute Call
              </button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Section 5: Tracks & Specialties */}
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
            marginBottom: '48px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}>
            <i className="fas fa-route" style={{ color: colors.accent }} />
            Want structure? Try one of our short-term therapy tracks.
          </motion.h2>

          <motion.div variants={itemVariants} style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr',
            gap: '24px',
            marginBottom: '40px',
          }}>
            {[
              {
                title: 'Navara Reset',
                description: '6-session short-term CBT for burnout, stress, and overwhelm',
                icon: 'fas fa-refresh'
              },
              {
                title: 'Parent Clarity',
                description: 'Parent-focused therapy or coaching to manage behavior and rebuild relationships',
                icon: 'fas fa-heart'
              },
              {
                title: 'Neurodivergent Support',
                description: 'For adults navigating ADHD, ASD, or executive dysfunction in daily life',
                icon: 'fas fa-puzzle-piece'
              },
              {
                title: 'Relationship Repair',
                description: 'For couples or individuals processing relational trauma and rebuilding trust',
                icon: 'fas fa-hands-helping'
              }
            ].map((track, index) => (
              <motion.div key={index} variants={itemVariants} style={{
                ...cardStyle,
                marginBottom: 0,
                position: 'relative',
                overflow: 'hidden',
              }}>
                <motion.div
                  variants={floatingVariants}
                  animate="animate"
                  style={{
                    position: 'absolute',
                    top: '15px',
                    right: '15px',
                    fontSize: '40px',
                    color: `${colors.primary}10`,
                    zIndex: 0,
                  }}
                >
                  <i className={track.icon} />
                </motion.div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <i className={track.icon} style={{
                    fontSize: '32px',
                    color: colors.primary,
                    marginBottom: '16px',
                    display: 'block',
                  }} />
                  <h3 style={{
                    fontSize: textSizes.lg.fontSize,
                    fontFamily: textSizes.lg.fontFamily,
                    color: colors.primary,
                    fontWeight: '600',
                    marginBottom: '12px',
                  }}>
                    {track.title}
                  </h3>
                  <p style={{
                    fontSize: textSizes.base.fontSize,
                    fontFamily: textSizes.base.fontFamily,
                    color: colors.text,
                    lineHeight: '1.6',
                    margin: 0,
                  }}>
                    {track.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Section 6: FAQ */}
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
            marginBottom: '48px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}>
            <i className="fas fa-question-circle" style={{ color: colors.accent }} />
            What else do you want to know?
          </motion.h2>

          <motion.div variants={itemVariants} style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '24px',
            marginBottom: '40px',
          }}>
            {[
              {
                question: 'What if I\'ve never done therapy before?',
                answer: 'That\'s perfectly okay! We start with a free 15-minute consultation to help you feel comfortable and understand what to expect.'
              },
              {
                question: 'Do I need a diagnosis to work with you?',
                answer: 'Not at all. We focus on your goals and what you want to work on, not labels or diagnoses.'
              },
              {
                question: 'Can I use my HSA/FSA?',
                answer: 'Yes! HSA and FSA cards are accepted for all our services.'
              },
              {
                question: 'What if I can\'t afford your rate?',
                answer: 'We offer sliding scale pricing on a limited basis. Contact us to discuss your situation.'
              },
              {
                question: 'Are sessions virtual or in-person?',
                answer: 'We offer both virtual and in-person sessions to accommodate your preferences and schedule.'
              },
              {
                question: 'What\'s the difference between therapy and coaching?',
                answer: 'Therapy focuses on healing and processing, while coaching is more goal-oriented and forward-focused. We\'ll help you determine what\'s best for you.'
              }
            ].map((faq, index) => (
              <motion.div key={index} variants={itemVariants} style={{
                ...cardStyle,
                marginBottom: 0,
              }}>
                <h3 style={{
                  fontSize: textSizes.lg.fontSize,
                  fontFamily: textSizes.lg.fontFamily,
                  color: colors.primary,
                  fontWeight: '600',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}>
                  <i className="fas fa-question" style={{ 
                    color: colors.accent,
                    fontSize: textSizes.base.fontSize,
                    marginTop: '2px',
                    minWidth: '16px',
                  }} />
                  {faq.question}
                </h3>
                <p style={{
                  fontSize: textSizes.base.fontSize,
                  fontFamily: textSizes.base.fontFamily,
                  color: colors.text,
                  lineHeight: '1.6',
                  margin: 0,
                  paddingLeft: '24px',
                }}>
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Final CTA Section */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={{
          ...sectionStyle,
          backgroundColor: colors.surface,
          background: `linear-gradient(135deg, ${colors.primary}10, ${colors.secondary}05)`,
        }}
      >
        <div style={containerStyle}>
          <motion.div variants={itemVariants} style={{
            textAlign: 'center',
            maxWidth: '800px',
            margin: '0 auto',
          }}>
            <motion.h2 variants={itemVariants} style={{
              fontSize: isMobile ? textSizes['2xl'].fontSize : isTablet ? textSizes['3xl'].fontSize : textSizes['4xl'].fontSize,
              fontFamily: textSizes['4xl'].fontFamily,
              color: colors.primary,
              fontWeight: '700',
              marginBottom: '24px',
            }}>
              Start feeling better - on your terms.
            </motion.h2>

            <motion.p variants={itemVariants} style={{
              fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.text,
              lineHeight: '1.8',
              marginBottom: '48px',
            }}>
              Whether you're just curious or ready to dive in, we're here.
              Let's figure it out together.
            </motion.p>

            <motion.div variants={itemVariants} style={{
              display: 'flex',
              justifyContent: 'center',
              gap: isMobile ? '16px' : '24px',
              flexWrap: 'wrap',
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
                Book a Free Consult
              </button>


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
                <i className="fas fa-envelope" style={{ marginRight: '8px' }} />
                Contact Us
              </button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Contact Section */}
      <ContactSection isDarkMode={isDarkMode} />

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

export default WellnessPage;
