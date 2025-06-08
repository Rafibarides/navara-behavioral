import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ClientPortal from './Components/ClientPortal';
import PrivacyPolicy from './Components/PrivacyPolicy';
import TermsOfService from './Components/TermsOfService';
import Sitemap from './Components/Sitemap';
// ... your other imports

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <Router>
      <Routes>
        {/* Your existing route */}
        <Route path="/" element={<YourMainComponent isDarkMode={isDarkMode} />} />
        
        {/* Add these new routes */}
        <Route path="/client-portal" element={<ClientPortal isDarkMode={isDarkMode} />} />
        <Route path="/privacy" element={<PrivacyPolicy isDarkMode={isDarkMode} />} />
        <Route path="/terms" element={<TermsOfService isDarkMode={isDarkMode} />} />
        <Route path="/sitemap" element={<Sitemap isDarkMode={isDarkMode} />} />
        
        {/* Add other routes as needed */}
      </Routes>
    </Router>
  );
}

export default App; 