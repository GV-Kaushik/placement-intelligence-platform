import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data when page loads
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await api.get('/companies');
        setCompanies(res.data.companies);
      } catch (err) {
        console.error("Error fetching companies:", err);
      } finally {
        setLoading(false); // Stop the loading spinner whether it succeeds or fails
      }
    }

    fetchCompanies();
  }, []);

  // Build company card elements using a standard for loop (instead of a map in the template)
  const companyCards = [];
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    companyCards.push(
      <Link 
        to={`/companies/${company.id}`} 
        key={company.id}
        className="group block bg-slate-900 border border-slate-800 rounded-lg p-6 hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-start justify-between mb-4">
          {/* Company Icon (Using Building2 from lucide-react) */}
          <div className="h-12 w-12 bg-slate-800 rounded-lg flex items-center justify-center text-indigo-400 transition-colors">
            <Building2 className="h-6 w-6" />
          </div>
          
          {/* The Arrow that slides right on hover */}
          <ArrowRight className="h-5 w-5 text-slate-650 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
        </div>

        <h3 className="text-xl font-bold text-slate-100 mb-2">
          {company.name}
        </h3>
        
        <p className="text-sm text-slate-400 line-clamp-2">
          {company.description || "Top tier technology company."}
        </p>
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <h1 className="text-4xl font-extrabold text-white mb-3">
          Explore Target Companies
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          Discover hiring patterns, interview questions, and placement success rates for your dream companies.
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Loading Spinner */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-650 border-opacity-50"></div>
          </div>
        ) : (
          /* Companies Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companyCards}
          </div>
        )}
      </div>
    </div>
  );
}