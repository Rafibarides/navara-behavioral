import React, { useState, useEffect, useRef } from 'react';
import { getColors, getTextSizes } from '../../utils/colorsAndText';
import CalendlyModal from '../CalendlyModal';

const ContactSection = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);
  const sectionRef = useRef(null);

  // Array of words to cycle through
  const helpWords = ["HELP", "SUPPORT", "EMBRACE", "GUIDE", "PROVIDE", "SERVE", "CARE", "EMPOWER"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isWordVisible, setIsWordVisible] = useState(true);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cycle through words
  useEffect(() => {
    const interval = setInterval(() => {
      // Start fade out
      setIsWordVisible(false);
      
      // After fade out completes, change word and fade in
      setTimeout(() => {
        setCurrentWordIndex((prevIndex) => 
          (prevIndex + 1) % helpWords.length
        );
        setIsWordVisible(true);
      }, 300); // Fade out duration
      
    }, 3000); // Change word every 3 seconds

    return () => clearInterval(interval);
  }, [helpWords.length]);

  // Intersection Observer for content animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsContentVisible(true);
          } else {
            // Reset when section leaves view
            setIsContentVisible(false);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if all required fields are filled
    if (!formData.name || !formData.email || !formData.message) {
      return;
    }

    // Show success state immediately
    setIsSubmitted(true);
    
    // Submit to Formspree in the background
    const formDataToSend = new FormData(e.target);
    try {
      await fetch("https://formspree.io/f/mblyywzv", {
        method: "POST",
        body: formDataToSend
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    }

    // Clear form and reset after 3 seconds
    setFormData({ name: '', email: '', message: '' });
    setTimeout(() => {
      setIsSubmitted(false);
    }, 3000);
  };

  return (
    <section 
      id="contact"
      ref={sectionRef}
      style={{
        backgroundColor: colors.surface,
        width: '100vw',
        padding: isMobile ? '80px 20px' : '120px 40px',
        margin: 0,
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: isMobile ? 'block' : 'flex',
        gap: '60px',
        alignItems: 'center',
      }}>
        {/* Left Side - Contact Information */}
        <div style={{
          flex: isMobile ? 'none' : '1',
          marginBottom: isMobile ? '60px' : '0',
        }}>
          <div style={{
            marginBottom: '40px',
          }}>
            <h3 style={{
              fontSize: isMobile ? textSizes.lg.fontSize : textSizes.xl.fontSize,
              fontFamily: isMobile ? textSizes.lg.fontFamily : textSizes.xl.fontFamily,
              fontWeight: '600',
              marginBottom: '8px',
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '1.5em', // Prevent layout shift
            }}>
              <span>WE'RE HERE TO</span>
              <span style={{
                opacity: isWordVisible ? 1 : 0,
                transform: isWordVisible ? 'translateY(0)' : 'translateY(-10px)',
                transition: 'all 0.3s ease-in-out',
                color: colors.primary,
                fontWeight: '700',
              }}>
                {helpWords[currentWordIndex]}
              </span>
            </h3>
            <h2 style={{
              fontSize: isMobile ? textSizes['2xl'].fontSize : textSizes['3xl'].fontSize,
              fontFamily: isMobile ? textSizes['2xl'].fontFamily : textSizes['3xl'].fontFamily,
              fontWeight: '700',
              lineHeight: '1.2',
              marginBottom: '24px',
              color: colors.primary,
            }}>
              Get the Support Your Family Needs
            </h2>
            <p style={{
              fontSize: textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              lineHeight: '1.6',
              color: colors.text,
              marginBottom: '40px',
            }}>
              Navara Behavioral Group is here to help. Send us a message and we'll be in touch.
            </p>
          </div>

          {/* Contact Details with Staggered Animation */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}>
            {/* Email */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              opacity: isContentVisible ? 1 : 0,
              transform: isContentVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s ease-out 0.2s', // 0.2s delay
            }}>
              <div style={{
                backgroundColor: colors.primary + '15',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <i className="fas fa-envelope" style={{
                  fontSize: '18px',
                  color: colors.primary,
                }} />
              </div>
              <div>
                <p style={{
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.textSecondary,
                  margin: 0,
                  marginBottom: '4px',
                  fontWeight: '500',
                }}>
                  E-mail
                </p>
                <p style={{
                  fontSize: textSizes.base.fontSize,
                  fontFamily: textSizes.base.fontFamily,
                  color: colors.text,
                  margin: 0,
                  fontWeight: '500',
                }}>
                  Info@navarabehavioralgroup.com
                </p>
              </div>
            </div>

            {/* Phone */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              opacity: isContentVisible ? 1 : 0,
              transform: isContentVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s ease-out 0.4s', // 0.4s delay for stagger
            }}>
              <div style={{
                backgroundColor: colors.primary + '15',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <i className="fas fa-phone" style={{
                  fontSize: '18px',
                  color: colors.primary,
                }} />
              </div>
              <div>
                <p style={{
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.textSecondary,
                  margin: 0,
                  marginBottom: '4px',
                  fontWeight: '500',
                }}>
                  Phone
                </p>
                <p style={{
                  fontSize: textSizes.base.fontSize,
                  fontFamily: textSizes.base.fontFamily,
                  color: colors.text,
                  margin: 0,
                  fontWeight: '500',
                }}>
                  (1) 877-7NAVARA (877-762-8272)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Contact Form Card with Animation */}
        <div style={{
          flex: isMobile ? 'none' : '0 0 400px',
          maxWidth: isMobile ? '100%' : '400px',
          opacity: isContentVisible ? 1 : 0,
          transform: isContentVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s ease-out 0.6s', // 0.6s delay for last in sequence
        }}>
          <div style={{
            backgroundColor: colors.background,
            borderRadius: '20px',
            padding: isMobile ? '30px 25px' : '35px 30px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: `1px solid ${colors.border}`,
          }}>
            <form 
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {/* Name Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.text,
                  marginBottom: '6px',
                  fontWeight: '500',
                }}>
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your name"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    fontSize: textSizes.sm.fontSize,
                    fontFamily: textSizes.sm.fontFamily,
                    backgroundColor: colors.surface,
                    color: colors.text,
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = colors.border}
                />
              </div>

              {/* Email Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.text,
                  marginBottom: '6px',
                  fontWeight: '500',
                }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    fontSize: textSizes.sm.fontSize,
                    fontFamily: textSizes.sm.fontFamily,
                    backgroundColor: colors.surface,
                    color: colors.text,
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = colors.border}
                />
              </div>

              {/* Message Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.text,
                  marginBottom: '6px',
                  fontWeight: '500',
                }}>
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Tell us about your needs..."
                  rows="3"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    fontSize: textSizes.sm.fontSize,
                    fontFamily: textSizes.sm.fontFamily,
                    backgroundColor: colors.surface,
                    color: colors.text,
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = colors.border}
                />
              </div>

              {/* Submit Button - Send Message */}
              <button
                type="submit"
                disabled={isSubmitted}
                style={{
                  backgroundColor: isSubmitted ? colors.accent : colors.primary,
                  color: isSubmitted ? colors.surface : colors.surface,
                  border: 'none',
                  borderRadius: '25px',
                  padding: '12px 24px',
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  fontWeight: '600',
                  cursor: isSubmitted ? 'default' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px',
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitted) {
                    e.target.style.backgroundColor = colors.secondary;
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitted) {
                    e.target.style.backgroundColor = colors.primary;
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isSubmitted ? (
                  <>
                    <i className="fas fa-check" style={{ fontSize: '14px' }} />
                    Message Sent!
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane" style={{ fontSize: '14px' }} />
                    Send Message
                  </>
                )}
              </button>
              {isSubmitted && (
                <p style={{
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: '8px',
                }}>
                  A team member will be in touch shortly
                </p>
              )}
            </form>

            {/* Separate consultation booking option */}
            <div style={{
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: `1px solid ${colors.border}`,
              textAlign: 'center',
            }}>
              <p style={{
                fontSize: textSizes.xs.fontSize,
                fontFamily: textSizes.xs.fontFamily,
                color: colors.textSecondary,
                margin: '0 0 12px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Or skip the form →
              </p>
              <button
                type="button"
                onClick={() => setIsCalendlyModalOpen(true)}
                style={{
                  backgroundColor: 'transparent',
                  color: colors.primary,
                  border: `1px solid ${colors.primary}`,
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontSize: textSizes.xs.fontSize,
                  fontFamily: textSizes.xs.fontFamily,
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  margin: '0 auto',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = colors.primary + '10';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <i className="fas fa-calendar-alt" style={{ fontSize: '12px' }} />
                Book your free consultation
                <i className="fas fa-external-link-alt" style={{ fontSize: '10px', opacity: 0.7 }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendly Modal */}
      <CalendlyModal 
        isOpen={isCalendlyModalOpen}
        onClose={() => setIsCalendlyModalOpen(false)}
        isDarkMode={isDarkMode}
      />
    </section>
  );
};

export default ContactSection;
