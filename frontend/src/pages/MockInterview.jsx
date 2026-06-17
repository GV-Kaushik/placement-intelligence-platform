import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  Briefcase, 
  Layers, 
  Play, 
  Bot, 
  User, 
  Send, 
  Award, 
  AlertCircle, 
  ArrowLeft,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Activity,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';

export default function MockInterview() {
  const navigate = useNavigate();
  // We use a React Ref to automatically scroll the chat container to the bottom on new messages
  const chatEndRef = useRef(null);

  // --- FORM STATES (Start Screen) ---
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('Software Engineer');
  const [difficulty, setDifficulty] = useState('Medium');

  // --- INTERVIEW SESSION STATES ---
  const [activeInterview, setActiveInterview] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // --- LOADING & ERROR STATES ---
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // --- CHAT STATE ---
  const [inputText, setInputText] = useState('');

  // Automatically scroll to the bottom of the chat every time the activeInterview changes
  useEffect(function() {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeInterview, sending]);

  // --- SUBMIT: CREATE NEW INTERVIEW SESSION ---
  async function handleStartInterview() {
    if (!companyName.trim()) {
      setError('Please enter a target company name.');
      return;
    }

    setStarting(true);
    setError('');

    try {
      const res = await api.post('/mock-interviews', {
        company_name: companyName,
        role: role,
        difficulty: difficulty
      });

      // Save the active interview object (which contains the 1st question)
      setActiveInterview(res.data.interview);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Failed to start interview. Please try again.'
      );
    } finally {
      setStarting(false);
    }
  }

  // --- SUBMIT: SEND USER RESPONSE ---
  async function handleSendMessage(e) {
    e.preventDefault(); // Stop browser page reload
    if (!inputText.trim() || sending) return;

    const messageText = inputText.trim();
    setInputText(''); // Clear the input box instantly
    setSending(true);

    // Optimistically push the user's message to the local chat UI so it displays immediately!
    const updatedHistory = [];
    for (let i = 0; i < activeInterview.chat_history.length; i++) {
      updatedHistory.push(activeInterview.chat_history[i]);
    }
    updatedHistory.push({ role: 'user', text: messageText });
    
    // Update local state temporarily to show user message while waiting for AI
    setActiveInterview(function(prev) {
      return {
        ...prev,
        chat_history: updatedHistory
      };
    });

    try {
      const res = await api.post(`/mock-interviews/${activeInterview.id}/message`, {
        message: messageText
      });

      if (res.data.status === 'completed') {
        // If the interview is finished (5th response), the API returns the final scorecard feedback
        setActiveInterview(res.data.interview);
        setFeedback(res.data.feedback);
      } else {
        // If the interview is still active, save the updated session (which has the next question)
        setActiveInterview(res.data.interview);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  // Helper to determine text color based on score value
  function getScoreColorClass(score) {
    if (score < 50) return 'text-red-400';
    if (score < 75) return 'text-yellow-400';
    return 'text-emerald-400';
  }

  // Helper to determine progress bar color based on score value
  function getBarColorClass(score) {
    if (score < 50) return 'bg-red-500';
    if (score < 75) return 'bg-yellow-500';
    return 'bg-emerald-500';
  }

  // --- VIEW STATE 1: START SCREEN (If no active session exists) ---
  if (!activeInterview) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 flex flex-col items-center justify-center">
        <div className="w-full max-w-lg">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors mb-6 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          <div className="bg-slate-900 border border-slate-800 p-8 rounded-lg shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-slate-850 rounded-lg">
                <Bot className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  AI Mock Interview
                </h1>
                <p className="text-slate-400 text-xs mt-0.5">Customize and start your practice session</p>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-4 bg-red-950/40 border border-red-800/50 rounded-lg text-red-400 text-sm flex gap-2 items-center">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5" /> Target Company
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google, Amazon, Microsoft"
                  value={companyName}
                  onChange={function(e) { setCompanyName(e.target.value); }}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg outline-none text-slate-100 placeholder-slate-600 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5" /> Interview Role
                </label>
                <select
                  value={role}
                  onChange={function(e) { setRole(e.target.value); }}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg outline-none text-slate-100 placeholder-slate-400 transition-colors text-sm cursor-pointer"
                >
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Full Stack Engineer">Full Stack Engineer</option>
                  <option value="Data Scientist">Data Scientist</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5" /> Interview Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={function(e) { setDifficulty(e.target.value); }}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg outline-none text-slate-100 placeholder-slate-400 transition-colors text-sm cursor-pointer"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <button
                onClick={handleStartInterview}
                disabled={starting}
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {starting ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Start Mock Interview</span>
                    <Play className="h-4 w-4 fill-current" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW STATE 2: ACTIVE CHAT SCREEN (If active session exists & not completed) ---
  if (activeInterview && activeInterview.status !== 'completed') {
    
    // --- BUILD CHAT BUBBLES ---
    // We loop through the chat_history array and push JSX elements for each message bubble
    const chatBubbles = [];
    const history = activeInterview.chat_history;
    let userAnswersCount = 0;

    for (let i = 0; i < history.length; i++) {
      const msg = history[i];
      const isModel = msg.role === 'model';
      
      if (msg.role === 'user') {
        userAnswersCount = userAnswersCount + 1;
      }

      chatBubbles.push(
        <div key={i} className={`flex ${isModel ? 'justify-start' : 'justify-end'} mb-6`}>
          <div className={`flex gap-3.5 max-w-[85%] sm:max-w-[75%] ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
            {/* Speaker Avatar Icon */}
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border ${
              isModel 
                ? 'bg-slate-800 text-indigo-400 border-slate-700' 
                : 'bg-slate-800 text-indigo-400 border-slate-700'
            }`}>
              {isModel ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
            </div>

            {/* Speaker Text Bubble */}
            <div className={`p-4 rounded-lg text-sm leading-relaxed ${
              isModel 
                ? 'bg-slate-900 border border-slate-800 text-slate-100' 
                : 'bg-indigo-600 text-white'
            }`}>
              {msg.text}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        {/* Chat Navbar Header */}
        <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 sticky top-0 z-40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-indigo-400" />
            <div>
              <h1 className="font-bold text-slate-100 text-sm sm:text-base">
                Interviewer: {activeInterview.company_name} ({activeInterview.role})
              </h1>
              <p className="text-slate-500 text-xs font-semibold">
                Difficulty: {activeInterview.difficulty}
              </p>
            </div>
          </div>
          {/* Question tracker: shows "Question X of 5" */}
          <div className="bg-slate-850 text-slate-300 px-3 py-1 rounded-lg text-xs font-bold border border-slate-800">
            Question {Math.min(userAnswersCount + 1, 5)} of 5
          </div>
        </header>

        {/* Chat Message Box Container */}
        <main className="flex-1 overflow-y-auto px-6 py-8 max-w-4xl w-full mx-auto">
          {chatBubbles}

          {/* Typing/Thinking indicator shown when waiting for Gemini */}
          {sending && (
            <div className="flex justify-start mb-6">
              <div className="flex gap-3.5">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-slate-800 text-indigo-400 border border-slate-700 shrink-0">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="bg-slate-900 border border-slate-800 px-5 py-4 rounded-lg flex items-center gap-1.5">
                  <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Dummy element used by chatEndRef to scroll to bottom */}
          <div ref={chatEndRef} />
        </main>

        {/* Chat Input Text Box */}
        <footer className="border-t border-slate-800 bg-slate-900 px-6 py-4 sticky bottom-0 z-40">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
            <input 
              type="text"
              required
              disabled={sending}
              placeholder={sending ? "AI is thinking..." : "Type your technical response here..."}
              value={inputText}
              onChange={function(e) { setInputText(e.target.value); }}
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-4 py-3 text-sm outline-none text-slate-100 placeholder-slate-650 disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-5 py-3 flex items-center justify-center transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </footer>
      </div>
    );
  }

  // --- VIEW STATE 3: FEEDBACK SCORECARD SCREEN (If session is completed) ---
  if (activeInterview && activeInterview.status === 'completed' && feedback) {
    
    // --- BUILD WEAK AREAS BADGES ---
    // We extract the list of weak areas and format them as red pill badges
    const weakAreaBadges = [];
    let weakList = [];
    try {
      // Decode if stored as a stringified JSON in the DB
      weakList = typeof feedback.weak_areas === 'string' ? JSON.parse(feedback.weak_areas) : feedback.weak_areas;
    } catch (e) {
      weakList = feedback.weak_areas || [];
    }

    if (Array.isArray(weakList)) {
      for (let i = 0; i < weakList.length; i++) {
        weakAreaBadges.push(
          <span key={i} className="text-xs px-3 py-1 bg-red-950/30 border border-red-900/40 text-red-400 rounded-lg font-semibold">
            {weakList[i]}
          </span>
        );
      }
    }

    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Back Action */}
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors mb-8 text-sm">
            <ArrowLeft className="h-4 w-4" /> Return to Dashboard
          </Link>

          {/* Feedback Card Header */}
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-lg mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-slate-800 rounded-lg flex items-center justify-center text-indigo-400 shrink-0 border border-slate-700">
                <Award className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Interview Scorecard</h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  Mock interview feedback for {activeInterview.role} at {activeInterview.company_name}
                </p>
              </div>
            </div>
            
            {/* Overall Score Circle Indicator */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative h-24 w-24 flex items-center justify-center border-4 border-slate-800 rounded-full bg-slate-950">
                <span className={`text-3xl font-black ${getScoreColorClass(feedback.overall_score)}`}>
                  {feedback.overall_score}%
                </span>
              </div>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-2">Overall Score</span>
            </div>
          </div>

          {/* --- TOPIC DOMAIN SCORE GAUGES --- */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 mb-8">
            <h2 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" /> Domain Performance
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* DSA Score */}
              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-slate-300">Data Structures & Algorithms</span>
                  <span className={getScoreColorClass(feedback.dsa_score)}>{feedback.dsa_score}%</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-lg overflow-hidden border border-slate-800">
                  <div className={`h-3 rounded-lg ${getBarColorClass(feedback.dsa_score)}`} style={{ width: `${feedback.dsa_score}%` }}></div>
                </div>
              </div>

              {/* OS Score */}
              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-slate-300">Operating Systems</span>
                  <span className={getScoreColorClass(feedback.os_score)}>{feedback.os_score}%</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-lg overflow-hidden border border-slate-800">
                  <div className={`h-3 rounded-lg ${getBarColorClass(feedback.os_score)}`} style={{ width: `${feedback.os_score}%` }}></div>
                </div>
              </div>

              {/* DBMS Score */}
              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-slate-300">Database Systems (DBMS)</span>
                  <span className={getScoreColorClass(feedback.dbms_score)}>{feedback.dbms_score}%</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-lg overflow-hidden border border-slate-800">
                  <div className={`h-3 rounded-lg ${getBarColorClass(feedback.dbms_score)}`} style={{ width: `${feedback.dbms_score}%` }}></div>
                </div>
              </div>

              {/* Computer Networks Score */}
              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-slate-300">Computer Networks (CN)</span>
                  <span className={getScoreColorClass(feedback.cn_score)}>{feedback.cn_score}%</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-lg overflow-hidden border border-slate-800">
                  <div className={`h-3 rounded-lg ${getBarColorClass(feedback.cn_score)}`} style={{ width: `${feedback.cn_score}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* --- NARRATIVE FEEDBACK & SUGGESTIONS --- */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 mb-8">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-indigo-400" /> AI Interviewer Feedback
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {feedback.feedback_details}
            </p>
          </div>

          {/* --- WEAK AREAS / IMPROVEMENT PLAN --- */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 mb-8">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-red-400" /> Identified Weak Areas
            </h2>
            <p className="text-slate-400 text-xs mb-4">
              We recommend revising the following topics to improve your selection rates in future rounds:
            </p>
            <div className="flex flex-wrap gap-2.5">
              {weakAreaBadges.length > 0 ? weakAreaBadges : (
                <span className="text-sm text-slate-500 italic">No significant weak areas identified! Outstanding performance.</span>
              )}
            </div>
          </div>

          {/* Share/Complete Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <Link 
              to="/dashboard" 
              className="px-8 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold rounded-lg text-center transition-colors"
            >
              Back to Dashboard
            </Link>
            <Link 
              to="/submit-experience" 
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-center transition-colors"
            >
              Share Placement Experience
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}