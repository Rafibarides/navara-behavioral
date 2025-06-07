import React, { useState, useEffect } from 'react';
import { getColors, getTextSizes } from '../../utils/colorsAndText';
import servicesData from '../../utils/Services.json';

const BehavioralSection = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get the behavioral service from JSON
  const behavioralService = servicesData.services.find(service => service.id === 'behavioral');

  if (!behavioralService) return null;

  // Mobile Layout
  if (isMobile) {
    return (
      <section style={{
        backgroundColor: colors.background,
        width: '100vw',
        padding: '80px 20px',
        margin: 0,
        boxSizing: 'border-box',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          {/* Service Logo & Title */}
          <div style={{
            textAlign: 'center',
            marginBottom: '60px',
          }}>
            <img
              src={behavioralService.logo}
              alt={`${behavioralService.title} Logo`}
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'contain',
                marginBottom: '24px',
              }}
            />
            <h2 style={{
              fontSize: textSizes['3xl'],
              color: colors.primary,
              fontWeight: '700',
              margin: 0,
            }}>
              {behavioralService.title}
            </h2>
          </div>

          {/* Photo */}
          <div style={{
            marginBottom: '60px',
            display: 'flex',
            justifyContent: 'center',
          }}>
            <img
              src={behavioralService.photo}
              alt={behavioralService.title}
              style={{
                width: '100%',
                maxWidth: '400px',
                height: '300px',
                objectFit: 'cover',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
            />
          </div>

          {/* Content */}
          <div style={{
            textAlign: 'center',
            padding: '0 20px',
          }}>
            <p style={{
              fontSize: textSizes.base,
              color: colors.text,
              lineHeight: '1.8',
              marginBottom: '40px',
            }}>
              {behavioralService.p1}
            </p>

            {behavioralService.highlight && (
              <p style={{
                fontSize: textSizes.lg,
                color: colors.primary,
                fontWeight: '600',
                lineHeight: '1.6',
                marginBottom: '40px',
                fontStyle: 'italic',
                padding: '24px',
                backgroundColor: colors.accent + '15',
                borderRadius: '12px',
              }}>
                {behavioralService.highlight}
              </p>
            )}

            <p style={{
              fontSize: textSizes.base,
              color: colors.text,
              lineHeight: '1.8',
              margin: 0,
            }}>
              {behavioralService.p2}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Desktop Layout with Overlay Effect
  return (
    <section style={{
      backgroundColor: colors.background,
      width: '100vw',
      padding: '100px 40px',
      margin: 0,
      boxSizing: 'border-box',
      position: 'sticky',
      top: 0,
      zIndex: 20,
      minHeight: '100vh',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        gap: '80px',
        minHeight: '80vh',
      }}>
        {/* Photo Section - Left Side */}
        <div style={{
          flex: '0 0 500px',
          height: '600px',
        }}>
          <img
            src={behavioralService.photo}
            alt={behavioralService.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '20px',
              boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
            }}
          />
        </div>

        {/* Content Section - Right Side */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '40px 0',
        }}>
          {/* Service Logo & Title */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '48px',
          }}>
            <img
              src={behavioralService.logo}
              alt={`${behavioralService.title} Logo`}
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'contain',
                marginRight: '20px',
              }}
            />
            <h2 style={{
              fontSize: textSizes['4xl'],
              color: colors.primary,
              fontWeight: '700',
              margin: 0,
            }}>
              {behavioralService.title}
            </h2>
          </div>

          {/* Content */}
          <div>
            <p style={{
              fontSize: textSizes.lg,
              color: colors.text,
              lineHeight: '1.8',
              marginBottom: '40px',
            }}>
              {behavioralService.p1}
            </p>

            {behavioralService.highlight && (
              <p style={{
                fontSize: textSizes['2xl'],
                color: colors.primary,
                fontWeight: '700',
                lineHeight: '1.5',
                marginBottom: '40px',
                fontStyle: 'italic',
                padding: '32px',
                backgroundColor: colors.accent + '20',
                borderLeft: `4px solid ${colors.primary}`,
                borderRadius: '12px',
              }}>
                {behavioralService.highlight}
              </p>
            )}

            <p style={{
              fontSize: textSizes.lg,
              color: colors.text,
              lineHeight: '1.8',
              margin: 0,
            }}>
              {behavioralService.p2}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BehavioralSection;
