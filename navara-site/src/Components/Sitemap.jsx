import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getColors, getTextSizes } from '../utils/colorsAndText';

const Sitemap = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleGoBack = () => {
    window.history.back();
  };

  const siteStructure = {
    main: [
      { name: 'Home', path: '/', description: 'Main landing page with overview of divisions' },
      { name: 'About Us', path: '/#about', description: 'Information about Navara Behavioral Group' },
      { name: 'Our Team', path: '/#team', description: 'Meet our behavioral health professionals' },
      { name: 'Contact', path: '/#contact', description: 'Get in touch with our team' }
    ],
    divisions: [
      { name: 'All Divisions', path: '/divisions', description: 'Overview of all six Navara divisions' },
      { name: 'Navara Behavior Support', path: '/behavioral', description: 'Live — Behavior Method, Direct ABA, and Behavioral Consulting' },
      { name: 'Navara Diagnostics (Coming Soon)', path: '/diagnostics', description: 'Comprehensive psychological evaluations' },
      { name: 'Navara Wellness (Coming Soon)', path: '/wellness', description: 'Therapy and group counseling' },
      { name: 'Navara Nutrition (Coming Soon)', path: '/nutrition', description: 'Nutritional guidance for neurodivergent families' },
      { name: 'Navara Pathways (Coming Soon)', path: '/pathways', description: 'Career exploration for teens and young adults' },
      { name: 'Navara Medical (Coming Soon)', path: '/medical', description: 'Psychiatric medication management' }
    ],
    resources: [
      { name: 'Client Portal', path: '/client-portal', description: 'Secure access to your records and appointments' },
      { name: 'Privacy Policy', path: '/privacy', description: 'How we protect your personal information' },
      { name: 'Terms of Service', path: '/terms', description: 'Terms and conditions for our services' }
    ]
  };

  const handleLinkClick = (path) => {
    if (path.startsWith('/#')) {
      // Navigate to main page then scroll to section
      navigate('/');
      setTimeout(() => {
        const sectionId = path.substring(2);
        const element = document.getElementById(sectionId);
        if (element) {
          const navHeight = 80;
          const elementPosition = element.offsetTop - navHeight;
          window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    } else {
      navigate(path);
    }
  };

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      background: colors.background,
      boxSizing: 'border-box',
    }}>
      {/* Back Button */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 1000,
      }}>
        <button
          onClick={handleGoBack}
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = colors.primary + '10';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = colors.surface;
          }}
        >
          <i className="fas fa-arrow-left" style={{
            fontSize: '14px',
            color: colors.primary,
          }} />
          <span style={{
            fontSize: textSizes.sm.fontSize,
            fontFamily: textSizes.sm.fontFamily,
            color: colors.text,
            fontWeight: '500'
          }}>
            Back
          </span>
        </button>
      </div>

      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '80px 40px 60px 40px',
      }}>
        <h1 style={{
          fontSize: textSizes['4xl'].fontSize,
          fontFamily: textSizes['4xl'].fontFamily,
          color: colors.primary,
          marginBottom: '16px',
          fontWeight: '700'
        }}>
          Sitemap
        </h1>
        
        <p style={{
          fontSize: textSizes.lg.fontSize,
          fontFamily: textSizes.lg.fontFamily,
          color: colors.textSecondary,
          marginBottom: '40px'
        }}>
          Navigate through all pages and sections of our website
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px'
        }}>
          {/* Main Pages */}
          <div style={{
            background: colors.surface,
            borderRadius: '16px',
            padding: '32px',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <h2 style={{
              fontSize: textSizes['2xl'].fontSize,
              fontFamily: textSizes['2xl'].fontFamily,
              color: colors.primary,
              marginBottom: '24px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <i className="fas fa-home" style={{ fontSize: '20px' }} />
              Main Pages
            </h2>
            {siteStructure.main.map((page, index) => (
              <div key={index} style={{ marginBottom: '20px' }}>
                <button
                  onClick={() => handleLinkClick(page.path)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.primary,
                    fontSize: textSizes.lg.fontSize,
                    fontFamily: textSizes.lg.fontFamily,
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: 0,
                    marginBottom: '4px',
                    textDecoration: 'underline',
                    textAlign: 'left',
                    display: 'block'
                  }}
                  onMouseEnter={(e) => e.target.style.color = colors.secondary}
                  onMouseLeave={(e) => e.target.style.color = colors.primary}
                >
                  {page.name}
                </button>
                <p style={{
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.textSecondary,
                  margin: 0
                }}>
                  {page.description}
                </p>
              </div>
            ))}
          </div>

          {/* Divisions */}
          <div style={{
            background: colors.surface,
            borderRadius: '16px',
            padding: '32px',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <h2 style={{
              fontSize: textSizes['2xl'].fontSize,
              fontFamily: textSizes['2xl'].fontFamily,
              color: colors.primary,
              marginBottom: '24px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <i className="fas fa-th-large" style={{ fontSize: '20px' }} />
              Divisions
            </h2>
            {siteStructure.divisions.map((service, index) => (
              <div key={index} style={{ marginBottom: '20px' }}>
                <button
                  onClick={() => handleLinkClick(service.path)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.primary,
                    fontSize: textSizes.lg.fontSize,
                    fontFamily: textSizes.lg.fontFamily,
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: 0,
                    marginBottom: '4px',
                    textDecoration: 'underline',
                    textAlign: 'left',
                    display: 'block'
                  }}
                  onMouseEnter={(e) => e.target.style.color = colors.secondary}
                  onMouseLeave={(e) => e.target.style.color = colors.primary}
                >
                  {service.name}
                </button>
                <p style={{
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.textSecondary,
                  margin: 0
                }}>
                  {service.description}
                </p>
              </div>
            ))}
          </div>

          {/* Resources */}
          <div style={{
            background: colors.surface,
            borderRadius: '16px',
            padding: '32px',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <h2 style={{
              fontSize: textSizes['2xl'].fontSize,
              fontFamily: textSizes['2xl'].fontFamily,
              color: colors.primary,
              marginBottom: '24px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <i className="fas fa-folder-open" style={{ fontSize: '20px' }} />
              Resources
            </h2>
            {siteStructure.resources.map((resource, index) => (
              <div key={index} style={{ marginBottom: '20px' }}>
                <button
                  onClick={() => handleLinkClick(resource.path)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.primary,
                    fontSize: textSizes.lg.fontSize,
                    fontFamily: textSizes.lg.fontFamily,
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: 0,
                    marginBottom: '4px',
                    textDecoration: 'underline',
                    textAlign: 'left',
                    display: 'block'
                  }}
                  onMouseEnter={(e) => e.target.style.color = colors.secondary}
                  onMouseLeave={(e) => e.target.style.color = colors.primary}
                >
                  {resource.name}
                </button>
                <p style={{
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.textSecondary,
                  margin: 0
                }}>
                  {resource.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sitemap; 