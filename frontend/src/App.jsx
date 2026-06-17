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
          element={user ? <Navigate to="/dashboard" /> : <Login />} 
        />
        <Route 
          path="/signup" 
          element={user ? <Navigate to="/dashboard" /> : <Signup />} 
        />

        {/* Private Protected Route: Redirect to login if guest */}
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/companies" 
          element={user ? <Companies /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/companies/:id" 
          element={user ? <CompanyDetail /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/experiences" 
          element={user ? <Experiences /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/experiences/:id" 
          element={user ? <ExperienceDetail /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/submit-experience" 
          element={user ? <SubmitExperience /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/mock-interview" 
          element={user ? <MockInterview /> : <Navigate to="/login" />} 
        />
        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
