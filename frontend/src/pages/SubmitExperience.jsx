import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Briefcase, Plus, Trash2, Send } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';

export default function SubmitExperience() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false); // Boolean flag to show loading spinner / disable save button while posting the new interview experience
  const [error, setError] = useState('');              // Stores form validation or API submission error messages to display

  // --- BASIC INFO STATE ---
  const [companyName, setCompanyName] = useState('');   // Stores the target company name input typed by the user (e.g. "Google")
  const [role, setRole] = useState('');                 // Stores the job role input typed by the user (e.g. "SDE-1")
  const [result, setResult] = useState('Selected');     // Stores the selected interview result status dropdown ("Selected" / "Rejected")

  // --- DYNAMIC ARRAYS STATE ---
  const [rounds, setRounds] = useState([{ round_name: '', content: '' }]); // Stores the dynamically added list of interview rounds (each round has name and description)
  const [questions, setQuestions] = useState([{ topic: '', question: '', difficulty: 'Medium' }]); // Stores the dynamically added list of questions asked (topic, description, difficulty)

  // --- ROUNDS LOGIC ---
  function addRound() {
    setRounds([...rounds, { round_name: '', content: '' }]);
  }
  
  function removeRound(index) {
    setRounds(rounds.filter(function(_, i) {
      return i !== index;
    }));
  }

  function updateRound(index, field, value) {
    const newRounds = [...rounds];
    newRounds[index][field] = value;
    setRounds(newRounds);
  }

  // --- QUESTIONS LOGIC ---
  function addQuestion() {
    setQuestions([...questions, { topic: '', question: '', difficulty: 'Medium' }]);
  }

  // Preserve map filter logic in standard code
  function removeQuestion(index) {
    setQuestions(questions.filter(function(_, i) {
      return i !== index;
    }));
  }

  function updateQuestion(index, field, value) {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  }

  // --- SUBMIT LOGIC ---
  async function handleSubmit(e) {
    e.preventDefault();
    if (!companyName || !role) {
      setError("Company Name and Role are required.");
      return;
    }
    
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        company_name: companyName,
        role: role,
        result: result,
        rounds: rounds.filter(function(r) { return r.round_name || r.content; }),
        questions: questions.filter(function(q) { return q.topic || q.question; })
      };

      const res = await api.post('/experiences', payload);
      navigate(`/experiences/${res.data.experience.id}`);
      
    } catch (err) {
      console.error("Error submitting experience:", err);
      setError(err.response?.data?.message || "Failed to submit experience. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Build round input forms using a standard for loop
  const roundFormFields = [];
  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i];
    const index = i;
    roundFormFields.push(
      <div key={index} className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-slate-800 font-bold text-xs uppercase tracking-wider">Round {index + 1}</h3>
          {rounds.length > 1 && (
            <button 
              type="button" 
              onClick={function() { removeRound(index); }}
              className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
        
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 mb-1.5">Round Name</label>
          <input 
            type="text" 
            placeholder="e.g. Online Assessment, Technical Interviews"
            value={round.round_name}
            onChange={function(e) { updateRound(index, 'round_name', e.target.value); }}
            className="w-full bg-white border border-slate-350 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-4 py-2 text-slate-900 outline-none text-sm transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 mb-1.5">Describe what happened</label>
          <textarea 
            rows="3"
            placeholder="Describe the interview process, format, topics discussed or feedback..."
            value={round.content}
            onChange={function(e) { updateRound(index, 'content', e.target.value); }}
            className="w-full bg-white border border-slate-350 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-4 py-2 text-slate-900 outline-none text-sm transition-colors"
          />
        </div>
      </div>
    );
  }

  // Build question input forms using a standard for loop
  const questionFormFields = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const index = i;
    questionFormFields.push(
      <div key={index} className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-slate-800 font-bold text-xs uppercase tracking-wider">Question {index + 1}</h3>
          {questions.length > 1 && (
            <button 
              type="button" 
              onClick={function() { removeQuestion(index); }}
              className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 mb-1.5">Topic</label>
            <input 
              type="text" 
              placeholder="e.g. Graphs, SQL, System Design"
              value={q.topic}
              onChange={function(e) { updateQuestion(index, 'topic', e.target.value); }}
              className="w-full bg-white border border-slate-350 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-4 py-2 text-slate-900 outline-none text-sm transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 mb-1.5">Difficulty</label>
            <select 
              value={q.difficulty}
              onChange={function(e) { updateQuestion(index, 'difficulty', e.target.value); }}
              className="w-full bg-white border border-slate-350 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-4 py-2 text-slate-900 outline-none text-sm transition-colors"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 mb-1.5">Question Text</label>
          <textarea 
            rows="2"
            placeholder="Write the exact question or a summary of it..."
            value={q.question}
            onChange={function(e) { updateQuestion(index, 'question', e.target.value); }}
            className="w-full bg-white border border-slate-350 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-4 py-2 text-slate-900 outline-none text-sm transition-colors"
          />
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-8 w-full">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            Share Your Experience
          </h1>
          <p className="text-slate-500 text-sm">
            Help your juniors by sharing what your interview process was like.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg mb-8 text-center text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* --- SECTION 1: BASIC INFO --- */}
          <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-xl">
            <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Briefcase className="h-4.5 w-4.5 text-blue-600" /> 
              <span>Basic Details</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 mb-1.5">Company Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Google"
                  value={companyName}
                  onChange={function(e) { setCompanyName(e.target.value); }}
                  className="w-full bg-white border border-slate-350 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-4 py-2 text-slate-900 outline-none text-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 mb-1.5">Role Applied For</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Software Engineer"
                  value={role}
                  onChange={function(e) { setRole(e.target.value); }}
                  className="w-full bg-white border border-slate-350 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-4 py-2 text-slate-900 outline-none text-sm transition-colors"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 mb-1.5">Final Result</label>
                <select 
                  value={result}
                  onChange={function(e) { setResult(e.target.value); }}
                  className="w-full bg-white border border-slate-350 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-4 py-2 text-slate-900 outline-none text-sm transition-colors"
                >
                  <option value="Selected">Selected</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Waitlisted">Waitlisted</option>
                </select>
              </div>
            </div>
          </div>

          {/* --- SECTION 2: ROUNDS --- */}
          <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Interview Rounds</h2>
              <button 
                type="button" 
                onClick={addRound}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-bold text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> 
                <span>Add Round</span>
              </button>
            </div>

            <div className="space-y-6">
              {roundFormFields}
            </div>
          </div>

          {/* --- SECTION 3: QUESTIONS --- */}
          <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Specific Questions</h2>
              <button 
                type="button" 
                onClick={addQuestion}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-bold text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> 
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-6">
              {questionFormFields}
            </div>
          </div>

          {/* --- SUBMIT BUTTON --- */}
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm cursor-pointer"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <Send className="h-4 w-4" /> 
                <span>Submit Experience</span>
              </>
            )}
          </button>

        </form>
      </div>
    </Layout>
  );
}