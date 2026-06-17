import React,{useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, 
  Target, 
  TrendingUp, 
  BookOpen, 
  Briefcase, 
  MessageSquare, 
  ShieldCheck 
} from 'lucide-react';

export default function Dashboard() {
  const {user,logout,updateProfile}=useAuth();
  const navigate =useNavigate();
  function handleLogout(){
     logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      
      {/* --- NAVBAR --- */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Left side: Logo */}
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                PlaceMentor
              </span>
            </div>
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
      {/* --- MAIN CONTENT WILL GO HERE IN PART 2 --- */}
            {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* 1. Welcome Banner */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, <span className="text-blue-400">{user?.name}</span> 👋
          </h1>
          <p className="text-slate-400">
            Here's a summary of your placement preparation progress.
          </p>
        </div>

        {/* 2. Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Card 1: Target Company */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Target className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Target Company</p>
              <h3 className="text-xl font-bold text-white">
                {user?.target_company || "Not set yet"}
              </h3>
            </div>
          </div>

          {/* Card 2: Readiness Score */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
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
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
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
            className="group bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/50 hover:bg-slate-800/50 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="p-3 bg-blue-500/10 rounded-xl w-max mb-4 group-hover:bg-blue-500/20 transition-colors">
              <BookOpen className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Explore Companies</h3>
            <p className="text-sm text-slate-400">
              View hiring stats, interview patterns, and success rates for top companies.
            </p>
          </Link>

          {/* Action 2: Placement Experiences */}
          <Link 
            to="/experiences"
            className="group bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-indigo-500/50 hover:bg-slate-800/50 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="p-3 bg-indigo-500/10 rounded-xl w-max mb-4 group-hover:bg-indigo-500/20 transition-colors">
              <MessageSquare className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Read Experiences</h3>
            <p className="text-sm text-slate-400">
              Learn from interview stories shared by your seniors and peers.
            </p>
          </Link>

          {/* Action 3: Settings/Profile */}
          {/* <Link 
            to="/settings"
            className="group bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-500/50 hover:bg-slate-800/50 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="p-3 bg-slate-800 rounded-xl w-max mb-4 group-hover:bg-slate-700 transition-colors">
              <Settings className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Update Profile</h3>
            <p className="text-sm text-slate-400">
              Set your target company to start getting AI-powered recommendations.
            </p>
          </Link> */}

        </div>

      </main>
      
    </div>
  );
}


