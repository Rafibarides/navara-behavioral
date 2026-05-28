import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './Components/MainPage';
import Careers from './Components/Careers';
import ClientPortal from './Components/ClientPortal';
import DiagnosticsPage from './Components/DiagnosticsPage';
import PathwaysPage from './Components/PathwaysPage';
import BehavioralPage from './Components/BehavioralPage';
import WellnessPage from './Components/WellnessPage';
import DivisionsPage from './Components/DivisionsPage';
import ComingSoonPage from './Components/ComingSoonPage';
import PrivacyPolicy from './Components/PrivacyPolicy';
import TermsOfService from './Components/TermsOfService';
import Sitemap from './Components/Sitemap';
import Administrator from './Components/Administrator';
import DarkModeToggle from './Components/DarkModeToggle';
import ScrollToTop from './Components/ScrollToTop';
import StickyConsultButton from './Components/StickyConsultButton';
import './App.css'

function App() {
  // Initialize dark mode from localStorage or default to false
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('navaraComDarkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Save dark mode preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('navaraComDarkMode', JSON.stringify(isDarkMode));
    
    // Add/remove dark mode class to body for any global styles if needed
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <Router>
      <ScrollToTop />
      <div style={{ width: '100%', minHeight: '100vh' }}>
        {/* Global Dark Mode Toggle - shown on all pages */}
        <DarkModeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        
        {/* Global Sticky Consult Button - shown on all pages */}
        <StickyConsultButton isDarkMode={isDarkMode} />
        
        <Routes>
          <Route path="/" element={<MainPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} />
          <Route path="/careers" element={<Careers isDarkMode={isDarkMode} />} />
          <Route path="/client-portal" element={<ClientPortal isDarkMode={isDarkMode} />} />
          <Route path="/divisions" element={<DivisionsPage isDarkMode={isDarkMode} />} />
          <Route path="/behavioral" element={<BehavioralPage isDarkMode={isDarkMode} />} />
          {/* Placeholder pages — accessible only via direct URL until divisions launch */}
          <Route
            path="/diagnostics"
            element={
              <ComingSoonPage
                isDarkMode={isDarkMode}
                title="Navara Diagnostics"
                tagline="Comprehensive psychological & developmental evaluations — launching soon."
                description="Clear, actionable assessments for families who need answers — without the months-long waitlists. When this division goes live, you'll have direct access to licensed psychologists and BCBAs working in collaboration."
                icon="fas fa-stethoscope"
                offerings={[
                  'Comprehensive Psychological Evaluations',
                  'ASD Comprehensive Evaluations',
                  'ADHD Evaluation & Consultation',
                  'Additional specialty evaluations',
                ]}
              />
            }
          />
          <Route
            path="/wellness"
            element={
              <ComingSoonPage
                isDarkMode={isDarkMode}
                title="Navara Wellness"
                tagline="Therapy and group programming for families and individuals — launching soon."
                description="Private, personalized therapeutic support — no insurance hoops, no waitlists, no judgment. Built for the moments when you need someone in your corner who actually understands."
                icon="fas fa-heart"
                offerings={[
                  'Individual Therapy',
                  'Group Counseling',
                  'Process & Focus Groups',
                ]}
              />
            }
          />
          <Route
            path="/nutrition"
            element={
              <ComingSoonPage
                isDarkMode={isDarkMode}
                title="Navara Nutrition"
                tagline="Nutrition support built for neurodivergent families — launching soon."
                description="Practical, sustainable nutrition guidance designed for the realities of feeding selective eaters, supporting sensory needs, and keeping the whole family fed without losing your mind."
                icon="fas fa-leaf"
                offerings={[
                  'Nutritional Consulting for Neurodivergent Families',
                  'Meal Planning & Lifestyle Packages',
                  'Food delivery / subscription (future phase)',
                ]}
              />
            }
          />
          <Route
            path="/pathways"
            element={
              <ComingSoonPage
                isDarkMode={isDarkMode}
                title="Navara Pathways"
                tagline="Career direction for teens and young adults — launching soon."
                description="Real career exploration that goes deeper than a personality quiz. We help young adults find work that fits who they actually are — and connect them with hands-on opportunities to test it out."
                icon="fas fa-compass"
                offerings={[
                  'Career Exploration & Coaching for Teens & Young Adults',
                  'Personality & Career Assessment Packages',
                  'Navara Partners Internship Program (future phase)',
                ]}
              />
            }
          />
          <Route
            path="/medical"
            element={
              <ComingSoonPage
                isDarkMode={isDarkMode}
                title="Navara Medical"
                tagline="Psychiatric and integrated behavioral-medical care — launching soon."
                description="Medication management and integrated care, designed to work in sync with the rest of your support team. No more bouncing between providers who don't talk to each other."
                icon="fas fa-user-md"
                offerings={[
                  'Psychiatric Medication Management (future phase)',
                  'Integrated Behavioral-Medical Care (future phase)',
                ]}
              />
            }
          />
          {/* Preview routes for full division content that's been built but not yet launched.
              These keep the original detailed pages accessible by direct URL for internal review. */}
          <Route path="/diagnostics-preview" element={<DiagnosticsPage isDarkMode={isDarkMode} />} />
          <Route path="/wellness-preview" element={<WellnessPage isDarkMode={isDarkMode} />} />
          <Route path="/pathways-preview" element={<PathwaysPage isDarkMode={isDarkMode} />} />
          <Route path="/privacy" element={<PrivacyPolicy isDarkMode={isDarkMode} />} />
          <Route path="/terms" element={<TermsOfService isDarkMode={isDarkMode} />} />
          <Route path="/sitemap" element={<Sitemap isDarkMode={isDarkMode} />} />
          <Route path="/administrator" element={<Administrator isDarkMode={isDarkMode} />} />
          {/* Fallback route for unmatched paths */}
          <Route path="*" element={<MainPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
