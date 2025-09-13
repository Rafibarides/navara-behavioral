import React, { useState, useEffect } from 'react';
import { getColors, getTextSizes } from '../utils/colorsAndText';
import NavBarMenu from './NavBarMenu';
import FooterSection from './Sections/FooterSection';
import ContactSection from './Sections/ContactSection';
import CalendlyModal from './CalendlyModal';
import siteData from '../../SiteData.json';
import { motion } from 'framer-motion';

const DiagnosticsPage = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);

  // Function to scroll to contact section
  const scrollToContact = () => {
    const contactSection = document.querySelector('#contact-section');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Get data from siteData
  const {
    hero,
    whyChoose,
    whatWeTest,
    whoWeServe,
    timeline,
    pricing,
    cta
  } = siteData.sections.diagnosticsPage;

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
    padding: isMobile ? '40px 20px' : '80px 40px',
  };

  const headingStyle = {
    fontSize: isMobile ? textSizes['2xl'].fontSize : textSizes['4xl'].fontSize,
    fontFamily: textSizes['4xl'].fontFamily,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: '16px',
    textAlign: 'center',
  };

  const subheadingStyle = {
    fontSize: isMobile ? textSizes.lg.fontSize : textSizes['2xl'].fontSize,
    fontFamily: textSizes['2xl'].fontFamily,
    color: colors.text,
    fontWeight: '600',
    marginBottom: '32px',
    textAlign: 'center',
  };

  const sectionHeadingStyle = {
    fontSize: isMobile ? textSizes.xl.fontSize : textSizes['2xl'].fontSize,
    fontFamily: textSizes['2xl'].fontFamily,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: '24px',
  };

  const listItemStyle = {
    fontSize: textSizes.base.fontSize,
    fontFamily: textSizes.base.fontFamily,
    color: colors.text,
    lineHeight: '1.8',
    marginBottom: '12px',
    paddingLeft: '20px',
    position: 'relative',
  };

  const bulletStyle = {
    position: 'absolute',
    left: '0',
    color: colors.primary,
    fontWeight: 'bold',
  };

  const cardStyle = {
    background: `rgba(255, 255, 255, ${isDarkMode ? '0.1' : '0.9'})`,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: isMobile ? '24px' : '32px',
    marginBottom: '32px',
    border: `1px solid rgba(255, 255, 255, ${isDarkMode ? '0.2' : '0.3'})`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  };

  const glassMorphCardStyle = {
    background: `rgba(255, 255, 255, 0.15)`,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: isMobile ? '24px' : '32px',
    marginBottom: '32px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  };

  const contactButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
    color: 'white',
    padding: '12px 24px',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: textSizes.base.fontSize,
    fontFamily: textSizes.base.fontFamily,
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginRight: '16px',
    marginBottom: '16px',
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

  // Function to get benefit icons
  const getBenefitIcon = (index) => {
    const icons = [
      'fas fa-clock',           // Fast Turnaround
      'fas fa-file-alt',        // Clear, Actionable Reports  
      'fas fa-users',           // Multidisciplinary Expertise
      'fas fa-heart',           // Parent-Friendly Process
      'fas fa-handshake'        // School & Treatment Collaboration
    ];
    return icons[index] || 'fas fa-check';
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

        {/* Diagnostics Logo in top left corner */}
        <img 
          src="assets/service-logos/diagnostics.png" 
          alt="Diagnostics Logo"
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
          {/* Diagnostics Text */}
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
            Diagnostics
          </h1>
        </div>
      </section>

      {/* Navigation */}
      <NavBarMenu isDarkMode={isDarkMode} />

      {/* Why Choose Navara Diagnostics */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={{
          ...sectionStyle,
          backgroundColor: colors.surface,
          position: 'relative',
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
            <i className="fas fa-award" style={{ color: colors.accent }} />
            {whyChoose.title}
          </motion.h2>

          <motion.div variants={itemVariants} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '20px' : '40px',
            flexDirection: isMobile ? 'column' : 'row',
            margin: '0 auto 48px auto',
            maxWidth: '1000px',
          }}>
            <motion.img 
              variants={imageVariants}
              src="/assets/NAVARA1.jpg"
              alt="Professional diagnostic assessment"
              style={{
                width: isMobile ? '220px' : '280px',
                height: isMobile ? '180px' : '220px',
                borderRadius: '20px',
                objectFit: 'cover',
                border: `4px solid ${colors.primary}30`,
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                transform: 'rotate(-2deg)',
              }}
            />
            <motion.div style={{ textAlign: isMobile ? 'center' : 'left', maxWidth: '500px' }}>
              <motion.p variants={itemVariants} style={{
                fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
                fontFamily: textSizes.lg.fontFamily,
                color: colors.text,
                lineHeight: '1.8',
                marginBottom: '24px',
              }}>
                Fast, clear, actionable diagnostic evaluations that empower families with the insights they need to move forward with confidence.
              </motion.p>
              
              <motion.div variants={itemVariants} style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                {['No Waitlists', 'Clear Reports', 'Expert Team', 'Parent-Friendly'].map((tag, index) => (
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
                    {tag}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants} style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr 1fr',
            gap: '24px',
            marginBottom: '40px',
          }}>
            {whyChoose.benefits.map((benefit, index) => (
              <motion.div 
                key={index} 
                variants={itemVariants} 
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  ...cardStyle,
                  marginBottom: 0,
                  position: 'relative',
                  overflow: 'hidden',
                  textAlign: 'center',
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
                    color: `${colors.primary}10`,
                    zIndex: 0,
                  }}
                >
                  <i className={getBenefitIcon(index)} />
                </motion.div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <i className={getBenefitIcon(index)} style={{
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
                    {benefit.title}
                  </h3>
                  <p style={{
                    fontSize: textSizes.base.fontSize,
                    fontFamily: textSizes.base.fontFamily,
                    color: colors.text,
                    lineHeight: '1.6',
                    margin: 0,
                  }}>
                    {benefit.description}
                  </p>
              </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Enhanced Blue Hero Section with Parallax */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={{
          backgroundColor: '#1B3B62',
          backgroundImage: `linear-gradient(135deg, #1B3B62 0%, #1A2A40 100%)`,
          backgroundAttachment: 'fixed',
          width: '100vw',
          margin: 0,
          boxSizing: 'border-box',
          paddingTop: isMobile ? '60px' : '80px',
          paddingBottom: isMobile ? '60px' : '80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated Background Elements */}
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
          position: 'absolute',
            top: '10%',
            right: '10%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: `linear-gradient(45deg, ${colors.primary}20, ${colors.accent}10)`,
            zIndex: 1,
          }}
        />
        
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: isMobile ? '20px 20px' : '40px 40px',
          position: 'relative',
          zIndex: 10,
        }}>
          <motion.div variants={itemVariants} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '30px' : '50px',
            flexDirection: isMobile ? 'column' : 'row-reverse',
            marginBottom: '40px',
          }}>
            <motion.img 
              variants={imageVariants}
              src="/assets/NAVARA4.jpg"
              alt="Expert diagnostic consultation"
              style={{
                width: isMobile ? '200px' : '250px',
                height: isMobile ? '200px' : '250px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              }}
            />
            <motion.div style={{ textAlign: isMobile ? 'center' : 'left', maxWidth: '600px' }}>
          <motion.h2 variants={itemVariants} style={{
            fontSize: isMobile ? textSizes.xl.fontSize : textSizes['2xl'].fontSize,
            fontFamily: textSizes['2xl'].fontFamily,
            color: 'rgba(255, 255, 255, 0.9)',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            fontWeight: '600',
            marginBottom: '24px',
          }}>
            {hero.subtitle}
          </motion.h2>
          <motion.p variants={itemVariants} style={{
            fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
            fontFamily: textSizes.lg.fontFamily,
            color: 'rgba(255, 255, 255, 0.85)',
            lineHeight: '1.6',
                marginBottom: '32px',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}>
            {hero.description}
          </motion.p>
          
          {/* Get in Touch CTA Button */}
              <motion.div variants={itemVariants}>
            <button
              onClick={scrollToContact}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                color: 'white',
                padding: isMobile ? '12px 24px' : '16px 32px',
                borderRadius: '12px',
                fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
                fontFamily: textSizes.lg.fontFamily,
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
                  <i className="fas fa-calendar-check" />
                  Get Started Today
            </button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* What We Test For & Who We Serve */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={{
          ...sectionStyle,
          backgroundImage: `url('/assets/NAVARA1.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          position: 'relative',
        }}
      >
        {/* Glass morphism overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `rgba(${isDarkMode ? '26, 26, 26' : '242, 242, 242'}, 0.9)`,
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
        }} />
        
        <div style={{
          ...containerStyle,
          position: 'relative',
          zIndex: 10,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '32px' }}>
            <motion.div variants={itemVariants} style={{
              ...glassMorphCardStyle,
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
                  fontSize: '50px',
                  color: `${colors.primary}15`,
                  zIndex: 0,
                }}
              >
                <i className="fas fa-brain" />
              </motion.div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{
                  ...sectionHeadingStyle, 
                  color: isDarkMode ? 'white' : colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '24px',
                }}>
                  <i className="fas fa-brain" style={{ color: colors.primary }} />
                  {whatWeTest.title}
                </h2>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '16px',
                }}>
              {whatWeTest.conditions.map((condition, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        ...pillStyle,
                        background: `rgba(${isDarkMode ? '255, 255, 255' : '27, 59, 98'}, 0.1)`,
                        border: `1px solid ${colors.primary}40`,
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05) translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1) translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <i className="fas fa-check" style={{ color: colors.primary, fontSize: '12px' }} />
                  {condition}
                    </motion.div>
              ))}
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} style={{
              ...glassMorphCardStyle,
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
                  fontSize: '50px',
                  color: `${colors.secondary}15`,
                  zIndex: 0,
                }}
              >
                <i className="fas fa-users" />
              </motion.div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{
                  ...sectionHeadingStyle, 
                  color: isDarkMode ? 'white' : colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '24px',
                }}>
                  <i className="fas fa-users" style={{ color: colors.secondary }} />
                  {whoWeServe.title}
                </h2>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '16px',
                }}>
              {whoWeServe.audiences.map((audience, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        ...pillStyle,
                        background: `rgba(${isDarkMode ? '255, 255, 255' : '26, 42, 64'}, 0.1)`,
                        border: `1px solid ${colors.secondary}40`,
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05) translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1) translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <i className="fas fa-user" style={{ color: colors.secondary, fontSize: '12px' }} />
                  {audience}
                    </motion.div>
              ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* What to Expect - Vertical Timeline */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={{
          ...sectionStyle,
          background: `linear-gradient(135deg, ${colors.accent}20, ${colors.primary}10)`,
        }}
      >
        <div style={containerStyle}>
          <motion.div variants={itemVariants} style={cardStyle}>
            <h2 style={{
              ...sectionHeadingStyle,
              textAlign: 'center',
              marginBottom: '48px',
            }}>
              <TypingText text={timeline.title} delay={0.2} />
            </h2>
            
            {/* Timeline Container */}
            <div style={{
              position: 'relative',
              maxWidth: '800px',
              margin: '0 auto',
              padding: '0 20px',
            }}>
              {/* Timeline Steps */}
              {timeline.steps.map((step, index) => (
                <motion.div
                  key={index}
                  variants={{
                    hidden: { opacity: 0, x: -50 },
                    visible: {
                      opacity: 1,
                      x: 0,
                      transition: {
                        duration: 0.6,
                        delay: index * 0.2,
                        ease: "easeOut"
                      }
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginBottom: index === timeline.steps.length - 1 ? '0' : '48px',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  {/* Timeline Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.2 + 0.3,
                      type: "spring",
                      stiffness: 200
                    }}
                    viewport={{ once: true }}
                    style={{
                      width: isMobile ? '60px' : '80px',
                      height: isMobile ? '60px' : '80px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '24px',
                      flexShrink: 0,
                      boxShadow: `0 4px 20px ${colors.primary}40`,
                      border: '3px solid white',
                      position: 'relative',
                    }}
                  >
                    <i 
                      className={step.icon}
                      style={{
                        fontSize: isMobile ? '20px' : '24px',
                        color: 'white',
                      }}
                    />
                    
                    {/* Step Number */}
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.2 + 0.6,
                        type: "spring"
                      }}
                      viewport={{ once: true }}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: colors.accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: colors.primary,
                        border: '2px solid white',
                      }}
                    >
                      {index + 1}
                    </motion.div>
                  </motion.div>
                  
                  {/* Content */}
                  <div style={{ flex: 1, paddingTop: '8px' }}>
                    <motion.h3
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          transition: {
                            duration: 0.4,
                            delay: index * 0.2 + 0.4
                          }
                        }
                      }}
                      style={{
                        fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
                        fontFamily: textSizes.xl.fontFamily,
                        color: colors.primary,
                        fontWeight: '700',
                        marginBottom: '8px',
                        margin: 0,
                      }}
                    >
                      {step.title}
                    </motion.h3>
                    <motion.p
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          transition: {
                            duration: 0.4,
                            delay: index * 0.2 + 0.5
                          }
                        }
                      }}
                      style={{
                        fontSize: textSizes.base.fontSize,
                        fontFamily: textSizes.base.fontFamily,
                        color: colors.text,
                        lineHeight: '1.6',
                        margin: 0,
                      }}
                    >
                      {step.description}
                    </motion.p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Packages & Pricing */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={sectionStyle}
      >
        <div style={containerStyle}>
          <motion.div variants={itemVariants} style={cardStyle}>
            <h2 style={sectionHeadingStyle}>{pricing.title}</h2>
            <p style={{
              fontSize: textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.text,
              lineHeight: '1.8',
              marginBottom: '24px',
            }}>
              {pricing.description}
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {pricing.packages.map((pkg, index) => (
                <div key={index} style={{
                  background: `rgba(27, 59, 98, 0.1)`,
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                  border: '1px solid rgba(27, 59, 98, 0.2)',
                }}>
                  <h3 style={{
                    fontSize: textSizes.lg.fontSize,
                    fontFamily: textSizes.lg.fontFamily,
                    color: colors.primary,
                    fontWeight: '700',
                    marginBottom: '8px',
                  }}>
                    {pkg.title}
                  </h3>
                  <p style={{
                    fontSize: textSizes.xl.fontSize,
                    fontFamily: textSizes.xl.fontFamily,
                    color: colors.text,
                    fontWeight: '600',
                    margin: 0,
                  }}>
                    {pkg.price}
                  </p>
                </div>
              ))}
            </div>
            
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.textSecondary,
              lineHeight: '1.6',
              textAlign: 'center',
              fontStyle: 'italic',
            }}>
              {pricing.note}
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Call to Action */}
      <motion.section 
        id="contact-section"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={{
          backgroundColor: '#1B3B62',
          backgroundImage: `linear-gradient(135deg, #1B3B62 0%, #1A2A40 100%)`,
          width: '100vw',
          margin: 0,
          boxSizing: 'border-box',
        }}
      >
        <div style={containerStyle}>
          <motion.div variants={itemVariants} style={{
            ...glassMorphCardStyle,
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.15)',
          }}>
            <h2 style={{
              ...sectionHeadingStyle,
              fontSize: isMobile ? textSizes['2xl'].fontSize : textSizes['3xl'].fontSize,
              textAlign: 'center',
              marginBottom: '16px',
              color: 'white',
            }}>
              {cta.title}
            </h2>
            <p style={{
              fontSize: textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: '1.8',
              marginBottom: '16px',
            }}>
              {cta.description}
            </p>
            <p style={{
              fontSize: textSizes.xl.fontSize,
              fontFamily: textSizes.xl.fontFamily,
              color: 'white',
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: '32px',
              fontStyle: 'italic',
            }}>
              {cta.subtitle}
            </p>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}>
              <a href="tel:+18777628272" style={{
                ...contactButtonStyle,
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
              }}>
                <i className="fas fa-phone" />
                Call Us: {cta.contact.phone}
              </a>
              <a href={`mailto:${cta.contact.email}`} style={{
                ...contactButtonStyle,
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#1B3B62',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                fontSize: isMobile ? textSizes.sm.fontSize : textSizes.base.fontSize,
                padding: isMobile ? '10px 16px' : '12px 24px',
                maxWidth: isMobile ? 'calc(100vw - 80px)' : 'none',
                minWidth: 'auto',
                wordBreak: 'break-all',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: isMobile ? 'nowrap' : 'normal',
              }}>
                <i className="fas fa-envelope" />
                {isMobile ? 'Email Us' : cta.contact.email}
              </a>
              <button 
                onClick={() => setIsCalendlyModalOpen(true)}
                style={{
                  ...contactButtonStyle,
                  background: 'rgba(203, 217, 197, 0.3)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(203, 217, 197, 0.4)',
                  color: 'white',
                }}
              >
                <i className="fas fa-calendar" />
                {cta.contact.schedule}
              </button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Floating Contact Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        onClick={scrollToContact}
        style={{
          position: 'fixed',
          bottom: isMobile ? '20px' : '30px',
          left: isMobile ? '20px' : '30px',
          width: isMobile ? '50px' : '60px',
          height: isMobile ? '50px' : '60px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
          border: 'none',
          boxShadow: '0 4px 20px rgba(27, 59, 98, 0.4)',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={(e) => {
          e.target.style.boxShadow = '0 6px 30px rgba(27, 59, 98, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.target.style.boxShadow = '0 4px 20px rgba(27, 59, 98, 0.4)';
        }}
      >
        <i 
          className="fas fa-calendar" 
          style={{
            color: 'white',
            fontSize: isMobile ? '20px' : '24px',
          }}
        />
      </motion.button>

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

export default DiagnosticsPage;
