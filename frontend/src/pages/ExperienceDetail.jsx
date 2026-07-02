import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, ArrowLeft, User, ThumbsUp, HelpCircle, Layers, Calendar, CheckCircle, XCircle, Clock, MessageSquare, Send } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';

export default function ExperienceDetail() {
  const { id } = useParams();
  
  const [experience, setExperience] = useState(null);       // Stores the detailed interview experience object (rounds, questions, role, results, upvotes)
  const [loading, setLoading] = useState(true);             // Boolean flag to show loading spinner while fetching the experience detail details
  const [error, setError] = useState(null);                 // Stores any API retrieval error messages to display
  const [upvoting, setUpvoting] = useState(false);           // Boolean flag to disable upvote button during the active API request to prevent double upvoting

  // Comments states
  const [comments, setComments] = useState([]);             // Stores the list of comments left by users on this interview experience
  const [loadingComments, setLoadingComments] = useState(false); // Boolean flag to show spinner while retrieving comments list
  const [newComment, setNewComment] = useState('');         // Stores the text typed into the comment submission textarea input field
  const [submittingComment, setSubmittingComment] = useState(false); // Boolean flag to show loading/disable inputs while submitting a comment

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

    async function fetchComments() {
      setLoadingComments(true);
      try {
        const res = await api.get(`/experiences/${id}/comments`);
        setComments(res.data.comments || []);
      } catch (err) {
        console.error("Error fetching comments:", err);
      } finally {
        setLoadingComments(false);
      }
    }

    fetchExperience();
    fetchComments();
  }, [id]);

  async function handleSubmitComment(e) {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await api.post(`/experiences/${id}/comments`, {
        comment_text: newComment.trim()
      });
      setComments(function(prev) {
        return [...prev, res.data.comment];
      });
      setNewComment('');
    } catch (err) {
      console.error("Failed to post comment:", err);
      alert("Failed to submit comment. Please try again.");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleUpvote() {
    if (upvoting || !experience) return;
    setUpvoting(true);
    
    try {
      const res = await api.post(`/experiences/${id}/upvote`);
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
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !experience) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold text-red-655 mb-4">{error}</h2>
          <Link to="/experiences" className="text-blue-600 hover:text-blue-700 flex items-center gap-2 text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" /> Back to Feed
          </Link>
        </div>
      </Layout>
    );
  }

  const isSelected = experience.result === 'Selected';
  const isRejected = experience.result === 'Rejected';

  // Build the list of interview round elements using a standard for loop
  const roundElements = [];
  if (experience && experience.rounds && Array.isArray(experience.rounds)) {
    for (let i = 0; i < experience.rounds.length; i++) {
      const round = experience.rounds[i];
      roundElements.push(
        <div key={i} className="bg-white border border-slate-200 p-6 rounded-xl relative pl-10 overflow-hidden">
          {/* Visual Timeline Line */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600"></div>
          
          <h3 className="text-base font-bold text-slate-900 mb-2">Round {i + 1}: {round.round_name}</h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{round.content}</p>
        </div>
      );
    }
  }

  // Build the list of questions elements using a standard for loop
  const questionElements = [];
  if (experience && experience.questions && Array.isArray(experience.questions)) {
    for (let i = 0; i < experience.questions.length; i++) {
      const q = experience.questions[i];
      questionElements.push(
        <div key={i} className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">{q.topic}</h4>
            <p className="text-sm font-semibold text-slate-800">{q.question}</p>
          </div>
          
          {/* Difficulty Badge */}
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold border shrink-0 ${
            q.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            q.difficulty === 'Hard' ? 'bg-rose-50 text-rose-700 border-rose-200' :
            'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {q.difficulty || 'Medium'}
          </span>
        </div>
      );
    }
  }

  // Build the list of comment elements using a standard for loop
  const commentElements = [];
  if (comments) {
    for (let i = 0; i < comments.length; i++) {
      const c = comments[i];
      const commentDate = new Date(c.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      commentElements.push(
        <div key={c.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-700">{c.user_name}</span>
            <span className="text-slate-400 font-medium text-[10px]">{commentDate}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{c.comment_text}</p>
        </div>
      );
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-8 w-full">
        
        {/* Back Button */}
        <Link to="/experiences" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors mb-6">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Feed</span>
        </Link>

        {/* --- HEADER --- */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 mb-8 relative">
          
          <div className="flex flex-col md:flex-row gap-5">
            <div className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
              <Building2 className="h-8 w-8 text-slate-650" />
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{experience.company_name}</h1>
                
                {/* Result Badge */}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold ${
                  isSelected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  isRejected ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {isSelected ? <CheckCircle className="h-4 w-4" /> : 
                   isRejected ? <XCircle className="h-4 w-4" /> : 
                   <Clock className="h-4 w-4" />}
                  <span>{experience.result}</span>
                </div>
              </div>

              <h2 className="text-sm font-semibold text-slate-600 mb-3">Applied for: {experience.role}</h2>
              
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>Shared by <span className="text-slate-600 font-semibold">{experience.user_name}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{new Date(experience.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upvote Button (Floating) */}
          <button 
            onClick={handleUpvote}
            disabled={upvoting}
            className={`absolute -bottom-4.5 right-6 flex items-center gap-1.5 px-4 py-2.5 rounded-lg border transition-all text-xs font-bold cursor-pointer ${
              experience.has_upvoted 
                ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ThumbsUp className={`h-3.5 w-3.5 ${experience.has_upvoted ? 'fill-current' : ''}`} />
            <span>{experience.upvotes}</span>
          </button>
        </div>

        {/* --- INTERVIEW ROUNDS --- */}
        <div className="mb-10 mt-14">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="h-4.5 w-4.5 text-blue-600" /> 
            <span>Interview Rounds</span>
          </h2>
          
          <div className="space-y-4">
            {roundElements.length > 0 ? roundElements : (
              <p className="text-slate-400 text-xs italic">No specific round details provided.</p>
            )}
          </div>
        </div>

        {/* --- QUESTIONS ASKED --- */}
        <div className="mb-10">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <HelpCircle className="h-4.5 w-4.5 text-blue-600" /> 
            <span>Questions Asked</span>
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            {questionElements.length > 0 ? questionElements : (
              <p className="text-slate-400 text-xs italic">No specific questions were recorded for this experience.</p>
            )}
          </div>
        </div>

        {/* --- COMMENTS SECTION --- */}
        <div className="border-t border-slate-200 pt-8 mt-10">
          <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
            <MessageSquare className="h-4.5 w-4.5 text-blue-600" /> 
            <span>Discussion Feed ({commentElements.length})</span>
          </h2>

          <div className="space-y-4 mb-6">
            {loadingComments ? (
              <div className="flex justify-center py-4">
                <Clock className="h-5 w-5 text-blue-600 animate-spin" />
              </div>
            ) : commentElements.length > 0 ? (
              commentElements
            ) : (
              <p className="text-slate-400 text-xs italic">No comments posted yet. Start the discussion below!</p>
            )}
          </div>

          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <textarea
              rows="3"
              required
              disabled={submittingComment}
              placeholder="Post a query, suggestion, or comment on this interview experience..."
              value={newComment}
              onChange={function(e) { setNewComment(e.target.value); }}
              className="w-full bg-white border border-slate-350 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-4 py-2.5 text-xs outline-none text-slate-900 placeholder-slate-400 transition-colors"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {submittingComment ? (
                  <Clock className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Post Comment</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </Layout>
  );
}