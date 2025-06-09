import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getColors, getTextSizes } from '../utils/colorsAndText';
import NavBarMenu from './NavBarMenu';
import FooterSection from './Sections/FooterSection';

const PathwaysPage = ({ isDarkMode = false }) => {
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
              src="/src/assets/service-logos/pathways.png"
              alt="Pathways Logo"
              style={{
                width: isMobile ? '60px' : '80px',
                height: isMobile ? '60px' : '80px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
              }}
            />
          </motion.div>

          <motion.h1 variants={itemVariants} style={{
            fontSize: isMobile ? textSizes['3xl'].fontSize : textSizes['4xl'].fontSize,
            fontFamily: textSizes['4xl'].fontFamily,
            color: colors.primary,
            fontWeight: '700',
            marginBottom: '32px',
            textAlign: 'center',
          }}>
            Navara Pathways
          </motion.h1>

          <motion.h2 variants={itemVariants} style={{
            fontSize: isMobile ? textSizes.lg.fontSize : textSizes['2xl'].fontSize,
            fontFamily: textSizes['2xl'].fontFamily,
            color: colors.text,
            fontWeight: '600',
            marginBottom: '40px',
            textAlign: 'center',
            maxWidth: '800px',
            margin: '0 auto 40px auto',
          }}>
            Guided Career Exploration for Young Adults
          </motion.h2>

          <motion.p variants={itemVariants} style={{
            fontSize: textSizes.lg.fontSize,
            fontFamily: textSizes.lg.fontFamily,
            color: colors.text,
            lineHeight: '1.8',
            textAlign: 'center',
            maxWidth: '900px',
            margin: '0 auto',
          }}>
            Navara Pathways is a guided career exploration program for young adults seeking clarity about their future. Through expert-led assessments, one-on-one coaching, and short-term mentorships or shadowing experiences, we help individuals identify their strengths, interests, and best-fit career paths. Whether you're in college or just figuring things out, Pathways empowers you to move forward with confidence.
          </motion.p>
        </div>
      </motion.section>

      {/* Images Section */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={sectionStyle}
      >
        <div style={containerStyle}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
            gap: '32px',
            marginBottom: '60px',
          }}>
            <motion.div variants={itemVariants}>
              <img
                src="/src/assets/NAVARA6.jpg"
                alt="Career exploration and mentorship"
                style={{
                  width: '100%',
                  height: isMobile ? '250px' : '400px',
                  objectFit: 'cover',
                  borderRadius: '20px',
                  boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
                }}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <img
                src="/src/assets/NAVARA5.jpg"
                alt="Young adults in career planning session"
                style={{
                  width: '100%',
                  height: isMobile ? '250px' : '400px',
                  objectFit: 'cover',
                  borderRadius: '20px',
                  boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
                }}
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Program Features */}
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
          <motion.h2 variants={itemVariants} style={{
            fontSize: isMobile ? textSizes['2xl'].fontSize : textSizes['3xl'].fontSize,
            fontFamily: textSizes['3xl'].fontFamily,
            color: colors.primary,
            fontWeight: '700',
            marginBottom: '48px',
            textAlign: 'center',
          }}>
            What Pathways Offers
          </motion.h2>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', 
            gap: '32px',
          }}>
            <motion.div variants={itemVariants} style={{
              background: colors.surface,
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
              border: `1px solid ${colors.border}`,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
              }}>
                <i className="fas fa-search" style={{ fontSize: '24px', color: 'white' }} />
              </div>
              <h3 style={{
                fontSize: textSizes.lg.fontSize,
                fontFamily: textSizes.lg.fontFamily,
                color: colors.primary,
                fontWeight: '700',
                marginBottom: '16px',
              }}>
                Expert-Led Assessments
              </h3>
              <p style={{
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                color: colors.text,
                lineHeight: '1.6',
                margin: 0,
              }}>
                Comprehensive evaluations to identify your unique strengths, interests, and natural aptitudes.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} style={{
              background: colors.surface,
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
              border: `1px solid ${colors.border}`,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.secondary}, ${colors.accent})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
              }}>
                <i className="fas fa-user-tie" style={{ fontSize: '24px', color: 'white' }} />
              </div>
              <h3 style={{
                fontSize: textSizes.lg.fontSize,
                fontFamily: textSizes.lg.fontFamily,
                color: colors.primary,
                fontWeight: '700',
                marginBottom: '16px',
              }}>
                One-on-One Coaching
              </h3>
              <p style={{
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                color: colors.text,
                lineHeight: '1.6',
                margin: 0,
              }}>
                Personalized guidance to help you navigate career decisions and create actionable plans.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} style={{
              background: colors.surface,
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
              border: `1px solid ${colors.border}`,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
              }}>
                <i className="fas fa-handshake" style={{ fontSize: '24px', color: 'white' }} />
              </div>
              <h3 style={{
                fontSize: textSizes.lg.fontSize,
                fontFamily: textSizes.lg.fontFamily,
                color: colors.primary,
                fontWeight: '700',
                marginBottom: '16px',
              }}>
                Mentorships & Shadowing
              </h3>
              <p style={{
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                color: colors.text,
                lineHeight: '1.6',
                margin: 0,
              }}>
                Real-world experiences with professionals in fields that align with your interests.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Who We Serve */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={sectionStyle}
      >
        <div style={containerStyle}>
          <motion.div variants={itemVariants} style={{
            background: colors.surface,
            borderRadius: '16px',
            padding: isMobile ? '32px' : '48px',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
          }}>
            <h2 style={{
              fontSize: isMobile ? textSizes['2xl'].fontSize : textSizes['3xl'].fontSize,
              fontFamily: textSizes['3xl'].fontFamily,
              color: colors.primary,
              fontWeight: '700',
              marginBottom: '32px',
            }}>
              Perfect For
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
              gap: '32px',
              textAlign: 'left',
            }}>
              <div>
                <div style={{
                  fontSize: textSizes.base.fontSize,
                  fontFamily: textSizes.base.fontFamily,
                  color: colors.text,
                  lineHeight: '1.8',
                  marginBottom: '16px',
                  paddingLeft: '20px',
                  position: 'relative',
                }}>
                  <span style={{
                    position: 'absolute',
                    left: '0',
                    color: colors.primary,
                    fontWeight: 'bold',
                  }}>•</span>
                  College students unsure about their major or career direction
                </div>
                <div style={{
                  fontSize: textSizes.base.fontSize,
                  fontFamily: textSizes.base.fontFamily,
                  color: colors.text,
                  lineHeight: '1.8',
                  marginBottom: '16px',
                  paddingLeft: '20px',
                  position: 'relative',
                }}>
                  <span style={{
                    position: 'absolute',
                    left: '0',
                    color: colors.primary,
                    fontWeight: 'bold',
                  }}>•</span>
                  Recent graduates exploring their options
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: textSizes.base.fontSize,
                  fontFamily: textSizes.base.fontFamily,
                  color: colors.text,
                  lineHeight: '1.8',
                  marginBottom: '16px',
                  paddingLeft: '20px',
                  position: 'relative',
                }}>
                  <span style={{
                    position: 'absolute',
                    left: '0',
                    color: colors.primary,
                    fontWeight: 'bold',
                  }}>•</span>
                  Young adults considering a career change
                </div>
                <div style={{
                  fontSize: textSizes.base.fontSize,
                  fontFamily: textSizes.base.fontFamily,
                  color: colors.text,
                  lineHeight: '1.8',
                  marginBottom: '16px',
                  paddingLeft: '20px',
                  position: 'relative',
                }}>
                  <span style={{
                    position: 'absolute',
                    left: '0',
                    color: colors.primary,
                    fontWeight: 'bold',
                  }}>•</span>
                  Anyone seeking clarity about their professional future
                </div>
              </div>
            </div>
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
            background: colors.surface,
            borderRadius: '16px',
            padding: isMobile ? '32px' : '48px',
            textAlign: 'center',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          }}>
            <h2 style={{
              fontSize: isMobile ? textSizes['2xl'].fontSize : textSizes['3xl'].fontSize,
              fontFamily: textSizes['3xl'].fontFamily,
              color: colors.primary,
              fontWeight: '700',
              marginBottom: '16px',
            }}>
              Ready to Discover Your Path?
            </h2>
            <p style={{
              fontSize: textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.text,
              lineHeight: '1.8',
              marginBottom: '32px',
              maxWidth: '600px',
              margin: '0 auto 32px auto',
            }}>
              Take the first step toward a fulfilling career. Let Navara Pathways guide you to your future.
            </p>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}>
              <a href="tel:+1234567890" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                color: 'white',
                padding: '14px 28px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: textSizes.lg.fontSize,
                fontFamily: textSizes.lg.fontFamily,
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              }}>
                <i className="fas fa-phone" />
                Start Your Journey
              </a>
              <a href="mailto:pathways@navarabehavioralgroup.com" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: colors.surface,
                color: colors.primary,
                border: `2px solid ${colors.primary}`,
                padding: '14px 28px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: textSizes.lg.fontSize,
                fontFamily: textSizes.lg.fontFamily,
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
              }}>
                <i className="fas fa-envelope" />
                Get In Touch
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

export default PathwaysPage;
