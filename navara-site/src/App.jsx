import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './Components/MainPage';
import Careers from './Components/Careers';
import ScrollToTop from './Components/ScrollToTop';
import './App.css'

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div style={{ width: '100%', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/careers" element={<Careers />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
