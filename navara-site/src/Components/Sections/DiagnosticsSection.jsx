import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getColors, getTextSizes } from '../../utils/colorsAndText';
import siteData from '../../../SiteData.json';

const DiagnosticsSection = ({ isDarkMode = false }) => {
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

  // Get the diagnostics service from siteData
  const diagnosticsService = siteData.sections.services.diagnostics;

  if (!diagnosticsService) return null;

  // Optimized animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.15,
      }
    }
  };

  const imageVariants = {
    hidden: { 
      scale: 0.9, 
      opacity: 0,
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: [0.25, 0.46, 0.45, 0.94], // Custom bezier for smoothness
      }
    }
  };

  const textVariants = {
    hidden: { 
      opacity: 0, 
      y: 30 
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
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

  // Mobile Layout
  if (isMobile) {
    return (
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={{
          backgroundColor: colors.background,
          width: '100vw',
          padding: '80px 20px',
          margin: 0,
          boxSizing: 'border-box',
          willChange: 'transform, opacity',
        }}
      >
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          {/* Service Logo & Title */}
          <motion.div 
            variants={textVariants}
            style={{
              textAlign: 'center',
              marginBottom: '40px',
            }}
          >
            <motion.img
              variants={imageVariants}
              src={diagnosticsService.logo}
              alt={`${diagnosticsService.title} Logo`}
              style={{
                width: '140px',
                height: '140px',
                objectFit: 'contain',
                marginBottom: '16px',
              }}
            />
            <h2 style={{
              fontSize: textSizes['3xl'].fontSize,
              fontFamily: textSizes['3xl'].fontFamily,
              color: colors.primary,
              fontWeight: '700',
              margin: 0,
            }}>
              {diagnosticsService.title}
            </h2>
          </motion.div>

          {/* Photo */}
          <motion.div 
            variants={imageVariants}
            style={{
              marginBottom: '60px',
              display: 'flex',
              justifyContent: 'center',
              willChange: 'transform, opacity',
            }}
          >
            <img
              src={diagnosticsService.photo}
              alt={diagnosticsService.title}
              style={{
                width: '100%',
                maxWidth: '400px',
                height: '300px',
                objectFit: 'cover',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
            />
          </motion.div>

          {/* Content */}
          <div style={{
            textAlign: 'center',
            padding: '0 20px',
          }}>
            <motion.p 
              variants={textVariants}
              style={{
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                color: colors.text,
                lineHeight: '1.8',
                marginBottom: '24px',
              }}
            >
              {diagnosticsService.p1}
            </motion.p>

            {diagnosticsService.highlight && (
              <motion.div
                variants={textVariants}
                style={{
                  fontSize: textSizes.lg.fontSize,
                  fontFamily: textSizes.lg.fontFamily,
                  color: colors.primary,
                  fontWeight: '600',
                  lineHeight: '1.6',
                  marginBottom: '24px',
                  fontStyle: 'italic',
                  padding: '24px',
                  backgroundColor: colors.accent + '15',
                  borderRadius: '12px',
                }}
              >
                <TypingText text={diagnosticsService.highlight} delay={0.3} />
              </motion.div>
            )}

            <motion.p 
              variants={textVariants}
              style={{
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                color: colors.text,
                lineHeight: '1.8',
                marginBottom: '24px',
              }}
            >
              {diagnosticsService.p2}
            </motion.p>

            <motion.div 
              variants={textVariants}
              style={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Link 
                to="/diagnostics"
                style={{
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
                Learn More
                <i className="fas fa-arrow-right" style={{ fontSize: '14px' }} />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>
    );
  }

  // Desktop Layout
  return (
    <motion.section 
      id="diagnostics"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      style={{
        backgroundColor: colors.background,
        width: '100vw',
        padding: '100px 40px',
        margin: 0,
        boxSizing: 'border-box',
        willChange: 'transform, opacity',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        maxWidth: '1200px',
        margin: '0 auto',
        gap: '80px',
      }}>
        {/* Photo Section - Left Side */}
        <motion.div 
          variants={imageVariants}
          style={{
            flex: '0 0 500px',
            height: '600px',
            willChange: 'transform, opacity',
          }}
        >
          <img
            src={diagnosticsService.photo}
            alt={diagnosticsService.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '20px',
              boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
            }}
          />
        </motion.div>

        {/* Content Section - Right Side */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
        }}>
          {/* Service Logo & Title */}
          <motion.div 
            variants={textVariants}
            style={{
              marginBottom: '32px',
            }}
          >
            <motion.img
              variants={imageVariants}
              src={diagnosticsService.logo}
              alt={`${diagnosticsService.title} Logo`}
              style={{
                width: '160px',
                height: '160px',
                objectFit: 'contain',
                marginBottom: '16px',
                display: 'block',
              }}
            />
            <h2 style={{
              fontSize: textSizes['4xl'].fontSize,
              fontFamily: textSizes['4xl'].fontFamily,
              color: colors.primary,
              fontWeight: '700',
              margin: 0,
            }}>
              {diagnosticsService.title}
            </h2>
          </motion.div>

          {/* Content */}
          <div>
            <motion.p 
              variants={textVariants}
              style={{
                fontSize: textSizes.lg.fontSize,
                fontFamily: textSizes.lg.fontFamily,
                color: colors.text,
                lineHeight: '1.8',
                marginBottom: '24px',
              }}
            >
              {diagnosticsService.p1}
            </motion.p>

            {diagnosticsService.highlight && (
              <motion.div
                variants={textVariants}
                style={{
                  fontSize: textSizes['2xl'].fontSize,
                  fontFamily: textSizes['2xl'].fontFamily,
                  color: colors.primary,
                  fontWeight: '700',
                  lineHeight: '1.5',
                  marginBottom: '24px',
                  fontStyle: 'italic',
                  padding: '32px',
                  backgroundColor: colors.accent + '20',
                  borderLeft: `4px solid ${colors.primary}`,
                  borderRadius: '12px',
                }}
              >
                <TypingText text={diagnosticsService.highlight} delay={0.5} />
              </motion.div>
            )}

            <motion.p 
              variants={textVariants}
              style={{
                fontSize: textSizes.lg.fontSize,
                fontFamily: textSizes.lg.fontFamily,
                color: colors.text,
                lineHeight: '1.8',
                marginBottom: '24px',
              }}
            >
              {diagnosticsService.p2}
            </motion.p>

            <motion.div 
              variants={textVariants}
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
              }}
            >
              <Link 
                to="/diagnostics"
                style={{
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
                Learn More
                <i className="fas fa-arrow-right" style={{ fontSize: '16px' }} />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default DiagnosticsSection;
