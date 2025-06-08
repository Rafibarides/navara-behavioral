import React from 'react';
import WelcomeSection from './Sections/WelcomeSection';
import WhoWeAreSection from './Sections/WhoWeAreSection';
import AboutSection from './Sections/AboutSection';
import ServiceCardSection from './Sections/ServiceCardSection';
import DiagnosticsSection from './Sections/DiagnosticsSection';
import PathwaysSection from './Sections/PathwaysSection';
import BehavioralSection from './Sections/BehavioralSection';
import OurTeamSection from './Sections/OurTeamSection';
import ContactSection from './Sections/ContactSection';
import FooterSection from './Sections/FooterSection';
import NavBarMenu from './NavBarMenu';
import DarkModeToggle from './DarkModeToggle';

const MainPage = ({ isDarkMode, toggleDarkMode }) => {
  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      {/* Dark Mode Toggle */}
      <DarkModeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      
      {/* Navigation */}
      <NavBarMenu isDarkMode={isDarkMode} />
      
      {/* Sections */}
      <WelcomeSection isDarkMode={isDarkMode} />
      <WhoWeAreSection isDarkMode={isDarkMode} />
      <ServiceCardSection isDarkMode={isDarkMode} />
      <DiagnosticsSection isDarkMode={isDarkMode} />
      <PathwaysSection isDarkMode={isDarkMode} />
      <BehavioralSection isDarkMode={isDarkMode} />
      <AboutSection isDarkMode={isDarkMode} />
      <OurTeamSection isDarkMode={isDarkMode} />
      <ContactSection isDarkMode={isDarkMode} />
      <FooterSection isDarkMode={isDarkMode} />
    </div>
  );
};

export default MainPage;
