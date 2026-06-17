import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, ArrowLeft, TrendingUp, Users, BookOpen, Layers } from 'lucide-react';
import api from '../services/api';

export default function CompanyDetail() {
  // Grab the ID from the URL (e.g. /companies/1)
  const { id } = useParams();

  // State for our data
  const [company, setCompany] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data on load
  useEffect(() => {
    async function fetchCompanyData() {
      try {
        const res = await api.get(`/companies/${id}`);
        // The backend returns BOTH company info and analytics in one response!
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

  // Handle Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-opacity-50"></div>
      </div>
    );
  }

  // Handle Error State
  if (error || !company) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Company Not Found</h2>
        <Link to="/companies" className="text-indigo-400 hover:text-indigo-350 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Companies
        </Link>
      </div>
    );
  }

  // Build the most asked topics elements using a standard for loop (instead of a map in the template)
  const topicElements = [];
  if (analytics && analytics.mostAskedTopics) {
    for (let i = 0; i < analytics.mostAskedTopics.length; i++) {
      const topicData = analytics.mostAskedTopics[i];
      topicElements.push(
        <div key={i}>
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="text-slate-200">{topicData.topic}</span>
            <span className="text-indigo-400">{topicData.percentage}%</span>
          </div>
          {/* Visual Progress Bar */}
          <div className="w-full bg-slate-800 rounded-lg h-3 overflow-hidden">
            <div 
              className="bg-indigo-600 h-3 rounded-lg" 
              style={{ width: `${topicData.percentage}%` }}
            ></div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        
        {/* Back Button */}
        <Link to="/companies" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to all companies</span>
        </Link>

        {/* --- HEADER: Company Info --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 mb-8 flex items-start gap-6">
          <div className="h-20 w-20 bg-slate-800 rounded-lg flex items-center justify-center text-indigo-400 shrink-0 border border-slate-700">
            <Building2 className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-white mb-3">{company.name}</h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-3xl">
              {company.description || "A top-tier company heavily targeted by students for placements. Review the analytics below to prepare your strategy."}
            </p>
          </div>
        </div>

        {/* --- ANALYTICS GRID --- */}
        <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-indigo-400" /> Hiring Analytics
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* Stat 1: Success Rate */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <h3 className="text-slate-400 font-medium">Selection Rate</h3>
            </div>
            <p className="text-4xl font-bold text-white mb-1">{analytics.successRate}%</p>
            <p className="text-xs text-slate-500">Of students who interviewed</p>
          </div>

          {/* Stat 2: Avg Rounds */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Layers className="h-5 w-5 text-purple-400" />
              <h3 className="text-slate-400 font-medium">Average Rounds</h3>
            </div>
            <p className="text-4xl font-bold text-white mb-1">{analytics.averageRounds}</p>
            <p className="text-xs text-slate-500">Including OA and Tech rounds</p>
          </div>

          {/* Stat 3: Total Experiences */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-indigo-400" />
              <h3 className="text-slate-400 font-medium">Shared Experiences</h3>
            </div>
            <p className="text-4xl font-bold text-white mb-1">{analytics.totalExperiences}</p>
            <p className="text-xs text-slate-500">Verified student submissions</p>
          </div>

        </div>

        {/* --- MOST ASKED TOPICS --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-400" /> Most Asked Topics
          </h2>
          
          <div className="space-y-6">
            {topicElements}
          </div>
        </div>

      </div>
    </div>
  );
}