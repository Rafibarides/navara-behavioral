import React from 'react';
import WelcomeSection from './Sections/WelcomeSection';
import WhoWeAreSection from './Sections/WhoWeAreSection';
import AboutSection from './Sections/AboutSection';
import ServiceCardSection from './Sections/ServiceCardSection';
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

      {/* Sections — homepage flow reflects the current launch state.
          Only Navara Behavior Support is live; the other five divisions
          are surfaced in the Divisions overview as "Coming Soon". */}
      <WelcomeSection isDarkMode={isDarkMode} />
      <WhoWeAreSection isDarkMode={isDarkMode} />
      <ServiceCardSection isDarkMode={isDarkMode} />
      <BehavioralSection isDarkMode={isDarkMode} />
      <AboutSection isDarkMode={isDarkMode} />
      <OurTeamSection isDarkMode={isDarkMode} />
      <ContactSection isDarkMode={isDarkMode} />
      <FooterSection isDarkMode={isDarkMode} />
    </div>
  );
};

export default MainPage;
