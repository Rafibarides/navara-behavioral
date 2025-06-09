import React, { useState, useEffect, useRef } from 'react';
import { getColors, getTextSizes } from '../../utils/colorsAndText';
import StaffModal from '../StaffModal';

const OurTeamSection = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [blinkingStates, setBlinkingStates] = useState({});
  const [isTitleVisible, setIsTitleVisible] = useState(false);
  const [typedSubtext, setTypedSubtext] = useState('');
  const sectionRef = useRef(null);

  // Text to type out
  const fullSubtext = "Meet the dedicated professionals committed to providing exceptional care and support";

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Dynamic team array
  const teamMembers = [
    {
      photo: '/src/assets/nisanFetman.png',
      eyesClosed: '/src/assets/nisanFetmanEyesClosed.png',
      name: 'David Nisan Fetman, BCBA',
      position: 'Founder',
      introSentence: 'David Nisan is a Board Certified Behavior Analyst (BCBA) and doctoral-level psychology trainee',
      fullText: 'Nisan is a Board Certified Behavior Analyst (BCBA) and doctoral-level psychology trainee with extensive experience in child development, behavioral assessment, and intervention. In 2025, he founded Navara Behavioral Group with the mission of delivering direct, effective, and family-centered care. Nisan is known for his clear communication style, practical strategies, and deep commitment to helping children and families make meaningful progress.'
    },
    {
        photo: '/src/assets/lady1.png',
        name: 'Sarah Levine, M.Ed, BCBA',
        position: 'Senior Behavior Analyst',
        introSentence: 'Sarah Levine is a Senior Board Certified Behavior Analyst (BCBA) with expertise in early intervention and educational programming.',
        fullText: 'Levine has over a decade of experience designing and implementing individualized behavior intervention plans in school and home settings. She earned her Master of Education in Special Education and has trained numerous parents and professionals in positive behavior support techniques. Sarah is passionate about empowering families and educators through data-driven strategies and compassionate guidance.'
      }
      
  ];

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
              OUR TEAM
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
            gap: '40px',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: isTitleVisible ? 1 : 0, // Changed to fade in with title
            transform: isTitleVisible ? 'translateY(0)' : 'translateY(30px)', // Changed to fade in with title
            transition: 'all 0.8s ease-out 0.4s', // Added small delay after title
          }}>
            {teamMembers.map((member, index) => (
              <div
                key={index}
                onClick={() => handleStaffClick(member)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: '24px',
                  padding: '40px 30px',
                  textAlign: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  maxWidth: '320px',
                  width: isMobile ? '100%' : '320px',
                  overflow: 'hidden',
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
                  marginBottom: '24px',
                }}>
                  <img
                    src={member.eyesClosed && blinkingStates[index] ? member.eyesClosed : member.photo}
                    alt={member.name}
                    style={{
                      width: '120px',
                      height: '120px',
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
                  fontSize: textSizes.xl.fontSize,
                  fontFamily: textSizes.xl.fontFamily,
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
                  fontSize: textSizes.base.fontSize,
                  fontFamily: textSizes.base.fontFamily,
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
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.textSecondary,
                  lineHeight: '1.5',
                  margin: 0,
                  position: 'relative',
                  zIndex: 2,
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
