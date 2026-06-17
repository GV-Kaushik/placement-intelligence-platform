import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  ShieldCheck, 
  ArrowRight, 
  Building2, 
  ThumbsUp, 
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';

export default function LandingPage() {
  const { user, logout } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch companies and experiences for the dashboard
  useEffect(() => {
    async function fetchData() {
      try {
        const compRes = await api.get('/companies');
        const expRes = await api.get('/experiences');
        
        // Show up to 4 companies and 3 experiences on homepage
        setCompanies(compRes.data.companies.slice(0, 4));
        setExperiences(expRes.data.experiences.slice(0, 3));
      } catch (err) {
        console.error('Error fetching landing page data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // 1. Build company skeleton loader elements
  const companySkeletons = [];
  for (let i = 1; i <= 4; i++) {
    companySkeletons.push(
      <div key={i} className="h-40 bg-slate-900 border border-slate-800 rounded-lg animate-pulse"></div>
    );
  }

  // 2. Build featured company card elements
  const companyCards = [];
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    companyCards.push(
      <div 
        key={company.id} 
        className="bg-slate-900 border border-slate-800 p-6 rounded-lg flex flex-col justify-between hover:border-slate-700 transition-colors"
      >
        <div>
          <div className="h-10 w-10 flex items-center justify-center bg-slate-800 rounded-lg p-2 mb-4">
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
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors mt-2"
        >
          <span>Analyze Stats</span>
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  // 3. Build experience skeleton loader elements
  const experienceSkeletons = [];
  for (let i = 1; i <= 2; i++) {
    experienceSkeletons.push(
      <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-lg animate-pulse"></div>
    );
  }

  // 4. Build recent experience card elements
  const experienceCards = [];
  for (let i = 0; i < experiences.length; i++) {
    const exp = experiences[i];
    
    // Build rounds list
    const roundItems = [];
    if (exp.rounds && Array.isArray(exp.rounds)) {
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

    // Build questions list
    const questionBadges = [];
    if (exp.questions && Array.isArray(exp.questions)) {
      const questionsToRender = exp.questions.slice(0, 3);
      for (let j = 0; j < questionsToRender.length; j++) {
        const q = questionsToRender[j];
        questionBadges.push(
          <span key={j} className="text-[11px] px-2.5 py-0.5 bg-slate-850 border border-slate-800 text-slate-400 rounded-full font-medium">
            {q.topic}
          </span>
        );
      }
    }

    experienceCards.push(
      <div 
        key={exp.id} 
        className="bg-slate-900 border border-slate-800 p-6 rounded-lg hover:border-slate-700 transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center bg-slate-800 rounded-lg p-2 shrink-0">
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
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}>
              {exp.result}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              <ThumbsUp className="h-3 w-3" />
              <span>{exp.upvotes}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {roundItems}
        </div>

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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* 1. Header / Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-indigo-500" />
          <span className="font-extrabold text-xl tracking-tight text-white">
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
                className="px-4 py-2 bg-slate-850 border border-slate-800 hover:bg-slate-800 rounded-lg text-sm font-semibold transition-all"
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="flex-1 max-w-6xl mx-auto px-6 py-20 flex flex-col items-center text-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-semibold text-indigo-400 mb-6 uppercase tracking-wider">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Placement preparation platform</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-6 max-w-4xl text-white">
          Prepare Smarter. Get Placed Faster.
        </h1>
        
        <p className="text-slate-400 text-base md:text-lg max-w-2xl mb-10 leading-relaxed">
          Access student placement experiences, analyze company stats, practice with adaptive AI mock interviews, and build study roadmaps.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link 
            to={user ? "/dashboard" : "/signup"} 
            className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <span>Start Preparing</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a 
            href="#companies" 
            className="w-full sm:w-auto px-8 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
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
              <Building2 className="h-6 w-6 text-indigo-500" />
              <span>Explore Top Companies</span>
            </h2>
            <p className="text-slate-400 mt-2">Browse hiring patterns, statistics, and solved test papers</p>
          </div>
          <Link to="/login" className="text-indigo-400 hover:text-indigo-350 font-semibold flex items-center gap-1 mt-4 md:mt-0 text-sm group">
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
              <Activity className="h-6 w-6 text-indigo-500" />
              <span>Recent Placement Experiences</span>
            </h2>
            <p className="text-slate-400 mt-2">Learn from real-world online assessments and interview rounds</p>
          </div>
          <Link to="/login" className="text-indigo-400 hover:text-indigo-350 font-semibold flex items-center gap-1 mt-4 md:mt-0 text-sm group">
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
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 px-6 py-8 text-center text-sm text-slate-500">
        <p>© 2026 PlaceMentor AI. All rights reserved.</p>
        <p className="text-xs text-slate-600 mt-1">Prepare Smarter. Get Placed Faster.</p>
      </footer>
    </div>
  );
}
