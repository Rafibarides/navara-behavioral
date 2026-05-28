import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getColors, getTextSizes } from '../utils/colorsAndText';
import NavBarMenu from './NavBarMenu';
import FooterSection from './Sections/FooterSection';
import ContactSection from './Sections/ContactSection';
import CalendlyModal from './CalendlyModal';
import StaffModal from './StaffModal';
import siteData from '../../SiteData.json';

const BehavioralPage = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);

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
            src="assets/service-logos/behavioral.png" 
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
            Navara Behavior Support
          </h1>
        </div>
      </section>

      {/* Navigation */}
      <NavBarMenu isDarkMode={isDarkMode} />

      {/* Division Intro + Three Services Overview */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        style={{
          ...sectionStyle,
          paddingTop: isMobile ? '50px' : '80px',
          paddingBottom: isMobile ? '20px' : '40px',
        }}
      >
        <div style={containerStyle}>
          <motion.p variants={itemVariants} style={{
            fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
            fontFamily: textSizes.xl.fontFamily,
            color: colors.text,
            lineHeight: '1.7',
            textAlign: 'center',
            maxWidth: '820px',
            margin: '0 auto 16px auto',
            fontStyle: 'italic',
          }}>
            Navara Behavior Support offers flexible, evidence-based services for families who want real results —
            without the waitlists, the insurance hoops, or the one-size-fits-all approach.
          </motion.p>

          <motion.div variants={itemVariants} style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '32px',
            marginBottom: isMobile ? '40px' : '56px',
          }}>
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

          {/* 3-service overview cards */}
          <motion.div variants={itemVariants} style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : 'repeat(3, 1fr)',
            gap: '20px',
            maxWidth: '1100px',
            margin: '0 auto',
          }}>
            {[
              {
                title: 'The Navara Behavior Method™',
                tagline: '12-Week Parent Training Program',
                description: 'Our flagship offering. A structured 12-week program built on the Four Cs Framework — Clarity, Connection, Control, and Carryover.',
                icon: 'fas fa-graduation-cap',
                anchor: 'service-method',
                featured: true,
              },
              {
                title: 'Navara Direct ABA™',
                tagline: 'Private, BCBA-Led ABA',
                description: 'Insurance-free ABA designed around your family. BCBA-only or BCBA + paraprofessional packages — scheduled on your terms.',
                icon: 'fas fa-user-md',
                anchor: 'service-direct-aba',
                featured: false,
              },
              {
                title: 'Behavioral Consulting',
                tagline: 'Expert-Level Guidance',
                description: 'A single focused session for families or professionals who need straight answers from a senior BCBA — no commitment, no program required.',
                icon: 'fas fa-comments',
                anchor: 'service-consulting',
                featured: false,
              },
            ].map((service, idx) => (
              <motion.button
                key={idx}
                onClick={() => scrollToSection(service.anchor)}
                whileHover={{
                  y: -6,
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.15)',
                  transition: { duration: 0.3 }
                }}
                style={{
                  textAlign: 'left',
                  background: service.featured
                    ? `linear-gradient(135deg, ${colors.primary}10, ${colors.secondary}08)`
                    : colors.surface,
                  borderRadius: '20px',
                  padding: isMobile ? '24px' : '28px',
                  border: service.featured
                    ? `2px solid ${colors.primary}40`
                    : `1px solid ${colors.border}`,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  fontFamily: textSizes.base.fontFamily,
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '4px',
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}15)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <i className={service.icon} style={{ fontSize: '20px', color: colors.primary }} />
                  </div>
                  {service.featured && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: colors.primary,
                      background: colors.primary + '15',
                      padding: '4px 10px',
                      borderRadius: '999px',
                    }}>
                      Flagship
                    </span>
                  )}
                </div>
                <h3 style={{
                  fontSize: textSizes.lg.fontSize,
                  fontFamily: textSizes.lg.fontFamily,
                  color: colors.text,
                  fontWeight: '700',
                  margin: 0,
                  lineHeight: '1.3',
                }}>
                  {service.title}
                </h3>
                <p style={{
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.primary,
                  fontWeight: '600',
                  margin: 0,
                }}>
                  {service.tagline}
                </p>
                <p style={{
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.text,
                  lineHeight: '1.5',
                  margin: 0,
                  flex: 1,
                }}>
                  {service.description}
                </p>
                <span style={{
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.primary,
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '6px',
                }}>
                  Learn more
                  <i className="fas fa-arrow-down" style={{ fontSize: '11px' }} />
                </span>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Service 1: The Navara Behavior Method™ — Combined Hero & Video Section */}
      <motion.section 
        id="service-method"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          ...sectionStyle,
          background: `linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}10)`,
          paddingTop: '40px',
          paddingBottom: '60px',
          position: 'relative',
        }}
      >
        <div style={containerStyle}>
          {/* Main Title */}
          <motion.h1 variants={itemVariants} style={{
            fontSize: isMobile ? textSizes['2xl'].fontSize : isTablet ? textSizes['3xl'].fontSize : textSizes['4xl'].fontSize,
            fontFamily: textSizes['4xl'].fontFamily,
            color: colors.primary,
            fontWeight: '700',
            marginBottom: '16px',
            textAlign: 'center',
            lineHeight: '1.2',
          }}>
            The Navara Behavior Method™
          </motion.h1>
          
          <motion.h2 variants={itemVariants} style={{
            fontSize: isMobile ? textSizes.lg.fontSize : isTablet ? textSizes.xl.fontSize : textSizes['2xl'].fontSize,
            fontFamily: textSizes['2xl'].fontFamily,
            color: colors.text,
            fontWeight: '600',
            marginBottom: '32px',
            textAlign: 'center',
            lineHeight: '1.3',
          }}>
            A 12-Week Parent-Led Behavior Program that Disrupts the ABA Industry
          </motion.h2>

          {/* Video Section */}
          <motion.div variants={itemVariants} style={{
            maxWidth: '900px',
            margin: '0 auto 48px auto',
            textAlign: 'center',
          }}>
            <motion.p variants={itemVariants} style={{
              fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.text,
              lineHeight: '1.6',
              marginBottom: '32px',
            }}>
              Watch this introduction to understand how we're revolutionizing behavior support
            </motion.p>

            <motion.div variants={itemVariants} style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              background: '#000',
              aspectRatio: '16/9',
              maxWidth: '100%',
              margin: '0 auto 32px auto',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              border: `4px solid ${colors.primary}20`,
            }}>
              <video
                controls
                preload="metadata"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
                poster=""
              >
                <source src="https://pub-6b585af950464b7ca12da1ee87798b6d.r2.dev/navaravideo.m4v" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </motion.div>
          </motion.div>

          {/* Content with Image */}
          <motion.div variants={itemVariants} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '32px' : '48px',
            flexDirection: isMobile ? 'column' : 'row',
            margin: '0 auto 48px auto',
            maxWidth: '1000px',
          }}>
            <motion.img 
              variants={imageVariants}
              src="/assets/parenting1.jpg"
              alt="Parent and child connection"
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
              <motion.h3 variants={itemVariants} style={{
                fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
                fontFamily: textSizes.xl.fontFamily,
                color: colors.primary,
                fontWeight: '700',
                marginBottom: '16px',
              }}>
                We don't babysit.
              </motion.h3>
              <motion.p variants={itemVariants} style={{
                fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
                fontFamily: textSizes.lg.fontFamily,
                color: colors.text,
                lineHeight: '1.8',
                margin: 0,
              }}>
                The Navara Behavior Method™ flips the script on traditional ABA. While many agencies have become glorified babysitting services, incentivized by insurance to keep your child enrolled as long as possible, we do the opposite.
              </motion.p>
            </motion.div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div variants={itemVariants} style={{
            display: 'flex',
            justifyContent: 'center',
            gap: isMobile ? '16px' : '24px',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => scrollToSection('service-method')}
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
              Learn More
            </button>

            <button
              onClick={() => scrollToSection('service-direct-aba')}
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
              Explore Direct ABA
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* Section 1: Our Behavior Support Program */}
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
          }}>
            This isn't just a behavior plan. It's a transformation.
          </motion.h2>

          <motion.div variants={itemVariants} style={{
            ...cardStyle,
            marginBottom: '40px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <motion.div
              variants={floatingVariants}
              animate="animate"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                fontSize: '60px',
                color: `${colors.primary}20`,
                zIndex: 0,
              }}
            >
              <i className="fas fa-heart" />
            </motion.div>
            <div style={{ position: 'relative', zIndex: 1 }}>
            <motion.div variants={itemVariants} style={{
              marginBottom: '32px',
            }}>
              <motion.ul style={{
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                color: colors.text,
                lineHeight: '1.8',
                paddingLeft: '0',
                listStyle: 'none',
                textAlign: 'left',
              }}>
                <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: colors.primary, fontWeight: 'bold', minWidth: '8px', marginTop: '6px' }}>•</span>
                  <span>In just 12 weeks, we train you, the parent, to become your child's behavior expert.</span>
                </li>
                <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: colors.primary, fontWeight: 'bold', minWidth: '8px', marginTop: '6px' }}>•</span>
                  <span>We focus on parent empowerment, not endless therapy hours.</span>
                </li>
                <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: colors.primary, fontWeight: 'bold', minWidth: '8px', marginTop: '6px' }}>•</span>
                  <span>We are incentivized to get results, not to extend services indefinitely.</span>
                </li>
                <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: colors.primary, fontWeight: 'bold', minWidth: '8px', marginTop: '6px' }}>•</span>
                  <span>We believe the change starts with you and not with a stranger.</span>
                </li>
              </motion.ul>
            </motion.div>

            <motion.h3 variants={itemVariants} style={{
              fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
              fontFamily: textSizes.xl.fontFamily,
              color: colors.primary,
              fontWeight: '600',
              marginBottom: '20px',
            }}>
              What You Get
            </motion.h3>

            <motion.div variants={itemVariants} style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              lineHeight: '1.8',
              marginBottom: '32px',
            }}>
              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: colors.primary, fontWeight: 'bold', minWidth: '8px', marginTop: '6px' }}>•</span>
                <div>
                  <div style={{ fontWeight: '700', marginBottom: '8px', color: colors.text }}>
                    Weekly 1:1 Sessions With Your Navara Behavior Specialist
                  </div>
                  <div style={{ color: colors.textSecondary, lineHeight: '1.6' }}>
                    Consistent, personalized guidance each week to help you understand your child's behavior, strengthen your parenting confidence, and build momentum toward real change.
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: colors.primary, fontWeight: 'bold', minWidth: '8px', marginTop: '6px' }}>•</span>
                <div>
                  <div style={{ fontWeight: '700', marginBottom: '8px', color: colors.text }}>
                    A Fully Customized Behavior Roadmap + Collaborative FBA
                  </div>
                  <div style={{ color: colors.textSecondary, lineHeight: '1.6' }}>
                    A clear, step-by-step plan created with you, identifying the "why" behind your child's behavior and outlining exactly how to respond, prevent, and support.
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: colors.primary, fontWeight: 'bold', minWidth: '8px', marginTop: '6px' }}>•</span>
                <div>
                  <div style={{ fontWeight: '700', marginBottom: '8px', color: colors.text }}>
                    Full Access to the 4Cs Framework Curriculum
                  </div>
                  <div style={{ color: colors.textSecondary, lineHeight: '1.6' }}>
                    Learn and master Navara's signature Clarity, Connection, Control, and Carryover model — a blueprint for understanding behavior, strengthening the parent-child relationship, and creating long-term stability at home.
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: colors.primary, fontWeight: 'bold', minWidth: '8px', marginTop: '6px' }}>•</span>
                <div>
                  <div style={{ fontWeight: '700', marginBottom: '8px', color: colors.text }}>
                    Unlimited Email & Check-In Support Between Sessions
                  </div>
                  <div style={{ color: colors.textSecondary, lineHeight: '1.6' }}>
                    You are never alone. Ask questions, get feedback, and stay supported as real-life situations come up throughout your week.
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: colors.primary, fontWeight: 'bold', minWidth: '8px', marginTop: '6px' }}>•</span>
                <div>
                  <div style={{ fontWeight: '700', marginBottom: '8px', color: colors.text }}>
                    Continued Coaching at a Reduced Rate Post-Program
                  </div>
                  <div style={{ color: colors.textSecondary, lineHeight: '1.6' }}>
                    For families who want ongoing support, you maintain priority access at a preferred rate.
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '0', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: colors.primary, fontWeight: 'bold', minWidth: '8px', marginTop: '6px' }}>•</span>
                <div>
                  <div style={{ fontWeight: '700', marginBottom: '8px', color: colors.text }}>
                    Tools & Strategies You Will Use for Life
                  </div>
                  <div style={{ color: colors.textSecondary, lineHeight: '1.6' }}>
                    You leave with skills that last forever — the ability to read behavior clearly, prevent escalation, respond effectively, and create a calmer, more connected home environment.
                  </div>
                </div>
              </div>
            </motion.div>

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
                <i className="fas fa-calendar-check" style={{ marginRight: '8px' }} />
                Enroll Now in the 12-Week Program
              </button>

              <div style={{
                background: `rgba(255, 255, 255, ${isDarkMode ? '0.05' : '0.8'})`,
                borderRadius: '12px',
                padding: '16px 20px',
                border: `1px solid ${colors.primary}20`,
                textAlign: 'center',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginBottom: '4px',
                }}>
                  <span style={{
                    fontSize: textSizes.sm.fontSize,
                    fontFamily: textSizes.sm.fontFamily,
                    color: colors.textSecondary,
                  }}>
                    Program Investment:
                  </span>
                  <span style={{
                    fontSize: textSizes.base.fontSize,
                    fontFamily: textSizes.base.fontFamily,
                    color: colors.primary,
                    fontWeight: '600',
                  }}>
                    $5,400
                  </span>
                </div>
                <div style={{
                  fontSize: textSizes.xs.fontSize,
                  fontFamily: textSizes.xs.fontFamily,
                  color: colors.textSecondary,
                }}>
                  Payment plans available
                </div>
              </div>
            </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Section 1.5: The Four Cs Framework */}
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
            <i className="fas fa-route" style={{ color: colors.accent }} />
            Our Proven Framework: The Four Cs
          </motion.h2>

          <motion.div variants={itemVariants} style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr',
            gap: '32px',
            marginBottom: '40px',
          }}>
            {[
              {
                title: 'Clarity (Weeks 1–3)',
                description: 'Understand the "why" behind the behavior',
                items: [
                  'Learn behavior science in plain language',
                  'Identify key patterns through guided observation',
                  'Complete a collaborative Functional Behavior Assessment (FBA)',
                  'Develop your Behavior Roadmap™'
                ],
                icon: 'fas fa-lightbulb',
                color: colors.primary
              },
              {
                title: 'Connection (Weeks 4–6)',
                description: 'Build trust while shaping change',
                items: [
                  'Master co-regulation and emotionally-attuned parenting',
                  'Implement structure that feels safe, not stiff',
                  'Build rapport with your child through play and positive reinforcement'
                ],
                icon: 'fas fa-heart',
                color: colors.secondary
              },
              {
                title: 'Control (Weeks 7–9)',
                description: 'Guide behavior with confidence',
                items: [
                  'Apply clear, predictable systems of rewards and consequences',
                  'Learn to set boundaries that work — and stick',
                  'Handle tantrums, refusals, and escalation using evidence-based tools'
                ],
                icon: 'fas fa-compass',
                color: colors.accent
              },
              {
                title: 'Carryover (Weeks 10–12)',
                description: 'Make change last',
                items: [
                  'Learn how to generalize to school, grandparents, other settings',
                  'Use scripts, routines, and visuals to promote independence',
                  'Graduate with a Behavior Toolbox™ — templates, charts, and systems that work'
                ],
                icon: 'fas fa-graduation-cap',
                color: colors.primary
              }
            ].map((phase, index) => (
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
                    color: `${phase.color}10`,
                    zIndex: 0,
                  }}
                >
                  <i className={phase.icon} />
                </motion.div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <i className={phase.icon} style={{
                    fontSize: '32px',
                    color: phase.color,
                    marginBottom: '16px',
                    display: 'block',
                  }} />
                  <h3 style={{
                    fontSize: textSizes.lg.fontSize,
                    fontFamily: textSizes.lg.fontFamily,
                    color: colors.primary,
                    fontWeight: '700',
                    marginBottom: '8px',
                  }}>
                    {phase.title}
                  </h3>
                  <p style={{
                    fontSize: textSizes.base.fontSize,
                    fontFamily: textSizes.base.fontFamily,
                    color: colors.text,
                    fontWeight: '600',
                    marginBottom: '16px',
                  }}>
                    {phase.description}
                  </p>
                  <ul style={{
                    fontSize: textSizes.sm.fontSize,
                    fontFamily: textSizes.sm.fontFamily,
                    color: colors.text,
                    lineHeight: '1.6',
                    paddingLeft: '0',
                    listStyle: 'none',
                    margin: 0,
                  }}>
                    {phase.items.map((item, itemIndex) => (
                      <li key={itemIndex} style={{
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px'
                      }}>
                        <span style={{ color: phase.color, fontWeight: 'bold', minWidth: '8px', marginTop: '2px' }}>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Service 2: Navara Direct ABA™ */}
      <motion.section
        id="service-direct-aba"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        style={sectionStyle}
      >
        <div style={containerStyle}>
          {/* Service badge */}
          <motion.div variants={itemVariants} style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '12px',
          }}>
            <span style={{
              display: 'inline-block',
              background: colors.primary + '15',
              color: colors.primary,
              padding: '6px 16px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>
              Service 2
            </span>
          </motion.div>

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
              Navara Direct ABA is a private, insurance-free ABA service designed for families who want
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
              And because we operate outside of the insurance model, we can move at your pace, adjust in
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
                price: '$800',
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
                price: '$1,500',
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
                price: '$6,000',
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

      {/* Service 3: Behavioral Consulting */}
      <motion.section
        id="service-consulting"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        style={{
          ...sectionStyle,
          background: `linear-gradient(135deg, ${colors.primary}08, ${colors.secondary}04)`,
        }}
      >
        <div style={containerStyle}>
          {/* Service badge */}
          <motion.div variants={itemVariants} style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '12px',
          }}>
            <span style={{
              display: 'inline-block',
              background: colors.primary + '15',
              color: colors.primary,
              padding: '6px 16px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>
              Service 3
            </span>
          </motion.div>

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

      {/* Section 3: FAQ */}
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
            <i className="fas fa-question-circle" style={{ color: colors.accent }} />
            Frequently Asked Questions
          </motion.h2>

          <motion.div variants={itemVariants} style={{
            maxWidth: '800px',
            margin: '0 auto',
          }}>
            {[
              {
                question: "Is this just another version of ABA?",
                answer: "No — this is a behavior intervention program for the parent. While rooted in ABA principles, this is about helping you understand and manage your child's behavior with confidence."
              },
              {
                question: "Is this only for kids with Autism?",
                answer: "No. While it works extremely well for children with Autism, ADHD, anxiety, or ODD, it's for any child with challenging behavior — tantrums, refusals, aggression, rigidity, etc."
              },
              {
                question: "What if my child is already in therapy?",
                answer: "No problem. This program works alongside or instead of therapy. In fact, many families report better outcomes because they understand how to maintain progress at home."
              },
              {
                question: "Can I participate even if I work full-time?",
                answer: "Yes. Sessions are scheduled flexibly — evenings, weekends, or early mornings. You only need 60–75 minutes per week for coaching, and the rest is integrated into your daily routine."
              },
              {
                question: "What if I miss a session?",
                answer: "We allow for one rescheduled session during the 12 weeks. If more are needed, we offer optional makeup sessions at a discounted rate."
              },
              {
                question: "Do both parents attend?",
                answer: "We recommend both caregivers attend whenever possible, but it is not required. Solo parents and grandparents often succeed with this program."
              },
              {
                question: "Can this replace traditional ABA?",
                answer: "Yes — for many families, it becomes the preferred option. You get real results without relying on 20–30 hours/week of outside therapy."
              },
              {
                question: "What happens after the 12 weeks?",
                answer: "You'll have a solid foundation — but we offer maintenance sessions, check-ins, or re-enrollment options if desired."
              }
            ].map((faq, index) => (
              <motion.div key={index} variants={itemVariants} style={{
                ...cardStyle,
                marginBottom: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
              onMouseEnter={(e) => {
                if (openFAQ !== index) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (openFAQ !== index) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                }
              }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: openFAQ === index ? '16px' : '0',
                }}>
                  <h3 style={{
                    fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
                    fontFamily: textSizes.lg.fontFamily,
                    color: colors.primary,
                    fontWeight: '600',
                    margin: 0,
                    flex: 1,
                    paddingRight: '16px',
                  }}>
                    {faq.question}
                  </h3>
                  <i className={`fas fa-chevron-${openFAQ === index ? 'up' : 'down'}`} style={{
                    color: colors.primary,
                    fontSize: '16px',
                    transition: 'transform 0.3s ease',
                  }} />
                </div>
                
                <div style={{
                  maxHeight: openFAQ === index ? '200px' : '0',
                  opacity: openFAQ === index ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'all 0.4s ease',
                }}>
                  <p style={{
                    fontSize: textSizes.base.fontSize,
                    fontFamily: textSizes.base.fontFamily,
                    color: colors.text,
                    lineHeight: '1.7',
                    margin: 0,
                    paddingTop: openFAQ === index ? '0' : '16px',
                  }}>
                    {faq.answer}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Section 4: Pricing and CTA */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={sectionStyle}
      >
        <div style={containerStyle}>
          <motion.div variants={itemVariants} style={{
            textAlign: 'center',
            marginBottom: '48px',
            maxWidth: '700px',
            margin: '0 auto 48px auto',
          }}>
            <motion.h2 variants={itemVariants} style={{
              fontSize: isMobile ? textSizes['2xl'].fontSize : isTablet ? textSizes['3xl'].fontSize : textSizes['3xl'].fontSize,
              fontFamily: textSizes['3xl'].fontFamily,
              color: colors.primary,
              fontWeight: '700',
              marginBottom: '24px',
            }}>
              Your Investment
            </motion.h2>
            
            <motion.p variants={itemVariants} style={{
              fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.text,
              lineHeight: '1.8',
              marginBottom: '20px',
            }}>
              You're not purchasing sessions. You're investing in a structured, evidence-based system that changes how you understand, respond to, and guide your child long after the 12 weeks are over.
            </motion.p>
            
            <motion.p variants={itemVariants} style={{
              fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.textSecondary,
              lineHeight: '1.8',
              marginBottom: '32px',
            }}>
              The Navara Behavior Method™ is designed to replace years of trial-and-error, conflicting advice, and reactive parenting with clarity, confidence, and a repeatable framework you can use for life.
            </motion.p>
            
            <motion.div variants={itemVariants} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}>
              <span style={{
                fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
                fontFamily: textSizes.lg.fontFamily,
                color: colors.text,
                fontWeight: '500',
              }}>
                Program Investment:
              </span>
              <span style={{
                fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
                fontFamily: textSizes.xl.fontFamily,
                color: colors.primary,
                fontWeight: '600',
              }}>
                $5,400
              </span>
            </motion.div>
            
            <motion.p variants={itemVariants} style={{
              fontSize: textSizes.sm.fontSize,
              fontFamily: textSizes.sm.fontFamily,
              color: colors.textSecondary,
              fontStyle: 'italic',
            }}>
              Limited enrollment per cohort to ensure depth, quality, and individualized support.
            </motion.p>
          </motion.div>

          <motion.div variants={itemVariants} style={{
            display: 'flex',
            justifyContent: 'center',
            gap: isMobile ? '16px' : '24px',
            flexWrap: 'wrap',
            marginBottom: '32px',
          }}>
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
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
              }}
            >
              <i className="fas fa-phone" style={{ marginRight: '8px' }} />
              Book a Free 15-Minute Consultation
            </a>

            <button
              onClick={() => setIsCalendlyModalOpen(true)}
              style={{
                ...buttonStyle,
                background: `linear-gradient(135deg, ${colors.secondary}, ${colors.accent})`,
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
              Enroll Now in the 12-Week Program
            </button>
          </motion.div>

          <motion.div variants={itemVariants} style={{
            textAlign: 'center',
          }}>
            <button
              onClick={() => scrollToSection('service-consulting')}
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
              <i className="fas fa-comments" style={{ marginRight: '8px' }} />
              Need Just an Expert Opinion? Book a Consult
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* Behavioral Support Team Section */}
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
            <i className="fas fa-users" style={{ color: colors.accent }} />
            Meet Our Behavioral Support Team
          </motion.h2>
          
          <motion.p variants={itemVariants} style={{
            fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
            fontFamily: textSizes.lg.fontFamily,
            color: colors.textSecondary,
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto 48px auto',
            textAlign: 'center',
          }}>
            Expert professionals trained in the Navara Behavior Method™
          </motion.p>

          {/* Team Cards Grid */}
          <motion.div variants={itemVariants} style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '30px',
            justifyContent: 'center',
            alignItems: 'stretch',
          }}>
            {/* Include founder and behavior support team members */}
            {[siteData.sections.team.founder, ...(siteData.sections.team.divisions
              .find(division => division.title === "Behavior Support")
              ?.members || [])].map((member, memberIndex) => (
              <motion.div
                key={memberIndex}
                variants={itemVariants}
                onClick={() => setSelectedStaff(member)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: '24px',
                  padding: isMobile ? '40px 30px' : '35px 25px',
                  textAlign: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  position: 'relative',
                  maxWidth: isMobile ? '100%' : '280px',
                  width: isMobile ? '100%' : '280px',
                  height: isMobile ? 'auto' : '380px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                whileHover={{
                  y: -8,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                  transition: { duration: 0.3 }
                }}
              >
                {/* Decorative Background Element */}
                <motion.div
                  variants={floatingVariants}
                  animate="animate"
                  style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '120px',
                    height: '120px',
                    backgroundColor: memberIndex % 2 === 0 ? colors.primary + '15' : colors.secondary + '15',
                    borderRadius: '50%',
                    zIndex: 1,
                  }}
                />

                {/* Profile Photo */}
                <div style={{
                  position: 'relative',
                  zIndex: 2,
                  marginBottom: isMobile ? '24px' : '20px',
                }}>
                  <img
                    src={member.photo}
                    alt={member.name}
                    style={{
                      width: isMobile ? '120px' : '100px',
                      height: isMobile ? '120px' : '100px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `4px solid ${colors.surface}`,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    }}
                  />
                </div>

                {/* Name */}
                <h4 style={{
                  fontSize: isMobile ? textSizes.xl.fontSize : textSizes.lg.fontSize,
                  fontFamily: isMobile ? textSizes.xl.fontFamily : textSizes.lg.fontFamily,
                  color: colors.text,
                  fontWeight: '600',
                  marginBottom: '8px',
                  position: 'relative',
                  zIndex: 2,
                }}>
                  {member.name}
                </h4>

                {/* Position */}
                <p style={{
                  fontSize: isMobile ? textSizes.base.fontSize : textSizes.sm.fontSize,
                  fontFamily: isMobile ? textSizes.base.fontFamily : textSizes.sm.fontFamily,
                  color: colors.primary,
                  fontWeight: '500',
                  marginBottom: '16px',
                  fontStyle: 'italic',
                  position: 'relative',
                  zIndex: 2,
                }}>
                  {member.position}
                </p>

                {/* Intro Sentence */}
                <p style={{
                  fontSize: isMobile ? textSizes.sm.fontSize : textSizes.xs.fontSize,
                  fontFamily: isMobile ? textSizes.sm.fontFamily : textSizes.xs.fontFamily,
                  color: colors.textSecondary,
                  lineHeight: '1.5',
                  margin: 0,
                  position: 'relative',
                  zIndex: 2,
                  flex: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {member.introSentence}
                </p>

                {/* Click indicator */}
                <div style={{
                  marginTop: '20px',
                  fontSize: textSizes.xs.fontSize,
                  fontFamily: textSizes.xs.fontFamily,
                  color: colors.primary,
                  fontWeight: '500',
                  position: 'relative',
                  zIndex: 2,
                }}>
                  Click to learn more →
                </div>
              </motion.div>
            ))}
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

      {/* Staff Modal */}
      {selectedStaff && (
        <StaffModal
          staff={selectedStaff}
          isDarkMode={isDarkMode}
          onClose={() => setSelectedStaff(null)}
        />
      )}
    </div>
  );
};

export default BehavioralPage; 