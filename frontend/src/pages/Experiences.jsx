import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ThumbsUp, Building2, User, ChevronRight } from 'lucide-react';
import api from '../services/api';

export default function Experiences() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for the Search Bar
  const [searchQuery, setSearchQuery] = useState('');

  // Function to fetch experiences from the backend
  async function fetchExperiences(query = '') {
    setLoading(true);
    try {
      // If there is a search query, append it to the URL: /experiences?q=react
      const url = query ? `/experiences?q=${query}` : '/experiences';
      const res = await api.get(url);
      setExperiences(res.data.experiences);
    } catch (err) {
      console.error("Error fetching experiences:", err);
    } finally {
      setLoading(false);
    }
  }

  // Live Search (Debounced)
  useEffect(() => {
    // Wait 300ms after the user stops typing to call the API
    const delayDebounceFn = setTimeout(() => {
      fetchExperiences(searchQuery);
    }, 300);

    // Cleanup function clears the timer if they type again before 300ms
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Handle when the user submits a search
  function handleSearch(e) {
    e.preventDefault();
    fetchExperiences(searchQuery);
  }

  // Build experience card elements using a standard for loop (instead of a map in the template)
  const experienceCards = [];
  for (let i = 0; i < experiences.length; i++) {
    const exp = experiences[i];
    experienceCards.push(
      <Link 
        to={`/experiences/${exp.id}`} 
        key={exp.id}
        className="block bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:bg-slate-800/80 hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-300 group"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left Side: Company & Author Info */}
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                {exp.company_name}
                {/* Result Badge */}
                <span className={`text-xs px-2 py-1 rounded-full border ${
                  exp.result === 'Selected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  exp.result === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                }`}>
                  {exp.result}
                </span>
              </h2>
              <p className="text-slate-300 font-medium mt-1">{exp.role}</p>
              <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                <User className="h-4 w-4" />
                <span>Shared by {exp.user_name}</span>
                <span>•</span>
                <span>{new Date(exp.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Right Side: Upvotes & Arrow */}
          <div className="flex items-center gap-6 self-end md:self-center">
            <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
              <ThumbsUp className={`h-4 w-4 ${exp.has_upvoted ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span className="font-semibold text-slate-300">{exp.upvotes}</span>
            </div>
            <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-white" />
            </div>
          </div>

        </div>
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        
        {/* --- PAGE HEADER & SEARCH BAR --- */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-4">
            Placement Experiences
          </h1>
          <p className="text-slate-400 text-lg mb-8">
            Learn from the real interview stories of your seniors and peers.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
            <input 
              type="text" 
              placeholder="Search for companies, roles, or topics (e.g. 'Google' or 'Binary Trees')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-full py-4 pl-6 pr-14 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <button 
              type="submit"
              className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 rounded-full p-3 transition-colors flex items-center justify-center"
            >
              <Search className="h-5 w-5 text-white" />
            </button>
          </form>
        </div>

        {/* --- EXPERIENCES FEED --- */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500 border-opacity-50"></div>
          </div>
        ) : experiences.length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-3xl border border-slate-800">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-bold">No experiences found</h2>
            <p>Try searching for a different keyword or topic.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {experienceCards}
          </div>
        )}

      </div>
    </div>
  );
}