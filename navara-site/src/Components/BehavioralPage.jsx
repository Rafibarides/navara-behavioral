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
  const [selectedCoach, setSelectedCoach] = useState('bcba');

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
            Behavioral Support
          </h1>
        </div>
      </section>

      {/* Navigation */}
      <NavBarMenu isDarkMode={isDarkMode} />

      {/* Combined Hero & Video Section */}
      <motion.section 
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
              Learn More
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
              Book Individual Coaching
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
                    Weekly 1:1 Sessions With Your Navara BCBA
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
            Not ready for a full program?
          </motion.h2>
          
          <motion.h3 variants={itemVariants} style={{
            fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
            fontFamily: textSizes.xl.fontFamily,
            color: colors.text,
            fontWeight: '600',
            marginBottom: '24px',
            textAlign: 'center',
          }}>
            Try a 1:1 coaching session first!
          </motion.h3>

          <motion.div variants={itemVariants} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '20px' : '40px',
            flexDirection: isMobile ? 'column' : 'row-reverse',
            margin: '0 auto 48px auto',
            maxWidth: '1000px',
          }}>
            <motion.img 
              variants={imageVariants}
              src="/assets/parenting2.jpg"
              alt="One-on-one coaching session"
              style={{
                width: isMobile ? '200px' : '250px',
                height: isMobile ? '200px' : '250px',
                borderRadius: '20px',
                objectFit: 'cover',
                border: `4px solid ${colors.secondary}30`,
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                transform: 'rotate(2deg)',
              }}
            />
            <motion.div style={{ textAlign: isMobile ? 'center' : 'left', maxWidth: '500px' }}>
              <motion.p variants={itemVariants} style={{
                fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
                fontFamily: textSizes.base.fontFamily,
                color: colors.text,
                lineHeight: '1.8',
                margin: 0,
              }}>
                Book a 45-minute private session with one of our BCBAs trained in the Navara Behavior Method™
              </motion.p>
            </motion.div>
          </motion.div>

          {/* Combined Coaching Options */}
          <motion.div variants={itemVariants} style={{
            ...cardStyle,
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden',
            maxWidth: '600px',
            margin: '0 auto 32px auto',
          }}>
            <motion.div
              variants={floatingVariants}
              animate="animate"
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                fontSize: isMobile ? '40px' : '45px',
                color: `${colors.secondary}15`,
                zIndex: 0,
              }}
            >
              <i className="fas fa-user-md" />
            </motion.div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <motion.h3 variants={itemVariants} style={{
                fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
                fontFamily: textSizes.xl.fontFamily,
                color: colors.primary,
                fontWeight: '600',
                marginBottom: '16px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}>
                <i className="fas fa-calendar-check" style={{ color: colors.accent, fontSize: '20px' }} />
                1:1 Coaching Session
              </motion.h3>

              <motion.p variants={itemVariants} style={{
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                color: colors.text,
                lineHeight: '1.6',
                marginBottom: '24px',
                textAlign: 'center',
              }}>
                Choose your preferred coach for personalized behavioral support
              </motion.p>

              {/* Coach Selection Dropdown */}
              <motion.div variants={itemVariants} style={{
                marginBottom: '24px',
              }}>
                <select
                  value={selectedCoach}
                  onChange={(e) => setSelectedCoach(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: `2px solid ${colors.primary}30`,
                    background: `rgba(255, 255, 255, ${isDarkMode ? '0.05' : '0.95'})`,
                    color: colors.text,
                    fontSize: textSizes.base.fontSize,
                    fontFamily: textSizes.base.fontFamily,
                    fontWeight: '500',
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${colors.primary.replace('#', '%23')}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '20px',
                    paddingRight: '40px',
                  }}
                >
                  <option value="bcba">Navara BCBA - Expert support from certified BCBAs</option>
                  <option value="david">David Nisan Fetman - Founder & Director</option>
                </select>
              </motion.div>

              {/* Pricing Display */}
              <motion.div variants={itemVariants} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '24px',
              }}>
                <div style={{
                  background: `rgba(255, 255, 255, ${isDarkMode ? '0.05' : '0.8'})`,
                  borderRadius: '8px',
                  padding: '12px 16px',
                  border: `1px solid ${colors.primary}30`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{
                    fontSize: textSizes.base.fontSize,
                    fontFamily: textSizes.base.fontFamily,
                    color: colors.text,
                    fontWeight: '500',
                  }}>
                    {selectedCoach === 'bcba' ? 'Intro Session:' : '45-min Intro Session:'}
                  </span>
                  <span style={{
                    fontSize: textSizes.lg.fontSize,
                    fontFamily: textSizes.lg.fontFamily,
                    color: colors.primary,
                    fontWeight: '700',
                  }}>
                    {selectedCoach === 'bcba' ? '$85' : '$125'}
                  </span>
                </div>

                <div style={{
                  background: `rgba(255, 255, 255, ${isDarkMode ? '0.05' : '0.8'})`,
                  borderRadius: '8px',
                  padding: '12px 16px',
                  border: `1px solid ${colors.primary}30`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{
                    fontSize: textSizes.base.fontSize,
                    fontFamily: textSizes.base.fontFamily,
                    color: colors.text,
                    fontWeight: '500',
                  }}>
                    45-min Follow-Up:
                  </span>
                  <span style={{
                    fontSize: textSizes.lg.fontSize,
                    fontFamily: textSizes.lg.fontFamily,
                    color: colors.primary,
                    fontWeight: '700',
                  }}>
                    {selectedCoach === 'bcba' ? '$115' : '$150'}
                  </span>
                </div>
              </motion.div>

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
                    fontSize: textSizes.base.fontSize,
                    padding: isMobile ? '12px 24px' : '14px 32px',
                    minWidth: '200px',
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
                  Book {selectedCoach === 'bcba' ? 'with Navara BCBA' : 'with David'}
                </button>
              </motion.div>
            </div>
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
          }}>
            <motion.h2 variants={itemVariants} style={{
              fontSize: isMobile ? textSizes['2xl'].fontSize : isTablet ? textSizes['3xl'].fontSize : textSizes['3xl'].fontSize,
              fontFamily: textSizes['3xl'].fontFamily,
              color: colors.primary,
              fontWeight: '700',
              marginBottom: '16px',
            }}>
              Pricing
            </motion.h2>
            
            <motion.p variants={itemVariants} style={{
              fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.text,
              lineHeight: '1.8',
              marginBottom: '24px',
            }}>
              You're not just paying for 12 weeks.<br />
              You're investing in a lifetime of clarity, connection, and confidence.
            </motion.p>
            
            <motion.div variants={itemVariants} style={{
              ...cardStyle,
              background: `linear-gradient(135deg, ${colors.primary}10, ${colors.secondary}05)`,
              border: `2px solid ${colors.primary}30`,
              display: 'inline-block',
              padding: '32px 48px',
            }}>
              <div style={{
                fontSize: isMobile ? textSizes['2xl'].fontSize : textSizes['3xl'].fontSize,
                fontFamily: textSizes['3xl'].fontFamily,
                color: colors.primary,
                fontWeight: '700',
                marginBottom: '16px',
              }}>
                $3,500
              </div>
            </motion.div>
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
              <i className="fas fa-arrow-up" style={{ marginRight: '8px' }} />
              Not Ready Yet? Book a Coaching Session First
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