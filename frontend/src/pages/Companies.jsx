import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';

export default function Companies() {
  const [companies, setCompanies] = useState([]); // Stores the list of tech companies fetched from the backend (used to generate links/cards)
  const [loading, setLoading] = useState(true);   // Boolean flag to show loading spinner while retrieving the companies list

  // Fetch data when page loads
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await api.get('/companies');
        setCompanies(res.data.companies);
      } catch (err) {
        console.error("Error fetching companies:", err);
      } finally {
        setLoading(false);// just commetn this to see how website looks when loading
      }
    }

    fetchCompanies();
  }, []);

  // Build company card elements using a standard for loop
  const companyCards = [];
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    companyCards.push(
      <Link 
        to={`/companies/${company.id}`} 
        key={company.id}
        className="group block bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-350 transition-colors animate-fade-in"
      >
        <div className="flex items-start justify-between mb-4">
          {/* Company Icon */}
          <div className="h-11 w-11 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-slate-100 transition-colors">
            <Building2 className="h-5.5 w-5.5 text-slate-600" />
          </div>
          
          {/* The Arrow that slides right on hover */}
          <ArrowRight className="h-4.5 w-4.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors">
          {company.name}
        </h3>
        
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {company.description || "Top tier technology company."}
        </p>
      </Link>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-8 w-full">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            Explore Target Companies
          </h1>
          <p className="text-slate-500 text-sm">
            Discover hiring patterns, interview questions, and placement success rates for your dream companies.
          </p>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-blue-600"></div>
          </div>
        ) : (
          /* Companies Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companyCards}
          </div>
        )}
      </div>
    </Layout>
  );
}