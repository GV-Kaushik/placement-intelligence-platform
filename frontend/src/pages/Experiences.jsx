import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ThumbsUp, Building2, User, ChevronRight, MessageSquarePlus } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';

export default function Experiences() {
  const [experiences, setExperiences] = useState([]); // Stores the list of interview experiences fetched from the backend matching search query
  const [loading, setLoading] = useState(true);       // Boolean flag to show loading spinner while fetching experiences
  const [searchQuery, setSearchQuery] = useState(''); // Stores the search keyword string typed into the query search bar (debounced to trigger api fetches)

  // Function to fetch experiences from the backend
  async function fetchExperiences(query = '') {
    setLoading(true);
    try {
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
    const delayDebounceFn = setTimeout(() => {
      fetchExperiences(searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  function handleSearch(e) {
    e.preventDefault();
    fetchExperiences(searchQuery);
  }

  // Build experience card elements using a standard for loop
  const experienceCards = [];
  for (let i = 0; i < experiences.length; i++) {
    const exp = experiences[i];
    experienceCards.push(
      <Link 
        to={`/experiences/${exp.id}`} 
        key={exp.id}
        className="block bg-white border border-slate-200 rounded-xl p-5 md:p-6 hover:border-slate-350 transition-colors group animate-fade-in"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left Side: Company & Author Info */}
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
              <Building2 className="h-6 w-6 text-slate-650" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                <span>{exp.company_name}</span>
                {/* Result Badge */}
                <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                  exp.result === 'Selected' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  exp.result === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {exp.result}
                </span>
              </h2>
              <p className="text-xs font-semibold text-slate-600 mt-1">{exp.role}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                <User className="h-3.5 w-3.5" />
                <span>Shared by {exp.user_name}</span>
                <span>•</span>
                <span>{new Date(exp.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Right Side: Upvotes & Arrow */}
          <div className="flex items-center gap-4 self-end md:self-center">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600">
              <ThumbsUp className={`h-3.5 w-3.5 ${exp.has_upvoted ? 'text-blue-600 fill-blue-50' : 'text-slate-455'}`} />
              <span>{exp.upvotes}</span>
            </div>
            <div className="h-9 w-9 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-100 transition-colors">
              <ChevronRight className="h-4.5 w-4.5 text-slate-400 group-hover:text-blue-600" />
            </div>
          </div>

        </div>
      </Link>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-8 w-full">
        
        {/* --- PAGE HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
              Experiences
            </h1>
            <p className="text-slate-500 text-sm">
              Read real interview stories and interview patterns from your seniors and peers.
            </p>
          </div>
          <Link 
            to="/submit-experience"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-bold transition-colors cursor-pointer w-fit"
          >
            <MessageSquarePlus className="h-4.5 w-4.5" />
            <span>Share Experience</span>
          </Link>
        </div>

        {/* --- SEARCH BAR --- */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="relative w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input 
              type="text" 
              placeholder="Search for companies, roles, or topics..."
              value={searchQuery}
              onChange={function(e) { setSearchQuery(e.target.value); }}
              className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-9 pr-4 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors text-sm"
            />
          </form>
        </div>

        {/* --- EXPERIENCES FEED --- */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-blue-600"></div>
          </div>
        ) : experiences.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-white rounded-xl border border-slate-200">
            <Search className="h-10 w-10 mx-auto mb-3 text-slate-400 opacity-60" />
            <h2 className="text-base font-bold text-slate-800">No experiences found</h2>
            <p className="text-xs text-slate-550 mt-1">Try searching for a different keyword or company name.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {experienceCards}
          </div>
        )}

      </div>
    </Layout>
  );
}