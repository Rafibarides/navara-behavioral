import React, { useState, useEffect } from 'react';
import { getColors, getTextSizes } from '../../utils/colorsAndText';
import StaffModal from '../StaffModal';

const OurTeamSection = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

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
      photo: '/src/assets/nisanFetman.jpeg',
      name: 'David Nisan Fetman, BCBA',
      position: 'Founder',
      introSentence: 'David Nisan is a Board Certified Behavior Analyst (BCBA) and doctoral-level psychology trainee',
      fullText: 'Nisan is a Board Certified Behavior Analyst (BCBA) and doctoral-level psychology trainee with extensive experience in child development, behavioral assessment, and intervention. In 2025, he founded Navara Behavioral Group with the mission of delivering direct, effective, and family-centered care. Nisan is known for his clear communication style, practical strategies, and deep commitment to helping children and families make meaningful progress.'
    }
  ];

  const handleStaffClick = (staff) => {
    setSelectedStaff(staff);
  };

  const closeModal = () => {
    setSelectedStaff(null);
  };

  return (
    <>
      <section style={{
        backgroundColor: colors.background,
        width: '100vw',
        padding: isMobile ? '80px 20px' : '120px 40px',
        margin: 0,
        boxSizing: 'border-box',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          {/* Section Title */}
          <div style={{
            textAlign: 'center',
            marginBottom: isMobile ? '60px' : '80px',
          }}>
            <h2 style={{
              fontSize: isMobile ? textSizes['3xl'] : textSizes['4xl'],
              color: colors.primary,
              fontWeight: '700',
              marginBottom: '16px',
              letterSpacing: '0.05em',
            }}>
              OUR TEAM
            </h2>
            <p style={{
              fontSize: textSizes.lg,
              color: colors.textSecondary,
              lineHeight: '1.6',
              maxWidth: '600px',
              margin: '0 auto',
            }}>
              Meet the dedicated professionals committed to providing exceptional care and support
            </p>
          </div>

          {/* Team Cards Grid */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '40px',
            justifyContent: 'center',
            alignItems: 'center',
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
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
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
                    src={member.photo}
                    alt={member.name}
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `4px solid ${colors.surface}`,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    }}
                  />
                </div>

                {/* Name */}
                <h3 style={{
                  fontSize: textSizes.xl,
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
                  fontSize: textSizes.base,
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
                  fontSize: textSizes.sm,
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
                  fontSize: textSizes.xs,
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
