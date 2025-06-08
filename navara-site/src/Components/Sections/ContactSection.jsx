import React, { useState, useEffect, useRef } from 'react';
import { getColors, getTextSizes } from '../../utils/colorsAndText';

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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    // Add your form submission logic here
  };

  return (
    <section 
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
                  admin@navarabehavioralgroup.com
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
                  (8)-666-NAVARA
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
            <form onSubmit={handleSubmit} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}>
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

              {/* Submit Button */}
              <button
                type="submit"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.surface,
                  border: 'none',
                  borderRadius: '25px',
                  padding: '12px 24px',
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = colors.secondary;
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = colors.primary;
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <i className="fas fa-calendar-alt" style={{ fontSize: '14px' }} />
                Book your free consultation
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
