import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Layout from '../components/Layout';
import { 
  Target, 
  TrendingUp, 
  BookOpen, 
  Briefcase, 
  MessageSquare, 
  HelpCircle,
  Compass,
  FileText,
  Building2,
  ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [appsCount, setAppsCount] = useState(0); // Stores the count of active job applications (retrieved from the application tracker)
  const [mockHistory, setMockHistory] = useState([]); // Stores the list of past mock interviews fetched from the backend database
  const [loadingMocks, setLoadingMocks] = useState(true); // Boolean flag to show spinner while loading history list on mount

  useEffect(function() {
    fetchAppsCount();
    fetchMockHistory();
  }, []);

  async function fetchAppsCount() {
    try {
      const res = await api.get('/applications');
      setAppsCount(res.data.applications?.length || 0);
    } catch (err) {
      console.error('Failed to fetch applications count:', err);
    }
  }

  async function fetchMockHistory() {
    setLoadingMocks(true);
    try {
      const res = await api.get('/mock-interviews');
      setMockHistory(res.data.interviews || []);
    } catch (err) {
      console.error('Failed to fetch mock interview history:', err);
    } finally {
      setLoadingMocks(false);
    }
  }

  // Build mock interview history list
  const historyItems = [];
  if (loadingMocks) {
    historyItems.push(
      <div key="loading" className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-blue-600"></div>
      </div>
    );
  } else if (mockHistory.length === 0) {
    historyItems.push(
      <div key="empty" className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50">
        <p className="text-xs text-slate-500">No mock interviews practiced yet.</p>
        <Link to="/mock-interview" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 mt-2">
          Start your first mock interview <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  } else {
    const listItems = [];
    for (let i = 0; i < mockHistory.length; i++) {
      const item = mockHistory[i];
      const dateFormatted = new Date(item.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const isCompleted = item.status === 'completed';
      
      listItems.push(
        <Link 
          to={`/mock-interview/${item.id}`} 
          key={item.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-350 transition-colors gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span>{item.company_name}</span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-650 rounded font-medium">
                  {item.role}
                </span>
              </h4>
              <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                <span>{item.difficulty} Difficulty</span>
                <span>•</span>
                <span>Practiced on {dateFormatted}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 self-start sm:self-auto">
            {isCompleted ? (
              <>
                <span className="text-xs px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full font-bold">
                  Completed
                </span>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Score</span>
                  <span className="text-base font-extrabold text-slate-900 leading-none mt-0.5">
                    {item.overall_score}%
                  </span>
                </div>
              </>
            ) : (
              <span className="text-xs px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full font-bold">
                In Progress
              </span>
            )}
          </div>
        </Link>
      );
    }
    historyItems.push(
      <div key="list" className="space-y-4">
        {listItems}
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-8 w-full">
        
        {/* 1. Welcome Banner */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            Welcome back, <span className="text-blue-600"> {user?.name} </span>!
          </h1>
          <p className="text-slate-500 text-sm">
            Here is a summary of your placement preparation progress.
          </p>
        </div>

        {/* 2. Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Card 1: Target Company */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-lg text-slate-700">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Company</p>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {user?.target_company || "Not set yet"}
              </h3>
            </div>
          </div>

          {/* Card 2: Readiness Score */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-lg text-slate-700">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Readiness Score</p>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {user?.readiness_score}%
              </h3>
            </div>
          </div>

          {/* Card 3: Active Applications */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-lg text-slate-700">
              <Briefcase className="h-6 w-6 text-slate-700" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Applications</p>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">{appsCount}</h3>
            </div>
          </div>

        </div>

        {/* 3. Quick Action Links */}
        <h2 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Action 1: Explore Companies */}
          <Link 
            to="/companies"
            className="bg-white border border-slate-200 p-6 rounded-xl hover:border-slate-350 transition-colors group"
          >
            <div className="p-3 bg-slate-100 rounded-lg w-max mb-4 text-slate-700 group-hover:bg-slate-200 transition-colors">
              <BookOpen className="h-5 w-5 text-slate-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors">Explore Companies</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              View hiring stats, interview patterns, and success rates for top companies.
            </p>
          </Link>

          {/* Action 2: Placement Experiences */}
          <Link 
            to="/experiences"
            className="bg-white border border-slate-200 p-6 rounded-xl hover:border-slate-350 transition-colors group"
          >
            <div className="p-3 bg-slate-100 rounded-lg w-max mb-4 text-slate-700 group-hover:bg-slate-200 transition-colors">
              <MessageSquare className="h-5 w-5 text-slate-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors">Read Experiences</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Learn from interview stories shared by your seniors and peers.
            </p>
          </Link>

          {/* Action 3: Mock Interview */}
          <Link 
            to="/mock-interview"
            className="bg-white border border-slate-200 p-6 rounded-xl hover:border-slate-350 transition-colors group"
          >
            <div className="p-3 bg-slate-100 rounded-lg w-max mb-4 text-slate-700 group-hover:bg-slate-200 transition-colors">
              <HelpCircle className="h-5 w-5 text-slate-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors">Mock Interview Practice</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Simulate technical and behavioral interview questions with structured follow-ups.
            </p>
          </Link>

          {/* Action 4: Study Roadmap */}
          <Link 
            to="/roadmaps"
            className="bg-white border border-slate-200 p-6 rounded-xl hover:border-slate-350 transition-colors group"
          >
            <div className="p-3 bg-slate-100 rounded-lg w-max mb-4 text-slate-700 group-hover:bg-slate-200 transition-colors">
              <Compass className="h-5 w-5 text-slate-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors">Study Planner & Roadmap</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Create a week-by-week timeline checklist for your target company prep.
            </p>
          </Link>

          {/* Action 5: Resume Reviewer */}
          <Link 
            to="/resume-evaluator"
            className="bg-white border border-slate-200 p-6 rounded-xl hover:border-slate-350 transition-colors group"
          >
            <div className="p-3 bg-slate-100 rounded-lg w-max mb-4 text-slate-700 group-hover:bg-slate-200 transition-colors">
              <FileText className="h-5 w-5 text-slate-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors">Resume Reviewer</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload your PDF resume to receive suggestion points on your strengths and weaknesses.
            </p>
          </Link>

          {/* Action 6: Job Application Tracker */}
          <Link 
            to="/application-tracker"
            className="bg-white border border-slate-200 p-6 rounded-xl hover:border-slate-350 transition-colors group"
          >
            <div className="p-3 bg-slate-100 rounded-lg w-max mb-4 text-slate-700 group-hover:bg-slate-200 transition-colors">
              <Briefcase className="h-5 w-5 text-slate-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors">Application Tracker</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Log, manage, and update your active job applications and interview stages.
            </p>
          </Link>

        </div>

        {/* 4. Mock Interview History */}
        <div className="mt-12 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">Mock Interview History</h2>
          {historyItems}
        </div>

      </div>
    </Layout>
  );
}


