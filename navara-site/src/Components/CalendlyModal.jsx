import React, { useEffect, useState, useRef } from 'react';
import { getColors, getTextSizes } from '../utils/colorsAndText';

const CalendlyModal = ({ isOpen, onClose, isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(false);
  const [isCalendlyLoaded, setIsCalendlyLoaded] = useState(false);
  const [isWidgetInitialized, setIsWidgetInitialized] = useState(false);
  const widgetContainerRef = useRef(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Load Calendly scripts only once when modal opens
  useEffect(() => {
    if (isOpen && !isCalendlyLoaded) {
      loadCalendlyScripts();
    }
  }, [isOpen, isCalendlyLoaded]);

  // Initialize widget only when scripts are loaded and modal is open
  useEffect(() => {
    if (isOpen && isCalendlyLoaded && !isWidgetInitialized) {
      initializeWidget();
    }
  }, [isOpen, isCalendlyLoaded, isWidgetInitialized]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsWidgetInitialized(false);
    }
  }, [isOpen]);

  const loadCalendlyScripts = () => {
    // Load Calendly CSS if not already loaded
    if (!document.querySelector('link[href*="calendly.com"]')) {
      const link = document.createElement('link');
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    // Load Calendly JS if not already loaded
    if (!document.querySelector('script[src*="calendly.com"]')) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => {
        setIsCalendlyLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Calendly script');
      };
      document.head.appendChild(script);
    } else {
      // Script already exists
      setIsCalendlyLoaded(true);
    }
  };

  const initializeWidget = () => {
    if (window.Calendly && widgetContainerRef.current && !isWidgetInitialized) {
      try {
        // Clear any existing content
        widgetContainerRef.current.innerHTML = '';
        
        // Initialize the inline widget
        window.Calendly.initInlineWidget({
          url: 'https://calendly.com/navarabehavioralgroup-info/free-15-minute-consultation',
          parentElement: widgetContainerRef.current,
          prefill: {},
          utm: {}
        });
        
        setIsWidgetInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Calendly widget:', error);
      }
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Custom styles for Calendly widget */}
      <style>
        {`
          .calendly-inline-widget,
          .calendly-inline-widget iframe {
            width: 100% !important;
            height: ${isMobile ? '600px' : '700px'} !important;
            border: none !important;
            border-radius: 0 !important;
          }
          
          .calendly-badge-widget {
            display: none !important;
          }
          
          .calendly-spinner {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            height: ${isMobile ? '600px' : '700px'} !important;
          }
        `}
      </style>

      <div 
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: 0,
          overflowY: 'hidden',
          overflowX: 'hidden',
        }}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.background,
            borderRadius: isMobile ? '20px 20px 0 0' : '24px 24px 0 0',
            width: '100%',
            maxWidth: isMobile ? '100%' : '1000px',
            height: isMobile ? '85vh' : '80vh',
            maxHeight: isMobile ? '85vh' : '80vh',
            minHeight: isMobile ? '600px' : '700px',
            position: 'relative',
            boxShadow: '0 -10px 60px rgba(0, 0, 0, 0.3)',
            border: `1px solid ${colors.border}`,
            borderBottom: 'none',
            display: 'flex',
            flexDirection: 'column',
            transform: 'translateY(0)',
            transition: 'transform 0.3s ease-out',
          }}
        >
          {/* Drag Handle */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '12px 0 8px 0',
            backgroundColor: colors.surface,
            borderRadius: isMobile ? '20px 20px 0 0' : '24px 24px 0 0',
          }}>
            <div style={{
              width: '40px',
              height: '4px',
              backgroundColor: colors.border,
              borderRadius: '2px',
              cursor: 'pointer',
            }} />
          </div>

          {/* Header */}
          <div style={{
            padding: isMobile ? '16px 20px 16px 20px' : '20px 32px 20px 32px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surface,
            borderRadius: '0',
            flexShrink: 0,
          }}>
            <div>
              <h2 style={{
                fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
                fontFamily: textSizes.xl.fontFamily,
                color: colors.primary,
                fontWeight: '700',
                margin: 0,
                marginBottom: '4px',
              }}>
                Schedule Your Free Consultation
              </h2>
              <p style={{
                fontSize: textSizes.sm.fontSize,
                fontFamily: textSizes.sm.fontFamily,
                color: colors.textSecondary,
                margin: 0,
              }}>
                Book a 15-minute consultation with our team
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: isMobile ? '24px' : '28px',
                color: colors.textSecondary,
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                width: '36px',
                height: '36px',
                lineHeight: 1,
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = colors.border;
                e.target.style.color = colors.text;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = colors.textSecondary;
              }}
            >
              ×
            </button>
          </div>

          {/* Calendly Widget Container */}
          <div style={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: '0',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Loading State */}
            {(!isCalendlyLoaded || !isWidgetInitialized) && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'white',
                zIndex: 1,
              }}>
                <div style={{
                  textAlign: 'center',
                  color: colors.textSecondary,
                }}>
                  <div style={{
                    display: 'inline-block',
                    width: '40px',
                    height: '40px',
                    border: `3px solid ${colors.border}`,
                    borderTop: `3px solid ${colors.primary}`,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '16px',
                  }} />
                  <p style={{
                    fontSize: textSizes.base.fontSize,
                    fontFamily: textSizes.base.fontFamily,
                    margin: 0,
                  }}>
                    Loading calendar...
                  </p>
                  <style>
                    {`
                      @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                    `}
                  </style>
                </div>
              </div>
            )}

            <div 
              ref={widgetContainerRef}
              style={{
                width: '100%',
                height: isMobile ? '600px' : '500px',
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default CalendlyModal; 