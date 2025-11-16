import React, { useState, useEffect } from 'react';
import { getColors, getTextSizes } from '../../utils/colorsAndText';
import StaffModal from '../StaffModal';
import siteData from '../../../SiteData.json';

const OurTeamSection = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Get data from siteData
  const { title, subtext, founder, divisions } = siteData.sections.team;

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
          {/* Section Title */}
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
            }}>
              {title}
            </h2>
            
            <div style={{
              fontSize: textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.textSecondary,
              lineHeight: '1.6',
              maxWidth: '600px',
              margin: '0 auto',
              textAlign: 'center',
            }}>
              {subtext}
            </div>
          </div>

          {/* Founder Card - David Nisan at the top */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: isMobile ? '60px' : '80px',
          }}>
            <div
              onClick={() => handleStaffClick(founder)}
              style={{
                backgroundColor: colors.surface,
                borderRadius: '24px',
                padding: isMobile ? '50px 40px' : '45px 35px',
                textAlign: 'center',
                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                cursor: 'pointer',
                position: 'relative',
                maxWidth: isMobile ? '100%' : '320px',
                width: isMobile ? '100%' : '320px',
                height: isMobile ? 'auto' : '420px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: `2px solid ${colors.primary}20`,
              }}
            >
              {/* Decorative Background Element */}
              <div style={{
                position: 'absolute',
                top: '-60px',
                right: '-60px',
                width: '140px',
                height: '140px',
                backgroundColor: colors.primary + '20',
                borderRadius: '50%',
                zIndex: 1,
              }} />

              {/* Profile Photo */}
              <div style={{
                position: 'relative',
                zIndex: 2,
                marginBottom: isMobile ? '28px' : '24px',
              }}>
                <img
                  src={founder.photo}
                  alt={founder.name}
                  style={{
                    width: isMobile ? '140px' : '120px',
                    height: isMobile ? '140px' : '120px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `5px solid ${colors.surface}`,
                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                  }}
                />
              </div>

              {/* Name */}
              <h3 style={{
                fontSize: isMobile ? textSizes['2xl'].fontSize : textSizes.xl.fontSize,
                fontFamily: isMobile ? textSizes['2xl'].fontFamily : textSizes.xl.fontFamily,
                color: colors.text,
                fontWeight: '700',
                marginBottom: '12px',
                position: 'relative',
                zIndex: 2,
              }}>
                {founder.name}
              </h3>

              {/* Position */}
              <p style={{
                fontSize: isMobile ? textSizes.lg.fontSize : textSizes.base.fontSize,
                fontFamily: isMobile ? textSizes.lg.fontFamily : textSizes.base.fontFamily,
                color: colors.primary,
                fontWeight: '600',
                marginBottom: '20px',
                fontStyle: 'italic',
                position: 'relative',
                zIndex: 2,
              }}>
                {founder.position}
              </p>

              {/* Intro Sentence */}
              <p style={{
                fontSize: isMobile ? textSizes.base.fontSize : textSizes.sm.fontSize,
                fontFamily: isMobile ? textSizes.base.fontFamily : textSizes.sm.fontFamily,
                color: colors.textSecondary,
                lineHeight: '1.6',
                margin: 0,
                position: 'relative',
                zIndex: 2,
                flex: 1,
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {founder.introSentence}
              </p>

              {/* Click indicator */}
              <div style={{
                marginTop: '24px',
                fontSize: textSizes.sm.fontSize,
                fontFamily: textSizes.sm.fontFamily,
                color: colors.primary,
                fontWeight: '600',
                position: 'relative',
                zIndex: 2,
              }}>
                Click to learn more →
              </div>
            </div>
          </div>

          {/* All Team Members */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '30px',
            justifyContent: 'center',
            alignItems: 'stretch',
          }}>
            {/* Flatten all division members into one array, excluding nutrition division */}
            {divisions
              .filter(division => division.title !== 'Nutrition')
              .flatMap(division => division.members)
              .map((member, memberIndex) => (
              <div
                key={memberIndex}
                onClick={() => handleStaffClick(member)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: '24px',
                  padding: isMobile ? '40px 30px' : '35px 25px',
                  textAlign: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  position: 'relative',
                  maxWidth: isMobile ? '100%' : '280px',
                  width: isMobile ? '100%' : '280px',
                  height: isMobile ? 'auto' : '380px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Decorative Background Element */}
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '120px',
                  height: '120px',
                  backgroundColor: memberIndex % 3 === 0 ? colors.primary + '15' : 
                                   memberIndex % 3 === 1 ? colors.accent + '20' : 
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
                    src={member.photo}
                    alt={member.name}
                    style={{
                      width: isMobile ? '120px' : '100px',
                      height: isMobile ? '120px' : '100px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `4px solid ${colors.surface}`,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    }}
                  />
                </div>

                {/* Name */}
                <h4 style={{
                  fontSize: isMobile ? textSizes.xl.fontSize : textSizes.lg.fontSize,
                  fontFamily: isMobile ? textSizes.xl.fontFamily : textSizes.lg.fontFamily,
                  color: colors.text,
                  fontWeight: '600',
                  marginBottom: '8px',
                  position: 'relative',
                  zIndex: 2,
                }}>
                  {member.name}
                </h4>

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
