import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');                       // Stores the user's name input string for account registration
  const [email, setEmail] = useState('');                     // Stores the user's email address input string
  const [password, setPassword] = useState('');               // Stores the password input string
  const [confirmPassword, setConfirmPassword] = useState(''); // Stores the confirmation password input string (used to verify passwords match)
  const [error, setError] = useState(null);                   // Stores form validation or API registration error messages to display
  const [loading, setLoading] = useState(false);               // Boolean flag to show loading spinner / disable buttons during sign-up registration request

  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  // Google Sign-in Callback Handler
  async function handleGoogleCallback(response) {
    setError(null);
    setLoading(true);
    try {
      await googleLogin(response.credential);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Failed to sign in with Google. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    /* global google */
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '804472332154-4paoja07fmh9jtfcjqr5u195ahdoj3u2.apps.googleusercontent.com';
    if (window.google && clientId) {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
      });
      google.accounts.id.renderButton(
        document.getElementById('googleSignInButton'),
        { theme: 'outline', size: 'large', width: '100%' }
      );
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    // 1. Basic validation: Check if fields are empty
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    // 2. Password Match Check
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // 3. Password Strength Check (optional but good practice)
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await register(name, email, password);
      // Success: Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      // Catch duplicate email errors from the database
      setError(
        err.response?.data?.message || 
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-lg border border-slate-200 mb-3">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            PlaceMentor
          </h1>
          <p className="text-slate-500 text-sm mt-1">Student Placement Preparation Portal</p>
        </div>

        {/* Solid Signup Card */}
        <div className="bg-white border border-slate-200 p-8 rounded-xl">
          <h2 className="text-lg font-bold mb-6 text-slate-900">Create Your Account</h2>

          {/* Error Message Display */}
          {error && (
            <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-650 text-xs">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={function(e) { setName(e.target.value); }}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-350 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg outline-none text-slate-900 placeholder-slate-400 transition-colors text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={function(e) { setEmail(e.target.value); }}
                  placeholder="Enter email address"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-350 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg outline-none text-slate-900 placeholder-slate-400 transition-colors text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={function(e) { setPassword(e.target.value); }}
                  placeholder="Create password"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-350 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg outline-none text-slate-900 placeholder-slate-400 transition-colors text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={function(e) { setConfirmPassword(e.target.value); }}
                  placeholder="Confirm password"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-350 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg outline-none text-slate-900 placeholder-slate-400 transition-colors text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white transition-colors rounded-lg font-bold flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative bg-white px-3 text-[10px] uppercase font-bold text-slate-400">Or continue with</span>
          </div>

          {/* Google Sign-in button */}
          <div id="googleSignInButton" className="w-full flex justify-center mb-2"></div>

          {/* Link to Login */}
          <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-bold">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
