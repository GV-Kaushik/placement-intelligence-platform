import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, ArrowLeft, User, ThumbsUp, HelpCircle, Layers, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../services/api';

export default function ExperienceDetail() {
  const { id } = useParams();
  
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For the upvote button
  const [upvoting, setUpvoting] = useState(false);

  // 1. Fetch the data when the page loads
  useEffect(() => {
    async function fetchExperience() {
      try {
        const res = await api.get(`/experiences/${id}`);
        setExperience(res.data.experience);
      } catch (err) {
        console.error("Error fetching experience details:", err);
        setError("Failed to load this placement experience.");
      } finally {
        setLoading(false);
      }
    }

    fetchExperience();
  }, [id]);

  // 2. Handle Upvoting
  async function handleUpvote() {
    if (upvoting || !experience) return;
    setUpvoting(true);
    
    try {
      const res = await api.post(`/experiences/${id}/upvote`);
      
      // Update our local state so the button color and number change instantly
      setExperience(function(prev) {
        return {
          ...prev,
          has_upvoted: res.data.hasUpvoted,
          upvotes: res.data.upvotes
        };
      });
    } catch (err) {
      console.error("Failed to upvote:", err);
    } finally {
      setUpvoting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-opacity-50"></div>
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-red-400 mb-4">{error}</h2>
        <Link to="/experiences" className="text-indigo-400 hover:text-indigo-350 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Feed
        </Link>
      </div>
    );
  }

  // Determine the color of the result badge
  const isSelected = experience.result === 'Selected';
  const isRejected = experience.result === 'Rejected';

  // Build the list of interview round elements using a standard for loop (no map)
  const roundElements = [];
  if (experience && experience.rounds && Array.isArray(experience.rounds)) {
    for (let i = 0; i < experience.rounds.length; i++) {
      const round = experience.rounds[i];
      roundElements.push(
        <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-lg relative pl-12 overflow-hidden">
          {/* Visual Timeline Line */}
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-indigo-500/20"></div>
          
          <h3 className="text-xl font-bold text-indigo-300 mb-3">Round {i + 1}: {round.round_name}</h3>
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{round.content}</p>
        </div>
      );
    }
  }

  // Build the list of questions elements using a standard for loop (no map)
  const questionElements = [];
  if (experience && experience.questions && Array.isArray(experience.questions)) {
    for (let i = 0; i < experience.questions.length; i++) {
      const q = experience.questions[i];
      questionElements.push(
        <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div>
            <h4 className="text-sm font-semibold text-purple-400 mb-1 uppercase tracking-wider">{q.topic}</h4>
            <p className="text-slate-200 text-lg">{q.question}</p>
          </div>
          
          {/* Difficulty Badge */}
          <span className={`text-xs px-3 py-1 rounded-lg border shrink-0 ${
            q.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            q.difficulty === 'Hard' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
          }`}>
            {q.difficulty || 'Medium'}
          </span>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Back Button */}
        <Link to="/experiences" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Feed</span>
        </Link>

        {/* --- HEADER --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 mb-8 relative">
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="h-20 w-20 bg-slate-800 rounded-lg flex items-center justify-center text-indigo-400 shrink-0 border border-slate-700">
              <Building2 className="h-10 w-10" />
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                <h1 className="text-3xl font-extrabold text-white">{experience.company_name}</h1>
                
                {/* Result Badge */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  isSelected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  isRejected ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                }`}>
                  {isSelected ? <CheckCircle className="h-5 w-5" /> : 
                   isRejected ? <XCircle className="h-5 w-5" /> : 
                   <Clock className="h-5 w-5" />}
                  <span className="font-bold">{experience.result}</span>
                </div>
              </div>

              <h2 className="text-xl text-slate-300 font-medium mb-4">Applied for: {experience.role}</h2>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Shared by <span className="text-slate-300 font-semibold">{experience.user_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(experience.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Upvote Button (Floating) */}
          <button 
            onClick={handleUpvote}
            disabled={upvoting}
            className={`absolute -bottom-6 right-8 flex items-center gap-2 px-6 py-3 rounded-lg border shadow-xl transition-all ${
              experience.has_upvoted 
                ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <ThumbsUp className={`h-5 w-5 ${experience.has_upvoted ? 'fill-current' : ''}`} />
            <span className="font-bold text-lg">{experience.upvotes}</span>
          </button>
        </div>

        {/* --- INTERVIEW ROUNDS --- */}
        <div className="mb-12 mt-16">
          <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <Layers className="h-6 w-6 text-indigo-400" /> 
            Interview Rounds
          </h2>
          
          <div className="space-y-6">
            {roundElements.length > 0 ? roundElements : (
              <p className="text-slate-500 italic">No specific round details provided.</p>
            )}
          </div>
        </div>

        {/* --- QUESTIONS ASKED --- */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-purple-400" /> 
            Questions Asked
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            {questionElements.length > 0 ? questionElements : (
              <p className="text-slate-500 italic">No specific questions were recorded for this experience.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}