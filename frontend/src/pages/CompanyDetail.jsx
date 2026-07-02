import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, ArrowLeft, TrendingUp, Users, BookOpen, Layers } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';

export default function CompanyDetail() {
  const { id } = useParams();

  const [company, setCompany] = useState(null);     // Stores the details of the company (id, name, logo, description) fetched from the backend
  const [analytics, setAnalytics] = useState(null); // Stores the calculated interview statistics (totalExperiences, avgRounds, successRate, mostAskedTopics)
  const [loading, setLoading] = useState(true);     // Boolean flag to display loading spinner while fetching company info and interview stats
  const [error, setError] = useState(null);         // Stores error message (e.g. "Failed to load company details") if API request fails

  useEffect(() => {
    async function fetchCompanyData() {
      try {
        const res = await api.get(`/companies/${id}`);
        setCompany(res.data.company);
        setAnalytics(res.data.analytics);
      } catch (err) {
        console.error("Error fetching company details:", err);
        setError("Failed to load company details.");
      } finally {
        setLoading(false);
      }
    }

    fetchCompanyData();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !company) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Company Not Found</h2>
          <Link to="/companies" className="text-blue-600 hover:text-blue-700 flex items-center gap-2 text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" /> Back to Companies
          </Link>
        </div>
      </Layout>
    );
  }

  const topicElements = [];
  if (analytics && analytics.mostAskedTopics) { // array of objects(topic,count,precentage are properties)
    for (let i = 0; i < analytics.mostAskedTopics.length; i++) {
      const topicData = analytics.mostAskedTopics[i];
      topicElements.push(
        <div key={i} className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-700">{topicData.topic}</span>
            <span className="text-blue-600">{topicData.percentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${topicData.percentage}%` }}
            ></div>
          </div>
        </div>
      );
    }
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-8 w-full">
        
        {/* Back Button */}
        <Link to="/companies" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors mb-6">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to all companies</span>
        </Link>

        {/* --- HEADER: Company Info --- */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 mb-8 flex items-start gap-5">
          <div className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
            <Building2 className="h-8 w-8 text-slate-650" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">{company.name}</h1>
            <p className="text-slate-500 text-sm leading-relaxed max-w-3xl">
              {company.description || "A top-tier company heavily targeted by students for placements. Review the analytics below to prepare your strategy."}
            </p>
          </div>
        </div>

        {/* --- ANALYTICS GRID --- */}
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-4.5 w-4.5 text-blue-600" /> 
          <span>Hiring Analytics</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Stat 1: Success Rate */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Selection Rate</h3>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{analytics.successRate}%</p>
            <p className="text-xs text-slate-500 mt-1">Of students who interviewed</p>
          </div>

          {/* Stat 2: Avg Rounds */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-4 w-4 text-slate-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Rounds</h3>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{analytics.averageRounds}</p>
            <p className="text-xs text-slate-500 mt-1">Including OA and Tech rounds</p>
          </div>

          {/* Stat 3: Total Experiences */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-slate-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Shared Experiences</h3>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{analytics.totalExperiences}</p>
            <p className="text-xs text-slate-500 mt-1">Verified student submissions</p>
          </div>

        </div>

        {/* --- MOST ASKED TOPICS --- */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8">
          <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
            <BookOpen className="h-4.5 w-4.5 text-blue-600" /> 
            <span>Most Asked Topics</span>
          </h2>
          
          <div className="space-y-5">
            {topicElements}
          </div>
        </div>

      </div>
    </Layout>
  );
}