import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getColors, getTextSizes } from '../../utils/colorsAndText';

const ServiceCardSection = ({ isDarkMode = false }) => {
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

  // Dynamic array for service cards
  const serviceCards = [
    {
      icon: 'fas fa-route',
      title: 'Navara Pathways',
      section: 'pathways'
    },
    {
      icon: 'fas fa-stethoscope',
      title: 'Navara Diagnostics',
      section: 'diagnostics'
    },
    {
      icon: 'fas fa-brain',
      title: 'Navara Behavioral',
      section: 'behavioral'
    }
  ];

  const handleLearnMore = (section) => {
    // Find the section element by ID
    const targetElement = document.getElementById(section);
    if (targetElement) {
      // Calculate offset for fixed navbar (adjust this value as needed)
      const navbarOffset = 80;
      const elementPosition = targetElement.offsetTop - navbarOffset;
      
      // Smooth scroll to the section
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    } else {
      console.warn(`Section with ID "${section}" not found`);
    }
  };

  // Smoother animation variants for the container
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15, // Slightly faster stagger
        delayChildren: 0.2,
        ease: [0.4, 0, 0.2, 1], // Custom cubic bezier
      }
    }
  };

  // Smoother animation variants for individual cards
  const cardVariants = {
    hidden: (index) => ({
      x: isMobile ? 0 : (index === 0 ? -80 : index === 2 ? 80 : 0), // Reduced initial offset
      y: isMobile ? (index === 0 ? -60 : index === 2 ? 60 : 0) : 0,
      rotate: isMobile ? (index === 0 ? -12 : index === 2 ? 12 : 0) : (index === 0 ? -8 : index === 2 ? 8 : 0),
      scale: 0.85,
      opacity: 0.6,
    }),
    visible: {
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 120, // Higher stiffness for snappier feel
        damping: 20, // Increased damping for less bounce
        mass: 0.8, // Reduced mass for lighter feel
        ease: [0.4, 0, 0.2, 1],
      }
    }
  };

  return (
    <section style={{
      backgroundColor: colors.surface,
      width: '100vw',
      padding: '80px 20px',
      margin: 0,
      boxSizing: 'border-box',
    }}>
      {/* Section Title */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ 
          duration: 0.8,
          ease: [0.4, 0, 0.2, 1]
        }}
        style={{
          textAlign: 'center',
          marginBottom: '60px',
          maxWidth: '800px',
          margin: '0 auto 60px auto',
        }}
      >
        <h2 style={{
          fontSize: textSizes['4xl'].fontSize,
          fontFamily: textSizes['4xl'].fontFamily,
          color: colors.primary,
          fontWeight: '700',
          marginBottom: '16px',
        }}>
          Our Services
        </h2>
        <p style={{
          fontSize: textSizes.lg.fontSize,
          fontFamily: textSizes.lg.fontFamily,
          color: colors.textSecondary,
          lineHeight: '1.6',
        }}>
          Comprehensive support tailored to your family's unique needs
        </p>
      </motion.div>

      {/* Service Cards Container */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '30px',
          maxWidth: '1000px', // Reduced from 1200px
          margin: '0 auto',
          padding: '0 20px',
          position: 'relative',
        }}
      >
        {serviceCards.map((service, index) => (
          <motion.div
            key={index}
            custom={index}
            variants={cardVariants}
            style={{
              backgroundColor: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: '20px',
              padding: '30px 25px', // Reduced from 40px 30px
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minHeight: '240px', // Reduced from 280px
              justifyContent: 'space-between',
              willChange: 'transform',
            }}
            whileHover={{
              y: -8,
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              // Removed borderColor change
              transition: { 
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
              }
            }}
            whileTap={{ 
              scale: 0.98,
              transition: { duration: 0.1 }
            }}
          >
            {/* Icon */}
            <motion.div 
              style={{
                width: '70px', // Reduced from 80px
                height: '70px', // Reduced from 80px
                backgroundColor: colors.primary + '15',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px', // Reduced from 24px
              }}
              whileHover={{ 
                scale: 1.08,
                backgroundColor: colors.primary + '25',
                transition: {
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1]
                }
              }}
            >
              <i 
                className={service.icon}
                style={{
                  fontSize: '28px', // Reduced from 32px
                  color: colors.primary,
                }}
              />
            </motion.div>

            {/* Title */}
            <h3 style={{
              fontSize: textSizes.xl.fontSize, // Reduced from 2xl
              fontFamily: textSizes.xl.fontFamily,
              color: colors.text,
              fontWeight: '600',
              marginBottom: '18px', // Reduced from 20px
              lineHeight: '1.2',
            }}>
              {service.title}
            </h3>

            {/* Learn More Button with Arrow - Only show on desktop */}
            {!isMobile && (
              <motion.button
                onClick={() => handleLearnMore(service.section)}
                style={{
                  backgroundColor: colors.primary,
                  color: colors.surface,
                  border: 'none',
                  borderRadius: '25px',
                  padding: '10px 20px', // Reduced from 12px 24px
                  fontSize: textSizes.sm.fontSize, // Reduced from base
                  fontFamily: textSizes.sm.fontFamily,
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginTop: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                whileHover={{
                  backgroundColor: colors.secondary,
                  scale: 1.03,
                  transition: {
                    duration: 0.2,
                    ease: [0.4, 0, 0.2, 1]
                  }
                }}
                whileTap={{ 
                  scale: 0.97,
                  transition: { duration: 0.1 }
                }}
              >
                Learn More
                <i className="fas fa-arrow-right" style={{ fontSize: '12px' }} />
              </motion.button>
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default ServiceCardSection;
