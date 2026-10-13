import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getColors, getTextSizes } from '../utils/colorsAndText';
import NavBarMenu from './NavBarMenu';
import FooterSection from './Sections/FooterSection';
import ContactSection from './Sections/ContactSection';
import CalendlyModal from './CalendlyModal';
import StaffModal from './StaffModal';
import siteData from '../../SiteData.json';

const ParentTrainingPage = ({ isDarkMode = false }) => {

  const [autoRevealCount, setAutoRevealCount] = useState(0);
  useEffect(() => {
    const start = setTimeout(() => setAutoRevealCount(1), 2500);
    return () => { clearTimeout(start); };
  }, []);
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
  const [isTablet, setIsTablet] = useState(() => window.matchMedia('(min-width: 769px) and (max-width: 1024px)').matches);
  const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const navigate = useNavigate();

  // Get the behavioral service from siteData
  const behavioralService = siteData.sections.services.behavioral;

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
        viewport={{ once: true, amount: isMobile ? 0.01 : 0.5 }}
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
            style={{ display: 'inline-block', whiteSpace: 'pre-wrap' }}
          >
            {word}{' '}
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
            The Navara Behavior Method™
          </h1>
        </div>
      </section>

      {/* Navigation */}
      <NavBarMenu isDarkMode={isDarkMode} />

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
            A 12-Week Clinical Training Program — For the Parent, Not the Child
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
              A short introduction to how the program works
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
                When plans fail, parents get blamed.
              </motion.h3>
              <motion.p variants={itemVariants} style={{
                fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
                fontFamily: textSizes.lg.fontFamily,
                color: colors.text,
                lineHeight: '1.8',
                margin: 0,
              }}>
                It is almost always the parent who is told they did not follow through. We built the Navara Behavior Method™ on the opposite assumption: that most plans fail because they were handed to parents instead of built with them. So across twelve weeks we teach you the same clinical reasoning a behavior analyst uses — the research, the assessment, the plan — and you build your child's plan yourself, with a BCBA beside you.
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
              onClick={() => navigate('/services/direct-aba')}
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
        viewport={{ once: true, amount: isMobile ? 0.01 : 0.3 }}
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
            This is not a parenting class. It is clinical training.
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
                  <span>22 sessions across 12 weeks — not a course you watch, a program you are coached through.</span>
                </li>
                <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: colors.primary, fontWeight: 'bold', minWidth: '8px', marginTop: '6px' }}>•</span>
                  <span>You learn the actual science, with the sources named: Bowlby, Gottman, Baumrind, Patterson, Iwata, Carr & Durand.</span>
                </li>
                <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: colors.primary, fontWeight: 'bold', minWidth: '8px', marginTop: '6px' }}>•</span>
                  <span>You finish with a Functional Behavior Assessment signed by a BCBA — a document you can bring to a school or IEP meeting.</span>
                </li>
                <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: colors.primary, fontWeight: 'bold', minWidth: '8px', marginTop: '6px' }}>•</span>
                  <span>The goal is that you stop needing us. We are paid to reach that in twelve weeks, not to extend it.</span>
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

            <motion.p variants={itemVariants} style={{
              fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.textSecondary,
              lineHeight: '1.6',
              marginBottom: '24px',
            }}>
              Twelve weeks of graduate-level training, and four clinical documents with your name on the author line.
            </motion.p>

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
                    22 Sessions With Your Navara Behavior Specialist
                  </div>
                  <div style={{ color: colors.textSecondary, lineHeight: '1.6' }}>
                    Twice a week for most of the twelve weeks — 22 one-to-one sessions, not a weekly check-in. Every session teaches a concept, names the research behind it, and then applies it live to your own child's data.
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: colors.primary, fontWeight: 'bold', minWidth: '8px', marginTop: '6px' }}>•</span>
                <div>
                  <div style={{ fontWeight: '700', marginBottom: '8px', color: colors.text }}>
                    Your Navara Parent Behavior Profile
                  </div>
                  <div style={{ color: colors.textSecondary, lineHeight: '1.6' }}>
                    A formal profile of you — how you respond under stress, where you escalate, withdraw, or give in, and the conditions that make each more likely. Most parents have never seen their own patterns written down. It is also what determines how your child's plan gets designed.
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: colors.primary, fontWeight: 'bold', minWidth: '8px', marginTop: '6px' }}>•</span>
                <div>
                  <div style={{ fontWeight: '700', marginBottom: '8px', color: colors.text }}>
                    A Collaborative Functional Behavior Assessment
                  </div>
                  <div style={{ color: colors.textSecondary, lineHeight: '1.6' }}>
                    Target behavior definitions, five days of baseline data, setting-event analysis, a function hypothesis supported by your own observations, and an identified replacement behavior. You write it. A BCBA signs it. You can bring it to a school or IEP meeting.
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: colors.primary, fontWeight: 'bold', minWidth: '8px', marginTop: '6px' }}>•</span>
                <div>
                  <div style={{ fontWeight: '700', marginBottom: '8px', color: colors.text }}>
                    A Behavior Intervention Plan Built From Your Own Data
                  </div>
                  <div style={{ color: colors.textSecondary, lineHeight: '1.6' }}>
                    Antecedent strategies, the replacement behavior and how to teach it, a reinforcement plan, and a data system — designed around your profile and constrained to what you can actually run on a hard day. Then three weeks of coached implementation with real fidelity data.
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: colors.primary, fontWeight: 'bold', minWidth: '8px', marginTop: '6px' }}>•</span>
                <div>
                  <div style={{ fontWeight: '700', marginBottom: '8px', color: colors.text }}>
                    The Actual Research, Not a Simplified Version
                  </div>
                  <div style={{ color: colors.textSecondary, lineHeight: '1.6' }}>
                    Bowlby and Ainsworth on attachment. Gottman on emotion coaching. Baumrind on parenting style. Patterson on coercive cycles. Iwata on the four functions of behavior. Carr and Durand on functional communication. Every session names its source, and offers a reading if you want to go deeper.
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '0', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: colors.primary, fontWeight: 'bold', minWidth: '8px', marginTop: '6px' }}>•</span>
                <div>
                  <div style={{ fontWeight: '700', marginBottom: '8px', color: colors.text }}>
                    Support Between Sessions, and After the Program
                  </div>
                  <div style={{ color: colors.textSecondary, lineHeight: '1.6' }}>
                    Unlimited email and check-in access throughout the twelve weeks, plus a written relapse protocol and maintenance plan you keep — and continued coaching at a reduced rate if you want it.
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
                Apply for the Next Open Spot
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
        viewport={{ once: true, amount: isMobile ? 0.01 : 0.3 }}
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
                title: 'Connection (Weeks 1–3)',
                description: 'Learn to think like a developmental psychologist',
                items: [
                  'Co-regulation and attachment — why strategy fails a dysregulated child',
                  'Emotion coaching: notice, label, tolerate, respond',
                  'Parenting style, your own triggers, and the science of rupture and repair',
                  'Complete your Navara Parent Profile (NPBP) — the instrument that shapes the plan'
                ],
                icon: 'fas fa-heart',
                color: colors.primary
              },
              {
                title: 'Clarity (Weeks 4–7)',
                description: 'Learn to think like a behavior analyst',
                items: [
                  'ABC observation, operational definitions, and real baseline data',
                  'Reinforcement, punishment, and the four functions of behavior',
                  'Setting events — why the same strategy works one day and fails the next',
                  'Build a Functional Behavior Assessment, signed by a BCBA'
                ],
                icon: 'fas fa-lightbulb',
                color: colors.secondary
              },
              {
                title: 'Control (Weeks 8–10)',
                description: 'Your knowledge put to the test — actually execute your BIP',
                items: [
                  'Write a Behavior Intervention Plan built from your own FBA',
                  'Recognize extinction bursts as expected, not as failure',
                  'Track treatment fidelity — whether the plan was actually run as written',
                  'Adjust the plan to the home you actually have, not an ideal one'
                ],
                icon: 'fas fa-compass',
                color: colors.accent
              },
              {
                title: 'Carryover (Weeks 11–12)',
                description: 'Prepare for generalization, change, and life beyond the program',
                items: [
                  'Program generalization to school, grandparents, and other caregivers',
                  'Write a relapse protocol before you need it',
                  'Build the version of the plan that survives a bad month',
                  'Leave with your complete file — profile, assessment, plan, and data, in your name'
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

      {/* Research */}
      <motion.section
        id="research"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: isMobile ? 0.01 : 0.3 }}
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
          }}>
            Built on research — and being studied.
          </motion.h2>

          <motion.p variants={itemVariants} style={{
            fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
            fontFamily: textSizes.lg.fontFamily,
            color: colors.textSecondary,
            lineHeight: '1.6',
            maxWidth: '780px',
            margin: '0 auto 48px auto',
            textAlign: 'center',
          }}>
            Most parent programs call themselves evidence-based. Here is what that means at Navara, specifically.
          </motion.p>

          <motion.div variants={itemVariants} style={cardStyle}>
            <h3 style={{
              fontSize: textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.primary,
              fontWeight: '700',
              marginBottom: '8px',
            }}>
              The method is built on established science
            </h3>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              lineHeight: '1.8',
              margin: 0,
            }}>
              Every session names the researcher behind the idea being taught. Attachment and co-regulation come from Bowlby and Ainsworth. Emotion coaching is Gottman's framework. The parenting-style grid is Baumrind, extended by Maccoby and Martin. The escalation cycles most parents recognize instantly were described by Patterson as coercive family process. The four functions of behavior come from Iwata and colleagues. Functional communication training is Carr and Durand. Generalization is Stokes and Baer. Parents get the citation, and a reading if they want to go further.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} style={cardStyle}>
            <h3 style={{
              fontSize: textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.primary,
              fontWeight: '700',
              marginBottom: '8px',
            }}>
              And the method itself is the subject of doctoral research
            </h3>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              lineHeight: '1.8',
              margin: 0,
            }}>
              Our founder's doctoral work examines whether front-loading structured connection-building — before any behavioral instruction begins — improves outcomes in parent training, compared with the conventional order. That question is the reason the four phases run Connection first. It is also why we can tell you what the sequence is designed to do, and why.
            </p>
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
          backgroundColor: colors.surface,
        }}
      >
        <div style={{ ...containerStyle, textAlign: 'center' }}>
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
Looking for in-home help instead? Navara Direct ABA™ brings a Board Certified Behavior Analyst into your home to work directly with your child.
            </p>
            <button
              onClick={() => navigate('/services/direct-aba')}
              style={{
                ...buttonStyle,
                background: isDarkMode ? 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06))' : 'linear-gradient(135deg, rgba(235,239,243,0.72), rgba(245,247,250,0.45))',
                color: isDarkMode ? '#e5e7eb' : '#555b64',
                backdropFilter: 'blur(18px) saturate(160%)',
                WebkitBackdropFilter: 'blur(18px) saturate(160%)',
                borderRadius: '999px',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(255,255,255,0.3), 0 5px 14px rgba(45,55,70,0.10)',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(205,213,222,0.65)'}`,
                transform: 'none',
              }}
            >
Explore Direct ABA
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
Just need an expert opinion first? A single Behavioral Consulting session gives you straight answers, no program required.
            </p>
            <button
              onClick={() => navigate('/services/consulting')}
              style={{
                ...buttonStyle,
                background: isDarkMode ? 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06))' : 'linear-gradient(135deg, rgba(235,239,243,0.72), rgba(245,247,250,0.45))',
                color: isDarkMode ? '#e5e7eb' : '#555b64',
                backdropFilter: 'blur(18px) saturate(160%)',
                WebkitBackdropFilter: 'blur(18px) saturate(160%)',
                borderRadius: '999px',
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
      {/* Section 3: FAQ */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: isMobile ? 0.01 : 0.3 }}
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
                question: "Who is this program for?",
                answer: "Parents of children with challenging behavior: tantrums, refusals, aggression, rigidity, daily power struggles. It works for children with autism, ADHD, anxiety, or ODD, and just as well for children with no diagnosis at all. If behavior is running your house, this is for you."
              },
              {
                question: "Does my child need a diagnosis first?",
                answer: "No. Behavior is behavior. We work from what your child actually does, not from a label. If an evaluation would help, I will tell you on the call."
              },
              {
                question: "What is the time commitment?",
                answer: "12 weeks, 22 sessions total. Coaching sessions run 60 to 75 minutes per week, scheduled flexibly around your life, including evenings and weekends. Everything else is built into your normal daily routine, not added on top of it."
              },
              {
                question: "How is this different from ABA therapy?",
                answer: "Traditional ABA sends a therapist to work with your child. This program trains you. You learn to read what your child's behavior is telling you and respond with a plan built from your own family's data. The goal is a parent who does not need a therapist in the room."
              },
              {
                question: "What actually happens over the 12 weeks?",
                answer: "Four phases: Connection, Clarity, Control, Carryover. We start with your parent profile and a collaborative functional behavior assessment, build a written behavior intervention plan from your own data, then spend three weeks implementing it together with me coaching you live. You finish with a plan you know how to run."
              },
              {
                question: "What happens on the free 15-minute call?",
                answer: "You tell me what is going on at home. I tell you honestly whether this program fits it and how it would work. If it is not a fit, I will say so and point you somewhere useful. No pressure either way."
              },
              {
                question: "How do enrollment and payment work?",
                answer: "I work with one family at a time. After the call, if we both want to move forward, you receive an invoice for the program ($5,400). Once it is paid, we schedule your first session and start."
              },
              {
                question: "What happens after the 12 weeks?",
                answer: "You keep your written plan, including a relapse protocol and maintenance plan. Follow-up check-ins and continued coaching are available at a reduced rate if you want them."
              },
              {
                question: "Do both parents need to attend?",
                answer: "Both caregivers are welcome and encouraged, but not required. Solo parents and grandparents do this program successfully."
              },
              {
                question: "What if I need to miss a session?",
                answer: "Life happens. One rescheduled session is built into the 12 weeks, and makeup sessions are available if you need more."
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
        viewport={{ once: true, amount: isMobile ? 0.01 : 0.3 }}
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
              One family at a time, so your family gets full attention and a plan built around you.
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
              Apply for the Next Open Spot
            </button>
          </motion.div>

          <motion.div variants={itemVariants} style={{
            textAlign: 'center',
          }}>
            <button
              onClick={() => navigate('/services/consulting')}
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
        viewport={{ once: true, amount: isMobile ? 0.01 : 0.3 }}
        style={{
          ...sectionStyle,
          backgroundColor: colors.surface,
        }}
      >
        <div style={{ ...containerStyle, paddingBottom: '24px' }}>
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
      <ContactSection isDarkMode={isDarkMode} servicePage />

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


export default ParentTrainingPage;
