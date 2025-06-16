import React, { useState, useEffect, useRef } from 'react';
import { getColors, getTextSizes } from '../../utils/colorsAndText';
import StaffModal from '../StaffModal';
import siteData from '../../../SiteData.json';

const OurTeamSection = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [blinkingStates, setBlinkingStates] = useState({});
  const [isTitleVisible, setIsTitleVisible] = useState(false);
  const [typedSubtext, setTypedSubtext] = useState('');
  const sectionRef = useRef(null);

  // Get data from siteData
  const { title, subtext, members: teamMembers } = siteData.sections.team;

  // Text to type out
  const fullSubtext = subtext;

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Setup blinking animation for team members with eyesClosed images
  useEffect(() => {
    const intervals = {};

    teamMembers.forEach((member, index) => {
      if (member.eyesClosed) {
        intervals[index] = setInterval(() => {
          // Show eyes closed for a quick flash
          setBlinkingStates(prev => ({ ...prev, [index]: true }));
          
          setTimeout(() => {
            setBlinkingStates(prev => ({ ...prev, [index]: false }));
          }, 200); // Eyes closed for 200ms (quick flash)
          
        }, 4000); // Every 4 seconds
      }
    });

    // Cleanup intervals on unmount
    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [teamMembers]);

  // Typing animation for subtext
  useEffect(() => {
    if (isTitleVisible && typedSubtext.length < fullSubtext.length) {
      const timeout = setTimeout(() => {
        setTypedSubtext(fullSubtext.slice(0, typedSubtext.length + 1));
      }, 50); // Typing speed
      
      return () => clearTimeout(timeout);
    }
  }, [isTitleVisible, typedSubtext, fullSubtext]);

  // Intersection Observer for title animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Start title fade in immediately
            setIsTitleVisible(true);
            // Reset typing animation only once when coming into view
            setTypedSubtext('');
          } else {
            // Reset animations when section leaves view
            setIsTitleVisible(false);
            setTypedSubtext('');
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

  const handleStaffClick = (staff) => {
    setSelectedStaff(staff);
  };

  const closeModal = () => {
    setSelectedStaff(null);
  };

  return (
    <>
      <section 
        id="team"
        ref={sectionRef}
        style={{
          backgroundColor: colors.background,
          width: '100vw',
          padding: isMobile ? '80px 20px' : '120px 40px',
          margin: 0,
          boxSizing: 'border-box',
        }}
      >
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          {/* Section Title with Animations */}
          <div style={{
            textAlign: 'center',
            marginBottom: isMobile ? '60px' : '80px',
          }}>
            <h2 style={{
              fontSize: isMobile ? textSizes['3xl'].fontSize : textSizes['4xl'].fontSize,
              fontFamily: isMobile ? textSizes['3xl'].fontFamily : textSizes['4xl'].fontFamily,
              color: colors.primary,
              fontWeight: '700',
              marginBottom: '16px',
              letterSpacing: '0.05em',
              opacity: isTitleVisible ? 1 : 0,
              transform: isTitleVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s ease-out',
            }}>
              {title}
            </h2>
            
            {/* Fixed height container to prevent layout shift */}
            <div style={{
              fontSize: textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.textSecondary,
              lineHeight: '1.6',
              maxWidth: '600px',
              margin: '0 auto',
              height: isMobile ? '4em' : '3.2em', // Fixed height for 2-3 lines
              display: 'flex',
              alignItems: 'flex-start', // Align to top instead of center
              justifyContent: 'center',
              paddingTop: '0.2em', // Small padding to center text visually
            }}>
              <span style={{
                textAlign: 'center',
                width: '100%',
              }}>
                {typedSubtext}
                {typedSubtext.length < fullSubtext.length && isTitleVisible && (
                  <span style={{
                    opacity: Math.sin(Date.now() / 500) > 0 ? 1 : 0,
                    transition: 'opacity 0.1s',
                    color: colors.textSecondary,
                  }}>|</span>
                )}
              </span>
            </div>
          </div>

          {/* Team Cards Grid - Fade in immediately with title */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '30px',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: isTitleVisible ? 1 : 0,
            transform: isTitleVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease-out 0.4s',
          }}>
            {teamMembers.map((member, index) => (
              <div
                key={index}
                onClick={() => handleStaffClick(member)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: '24px',
                  padding: isMobile ? '40px 30px' : '35px 25px',
                  textAlign: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  maxWidth: isMobile ? '100%' : '280px',
                  width: isMobile ? '100%' : '280px',
                  height: isMobile ? 'auto' : '380px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1)';
                  e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)';
                }}
              >
                {/* Decorative Background Element */}
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '120px',
                  height: '120px',
                  backgroundColor: index % 3 === 0 ? colors.primary + '15' : 
                                   index % 3 === 1 ? colors.accent + '20' : 
                                   colors.secondary + '15',
                  borderRadius: '50%',
                  zIndex: 1,
                }} />

                {/* Profile Photo */}
                <div style={{
                  position: 'relative',
                  zIndex: 2,
                  marginBottom: isMobile ? '24px' : '20px',
                }}>
                  <img
                    src={member.eyesClosed && blinkingStates[index] ? member.eyesClosed : member.photo}
                    alt={member.name}
                    style={{
                      width: isMobile ? '120px' : '100px',
                      height: isMobile ? '120px' : '100px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `4px solid ${colors.surface}`,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                      transition: 'opacity 0.1s ease-in-out',
                    }}
                  />
                </div>

                {/* Name */}
                <h3 style={{
                  fontSize: isMobile ? textSizes.xl.fontSize : textSizes.lg.fontSize,
                  fontFamily: isMobile ? textSizes.xl.fontFamily : textSizes.lg.fontFamily,
                  color: colors.text,
                  fontWeight: '600',
                  marginBottom: '8px',
                  position: 'relative',
                  zIndex: 2,
                }}>
                  {member.name}
                </h3>

                {/* Position */}
                <p style={{
                  fontSize: isMobile ? textSizes.base.fontSize : textSizes.sm.fontSize,
                  fontFamily: isMobile ? textSizes.base.fontFamily : textSizes.sm.fontFamily,
                  color: colors.primary,
                  fontWeight: '500',
                  marginBottom: '16px',
                  fontStyle: 'italic',
                  position: 'relative',
                  zIndex: 2,
                }}>
                  {member.position}
                </p>

                {/* Intro Sentence */}
                <p style={{
                  fontSize: isMobile ? textSizes.sm.fontSize : textSizes.xs.fontSize,
                  fontFamily: isMobile ? textSizes.sm.fontFamily : textSizes.xs.fontFamily,
                  color: colors.textSecondary,
                  lineHeight: '1.5',
                  margin: 0,
                  position: 'relative',
                  zIndex: 2,
                  flex: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {member.introSentence}
                </p>

                {/* Click indicator */}
                <div style={{
                  marginTop: '20px',
                  fontSize: textSizes.xs.fontSize,
                  fontFamily: textSizes.xs.fontFamily,
                  color: colors.primary,
                  fontWeight: '500',
                  position: 'relative',
                  zIndex: 2,
                }}>
                  Click to learn more →
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Staff Modal */}
      {selectedStaff && (
        <StaffModal
          staff={selectedStaff}
          isDarkMode={isDarkMode}
          onClose={closeModal}
        />
      )}
    </>
  );
};

export default OurTeamSection;
