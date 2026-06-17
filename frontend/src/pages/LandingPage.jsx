import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  ShieldCheck, 
  ArrowRight, 
  Building2, 
  Calendar, 
  ThumbsUp, 
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';

export default function LandingPage() {
  const { user, logout } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch companies and recent experiences from the backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [compRes, expRes] = await Promise.all([
          api.get('/companies'),
          api.get('/experiences')
        ]);
        setCompanies(compRes.data.companies.slice(0, 4)); // Show top 4 featured companies
        setExperiences(expRes.data.experiences.slice(0, 3)); // Show top 3 recent experiences
      } catch (err) {
        console.error('Error fetching landing page data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 1. Build company skeleton loader elements using a standard for loop
  const companySkeletons = [];
  for (let i = 1; i <= 4; i++) {
    companySkeletons.push(
      <div key={i} className="h-48 bg-slate-900/40 border border-slate-900 rounded-2xl animate-pulse"></div>
    );
  }

  // 2. Build featured company card elements using a standard for loop
  const companyCards = [];
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    companyCards.push(
      <div 
        key={company.id} 
        className="bg-slate-900/40 backdrop-blur-sm border border-slate-900 hover:border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between transition-all group hover:-translate-y-0.5"
      >
        <div>
          <div className="h-10 w-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 p-2 mb-4 group-hover:bg-white/10 transition-colors">
            <img 
              src={company.logo_url || 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Building_placeholder.svg'} 
              alt={company.name} 
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <h3 className="font-bold text-lg text-slate-100 mb-2">{company.name}</h3>
          <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed mb-4">
            {company.description}
          </p>
        </div>
        <Link 
          to={`/login`} 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 group-hover:text-blue-300 transition-colors mt-2"
        >
          <span>Analyze Stats</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  // 3. Build experience skeleton loader elements using a standard for loop
  const experienceSkeletons = [];
  for (let i = 1; i <= 2; i++) {
    experienceSkeletons.push(
      <div key={i} className="h-40 bg-slate-900/40 border border-slate-900 rounded-2xl animate-pulse"></div>
    );
  }

  // 4. Build recent experience card elements using a standard for loop
  const experienceCards = [];
  for (let i = 0; i < experiences.length; i++) {
    const exp = experiences[i];
    
    // Build round list inside the experience (using a nested loop for rounds)
    const roundItems = [];
    if (exp.rounds && Array.isArray(exp.rounds)) {
      // Show only the first round on the landing page
      const roundsToRender = exp.rounds.slice(0, 1);
      for (let j = 0; j < roundsToRender.length; j++) {
        const round = roundsToRender[j];
        roundItems.push(
          <div key={j} className="text-sm">
            <h4 className="font-semibold text-slate-300 text-xs uppercase tracking-wider mb-1">
              {round.round_name}
            </h4>
            <p className="text-slate-400 line-clamp-2 leading-relaxed text-xs">
              {round.content}
            </p>
          </div>
        );
      }
    }

    // Build questions list inside the experience (using a nested loop for questions)
    const questionBadges = [];
    if (exp.questions && Array.isArray(exp.questions)) {
      const questionsToRender = exp.questions.slice(0, 3);
      for (let j = 0; j < questionsToRender.length; j++) {
        const q = questionsToRender[j];
        questionBadges.push(
          <span key={j} className="text-[11px] px-2.5 py-0.5 bg-slate-900/60 border border-slate-900 text-slate-400 rounded-full font-medium">
            {q.topic}
          </span>
        );
      }
    }

    experienceCards.push(
      <div 
        key={exp.id} 
        className="bg-slate-900/20 backdrop-blur-sm border border-slate-900/80 hover:border-slate-800/60 p-6 rounded-2xl transition-all"
      >
        {/* Review Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl p-2 shrink-0">
              <img 
                src={exp.company_logo} 
                alt={exp.company_name} 
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm sm:text-base">
                <span>{exp.company_name}</span>
                <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md font-medium">
                  {exp.role}
                </span>
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">Submitted by {exp.user_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
              exp.result === 'Selected' 
                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              {exp.result}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-900">
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>{exp.upvotes}</span>
            </div>
          </div>
        </div>

        {/* Rounds Summary (Truncated display on landing page) */}
        <div className="space-y-3 mb-4">
          {roundItems}
        </div>

        {/* Questions Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Topics:</span>
          {questionBadges}
          {exp.questions && exp.questions.length > 3 && (
            <span className="text-[11px] text-slate-500 font-semibold pl-1">
              +{exp.questions.length - 3} more
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden">
      {/* Visual Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl -z-10"></div>

      {/* 1. Header / Navigation Bar (Glassmorphic) */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-blue-500" />
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            PlaceMentor AI
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#companies" className="hover:text-white transition-colors">Featured Companies</a>
          <a href="#experiences" className="hover:text-white transition-colors">Recent Experiences</a>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link 
                to="/dashboard" 
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-sm font-semibold transition-all"
              >
                Go to Dashboard
              </Link>
              <button 
                onClick={logout} 
                className="px-4 py-2 text-slate-400 hover:text-white text-sm font-semibold transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="px-4 py-2 text-slate-400 hover:text-white text-sm font-semibold transition-all"
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/10"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="flex-1 max-w-6xl mx-auto px-6 py-20 flex flex-col items-center text-center justify-center z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-950/40 border border-blue-900/50 rounded-full text-xs font-semibold text-blue-400 mb-6 uppercase tracking-wider">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Your All-in-One Placement Companion</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6 max-w-4xl bg-gradient-to-br from-white via-slate-100 to-slate-500 bg-clip-text text-transparent">
          Prepare Smarter.<br />Get Placed Faster.
        </h1>
        
        <p className="text-slate-400 text-base md:text-lg max-w-2xl mb-10 leading-relaxed">
          Unlock real student placement experiences, analyze company hiring statistics, practice with adaptive AI mock interviews, and build personalized roadmaps.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link 
            to={user ? "/dashboard" : "/signup"} 
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
          >
            <span>Start Preparing Free</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a 
            href="#companies" 
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
          >
            Explore Companies
          </a>
        </div>
      </section>

      {/* 3. Featured Companies Section */}
      <section id="companies" className="max-w-6xl w-full mx-auto px-6 py-20 border-t border-slate-900">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
              <Building2 className="h-6 w-6 text-blue-500" />
              <span>Explore Top Companies</span>
            </h2>
            <p className="text-slate-400 mt-2">Browse hiring patterns, statistics, and solved test papers</p>
          </div>
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 mt-4 md:mt-0 text-sm group">
            <span>View all companies</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {companySkeletons}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {companyCards}
          </div>
        )}
      </section>

      {/* 4. Recent Experiences Section */}
      <section id="experiences" className="max-w-6xl w-full mx-auto px-6 py-20 border-t border-slate-900">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
              <Activity className="h-6 w-6 text-blue-500" />
              <span>Recent Placement Experiences</span>
            </h2>
            <p className="text-slate-400 mt-2">Learn from real-world online assessments and interview rounds</p>
          </div>
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 mt-4 md:mt-0 text-sm group">
            <span>View all reviews</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-6">
            {experienceSkeletons}
          </div>
        ) : (
          <div className="space-y-6">
            {experienceCards}
          </div>
        )}
      </section>

      {/* 5. Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 px-6 py-8 text-center text-sm text-slate-500 z-10">
        <p>© 2026 PlaceMentor AI. All rights reserved.</p>
        <p className="text-xs text-slate-600 mt-1">Prepare Smarter. Get Placed Faster.</p>
      </footer>
    </div>
  );
}
