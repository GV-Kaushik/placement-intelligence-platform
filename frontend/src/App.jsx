import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CompanyDetail from './pages/CompanyDetail';
import Companies from './pages/Companies';
import Experiences from './pages/Experiences';
import ExperienceDetail from './pages/ExperienceDetail';
import SubmitExperience from './pages/SubmitExperience';
import MockInterview from './pages/MockInterview';
import Roadmap from './pages/Roadmap';
import ResumeEvaluator from './pages/ResumeEvaluator';
import ApplicationTracker from './pages/ApplicationTracker';
import Profile from './pages/Profile';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();

  // Show a loading spinner while verifying JWT token on page load
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-opacity-50"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth Routes: Redirect to dashboard if already logged in */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/signup" 
          element={user ? <Navigate to="/dashboard" replace /> : <Signup />} 
        />

        {/* Private Protected Route: Redirect to login if guest */}
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/companies" 
          element={user ? <Companies /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/companies/:id" 
          element={user ? <CompanyDetail /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/experiences" 
          element={user ? <Experiences /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/experiences/:id" 
          element={user ? <ExperienceDetail /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/submit-experience" 
          element={user ? <SubmitExperience /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/mock-interview" 
          element={user ? <MockInterview /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/mock-interview/:id" 
          element={user ? <MockInterview /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/roadmaps" 
          element={user ? <Roadmap /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/resume-evaluator" 
          element={user ? <ResumeEvaluator /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/application-tracker" 
          element={user ? <ApplicationTracker /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/profile" 
          element={user ? <Profile /> : <Navigate to="/login" replace />} 
        />
        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
