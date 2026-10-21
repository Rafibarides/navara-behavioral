import React from 'react';
import PromoVideo from './PromoVideo';
import WelcomeSection from './Sections/WelcomeSection';
import WhoWeAreSection from './Sections/WhoWeAreSection';
import AboutSection from './Sections/AboutSection';
import ServiceCardSection from './Sections/ServiceCardSection';
import BehavioralSection from './Sections/BehavioralSection';
import FamilyQuizSection from './Sections/FamilyQuizSection';
import FreeGuideSection from './Sections/FreeGuideSection';
import PathwaysPreviewBand from './Sections/PathwaysPreviewBand';
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
      <section id="method-video" style={{ padding: "64px 20px", background: isDarkMode ? "#182536" : "#f4f6f3" }}>
        <PromoVideo isDarkMode={isDarkMode} showHeading showBooking />
      </section>
      <ServiceCardSection isDarkMode={isDarkMode} />
      <BehavioralSection isDarkMode={isDarkMode} />
      <FamilyQuizSection isDarkMode={isDarkMode} />
      <FreeGuideSection isDarkMode={isDarkMode} />
      <PathwaysPreviewBand isDarkMode={isDarkMode} />
      <AboutSection isDarkMode={isDarkMode} />
      <OurTeamSection isDarkMode={isDarkMode} />
      <ContactSection isDarkMode={isDarkMode} />
      <FooterSection isDarkMode={isDarkMode} />
    </div>
  );
};

export default MainPage;
