import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  Building2, 
  Briefcase, 
  Layers, 
  Play, 
  User, 
  Send, 
  Award, 
  AlertCircle, 
  ArrowLeft,
  BookOpen,
  HelpCircle,
  Activity
} from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';

export default function MockInterview() {
  const chatEndRef = useRef(null);
  const { id } = useParams(); // Extracts the unique interview UUID parameter from the URL

  // --- FORM STATES (Start Screen) ---
  const [companyName, setCompanyName] = useState('');           // Stores the company name input by the user (e.g., "Google", "Amazon")
  const [role, setRole] = useState('Software Engineer');         // Stores the selected job role for the interview (e.g., "Software Engineer")
  const [difficulty, setDifficulty] = useState('Medium');         // Stores the selected difficulty level ("Easy", "Medium", "Hard")

  // --- INTERVIEW SESSION STATES ---
  const [activeInterview, setActiveInterview] = useState(null); // Stores the active interview session object (chat history, session details) from the DB
  const [feedback, setFeedback] = useState(null);               // Stores the final AI feedback / evaluation scorecard once the interview is completed

  // --- LOADING & ERROR STATES ---
  const [starting, setStarting] = useState(false);              // Boolean flag to show loading spinner while generating the first interview question
  const [sending, setSending] = useState(false);                // Boolean flag to disable inputs and show spinner while waiting for the AI's reply
  const [error, setError] = useState('');                      // Stores any validation or server error messages to display on the screen

  // --- CHAT STATE ---
  const [inputText, setInputText] = useState('');               // Stores the user's typed response to the interviewer's question in the chat input box

  // --- LOAD PAST INTERVIEW SESSION IF ID IS PRESENT ---
  useEffect(() => {
    if (id) {
      fetchPastInterview(id);
    } else {
      setActiveInterview(null);
      setFeedback(null);
    }
  }, [id]);

  async function fetchPastInterview(interviewId) {// This function comes into play when user clicks any interview history from dashboard 
    setStarting(true);
    setError('');
    try {
      const res = await api.get(`/mock-interviews/${interviewId}`);
      setActiveInterview(res.data.interview);
      if (res.data.interview.status === 'completed') {
        setFeedback(res.data.feedback);
      }
    } catch (err) {
      console.error('Failed to load past mock interview:', err);
      setError(
        err.response?.data?.message || 
        'Failed to load past mock interview details.'
      );
    } finally {
      setStarting(false);
    }
  }

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
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    const updatedHistory = [];
    for (let i = 0; i < activeInterview.chat_history.length; i++) {
      updatedHistory.push(activeInterview.chat_history[i]);
    }
    updatedHistory.push({ role: 'user', text: messageText });
    
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
        setActiveInterview(res.data.interview);
        setFeedback(res.data.feedback);
      } else {
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
    if (score < 50) return 'text-rose-600';
    if (score < 75) return 'text-amber-600';
    return 'text-emerald-650';
  }

  // Helper to determine progress bar color based on score value
  function getBarColorClass(score) {
    if (score < 50) return 'bg-rose-500';
    if (score < 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  // --- VIEW STATE 1: START SCREEN (If no active session exists) ---
  if (!activeInterview) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto px-6 py-12 w-full flex flex-col justify-center min-h-[calc(100vh-8rem)]">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors mb-6 text-xs font-bold">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>

          <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-xl">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
                <HelpCircle className="h-5.5 w-5.5 text-blue-650" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  Mock Interview Practice
                </h1>
                <p className="text-slate-500 text-xs mt-0.5">Practice technical and behavioral interviews</p>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex gap-2 items-center">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" /> Target Company
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google, Amazon, Microsoft"
                  value={companyName}
                  onChange={function(e) { setCompanyName(e.target.value); }}
                  className="w-full bg-white border border-slate-350 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-4 py-2 text-slate-900 outline-none text-sm placeholder-slate-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" /> Interview Role
                </label>
                <select
                  value={role}
                  onChange={function(e) { setRole(e.target.value); }}
                  className="w-full bg-white border border-slate-350 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-4 py-2 text-slate-900 outline-none text-sm transition-colors cursor-pointer"
                >
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Full Stack Engineer">Full Stack Engineer</option>
                  <option value="Data Scientist">Data Scientist</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 mb-1.5 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-slate-400" /> Interview Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={function(e) { setDifficulty(e.target.value); }}
                  className="w-full bg-white border border-slate-350 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-4 py-2 text-slate-900 outline-none text-sm transition-colors cursor-pointer"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <button
                onClick={handleStartInterview}
                disabled={starting}
                className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {starting ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Start Practice Interview</span>
                    <Play className="h-4 w-4 fill-current" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // --- VIEW STATE 2: ACTIVE CHAT SCREEN (If active session exists & not completed) ---
  if (activeInterview && activeInterview.status !== 'completed') {
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
          <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border text-xs font-bold ${
              isModel 
                ? 'bg-slate-100 text-slate-500 border-slate-200' 
                : 'bg-blue-50 text-blue-600 border-blue-100'
            }`}>
              <User className="h-4 w-4" />
            </div>

            <div className={`p-4 rounded-xl text-sm leading-relaxed ${
              isModel 
                ? 'bg-white border border-slate-200 text-slate-800' 
                : 'bg-blue-600 text-white'
            }`}>
              {msg.text}
            </div>
          </div>
        </div>
      );
    }

    return (
      <Layout>
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50">
          {/* Chat Navbar Header */}
          <header className="border-b border-slate-200 bg-white px-6 py-3.5 sticky top-0 z-40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-slate-500" />
              <div>
                <h1 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight">
                  Interviewer: {activeInterview.company_name} ({activeInterview.role})
                </h1>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                  Difficulty: {activeInterview.difficulty}
                </p>
              </div>
            </div>
            <div className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold border border-slate-200">
              Question {Math.min(userAnswersCount + 1, 5)} of 5
            </div>
          </header>

          {/* Chat Message Box Container */}
          <main className="flex-1 overflow-y-auto px-6 py-6 max-w-4xl w-full mx-auto">
            {chatBubbles}

            {sending && (
              <div className="flex justify-start mb-6">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="bg-white border border-slate-200 px-4 py-3.5 rounded-xl flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </main>

          {/* Chat Input Text Box */}
          <footer className="border-t border-slate-200 bg-white px-6 py-4 sticky bottom-0 z-40">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
              <input 
                type="text"
                required
                disabled={sending}
                placeholder={sending ? "Interviewer is typing..." : "Type your technical response here..."}
                value={inputText}
                onChange={function(e) { setInputText(e.target.value); }}
                className="flex-1 bg-white border border-slate-350 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-4 py-2.5 text-sm outline-none text-slate-900 placeholder-slate-400 disabled:opacity-50 transition-colors"
              />
              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 flex items-center justify-center transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </footer>
        </div>
      </Layout>
    );
  }

  // --- VIEW STATE 3: FEEDBACK SCORECARD SCREEN (If session is completed) ---
  if (activeInterview && activeInterview.status === 'completed' && feedback) {
    const weakAreaBadges = [];
    let weakList = [];
    try {
      weakList = typeof feedback.weak_areas === 'string' ? JSON.parse(feedback.weak_areas) : feedback.weak_areas;
    } catch (e) {
      weakList = feedback.weak_areas || [];
    }

    if (Array.isArray(weakList)) {
      for (let i = 0; i < weakList.length; i++) {
        weakAreaBadges.push(
          <span key={i} className="text-xs px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-semibold">
            {weakList[i]}
          </span>
        );
      }
    }

    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-6 py-8 w-full">
          {/* Back Action */}
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-slate-550 hover:text-blue-600 transition-colors mb-6 text-xs font-bold">
            <ArrowLeft className="h-3.5 w-3.5" /> Return to Dashboard
          </Link>

          {/* Feedback Card Header */}
          <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                <Award className="h-7 w-7 text-blue-650" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Interview Scorecard</h1>
                <p className="text-slate-500 text-xs mt-1">
                  Mock interview feedback for {activeInterview.role} at {activeInterview.company_name}
                </p>
              </div>
            </div>
            
            {/* Overall Score Circle Indicator */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative h-20 w-20 flex items-center justify-center border-4 border-slate-100 rounded-full bg-slate-50">
                <span className={`text-2xl font-black ${getScoreColorClass(feedback.overall_score)}`}>
                  {feedback.overall_score}%
                </span>
              </div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-2">Overall Score</span>
            </div>
          </div>

          {/* --- TOPIC DOMAIN SCORE GAUGES --- */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 mb-6">
            <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Activity className="h-4.5 w-4.5 text-blue-650" /> 
              <span>Domain Performance</span>
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* DSA Score */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">Data Structures & Algorithms</span>
                  <span className={getScoreColorClass(feedback.dsa_score)}>{feedback.dsa_score}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                  <div className={`h-2.5 rounded-full ${getBarColorClass(feedback.dsa_score)}`} style={{ width: `${feedback.dsa_score}%` }}></div>
                </div>
              </div>

              {/* OS Score */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">Operating Systems</span>
                  <span className={getScoreColorClass(feedback.os_score)}>{feedback.os_score}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                  <div className={`h-2.5 rounded-full ${getBarColorClass(feedback.os_score)}`} style={{ width: `${feedback.os_score}%` }}></div>
                </div>
              </div>

              {/* DBMS Score */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">Database Systems (DBMS)</span>
                  <span className={getScoreColorClass(feedback.dbms_score)}>{feedback.dbms_score}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                  <div className={`h-2.5 rounded-full ${getBarColorClass(feedback.dbms_score)}`} style={{ width: `${feedback.dbms_score}%` }}></div>
                </div>
              </div>

              {/* Computer Networks Score */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">Computer Networks (CN)</span>
                  <span className={getScoreColorClass(feedback.cn_score)}>{feedback.cn_score}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                  <div className={`h-2.5 rounded-full ${getBarColorClass(feedback.cn_score)}`} style={{ width: `${feedback.cn_score}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* --- NARRATIVE FEEDBACK & SUGGESTIONS --- */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 mb-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <HelpCircle className="h-4.5 w-4.5 text-blue-650" /> 
              <span>Interviewer Feedback</span>
            </h2>
            <p className="text-sm text-slate-655 leading-relaxed whitespace-pre-wrap">
              {feedback.feedback_details}
            </p>
          </div>

          {/* --- WEAK AREAS / IMPROVEMENT PLAN --- */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 mb-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <BookOpen className="h-4.5 w-4.5 text-rose-500" /> 
              <span>Identified Weak Areas</span>
            </h2>
            <p className="text-slate-500 text-xs mb-4">
              We recommend revising the following topics to improve your performance in future interviews:
            </p>
            <div className="flex flex-wrap gap-2.5">
              {weakAreaBadges.length > 0 ? weakAreaBadges : (
                <span className="text-xs text-slate-455 italic">No significant weak areas identified! Outstanding performance.</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <Link 
              to="/dashboard" 
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-lg text-center transition-colors text-xs cursor-pointer"
            >
              Back to Dashboard
            </Link>
            <Link 
              to="/submit-experience" 
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-center transition-colors text-xs cursor-pointer"
            >
              Share Placement Experience
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return null;
}