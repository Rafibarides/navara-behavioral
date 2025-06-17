import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './Components/MainPage';
import Careers from './Components/Careers';
import ClientPortal from './Components/ClientPortal';
import DiagnosticsPage from './Components/DiagnosticsPage';
import PathwaysPage from './Components/PathwaysPage';
import PrivacyPolicy from './Components/PrivacyPolicy';
import TermsOfService from './Components/TermsOfService';
import Sitemap from './Components/Sitemap';
import Administrator from './Components/Administrator';
import DarkModeToggle from './Components/DarkModeToggle';
import ScrollToTop from './Components/ScrollToTop';
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
        
        <Routes>
          <Route path="/" element={<MainPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} />
          <Route path="/careers" element={<Careers isDarkMode={isDarkMode} />} />
          <Route path="/client-portal" element={<ClientPortal isDarkMode={isDarkMode} />} />
          <Route path="/diagnostics" element={<DiagnosticsPage isDarkMode={isDarkMode} />} />
          <Route path="/pathways" element={<PathwaysPage isDarkMode={isDarkMode} />} />
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
