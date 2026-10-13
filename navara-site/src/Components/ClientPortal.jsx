import React from 'react';
import NavBarMenu from './NavBarMenu';
import SignInPage from './SignInPage';

// Placeholder portal: no records, no authentication. Replace with a real
// authenticated portal before collecting any client data here.
const ClientPortal = ({ isDarkMode = false }) => (
  <div>
    <NavBarMenu isDarkMode={isDarkMode} />
    <SignInPage isDarkMode={isDarkMode} />
  </div>
);

export default ClientPortal;
