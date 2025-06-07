import React from 'react';
import { getColors, getTextSizes } from '../utils/colorsAndText';

const StaffModal = ({ staff, isDarkMode = false, onClose }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);

  // Close modal when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: '24px',
          padding: '40px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: colors.textSecondary,
            cursor: 'pointer',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = colors.background}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          ×
        </button>

        {/* Content */}
        <div style={{ textAlign: 'center' }}>
          {/* Profile Photo */}
          <div style={{ marginBottom: '24px' }}>
            <img
              src={staff.photo}
              alt={staff.name}
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: `4px solid ${colors.primary + '20'}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              }}
            />
          </div>

          {/* Name */}
          <h2 style={{
            fontSize: textSizes['2xl'],
            color: colors.text,
            fontWeight: '700',
            marginBottom: '8px',
          }}>
            {staff.name}
          </h2>

          {/* Position */}
          <p style={{
            fontSize: textSizes.lg,
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
              fontSize: textSizes.base,
              color: colors.text,
              lineHeight: '1.7',
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
