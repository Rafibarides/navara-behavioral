import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getColors, getTextSizes } from '../utils/colorsAndText';
import NavBarMenu from './NavBarMenu';
import FooterSection from './Sections/FooterSection';

const DiagnosticsPage = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
      {/* White Top Bar with Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          backgroundColor: 'white',
          width: '100vw',
          padding: '20px 0',
          paddingTop: '100px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          zIndex: 20,
        }}
      >
        <img
          src="assets/service-logos/diagnostics.png"
          alt="Diagnostics Logo"
          style={{
            width: isMobile ? '80px' : '120px',
            height: isMobile ? '80px' : '120px',
            objectFit: 'contain',
          }}
        />
      </motion.div>

      {/* Navigation */}
      <NavBarMenu isDarkMode={isDarkMode} />

      {/* Hero Section with Dark Blue Background */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          backgroundColor: '#1B3B62',
          backgroundImage: `linear-gradient(135deg, #1B3B62 0%, #1A2A40 100%), url('NAVARA1.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
          width: '100vw',
          margin: 0,
          boxSizing: 'border-box',
          paddingTop: '80px',
          paddingBottom: '80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glass morphism overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(27, 59, 98, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }} />
        
        <div style={{
          ...containerStyle,
          position: 'relative',
          zIndex: 10,
        }}>
          <motion.h1 variants={itemVariants} style={{
            ...headingStyle,
            color: 'white',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
          }}>
            DIAGNOSTICS
          </motion.h1>
          <motion.h2 variants={itemVariants} style={{
            ...subheadingStyle,
            color: 'rgba(255, 255, 255, 0.9)',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}>
            Comprehensive Psychological & Developmental Diagnostics
          </motion.h2>
          <motion.p variants={itemVariants} style={{
            fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
            fontFamily: textSizes.xl.fontFamily,
            color: 'white',
            fontWeight: '600',
            textAlign: 'center',
            fontStyle: 'italic',
            marginBottom: '40px',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}>
            Clarity. Direction. Action.
          </motion.p>
          <motion.p variants={itemVariants} style={{
            fontSize: textSizes.lg.fontSize,
            fontFamily: textSizes.lg.fontFamily,
            color: 'rgba(255, 255, 255, 0.85)',
            lineHeight: '1.8',
            textAlign: 'center',
            maxWidth: '800px',
            margin: '0 auto',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}>
            At Navara Behavioral Group, we specialize in high-quality psychological and developmental assessments that empower families, schools, and treatment providers to move forward with confidence.
          </motion.p>
        </div>
      </motion.section>

      {/* Why Choose Navara Diagnostics */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={{
          ...sectionStyle,
          background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.surface} 100%)`,
        }}
      >
        <div style={containerStyle}>
          <motion.div variants={itemVariants} style={cardStyle}>
            <h2 style={sectionHeadingStyle}>Why Choose Navara Diagnostics?</h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
              <div>
                <div style={listItemStyle}>
                  <span style={bulletStyle}>✓</span>
                  <strong style={{ color: colors.primary }}>Fast Turnaround</strong> – Get results in days, not months.
                </div>
                <div style={listItemStyle}>
                  <span style={bulletStyle}>✓</span>
                  <strong style={{ color: colors.primary }}>Clear, Actionable Reports</strong> – No fluff. Every report includes detailed findings and specific recommendations.
                </div>
                <div style={listItemStyle}>
                  <span style={bulletStyle}>✓</span>
                  <strong style={{ color: colors.primary }}>Multidisciplinary Expertise</strong> – Licensed psychologists, BCBAs, and medical collaboration where needed.
                </div>
              </div>
              <div>
                <div style={listItemStyle}>
                  <span style={bulletStyle}>✓</span>
                  <strong style={{ color: colors.primary }}>Parent-Friendly Process</strong> – We guide you step-by-step, from intake to feedback.
                </div>
                <div style={listItemStyle}>
                  <span style={bulletStyle}>✓</span>
                  <strong style={{ color: colors.primary }}>School & Treatment Collaboration</strong> – We liaise directly with providers (when authorized) to support services like IEPs, ABA, or therapy.
                </div>
              </div>
            </div>
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
          backgroundImage: `url('NAVARA1.jpg')`,
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
          background: `rgba(${isDarkMode ? '26, 26, 26' : '242, 242, 242'}, 0.85)`,
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
        }} />
        
        <div style={{
          ...containerStyle,
          position: 'relative',
          zIndex: 10,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '32px' }}>
            <motion.div variants={itemVariants} style={glassMorphCardStyle}>
              <h2 style={{...sectionHeadingStyle, color: isDarkMode ? 'white' : colors.primary}}>What We Test For</h2>
              <div style={{...listItemStyle, color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : colors.text}}>
                <span style={{...bulletStyle, color: isDarkMode ? '#CBD9C5' : colors.primary}}>•</span>
                Autism Spectrum Disorder (ASD)
              </div>
              <div style={{...listItemStyle, color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : colors.text}}>
                <span style={{...bulletStyle, color: isDarkMode ? '#CBD9C5' : colors.primary}}>•</span>
                ADHD & Executive Functioning
              </div>
              <div style={{...listItemStyle, color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : colors.text}}>
                <span style={{...bulletStyle, color: isDarkMode ? '#CBD9C5' : colors.primary}}>•</span>
                Learning Disabilities (Dyslexia, Dyscalculia, etc.)
              </div>
              <div style={{...listItemStyle, color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : colors.text}}>
                <span style={{...bulletStyle, color: isDarkMode ? '#CBD9C5' : colors.primary}}>•</span>
                Anxiety, OCD, Mood Disorders
              </div>
              <div style={{...listItemStyle, color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : colors.text}}>
                <span style={{...bulletStyle, color: isDarkMode ? '#CBD9C5' : colors.primary}}>•</span>
                Behavior & Emotional Regulation
              </div>
              <div style={{...listItemStyle, color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : colors.text}}>
                <span style={{...bulletStyle, color: isDarkMode ? '#CBD9C5' : colors.primary}}>•</span>
                Intellectual & Cognitive Functioning (IQ Testing)
              </div>
              <div style={{...listItemStyle, color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : colors.text}}>
                <span style={{...bulletStyle, color: isDarkMode ? '#CBD9C5' : colors.primary}}>•</span>
                School Readiness & Giftedness
              </div>
            </motion.div>

            <motion.div variants={itemVariants} style={glassMorphCardStyle}>
              <h2 style={{...sectionHeadingStyle, color: isDarkMode ? 'white' : colors.primary}}>Who We Serve</h2>
              <div style={{...listItemStyle, color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : colors.text}}>
                <span style={{...bulletStyle, color: isDarkMode ? '#CBD9C5' : colors.primary}}>•</span>
                Children, Adolescents and Adults (ages 2 and up)
              </div>
              <div style={{...listItemStyle, color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : colors.text}}>
                <span style={{...bulletStyle, color: isDarkMode ? '#CBD9C5' : colors.primary}}>•</span>
                Parents seeking answers
              </div>
              <div style={{...listItemStyle, color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : colors.text}}>
                <span style={{...bulletStyle, color: isDarkMode ? '#CBD9C5' : colors.primary}}>•</span>
                Schools and ABA agencies in need of diagnostic clarity
              </div>
              <div style={{...listItemStyle, color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : colors.text}}>
                <span style={{...bulletStyle, color: isDarkMode ? '#CBD9C5' : colors.primary}}>•</span>
                Pediatricians and therapists looking for formal evaluation support
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
              <TypingText text="What to Expect" delay={0.2} />
            </h2>
            
            {/* Timeline Container */}
            <div style={{
              position: 'relative',
              maxWidth: '800px',
              margin: '0 auto',
              padding: '0 20px',
            }}>
              {/* Timeline Steps */}
              {[
                {
                  icon: 'fas fa-phone',
                  title: 'Free 15-minute phone consult',
                  description: 'We determine the right assessment package for your needs.',
                  color: colors.primary,
                },
                {
                  icon: 'fas fa-clipboard-list',
                  title: 'Initial intake session',
                  description: 'We gather history, concerns, and goals.',
                  color: colors.secondary,
                },
                {
                  icon: 'fas fa-brain',
                  title: 'Testing day(s)',
                  description: 'Comprehensive, focused, and child-friendly.',
                  color: colors.accent,
                },
                {
                  icon: 'fas fa-chart-line',
                  title: 'Results meeting',
                  description: 'We walk you through everything in plain English.',
                  color: colors.primary,
                },
                {
                  icon: 'fas fa-hands-helping',
                  title: 'Support for next steps',
                  description: 'We help you share the results with schools or providers and assist with service referrals if needed.',
                  color: colors.secondary,
                },
              ].map((step, index) => (
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
                    marginBottom: index === 4 ? '0' : '48px',
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
                      background: `linear-gradient(135deg, ${step.color}, ${step.color}dd)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '24px',
                      flexShrink: 0,
                      boxShadow: `0 4px 20px ${step.color}40`,
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
                        color: step.color,
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
            <h2 style={sectionHeadingStyle}>Packages & Pricing</h2>
            <p style={{
              fontSize: textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.text,
              lineHeight: '1.8',
              marginBottom: '24px',
            }}>
              We offer direct-pay diagnostic packages. No waiting lists. No insurance roadblocks.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div style={{
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
                  Standard Evaluation
                </h3>
                <p style={{
                  fontSize: textSizes.xl.fontSize,
                  fontFamily: textSizes.xl.fontFamily,
                  color: colors.text,
                  fontWeight: '600',
                  margin: 0,
                }}>
                  ~$1,500–$2,200
                </p>
              </div>
              
              <div style={{
                background: `rgba(26, 42, 64, 0.1)`,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center',
                border: '1px solid rgba(26, 42, 64, 0.2)',
              }}>
                <h3 style={{
                  fontSize: textSizes.lg.fontSize,
                  fontFamily: textSizes.lg.fontFamily,
                  color: colors.secondary,
                  fontWeight: '700',
                  marginBottom: '8px',
                }}>
                  Autism ADHD Diagnostic
                </h3>
                <p style={{
                  fontSize: textSizes.xl.fontSize,
                  fontFamily: textSizes.xl.fontFamily,
                  color: colors.text,
                  fontWeight: '600',
                  margin: 0,
                }}>
                  $1,100
                </p>
              </div>
              
              <div style={{
                background: `rgba(203, 217, 197, 0.2)`,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center',
                border: '1px solid rgba(203, 217, 197, 0.3)',
              }}>
                <h3 style={{
                  fontSize: textSizes.lg.fontSize,
                  fontFamily: textSizes.lg.fontFamily,
                  color: colors.accent,
                  fontWeight: '700',
                  marginBottom: '8px',
                }}>
                  Full Psychoeducational Battery
                </h3>
                <p style={{
                  fontSize: textSizes.xl.fontSize,
                  fontFamily: textSizes.xl.fontFamily,
                  color: colors.text,
                  fontWeight: '600',
                  margin: 0,
                }}>
                  $2,200
                </p>
              </div>
            </div>
            
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.textSecondary,
              lineHeight: '1.6',
              textAlign: 'center',
              fontStyle: 'italic',
            }}>
              Payment plans available. HSA/FSA eligible.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Call to Action */}
      <motion.section 
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
              Get Answers. Take Action.
            </h2>
            <p style={{
              fontSize: textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: '1.8',
              marginBottom: '16px',
            }}>
              Early diagnosis changes outcomes. Let's get started today.
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
              Book your free consult
            </p>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}>
              <a href="tel:+18666628272" style={{
                ...contactButtonStyle,
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
              }}>
                <i className="fas fa-phone" />
                Call Us: (1) 866-6NAVARA (866-662-8272)
              </a>
              <a href="mailto:Info@navarabehavioralgroup.com" style={{
                ...contactButtonStyle,
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#1B3B62',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}>
                <i className="fas fa-envelope" />
                Info@navarabehavioralgroup.com
              </a>
              <a href="#" style={{
                ...contactButtonStyle,
                background: 'rgba(203, 217, 197, 0.3)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(203, 217, 197, 0.4)',
                color: 'white',
              }}>
                <i className="fas fa-calendar" />
                Schedule Online
              </a>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <FooterSection isDarkMode={isDarkMode} />
    </div>
  );
};

export default DiagnosticsPage;
