import React, { useState, useEffect } from 'react';
import { getColors, getTextSizes } from '../utils/colorsAndText';

const StaffModal = ({ staff, isDarkMode = false, onClose }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isBlinking, setIsBlinking] = useState(false);

  // Setup blinking animation if staff has eyesClosed image
  useEffect(() => {
    if (staff.eyesClosed) {
      const interval = setInterval(() => {
        // Show eyes closed for a quick flash
        setIsBlinking(true);
        
        setTimeout(() => {
          setIsBlinking(false);
        }, 200); // Eyes closed for 200ms (quick flash)
        
      }, 4000); // Every 4 seconds

      // Cleanup interval on unmount
      return () => clearInterval(interval);
    }
  }, [staff.eyesClosed]);

  // Close modal when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={staff.name}
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: '24px',
          paddingTop: '64px',
          boxSizing: 'border-box',
          maxWidth: '600px',
          width: '100%',
          maxHeight: 'calc(100dvh - 40px)',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          aria-label="Close biography"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '16px',
            background: colors.surface,
            boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
            zIndex: 1,
            border: 'none',
            fontSize: '24px',
            color: colors.textSecondary,
            cursor: 'pointer',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = colors.background}
          onMouseLeave={(e) => e.target.style.backgroundColor = colors.surface}
        >
          ×
        </button>

        {/* Content */}
        <div className="navara-bio-scroll" style={{ textAlign: 'center', maxHeight: 'calc(100dvh - 104px)', overflowY: 'auto', overscrollBehavior: 'contain', padding: 'clamp(24px, 6vw, 40px)', boxSizing: 'border-box' }}>
          {/* Profile Photo */}
          <div style={{ marginBottom: '24px' }}>
            <img
              src={staff.eyesClosed && isBlinking ? staff.eyesClosed : staff.photo}
              alt={staff.name}
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: `4px solid ${colors.primary + '20'}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                transition: 'opacity 0.1s ease-in-out',
              }}
            />
          </div>

          {/* Name */}
          <h2 style={{
            fontSize: textSizes['2xl'].fontSize,
            fontFamily: textSizes['2xl'].fontFamily,
            color: colors.text,
            fontWeight: '700',
            marginBottom: '8px',
          }}>
            {staff.name}
          </h2>

          {/* Position */}
          <p style={{
            fontSize: textSizes.lg.fontSize,
            fontFamily: textSizes.lg.fontFamily,
            color: colors.primary,
            fontWeight: '500',
            marginBottom: '32px',
            fontStyle: 'italic',
          }}>
            {staff.position}
          </p>

          {/* Full Text */}
          <div style={{ textAlign: 'left' }}>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              lineHeight: '1.7',
              whiteSpace: 'pre-line',
              margin: 0,
            }}>
              {staff.fullText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffModal;
