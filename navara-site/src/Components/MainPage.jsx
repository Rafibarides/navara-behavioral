import React from 'react';
import WelcomeSection from './Sections/WelcomeSection';
import WhoWeAreSection from './Sections/WhoWeAreSection';
import AboutSection from './Sections/AboutSection';
import ServiceCardSection from './Sections/ServiceCardSection';
import DiagnosticsSection from './Sections/DiagnosticsSection';
import WellnessSection from './Sections/WellnessSection';
import BehavioralSection from './Sections/BehavioralSection';
import OurTeamSection from './Sections/OurTeamSection';
import ContactSection from './Sections/ContactSection';
import FooterSection from './Sections/FooterSection';
import NavBarMenu from './NavBarMenu';
import DarkModeToggle from './DarkModeToggle';
import { useState, useEffect } from 'react';

const MainPage = ({ isDarkMode, toggleDarkMode }) => {
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

  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      {/* Dark Mode Toggle */}
      <DarkModeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      
      {/* Navigation */}
      <NavBarMenu isDarkMode={isDarkMode} />
      
      {/* Sections */}
      <WelcomeSection isDarkMode={isDarkMode} />
      <WhoWeAreSection isDarkMode={isDarkMode} />
      {!isMobile && <ServiceCardSection isDarkMode={isDarkMode} />}
      <DiagnosticsSection isDarkMode={isDarkMode} />
      <WellnessSection isDarkMode={isDarkMode} />
      <BehavioralSection isDarkMode={isDarkMode} />
      <AboutSection isDarkMode={isDarkMode} />
      <OurTeamSection isDarkMode={isDarkMode} />
      <ContactSection isDarkMode={isDarkMode} />
      <FooterSection isDarkMode={isDarkMode} />
    </div>
  );
};

export default MainPage;
