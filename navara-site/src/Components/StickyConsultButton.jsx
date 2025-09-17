import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getColors, getTextSizes } from '../utils/colorsAndText';
import CalendlyModal from './CalendlyModal';

const StickyConsultButton = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(false);
  const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-expand on desktop after a delay, then collapse
  useEffect(() => {
    if (!isMobile) {
      const expandTimer = setTimeout(() => {
        setIsExpanded(true);
      }, 2000);

      const collapseTimer = setTimeout(() => {
        setIsExpanded(false);
      }, 8000);

      return () => {
        clearTimeout(expandTimer);
        clearTimeout(collapseTimer);
      };
    }
  }, [isMobile]);

  const handleClick = () => {
    setIsCalendlyModalOpen(true);
  };

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsExpanded(false);
    }
  };

  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0, x: -100 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ 
          delay: 1.5, 
          duration: 0.6,
          type: "spring",
          stiffness: 200,
          damping: 20
        }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'fixed',
          bottom: isMobile ? '20px' : '30px',
          left: isMobile ? '20px' : '30px',
          height: isMobile ? '50px' : '56px',
          minWidth: isMobile ? '50px' : '56px',
          borderRadius: '28px',
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
          border: 'none',
          boxShadow: '0 4px 20px rgba(27, 59, 98, 0.4)',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: isMobile ? '0' : '0 20px 0 0',
          overflow: 'hidden',
          width: isExpanded && !isMobile ? '300px' : isMobile ? '50px' : '56px',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
        whileHover={{ 
          scale: 1.05,
          boxShadow: '0 6px 30px rgba(27, 59, 98, 0.6)',
        }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Icon Container */}
        <div style={{
          width: isMobile ? '50px' : '56px',
          height: isMobile ? '50px' : '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <i 
            className="fas fa-calendar-check" 
            style={{
              color: 'white',
              fontSize: isMobile ? '18px' : '20px',
            }}
          />
        </div>

        {/* Text Container - Only show on desktop when expanded */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: isExpanded ? 1 : 0,
            }}
            transition={{ 
              duration: 0.3,
              ease: "easeInOut"
            }}
            style={{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              paddingLeft: isExpanded ? '12px' : '0px',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{
              color: 'white',
              fontSize: textSizes.xs.fontSize,
              fontFamily: textSizes.xs.fontFamily,
              fontWeight: '600',
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
            }}>
              Schedule Your Free Consult
            </span>
          </motion.div>
        )}
      </motion.button>

      {/* Calendly Modal */}
      <CalendlyModal 
        isOpen={isCalendlyModalOpen}
        onClose={() => setIsCalendlyModalOpen(false)}
        isDarkMode={isDarkMode}
      />
    </>
  );
};

export default StickyConsultButton;
