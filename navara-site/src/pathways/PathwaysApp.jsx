// Mounted at /pathways/* from App.jsx. Owns all Pathways routes and the stylesheet.
import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';

// Preserve the magic-link token hash across the index redirect so Supabase can read it.
function PlansByTrack() {
  const { track } = useParams();
  if (!['rbt', 'bcba'].includes(track)) return <Navigate to="/pathways/plans" replace />;
  return <Plans track={track} />;
}

function AppIndexRedirect() {
  return <Navigate to={'dashboard' + window.location.hash} replace />;
}
import './pathways.css';
import { CFG } from './config';
import Landing from './pages/Landing';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import StudyPlan from './pages/StudyPlan';
import RbtTrack from './pages/RbtTrack';
import BcbaTrack from './pages/BcbaTrack';
import Plans from './pages/Plans';
import PathwaysNotFound from './pages/NotFound';
import Login from './pages/Login';
import SampleQuiz from './pages/SampleQuiz';
import Dashboard from './pages/app/Dashboard';
import LearningThread from './pages/app/LearningThread';
import Practice from './pages/app/SafePractice';
import UnavailableCandidate from './components/UnavailableCandidate';

import GuidedBook from './pages/app/GuidedBook';
import GuidedStagingTest from './components/GuidedStagingTest';
import GuidedStaff from './pages/app/GuidedStaff';
import { GUIDED_PRODUCTION } from './lib/guidedBooking';
import Account from './pages/app/Account';
import Specialist from './pages/app/Specialist';
import Admin from './pages/app/Admin';

export default function PathwaysApp() {
  return (
    <>
    {CFG.previewOnly && <aside className="candidate-notice">Test version: untimed practice, explanations, set results and recorded progress. Timed sets, tag-specific review, booking and payments are not available. No purchase is needed to use your test account.</aside>}
    <Routes>
      <Route index element={<Landing />} />
      <Route path="rbt" element={<RbtTrack />} />
      <Route path="bcba" element={<BcbaTrack />} />
      <Route path="plans" element={<Plans />} />
      <Route path="plans/:track" element={<PlansByTrack />} />
      <Route path="login" element={<Login />} />
      <Route path="signup" element={<Navigate to="/pathways/login" replace />} />
      <Route path="privacy" element={<Privacy />} />
      <Route path="terms" element={<Terms />} />
      <Route path="study-plan" element={<StudyPlan />} />
      <Route path="sample-quiz" element={<SampleQuiz />} />
      <Route path="app" element={<AppIndexRedirect />} />
      <Route path="app/dashboard" element={<Dashboard />} />
      {import.meta.env.VITE_LEARNING_THREAD_CANDIDATE === 'true' && <Route path="app/learning-thread" element={<LearningThread />} />}
      {import.meta.env.VITE_GUIDED_STAGING_TEST === 'true' && <Route path="app/guided-staging-test" element={<GuidedStagingTest />} />}
      <Route path="app/practice" element={<Practice />} />
      <Route path="app/timed-sets" element={<Practice timed />} />
      <Route path="app/mock" element={<Navigate to="/pathways/app/timed-sets" replace />} />
      <Route path="app/book" element={GUIDED_PRODUCTION ? <GuidedBook/> : <UnavailableCandidate kind="booking" />} />
      {GUIDED_PRODUCTION && <Route path="app/coaching-staff" element={<GuidedStaff/>} />}
      <Route path="app/account" element={<Account />} />
      <Route path="app/specialist" element={<Specialist />} />
      <Route path="app/admin" element={<Admin />} />
      <Route path="*" element={<PathwaysNotFound />} />
    </Routes>
    </>
  );
}
