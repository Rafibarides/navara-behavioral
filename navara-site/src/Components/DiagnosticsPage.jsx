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
    background: colors.surface,
    borderRadius: '16px',
    padding: isMobile ? '24px' : '32px',
    marginBottom: '32px',
    border: `1px solid ${colors.border}`,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
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
          {/* Logo positioned in top left */}
          <motion.div 
            variants={itemVariants}
            style={{
              position: 'absolute',
              top: isMobile ? '80px' : '90px',
              left: isMobile ? '20px' : '40px',
              zIndex: 10,
            }}
          >
            <img
              src="/assets/service-logos/diagnostics.png"
              alt="Diagnostics Logo"
              style={{
                width: isMobile ? '60px' : '80px',
                height: isMobile ? '60px' : '80px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
              }}
            />
          </motion.div>

          <motion.h1 variants={itemVariants} style={headingStyle}>
            DIAGNOSTICS
          </motion.h1>
          <motion.h2 variants={itemVariants} style={subheadingStyle}>
            Comprehensive Psychological & Developmental Diagnostics
          </motion.h2>
          <motion.p variants={itemVariants} style={{
            fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
            fontFamily: textSizes.xl.fontFamily,
            color: colors.primary,
            fontWeight: '600',
            textAlign: 'center',
            fontStyle: 'italic',
            marginBottom: '40px',
          }}>
            Clarity. Direction. Action.
          </motion.p>
          <motion.p variants={itemVariants} style={{
            fontSize: textSizes.lg.fontSize,
            fontFamily: textSizes.lg.fontFamily,
            color: colors.text,
            lineHeight: '1.8',
            textAlign: 'center',
            maxWidth: '800px',
            margin: '0 auto',
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
        style={sectionStyle}
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
        style={sectionStyle}
      >
        <div style={containerStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '32px' }}>
            <motion.div variants={itemVariants} style={cardStyle}>
              <h2 style={sectionHeadingStyle}>What We Test For</h2>
              <div style={listItemStyle}>
                <span style={bulletStyle}>•</span>
                Autism Spectrum Disorder (ASD)
              </div>
              <div style={listItemStyle}>
                <span style={bulletStyle}>•</span>
                ADHD & Executive Functioning
              </div>
              <div style={listItemStyle}>
                <span style={bulletStyle}>•</span>
                Learning Disabilities (Dyslexia, Dyscalculia, etc.)
              </div>
              <div style={listItemStyle}>
                <span style={bulletStyle}>•</span>
                Anxiety, OCD, Mood Disorders
              </div>
              <div style={listItemStyle}>
                <span style={bulletStyle}>•</span>
                Behavior & Emotional Regulation
              </div>
              <div style={listItemStyle}>
                <span style={bulletStyle}>•</span>
                Intellectual & Cognitive Functioning (IQ Testing)
              </div>
              <div style={listItemStyle}>
                <span style={bulletStyle}>•</span>
                School Readiness & Giftedness
              </div>
            </motion.div>

            <motion.div variants={itemVariants} style={cardStyle}>
              <h2 style={sectionHeadingStyle}>Who We Serve</h2>
              <div style={listItemStyle}>
                <span style={bulletStyle}>•</span>
                Children, Adolescents and Adults (ages 2 and up)
              </div>
              <div style={listItemStyle}>
                <span style={bulletStyle}>•</span>
                Parents seeking answers
              </div>
              <div style={listItemStyle}>
                <span style={bulletStyle}>•</span>
                Schools and ABA agencies in need of diagnostic clarity
              </div>
              <div style={listItemStyle}>
                <span style={bulletStyle}>•</span>
                Pediatricians and therapists looking for formal evaluation support
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* What to Expect */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={{
          ...sectionStyle,
          background: `linear-gradient(135deg, ${colors.accent}10, ${colors.primary}05)`,
        }}
      >
        <div style={containerStyle}>
          <motion.div variants={itemVariants} style={cardStyle}>
            <h2 style={sectionHeadingStyle}>What to Expect</h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
              <div>
                <div style={{...listItemStyle, marginBottom: '20px'}}>
                  <span style={{...bulletStyle, color: colors.accent}}>1.</span>
                  <strong style={{ color: colors.primary }}>Free 15-minute phone consult</strong> – We determine the right assessment package for your needs.
                </div>
                <div style={{...listItemStyle, marginBottom: '20px'}}>
                  <span style={{...bulletStyle, color: colors.accent}}>2.</span>
                  <strong style={{ color: colors.primary }}>Initial intake session</strong> – We gather history, concerns, and goals.
                </div>
                <div style={{...listItemStyle, marginBottom: '20px'}}>
                  <span style={{...bulletStyle, color: colors.accent}}>3.</span>
                  <strong style={{ color: colors.primary }}>Testing day(s)</strong> – Comprehensive, focused, and child-friendly.
                </div>
              </div>
              <div>
                <div style={{...listItemStyle, marginBottom: '20px'}}>
                  <span style={{...bulletStyle, color: colors.accent}}>4.</span>
                  <strong style={{ color: colors.primary }}>Results meeting</strong> – We walk you through everything in plain English.
                </div>
                <div style={{...listItemStyle, marginBottom: '20px'}}>
                  <span style={{...bulletStyle, color: colors.accent}}>5.</span>
                  <strong style={{ color: colors.primary }}>Support for next steps</strong> – We help you share the results with schools or providers and assist with service referrals if needed.
                </div>
              </div>
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
                background: colors.primary + '10',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
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
                background: colors.secondary + '10',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
              }}>
                <h3 style={{
                  fontSize: textSizes.lg.fontSize,
                  fontFamily: textSizes.lg.fontFamily,
                  color: colors.secondary,
                  fontWeight: '700',
                  marginBottom: '8px',
                }}>
                  Autism Diagnostic Package
                </h3>
                <p style={{
                  fontSize: textSizes.xl.fontSize,
                  fontFamily: textSizes.xl.fontFamily,
                  color: colors.text,
                  fontWeight: '600',
                  margin: 0,
                }}>
                  ~$2,000–$2,500
                </p>
              </div>
              
              <div style={{
                background: colors.accent + '10',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
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
                  ~$2,500–$3,200
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
          ...sectionStyle,
          background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}15)`,
        }}
      >
        <div style={containerStyle}>
          <motion.div variants={itemVariants} style={{
            ...cardStyle,
            textAlign: 'center',
            background: colors.surface,
          }}>
            <h2 style={{
              ...sectionHeadingStyle,
              fontSize: isMobile ? textSizes['2xl'].fontSize : textSizes['3xl'].fontSize,
              textAlign: 'center',
              marginBottom: '16px',
            }}>
              Get Answers. Take Action.
            </h2>
            <p style={{
              fontSize: textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.text,
              lineHeight: '1.8',
              marginBottom: '32px',
            }}>
              Early diagnosis changes outcomes. Let's get started today.
            </p>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}>
              <a href="tel:+1234567890" style={contactButtonStyle}>
                <i className="fas fa-phone" />
                Book your free consult
              </a>
              <a href="mailto:diagnostics@navarabehavioralgroup.com" style={{
                ...contactButtonStyle,
                background: colors.surface,
                color: colors.primary,
                border: `2px solid ${colors.primary}`,
              }}>
                <i className="fas fa-envelope" />
                diagnostics@navarabehavioralgroup.com
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
