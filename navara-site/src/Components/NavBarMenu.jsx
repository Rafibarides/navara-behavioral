import React, { useState, useEffect, useRef } from 'react';
import { getColors, getTextSizes } from '../utils/colorsAndText';

const NavBarMenu = ({ isDarkMode = false }) => {
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const servicesTimeoutRef = useRef(null);

  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = ['home', 'services', 'about', 'contact'];
  const serviceItems = [
    { name: 'Diagnostics', id: 'diagnostics-section' },
    { name: 'Pathways', id: 'pathways-section' },
    { name: 'Navara Method', id: 'behavioral-section' }
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navHeight = 80; // Account for fixed navbar
      const elementPosition = element.offsetTop - navHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleNavClick = (item) => {
    if (item === 'services') {
      setIsServicesOpen(!isServicesOpen);
    } else {
      let sectionId = '';
      switch(item) {
        case 'home':
          sectionId = 'welcome-section';
          break;
        case 'about':
          sectionId = 'about-section';
          break;
        case 'contact':
          sectionId = 'contact-section';
          break;
        default:
          break;
      }
      if (sectionId) {
        scrollToSection(sectionId);
      }
      setIsMobileMenuOpen(false);
    }
  };

  const handleServiceClick = (serviceId) => {
    scrollToSection(serviceId);
    setIsServicesOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleServicesMouseEnter = () => {
    // Clear any existing timeout
    if (servicesTimeoutRef.current) {
      clearTimeout(servicesTimeoutRef.current);
      servicesTimeoutRef.current = null;
    }
    setIsServicesOpen(true);
  };

  const handleServicesMouseLeave = () => {
    // Add a delay before closing the dropdown
    servicesTimeoutRef.current = setTimeout(() => {
      setIsServicesOpen(false);
    }, 150); // 150ms delay
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (servicesTimeoutRef.current) {
        clearTimeout(servicesTimeoutRef.current);
      }
    };
  }, []);

  // Mobile Hamburger Menu
  if (isMobile) {
    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
      }}>
        {/* Hamburger Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '12px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        >
          {[1,2,3].map(i => (
            <div
              key={i}
              style={{
                width: '20px',
                height: '2px',
                backgroundColor: colors.text,
                borderRadius: '1px',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </button>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '60px',
            right: '0',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '16px',
            minWidth: '200px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}>
            {navItems.map(item => (
              <div key={item}>
                <button
                  onClick={() => handleNavClick(item)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: '12px 16px',
                    fontSize: textSizes.base,
                    color: colors.text,
                    cursor: 'pointer',
                    borderRadius: '8px',
                    textAlign: 'left',
                    textTransform: 'capitalize',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = colors.accent + '20'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  {item}
                </button>
                
                {/* Services Dropdown in Mobile */}
                {item === 'services' && isServicesOpen && (
                  <div style={{ marginLeft: '16px', marginTop: '8px' }}>
                    {serviceItems.map(service => (
                      <button
                        key={service.id}
                        onClick={() => handleServiceClick(service.id)}
                        style={{
                          width: '100%',
                          background: 'none',
                          border: 'none',
                          padding: '8px 12px',
                          fontSize: textSizes.sm,
                          color: colors.textSecondary,
                          cursor: 'pointer',
                          borderRadius: '6px',
                          textAlign: 'left',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = colors.accent + '15'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        {service.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop Navigation
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
    }}>
      <nav style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '50px',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
      }}>
        {navItems.map(item => (
          <div 
            key={item} 
            style={{ position: 'relative' }}
            onMouseEnter={item === 'services' ? handleServicesMouseEnter : undefined}
            onMouseLeave={item === 'services' ? handleServicesMouseLeave : undefined}
          >
            <button
              onClick={() => handleNavClick(item)}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 20px',
                fontSize: textSizes.base,
                color: colors.text,
                cursor: 'pointer',
                borderRadius: '25px',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease',
                fontWeight: '500',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = colors.accent + '30';
                e.target.style.color = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = colors.text;
              }}
            >
              {item}
              {item === 'services' && (
                <span style={{ marginLeft: '6px', fontSize: '10px' }}>▼</span>
              )}
            </button>

            {/* Services Dropdown */}
            {item === 'services' && isServicesOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginTop: '4px', // Reduced gap to prevent mouse leaving area
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '16px',
                  padding: '12px',
                  minWidth: '180px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                }}
              >
                {serviceItems.map(service => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceClick(service.id)}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      padding: '10px 16px',
                      fontSize: textSizes.sm,
                      color: colors.text,
                      cursor: 'pointer',
                      borderRadius: '8px',
                      textAlign: 'left',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = colors.accent + '20'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    {service.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default NavBarMenu;
