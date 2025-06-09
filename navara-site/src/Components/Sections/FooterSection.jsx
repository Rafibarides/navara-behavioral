import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getColors, getTextSizes } from '../../utils/colorsAndText';

const FooterSection = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const footerLinks = {
    company: [
      { name: 'About Us', href: 'about', type: 'scroll' },
      { name: 'Our Team', href: 'team', type: 'scroll' },
      { name: 'Careers', href: '/careers', type: 'route' },
      { name: 'Contact', href: 'contact', type: 'scroll' }
    ],
    services: [
      { name: 'Diagnostics', href: 'diagnostics', type: 'scroll' },
      { name: 'Pathways', href: 'pathways', type: 'scroll' },
      { name: 'Behavioral Method', href: 'behavioral', type: 'scroll' },
      { name: 'Consultations', href: 'contact', type: 'scroll' }
    ],
    resources: [
      { name: 'Client Portal', href: '/client-portal', type: 'route' },
      { name: 'Privacy Policy', href: '/privacy', type: 'route' },
      { name: 'Terms of Service', href: '/terms', type: 'route' },
      { name: 'Sitemap', href: '/sitemap', type: 'route' }
    ]
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navHeight = 80;
      const elementPosition = element.offsetTop - navHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  const navigateToSection = (sectionId) => {
    if (location.pathname === '/') {
      // We're on the main page, just scroll
      scrollToSection(sectionId);
    } else {
      // We're on a different page, navigate to main page then scroll
      navigate('/');
      // Use setTimeout to ensure the page has loaded before scrolling
      setTimeout(() => {
        scrollToSection(sectionId);
      }, 100);
    }
  };

  const handleLinkClick = (href, type) => {
    if (type === 'route') {
      // Direct route navigation
      navigate(href);
    } else if (type === 'scroll') {
      // Section scrolling
      navigateToSection(href);
    }
  };

  return (
    <footer style={{
      backgroundColor: colors.secondary,
      width: '100vw',
      margin: 0,
      boxSizing: 'border-box',
      color: colors.surface,
      minHeight: '400px',
    }}>
      {/* Main Footer Content */}
      <div style={{
        padding: isMobile ? '80px 20px 60px 20px' : '120px 40px 80px 40px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{
          display: isMobile ? 'block' : 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '2.5fr 1fr 1fr 1fr',
          gap: isMobile ? '50px' : '80px',
          alignItems: 'start',
        }}>
          {/* Logo and Company Info */}
          <div style={{
            marginBottom: isMobile ? '50px' : '0',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '32px',
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '12px',
                marginRight: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              }}>
                <img
                  src="/assets/service-logos/behavioral.png"
                  alt="Navara Behavioral Group"
                  style={{
                    width: '50px',
                    height: '50px',
                    objectFit: 'contain',
                  }}
                />
              </div>
              <div>
                <h3 style={{
                  fontSize: textSizes['2xl'].fontSize,
                  fontFamily: textSizes['2xl'].fontFamily,
                  fontWeight: '700',
                  margin: 0,
                  marginBottom: '4px',
                  color: 'white',
                }}>
                  Navara
                </h3>
                <p style={{
                  fontSize: textSizes.base.fontSize,
                  fontFamily: textSizes.base.fontFamily,
                  margin: 0,
                  color: 'rgba(255, 255, 255, 0.8)',
                }}>
                  Behavioral Group
                </p>
              </div>
            </div>
            <p style={{
              fontSize: textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              marginBottom: '24px',
              maxWidth: '400px',
            }}>
              Providing comprehensive behavioral support, diagnostics, and career guidance for families and young adults.
            </p>
            {/* Security Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <i className="fas fa-shield-alt" style={{
                fontSize: '18px',
                color: colors.accent,
              }} />
              <span style={{
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: '500',
              }}>
                Secured Website
              </span>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 style={{
              fontSize: textSizes.xl.fontSize,
              fontFamily: textSizes.xl.fontFamily,
              fontWeight: '600',
              marginBottom: '24px',
              color: 'white',
            }}>
              Company
            </h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {footerLinks.company.map((link, index) => (
                <button
                  key={index}
                  onClick={() => handleLinkClick(link.href, link.type)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: textSizes.base.fontSize,
                    fontFamily: textSizes.base.fontFamily,
                    cursor: 'pointer',
                    padding: 0,
                    textAlign: 'left',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'white'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.8)'}
                >
                  {link.name}
                </button>
              ))}
            </div>
          </div>

          {/* Services Links */}
          <div>
            <h4 style={{
              fontSize: textSizes.xl.fontSize,
              fontFamily: textSizes.xl.fontFamily,
              fontWeight: '600',
              marginBottom: '24px',
              color: 'white',
            }}>
              Services
            </h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {footerLinks.services.map((link, index) => (
                <button
                  key={index}
                  onClick={() => handleLinkClick(link.href, link.type)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: textSizes.base.fontSize,
                    fontFamily: textSizes.base.fontFamily,
                    cursor: 'pointer',
                    padding: 0,
                    textAlign: 'left',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'white'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.8)'}
                >
                  {link.name}
                </button>
              ))}
            </div>
          </div>

          {/* Resources Links */}
          <div>
            <h4 style={{
              fontSize: textSizes.xl.fontSize,
              fontFamily: textSizes.xl.fontFamily,
              fontWeight: '600',
              marginBottom: '24px',
              color: 'white',
            }}>
              Resources
            </h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {footerLinks.resources.map((link, index) => (
                <button
                  key={index}
                  onClick={() => handleLinkClick(link.href, link.type)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: textSizes.base.fontSize,
                    fontFamily: textSizes.base.fontFamily,
                    cursor: 'pointer',
                    padding: 0,
                    textAlign: 'left',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'white'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.8)'}
                >
                  {link.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Section */}
      <div style={{
        padding: isMobile ? '30px 20px' : '40px 40px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{
          textAlign: 'center',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            <span style={{
              fontSize: textSizes.xs.fontSize,
              fontFamily: textSizes.xs.fontFamily,
              color: 'rgba(255, 255, 255, 0.7)',
            }}>
              © 2025 Navara Behavioral Group
            </span>
            <span style={{
              fontSize: textSizes.xs.fontSize,
              fontFamily: textSizes.xs.fontFamily,
              color: 'rgba(255, 255, 255, 0.7)',
            }}>
              •
            </span>
            <span style={{
              fontSize: textSizes.xs.fontSize,
              fontFamily: textSizes.xs.fontFamily,
              color: 'rgba(255, 255, 255, 0.7)',
            }}>
              Developed by RBM
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;

