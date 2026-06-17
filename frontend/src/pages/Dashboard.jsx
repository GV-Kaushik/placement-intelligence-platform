import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, 
  Target, 
  TrendingUp, 
  BookOpen, 
  Briefcase, 
  MessageSquare, 
  ShieldCheck,
  Bot
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      
      {/* --- NAVBAR --- */}
      <nav className="border-b border-slate-800 bg-slate-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Left side: Clickable Logo */}
            <Link to="/" className="flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-indigo-500" />
              <span className="text-xl font-bold text-white">
                PlaceMentor AI
              </span>
            </Link>

            {/* Right side: User info & Logout */}
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <span className="text-slate-400">Logged in as </span>
                <span className="font-semibold text-slate-200">{user?.name}</span>
              </div>
              
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* 1. Welcome Banner */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, <span className="text-indigo-400">{user?.name}</span> 👋
          </h1>
          <p className="text-slate-400">
            Here's a summary of your placement preparation progress.
          </p>
        </div>

        {/* 2. Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Card 1: Target Company */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg flex items-center gap-4">
            <div className="p-3 bg-slate-800 rounded-lg">
              <Target className="h-8 w-8 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Target Company</p>
              <h3 className="text-xl font-bold text-white">
                {user?.target_company || "Not set yet"}
              </h3>
            </div>
          </div>

          {/* Card 2: Readiness Score */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg flex items-center gap-4">
            <div className="p-3 bg-slate-800 rounded-lg">
              <TrendingUp className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Readiness Score</p>
              <h3 className="text-xl font-bold text-white">
                {user?.readiness_score}%
              </h3>
            </div>
          </div>

          {/* Card 3: Active Applications */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg flex items-center gap-4">
            <div className="p-3 bg-slate-800 rounded-lg">
              <Briefcase className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Active Applications</p>
              <h3 className="text-xl font-bold text-white">0</h3>
            </div>
          </div>

        </div>

        {/* 3. Quick Action Links */}
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Action 1: Explore Companies */}
          <Link 
            to="/companies"
            className="bg-slate-900 border border-slate-800 p-6 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <div className="p-3 bg-slate-800 rounded-lg w-max mb-4">
              <BookOpen className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Explore Companies</h3>
            <p className="text-sm text-slate-400">
              View hiring stats, interview patterns, and success rates for top companies.
            </p>
          </Link>

          {/* Action 2: Placement Experiences */}
          <Link 
            to="/experiences"
            className="bg-slate-900 border border-slate-800 p-6 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <div className="p-3 bg-slate-800 rounded-lg w-max mb-4">
              <MessageSquare className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Read Experiences</h3>
            <p className="text-sm text-slate-400">
              Learn from interview stories shared by your seniors and peers.
            </p>
          </Link>

          {/* Action 3: AI Mock Interview */}
          <Link 
            to="/mock-interview"
            className="bg-slate-900 border border-slate-800 p-6 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <div className="p-3 bg-slate-800 rounded-lg w-max mb-4">
              <Bot className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">AI Mock Interview</h3>
            <p className="text-sm text-slate-400">
              Practice behavioral and technical interview questions with our adaptive AI agent.
            </p>
          </Link>

        </div>

      </main>
    </div>
  );
}


