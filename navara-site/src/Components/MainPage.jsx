import React, { useState, useEffect } from 'react';
import WelcomeSection from './Sections/WelcomeSection';
import WhoWeAreSection from './Sections/WhoWeAreSection';
import ServiceCardSection from './Sections/ServiceCardSection';
import DiagnosticsSection from './Sections/DiagnosticsSection';
import PathwaysSection from './Sections/PathwaysSection';
import BehavioralSection from './Sections/BehavioralSection';
import AboutSection from './Sections/AboutSection';
import OurTeamSection from './Sections/OurTeamSection';
import ContactSection from './Sections/ContactSection';
import FooterSection from './Sections/FooterSection';
import NavBarMenu from './NavBarMenu';

const MainPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Scroll to top on component mount (for direct access)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  console.log(setIsDarkMode);
  return (
    <div 
      className="main-page"
      style={{
        width: '100vw',
        minHeight: '100vh',
        margin: 0,
        padding: 0,
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <NavBarMenu isDarkMode={isDarkMode} />
      <div id="welcome-section">
        <WelcomeSection isDarkMode={isDarkMode} />
      </div>
      <WhoWeAreSection isDarkMode={isDarkMode} />
      <ServiceCardSection isDarkMode={isDarkMode} />
      <div id="diagnostics-section">
        <DiagnosticsSection isDarkMode={isDarkMode} />
      </div>
      <div id="pathways-section">
        <PathwaysSection isDarkMode={isDarkMode} />
      </div>
      <div id="behavioral-section">
        <BehavioralSection isDarkMode={isDarkMode} />
      </div>
      <div id="about-section">
        <AboutSection isDarkMode={isDarkMode} />
      </div>
      <OurTeamSection isDarkMode={isDarkMode} />
      <div id="contact-section">
        <ContactSection isDarkMode={isDarkMode} />
      </div>
      <FooterSection isDarkMode={isDarkMode} />
    </div>
  );
};

export default MainPage;
