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
  const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);

  // Get the behavioral service from siteData
  const behavioralService = siteData.sections.services.behavioral;

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
              src={behavioralService.logo}
              alt={`${behavioralService.title} Logo`}
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
            {behavioralService.title}
          </motion.h1>

          <motion.p variants={itemVariants} style={{
            fontSize: textSizes.lg.fontSize,
            fontFamily: textSizes.lg.fontFamily,
            color: colors.text,
            lineHeight: '1.8',
            textAlign: 'center',
            maxWidth: '900px',
            margin: '0 auto 40px auto',
          }}>
            {behavioralService.p1}
          </motion.p>

          {behavioralService.highlight && (
            <motion.div 
              variants={itemVariants}
              style={{
                fontSize: textSizes.xl.fontSize,
                fontFamily: textSizes.xl.fontFamily,
                color: colors.primary,
                fontWeight: '600',
                lineHeight: '1.6',
                marginBottom: '40px',
                fontStyle: 'italic',
                textAlign: 'center',
                maxWidth: '800px',
                margin: '0 auto 40px auto',
                padding: '32px',
                backgroundColor: colors.accent + '20',
                borderRadius: '20px',
              }}
            >
              <TypingText text={behavioralService.highlight} delay={0.3} />
            </motion.div>
          )}

          <motion.p variants={itemVariants} style={{
            fontSize: textSizes.lg.fontSize,
            fontFamily: textSizes.lg.fontFamily,
            color: colors.text,
            lineHeight: '1.8',
            textAlign: 'center',
            maxWidth: '900px',
            margin: '0 auto',
          }}>
            {behavioralService.p2}
          </motion.p>
        </div>
      </motion.section>

      {/* Image Section */}
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
            justifyContent: 'center',
            marginBottom: '60px',
          }}>
            <img
              src={behavioralService.photo}
              alt={behavioralService.title}
              style={{
                width: '100%',
                maxWidth: '800px',
                height: isMobile ? '300px' : '500px',
                objectFit: 'cover',
                borderRadius: '20px',
                boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
              }}
            />
          </motion.div>
        </div>
      </motion.section>

      {/* Our Approach Section */}
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
            fontSize: isMobile ? textSizes['2xl'].fontSize : textSizes['3xl'].fontSize,
            fontFamily: textSizes['3xl'].fontFamily,
            color: colors.primary,
            fontWeight: '700',
            marginBottom: '40px',
            textAlign: 'center',
          }}>
            Our Behavioral Health Approach
          </motion.h2>

          <div style={cardStyle}>
            <motion.h3 variants={itemVariants} style={{
              fontSize: textSizes.xl.fontSize,
              fontFamily: textSizes.xl.fontFamily,
              color: colors.primary,
              fontWeight: '600',
              marginBottom: '20px',
            }}>
              Evidence-Based Interventions
            </motion.h3>
            <motion.p variants={itemVariants} style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              lineHeight: '1.8',
              marginBottom: '20px',
            }}>
              We utilize scientifically proven methods including Applied Behavior Analysis (ABA), Cognitive Behavioral Therapy (CBT), and other evidence-based practices tailored to each individual's unique needs.
            </motion.p>
          </div>

          <div style={cardStyle}>
            <motion.h3 variants={itemVariants} style={{
              fontSize: textSizes.xl.fontSize,
              fontFamily: textSizes.xl.fontFamily,
              color: colors.primary,
              fontWeight: '600',
              marginBottom: '20px',
            }}>
              Family-Centered Care
            </motion.h3>
            <motion.p variants={itemVariants} style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              lineHeight: '1.8',
              marginBottom: '20px',
            }}>
              Our approach involves the entire family system, providing education, support, and training to ensure consistent progress across all environments.
            </motion.p>
          </div>

          <div style={cardStyle}>
            <motion.h3 variants={itemVariants} style={{
              fontSize: textSizes.xl.fontSize,
              fontFamily: textSizes.xl.fontFamily,
              color: colors.primary,
              fontWeight: '600',
              marginBottom: '20px',
            }}>
              Individualized Treatment Plans
            </motion.h3>
            <motion.p variants={itemVariants} style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              lineHeight: '1.8',
              marginBottom: '20px',
            }}>
              Every treatment plan is carefully crafted based on comprehensive assessments, personal goals, and ongoing progress monitoring to ensure optimal outcomes.
            </motion.p>
          </div>
        </div>
      </motion.section>

      {/* Contact Section */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={sectionStyle}
      >
        <div style={containerStyle}>
          <motion.h2 variants={itemVariants} style={{
            fontSize: isMobile ? textSizes['2xl'].fontSize : textSizes['3xl'].fontSize,
            fontFamily: textSizes['3xl'].fontFamily,
            color: colors.primary,
            fontWeight: '700',
            marginBottom: '32px',
            textAlign: 'center',
          }}>
            Ready to Get Started?
          </motion.h2>

          <motion.p variants={itemVariants} style={{
            fontSize: textSizes.lg.fontSize,
            fontFamily: textSizes.lg.fontFamily,
            color: colors.text,
            lineHeight: '1.8',
            textAlign: 'center',
            maxWidth: '600px',
            margin: '0 auto 40px auto',
          }}>
            Contact us today to learn more about our behavioral health services and how we can support your family's journey.
          </motion.p>

          <motion.div variants={itemVariants} style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => setIsCalendlyModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                color: 'white',
                padding: '14px 28px',
                borderRadius: '12px',
                border: 'none',
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
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
              <i className="fas fa-calendar" />
              Schedule Consultation
            </button>

            <a
              href="tel:+18777628272"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                color: colors.primary,
                padding: '14px 28px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                fontWeight: '600',
                border: `2px solid ${colors.primary}`,
                transition: 'all 0.3s ease',
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
              <i className="fas fa-phone" />
              Call Us
            </a>

            <a
              href="mailto:info@navarabehavioralgroup.com"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                color: colors.primary,
                padding: '14px 28px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                fontWeight: '600',
                border: `2px solid ${colors.primary}`,
                transition: 'all 0.3s ease',
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
              <i className="fas fa-envelope" />
              Email Us
            </a>
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