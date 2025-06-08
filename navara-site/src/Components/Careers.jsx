import React, { useState, useEffect, useRef } from 'react';
import { getColors, getTextSizes } from '../utils/colorsAndText';
import NavBarMenu from './NavBarMenu';
import FooterSection from './Sections/FooterSection';

const Careers = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTitleVisible, setIsTitleVisible] = useState(false);
  const [typedSubtitle, setTypedSubtitle] = useState('');
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
  const heroRef = useRef(null);

  // Text to type out
  const fullSubtitle = "Join Our Team of Dedicated Professionals";

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Typing animation for subtitle
  useEffect(() => {
    if (isTitleVisible && typedSubtitle.length < fullSubtitle.length) {
      const timeout = setTimeout(() => {
        setTypedSubtitle(fullSubtitle.slice(0, typedSubtitle.length + 1));
      }, 60); // Typing speed
      
      return () => clearTimeout(timeout);
    }
  }, [isTitleVisible, typedSubtitle, fullSubtitle]);

  // Show description after subtitle is complete
  useEffect(() => {
    if (typedSubtitle === fullSubtitle) {
      setTimeout(() => {
        setIsDescriptionVisible(true);
      }, 400); // Small delay after subtitle completes
    }
  }, [typedSubtitle, fullSubtitle]);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsTitleVisible(true);
            // Reset animations
            setTimeout(() => {
              setTypedSubtitle('');
              setIsDescriptionVisible(false);
            }, 600);
          } else {
            // Reset when section leaves view
            setIsTitleVisible(false);
            setTypedSubtitle('');
            setIsDescriptionVisible(false);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, []);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    // Handle email submission logic here
    console.log('Email submitted:', email);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setEmail('');
    }, 3000);
  };

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      overflowX: 'hidden',
      boxSizing: 'border-box',
    }}>
      <NavBarMenu isDarkMode={isDarkMode} />
      
      {/* Hero Section with Animations */}
      <section 
        ref={heroRef}
        style={{
          backgroundColor: colors.surface,
          width: '100vw',
          padding: isMobile ? '120px 20px 80px 20px' : '140px 40px 100px 40px',
          margin: 0,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          minHeight: '80vh',
        }}
      >
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: isMobile ? 'block' : 'flex',
          alignItems: 'center',
          gap: '80px',
        }}>
          {/* Content */}
          <div style={{
            flex: 1,
            marginBottom: isMobile ? '60px' : '0',
          }}>
            <h1 style={{
              fontSize: isMobile ? textSizes['3xl'].fontSize : textSizes['5xl'].fontSize,
              fontFamily: isMobile ? textSizes['3xl'].fontFamily : textSizes['5xl'].fontFamily,
              fontWeight: '800',
              color: colors.primary,
              lineHeight: '1.2',
              marginBottom: '32px',
              letterSpacing: '-0.02em',
              opacity: isTitleVisible ? 1 : 0,
              transform: isTitleVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s ease-out',
            }}>
              Want to Help Families Make Real Progress?
            </h1>
            
            <div style={{
              fontSize: isMobile ? textSizes.xl.fontSize : textSizes['2xl'].fontSize,
              fontFamily: isMobile ? textSizes.xl.fontFamily : textSizes['2xl'].fontFamily,
              fontWeight: '600',
              color: colors.text,
              lineHeight: '1.4',
              marginBottom: '40px',
              minHeight: '2em',
            }}>
              {typedSubtitle}
              {typedSubtitle.length < fullSubtitle.length && isTitleVisible && (
                <span style={{
                  opacity: Math.sin(Date.now() / 500) > 0 ? 1 : 0,
                  transition: 'opacity 0.1s',
                  color: colors.text,
                }}>|</span>
              )}
            </div>

            <p style={{
              fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
              fontFamily: isMobile ? textSizes.base.fontFamily : textSizes.lg.fontFamily,
              color: colors.text,
              lineHeight: '1.7',
              marginBottom: '48px',
              maxWidth: '600px',
              opacity: isDescriptionVisible ? 1 : 0,
              transform: isDescriptionVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s ease-out',
            }}>
              At Navara Behavioral Group, we're building something different—a place where expertise meets compassion, where families get the support they actually need, and where professionals can make a meaningful impact every day.
            </p>
            
            {/* Call to Action Buttons */}
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '20px',
              alignItems: isMobile ? 'stretch' : 'center',
              opacity: isDescriptionVisible ? 1 : 0,
              transform: isDescriptionVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s ease-out 0.3s',
            }}>
              <a
                href="mailto:admin@navarabehavioralgroup.com?subject=Resume Submission"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.surface,
                  padding: '16px 24px',
                  borderRadius: '50px',
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  fontWeight: '600',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  border: 'none',
                  whiteSpace: 'nowrap',
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
                <i className="fas fa-paper-plane" style={{ fontSize: '14px' }} />
                Send Resume
              </a>
              <p style={{
                fontSize: textSizes.sm.fontSize,
                fontFamily: textSizes.sm.fontFamily,
                color: colors.textSecondary,
                margin: 0,
                textAlign: isMobile ? 'center' : 'left',
              }}>
                Email: admin@navarabehavioralgroup.com
              </p>
            </div>
          </div>

          {/* Image */}
          <div style={{
            flex: '0 0 500px',
            maxWidth: isMobile ? '100%' : '500px',
            opacity: isTitleVisible ? 1 : 0,
            transform: isTitleVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease-out 0.4s',
          }}>
            <img
              src="/src/assets/office.png"
              alt="Navara Office Environment"
              style={{
                width: '100%',
                height: isMobile ? '300px' : '400px',
                objectFit: 'cover',
                borderRadius: '24px',
                boxShadow: '0 16px 64px rgba(0,0,0,0.1)',
              }}
            />
          </div>
        </div>
      </section>

      {/* Current Status Section */}
      <section style={{
        backgroundColor: colors.background,
        width: '100vw',
        padding: isMobile ? '80px 20px' : '120px 40px',
        margin: 0,
        boxSizing: 'border-box',
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center',
        }}>
          <div style={{
            backgroundColor: colors.surface,
            borderRadius: '24px',
            padding: isMobile ? '50px 30px' : '70px 60px',
            boxShadow: '0 12px 48px rgba(0,0,0,0.08)',
            border: `1px solid ${colors.border}`,
          }}>
            <h2 style={{
              fontSize: isMobile ? textSizes['2xl'].fontSize : textSizes['3xl'].fontSize,
              fontFamily: isMobile ? textSizes['2xl'].fontFamily : textSizes['3xl'].fontFamily,
              fontWeight: '700',
              color: colors.primary,
              marginBottom: '24px',
            }}>
              We're Not Hiring Right Now
            </h2>
            <p style={{
              fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
              fontFamily: isMobile ? textSizes.base.fontFamily : textSizes.lg.fontFamily,
              color: colors.text,
              lineHeight: '1.7',
              marginBottom: '40px',
            }}>
              But we're always growing! Drop your email below to be the first to know about new opportunities, and don't forget to send your resume to stay on our radar.
            </p>

            {/* Email Signup Form */}
            <form onSubmit={handleEmailSubmit} style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '16px',
              maxWidth: '500px',
              margin: '0 auto',
              marginBottom: '32px',
            }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                style={{
                  flex: 1,
                  padding: '16px 20px',
                  border: `2px solid ${colors.border}`,
                  borderRadius: '50px',
                  fontSize: textSizes.base.fontSize,
                  fontFamily: textSizes.base.fontFamily,
                  backgroundColor: colors.background,
                  color: colors.text,
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = colors.border}
              />
              <button
                type="submit"
                disabled={isSubmitted}
                style={{
                  backgroundColor: isSubmitted ? colors.accent : colors.primary,
                  color: colors.surface,
                  border: 'none',
                  borderRadius: '50px',
                  padding: '16px 24px',
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  fontWeight: '600',
                  cursor: isSubmitted ? 'default' : 'pointer',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitted) {
                    e.target.style.backgroundColor = colors.secondary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitted) {
                    e.target.style.backgroundColor = colors.primary;
                  }
                }}
              >
                {isSubmitted ? (
                  <>
                    <i className="fas fa-check" style={{ marginRight: '8px', fontSize: '12px' }} />
                    Subscribed!
                  </>
                ) : (
                  'Get Updates'
                )}
              </button>
            </form>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: colors.textSecondary,
              fontSize: textSizes.sm.fontSize,
              fontFamily: textSizes.sm.fontFamily,
            }}>
              <i className="fas fa-lock" style={{ fontSize: '12px' }} />
              <span>We respect your privacy. No spam, ever.</span>
            </div>
          </div>
        </div>
      </section>

      <FooterSection isDarkMode={isDarkMode} />
    </div>
  );
};

export default Careers;
