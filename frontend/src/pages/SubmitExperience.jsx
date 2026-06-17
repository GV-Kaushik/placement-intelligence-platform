import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Briefcase, Plus, Trash2, Send, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function SubmitExperience() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // --- BASIC INFO STATE ---
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [result, setResult] = useState('Selected');

  // --- DYNAMIC ARRAYS STATE ---
  const [rounds, setRounds] = useState([{ round_name: '', content: '' }]);
  const [questions, setQuestions] = useState([{ topic: '', question: '', difficulty: 'Medium' }]);

  // --- ROUNDS LOGIC ---
  const addRound = () => setRounds([...rounds, { round_name: '', content: '' }]);
  const removeRound = (index) => setRounds(rounds.filter((_, i) => i !== index));
  const updateRound = (index, field, value) => {
    const newRounds = [...rounds];
    newRounds[index][field] = value;
    setRounds(newRounds);
  };

  // --- QUESTIONS LOGIC ---
  const addQuestion = () => setQuestions([...questions, { topic: '', question: '', difficulty: 'Medium' }]);
  const removeQuestion = (index) => setQuestions(questions.filter((_, i) => i !== index));
  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  // --- SUBMIT LOGIC ---
  const handleSubmit = async (e) => {
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
        role,
        result,
        // Filter out any empty rounds/questions before sending to the backend
        rounds: rounds.filter(r => r.round_name || r.content),
        questions: questions.filter(q => q.topic || q.question)
      };

      const res = await api.post('/experiences', payload);
      
      // On success, automatically take them to their newly created experience page!
      navigate(`/experiences/${res.data.experience.id}`);
      
    } catch (err) {
      console.error("Error submitting experience:", err);
      setError(err.response?.data?.message || "Failed to submit experience. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Build round input forms using a standard for loop (instead of a map in the template)
  const roundFormFields = [];
  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i];
    const index = i; // Save local index for loop callbacks
    roundFormFields.push(
      <div key={index} className="bg-slate-950 border border-slate-800 p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-emerald-400 font-semibold">Round {index + 1}</h3>
          {rounds.length > 1 && (
            <button 
              type="button" 
              onClick={function() { removeRound(index); }}
              className="text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-400 mb-2">Round Name</label>
          <input 
            type="text" 
            placeholder="e.g. Online Assessment, Technical HR"
            value={round.round_name}
            onChange={function(e) { updateRound(index, 'round_name', e.target.value); }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">What happened?</label>
          <textarea 
            rows="3"
            placeholder="Describe the interview process, format, or general topics..."
            value={round.content}
            onChange={function(e) { updateRound(index, 'content', e.target.value); }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-emerald-500"
          />
        </div>
      </div>
    );
  }

  // Build question input forms using a standard for loop (instead of a map in the template)
  const questionFormFields = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const index = i; // Save local index for loop callbacks
    questionFormFields.push(
      <div key={index} className="bg-slate-950 border border-slate-800 p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-cyan-400 font-semibold">Question {index + 1}</h3>
          {questions.length > 1 && (
            <button 
              type="button" 
              onClick={function() { removeQuestion(index); }}
              className="text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Topic</label>
            <input 
              type="text" 
              placeholder="e.g. Graphs, SQL, React"
              value={q.topic}
              onChange={function(e) { updateQuestion(index, 'topic', e.target.value); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Difficulty</label>
            <select 
              value={q.difficulty}
              onChange={function(e) { updateQuestion(index, 'difficulty', e.target.value); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-cyan-500"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">The exact question</label>
          <textarea 
            rows="2"
            placeholder="Write the question you were asked..."
            value={q.question}
            onChange={function(e) { updateQuestion(index, 'question', e.target.value); }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-cyan-500"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4">
            Share Your Experience
          </h1>
          <p className="text-slate-400 text-lg">
            Help your juniors by sharing what your interview was like!
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-8 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12">
          
          {/* --- SECTION 1: BASIC INFO --- */}
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
            <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
              <Briefcase className="text-emerald-400" /> Basic Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Company Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Google"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Role Applied For</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Software Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-2">Final Result</label>
                <select 
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                >
                  <option value="Selected">Selected ✅</option>
                  <option value="Rejected">Rejected ❌</option>
                  <option value="Waitlisted">Waitlisted ⏳</option>
                </select>
              </div>
            </div>
          </div>

          {/* --- SECTION 2: ROUNDS --- */}
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-100">Interview Rounds</h2>
              <button 
                type="button" 
                onClick={addRound}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
              >
                <Plus className="h-4 w-4" /> Add Round
              </button>
            </div>

            <div className="space-y-6">
              {roundFormFields}
            </div>
          </div>

          {/* --- SECTION 3: QUESTIONS --- */}
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-100">Specific Questions</h2>
              <button 
                type="button" 
                onClick={addQuestion}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              >
                <Plus className="h-4 w-4" /> Add Question
              </button>
            </div>

            <div className="space-y-6">
              {questionFormFields}
            </div>
          </div></div>

          {/* --- SUBMIT BUTTON --- */}
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
            ) : (
              <>
                <Send className="h-5 w-5" /> Submit Experience
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}