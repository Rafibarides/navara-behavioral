import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './Components/MainPage';
import Careers from './Components/Careers';
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/careers" element={<Careers />} />
      </Routes>
    </Router>
  )
}

export default App
