import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getColors, getTextSizes } from '../utils/colorsAndText';

const NavBarMenu = ({ isDarkMode = false }) => {
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isNearTopOfPage, setIsNearTopOfPage] = useState(true);
  const servicesTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  // Track active section based on scroll position
  useEffect(() => {
    // Pages that should have transparent nav when at top (with welcome-section)
    const pagesWithWelcomeSection = ['/', '/diagnostics', '/pathways', '/behavioral'];
    
    if (!pagesWithWelcomeSection.includes(location.pathname)) {
      setActiveSection('');
      setIsNearTopOfPage(false);
      return;
    }

    const handleScroll = () => {
      const sections = [
        { id: 'welcome-section', name: 'home' },
        { id: 'diagnostics', name: 'diagnostics' },
        { id: 'pathways', name: 'pathways' },
        { id: 'behavioral', name: 'behavioral' },
        { id: 'about', name: 'about' },
        { id: 'contact', name: 'contact' }
      ];

      const scrollPosition = window.scrollY + 100; // Offset for navbar height

      // Check if we're near the top for navbar styling
      const welcomeSection = document.getElementById('welcome-section');
      if (welcomeSection) {
        const welcomeHeight = welcomeSection.offsetHeight;
        // Transition starts when we've scrolled 25% of the welcome section
        const transitionPoint = welcomeHeight * 0.25;
        setIsNearTopOfPage(window.scrollY < transitionPoint);
      }

      // Only track sections on main page
      if (location.pathname === '/') {
        for (let i = sections.length - 1; i >= 0; i--) {
          const element = document.getElementById(sections[i].id);
          if (element && element.offsetTop <= scrollPosition) {
            setActiveSection(sections[i].name);
            break;
          }
        }
      } else {
        setActiveSection('');
      }
    };

    // Set initial active section
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const navItems = ['home', 'services', 'about', 'contact'];
  const serviceItems = [
    { name: 'Diagnostics', id: 'diagnostics', key: 'diagnostics' },
    { name: 'Pathways', id: 'pathways', key: 'pathways' },
    { name: 'Navara Method', id: 'behavioral', key: 'behavioral' }
  ];

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
      scrollToSection(sectionId);
    } else {
      navigate('/', { replace: false });
      setTimeout(() => {
        scrollToSection(sectionId);
      }, 150);
    }
  };

  const handleNavClick = (item) => {
    if (item === 'services') {
      setIsServicesOpen(!isServicesOpen);
    } else {
      let sectionId = '';
      switch(item) {
        case 'home':
          if (location.pathname === '/') {
            // We're already on the main page, just scroll to top
            window.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
          } else {
            // Navigate to main page, then scroll to top
            navigate('/', { replace: false });
            setTimeout(() => {
              window.scrollTo({
                top: 0,
                behavior: 'smooth'
              });
            }, 150);
          }
          break;
        case 'about':
          sectionId = 'about';
          break;
        case 'contact':
          sectionId = 'contact';
          break;
        default:
          break;
      }
      if (sectionId) {
        navigateToSection(sectionId);
      }
      setIsMobileMenuOpen(false);
      setIsServicesOpen(false);
    }
  };

  const handleServiceClick = (serviceId, serviceKey) => {
    // Navigate directly to the service page
    navigate(`/${serviceKey}`);
    setIsServicesOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleServicesMouseEnter = () => {
    if (servicesTimeoutRef.current) {
      clearTimeout(servicesTimeoutRef.current);
      servicesTimeoutRef.current = null;
    }
    setIsServicesOpen(true);
  };

  const handleServicesMouseLeave = () => {
    servicesTimeoutRef.current = setTimeout(() => {
      setIsServicesOpen(false);
    }, 150);
  };

  const isItemActive = (item) => {
    if (item === 'services') {
      return ['diagnostics', 'pathways', 'behavioral'].includes(activeSection);
    }
    return activeSection === item;
  };

  const isServiceActive = (serviceKey) => {
    return activeSection === serviceKey;
  };

  useEffect(() => {
    return () => {
      if (servicesTimeoutRef.current) {
        clearTimeout(servicesTimeoutRef.current);
      }
    };
  }, []);

  // Get appropriate text color based on dark mode and position
  const getNavTextColor = (isActive = false) => {
    if (isActive) {
      return colors.primary;
    }
    
    if (isDarkMode) {
      return 'white'; // Always white text in dark mode
    }
    
    // Light mode: adjust based on position
    return isNearTopOfPage ? colors.text : '#2D2D2D';
  };

  // Get appropriate navbar background based on dark mode
  const getNavBackground = () => {
    if (isDarkMode) {
      return isNearTopOfPage 
        ? `rgba(45, 45, 45, 0.95)` // Dark surface when near top
        : `linear-gradient(135deg, 
            rgba(45, 45, 45, 0.25), 
            rgba(45, 45, 45, 0.15)
          )`; // Dark glassmorphism when scrolled
    } else {
      return isNearTopOfPage 
        ? 'rgba(255, 255, 255, 0.95)' // Light surface when near top
        : `linear-gradient(135deg, 
            rgba(255, 255, 255, 0.25), 
            rgba(255, 255, 255, 0.15)
          )`; // Light glassmorphism when scrolled
    }
  };

  // Get appropriate border color based on dark mode
  const getNavBorder = () => {
    if (isDarkMode) {
      return isNearTopOfPage
        ? `1px solid rgba(64, 64, 64, 0.8)`
        : `1px solid rgba(64, 64, 64, 0.3)`;
    } else {
      return isNearTopOfPage
        ? `1px solid rgba(255, 255, 255, 0.8)`
        : `1px solid rgba(255, 255, 255, 0.3)`;
    }
  };

  // Get dropdown background based on dark mode
  const getDropdownBackground = () => {
    if (isDarkMode) {
      return `linear-gradient(135deg, 
        rgba(45, 45, 45, 0.95), 
        rgba(45, 45, 45, 0.9)
      )`;
    } else {
      return `linear-gradient(135deg, 
        rgba(255, 255, 255, 0.95), 
        rgba(255, 255, 255, 0.9)
      )`;
    }
  };

  // Get dropdown border based on dark mode
  const getDropdownBorder = () => {
    if (isDarkMode) {
      return `1px solid rgba(64, 64, 64, 0.8)`;
    } else {
      return `1px solid rgba(255, 255, 255, 0.8)`;
    }
  };

  // Mobile Hamburger Menu
  if (isMobile) {
    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
      }}>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            background: getNavBackground(),
            backdropFilter: isNearTopOfPage 
              ? 'blur(10px)' 
              : 'blur(20px) brightness(1.1)',
            WebkitBackdropFilter: isNearTopOfPage 
              ? 'blur(10px)' 
              : 'blur(20px) brightness(1.1)',
            border: getNavBorder(),
            borderRadius: '12px',
            padding: '12px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            boxShadow: isNearTopOfPage
              ? `0 4px 20px rgba(0, 0, 0, 0.1)`
              : `0 4px 20px rgba(0, 0, 0, 0.1), 
                 inset 0 1px 0 rgba(255, 255, 255, 0.4)`,
            transition: 'all 0.3s ease',
          }}
        >
          {[1,2,3].map(i => (
            <div
              key={i}
              style={{
                width: '20px',
                height: '2px',
                backgroundColor: getNavTextColor(),
                borderRadius: '1px',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </button>

        {isMobileMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '60px',
            right: '0',
            background: getDropdownBackground(),
            backdropFilter: 'blur(20px) brightness(1.05)',
            WebkitBackdropFilter: 'blur(20px) brightness(1.05)',
            border: getDropdownBorder(),
            borderRadius: '16px',
            padding: '16px',
            minWidth: '200px',
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.9)
            `,
          }}>
            {navItems.map(item => (
              <div key={item}>
                <button
                  onClick={() => handleNavClick(item)}
                  style={{
                    width: '100%',
                    background: isItemActive(item) ? colors.accent + '4D' : 'none',
                    border: 'none',
                    padding: '12px 16px',
                    fontSize: textSizes.base.fontSize,
                    fontFamily: textSizes.base.fontFamily,
                    color: isItemActive(item) ? colors.primary : colors.text,
                    cursor: 'pointer',
                    borderRadius: '8px',
                    textAlign: 'left',
                    textTransform: 'capitalize',
                    transition: 'all 0.3s ease',
                    fontWeight: isItemActive(item) ? '500' : '400',
                  }}
                  onMouseEnter={(e) => {
                    if (!isItemActive(item)) {
                      e.target.style.backgroundColor = colors.accent + '33';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isItemActive(item)) {
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {item}
                </button>
                
                {item === 'services' && isServicesOpen && (
                  <div style={{ marginLeft: '16px', marginTop: '8px' }}>
                    {serviceItems.map(service => (
                      <button
                        key={service.id}
                        onClick={() => handleServiceClick(service.id, service.key)}
                        style={{
                          width: '100%',
                          background: isServiceActive(service.key) ? colors.accent + '33' : 'none',
                          border: 'none',
                          padding: '8px 12px',
                          fontSize: textSizes.sm.fontSize,
                          fontFamily: textSizes.sm.fontFamily,
                          color: isServiceActive(service.key) ? colors.primary : colors.textSecondary,
                          cursor: 'pointer',
                          borderRadius: '6px',
                          textAlign: 'left',
                          transition: 'all 0.3s ease',
                          fontWeight: isServiceActive(service.key) ? '500' : '400',
                        }}
                        onMouseEnter={(e) => {
                          if (!isServiceActive(service.key)) {
                            e.target.style.backgroundColor = colors.accent + '26';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isServiceActive(service.key)) {
                            e.target.style.backgroundColor = 'transparent';
                          }
                        }}
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
        background: getNavBackground(),
        backdropFilter: isNearTopOfPage 
          ? 'blur(10px)' 
          : 'blur(20px) brightness(1.1)',
        WebkitBackdropFilter: isNearTopOfPage 
          ? 'blur(10px)' 
          : 'blur(20px) brightness(1.1)',
        border: getNavBorder(),
        borderRadius: '50px',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: isNearTopOfPage
          ? `0 4px 20px rgba(0, 0, 0, 0.1)`
          : `0 8px 32px rgba(0, 0, 0, 0.12), 
             inset 0 1px 0 rgba(255, 255, 255, 0.4),
             0 0 0 1px rgba(255, 255, 255, 0.1)`,
        transition: 'all 0.3s ease',
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
                background: isItemActive(item) 
                  ? `linear-gradient(135deg, 
                      ${colors.accent}66, 
                      ${colors.accent}40
                    )`
                  : 'transparent',
                border: isItemActive(item) 
                  ? `1px solid ${colors.accent}66` 
                  : 'none',
                padding: '12px 20px',
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                color: getNavTextColor(isItemActive(item)),
                cursor: 'pointer',
                borderRadius: '25px',
                textTransform: 'capitalize',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                fontWeight: isItemActive(item) ? '500' : '400',
                transform: isItemActive(item) ? 'scale(1.05)' : 'scale(1)',
                backdropFilter: isItemActive(item) ? 'blur(10px) brightness(1.2)' : 'none',
                boxShadow: isItemActive(item) 
                  ? `inset 0 1px 0 rgba(255, 255, 255, 0.2)` 
                  : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isItemActive(item)) {
                  e.target.style.background = `linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.3), 
                    ${colors.accent}33
                  )`;
                  e.target.style.color = colors.primary;
                  e.target.style.transform = 'scale(1.02)';
                  e.target.style.backdropFilter = 'blur(8px) brightness(1.15)';
                  e.target.style.border = `1px solid rgba(255, 255, 255, 0.3)`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isItemActive(item)) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = getNavTextColor();
                  e.target.style.transform = 'scale(1)';
                  e.target.style.backdropFilter = 'none';
                  e.target.style.border = 'none';
                }
              }}
            >
              {item}
            </button>

            {item === 'services' && isServicesOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginTop: '4px',
                  background: getDropdownBackground(),
                  backdropFilter: 'blur(20px) brightness(1.05)',
                  WebkitBackdropFilter: 'blur(20px) brightness(1.05)',
                  border: getDropdownBorder(),
                  borderRadius: '16px',
                  padding: '12px',
                  minWidth: '180px',
                  boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.15),
                    inset 0 1px 0 rgba(255, 255, 255, 0.9),
                    0 0 0 1px rgba(255, 255, 255, 0.3)
                  `,
                  animation: 'dropdownSlide 0.2s ease-out',
                }}
              >
                <style>
                  {`
                    @keyframes dropdownSlide {
                      from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-10px);
                      }
                      to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                      }
                    }
                  `}
                </style>
                {serviceItems.map(service => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceClick(service.id, service.key)}
                    style={{
                      width: '100%',
                      background: isServiceActive(service.key) 
                        ? `linear-gradient(135deg, 
                            ${colors.accent}66, 
                            ${colors.accent}40
                          )`
                        : 'transparent',
                      border: isServiceActive(service.key) 
                        ? `1px solid ${colors.accent}66` 
                        : 'none',
                      padding: '10px 16px',
                      fontSize: textSizes.sm.fontSize,
                      fontFamily: textSizes.sm.fontFamily,
                      color: isServiceActive(service.key) ? colors.primary : colors.text,
                      cursor: 'pointer',
                      borderRadius: '8px',
                      textAlign: 'left',
                      transition: 'all 0.3s ease',
                      fontWeight: isServiceActive(service.key) ? '500' : '400',
                      backdropFilter: isServiceActive(service.key) ? 'blur(5px)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isServiceActive(service.key)) {
                        e.target.style.background = `linear-gradient(135deg, 
                          ${colors.accent}33, 
                          ${colors.accent}1A
                        )`;
                        e.target.style.backdropFilter = 'blur(5px)';
                        e.target.style.border = `1px solid ${colors.accent}33`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isServiceActive(service.key)) {
                        e.target.style.background = 'transparent';
                        e.target.style.backdropFilter = 'none';
                        e.target.style.border = 'none';
                      }
                    }}
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
