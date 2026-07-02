import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Trash2,
  RefreshCw,
  Clock
} from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';

export default function ResumeEvaluator() {
  // --- STATE VARIABLES ---
  const [resumesHistory, setResumesHistory] = useState([]);     // Stores the list of previously evaluated resumes fetched from the database
  const [selectedResume, setSelectedResume] = useState(null);   // Stores the currently selected resume object (details, score, feedback details) to show in the UI panel
  const [file, setFile] = useState(null);                       // Stores the raw File object uploaded/selected by the student for upload
  const [loading, setLoading] = useState(false);                 // Boolean flag to show loading spinner / disable buttons during resume upload and AI analysis
  const [fetchingHistory, setFetchingHistory] = useState(false); // Boolean flag to show spinner while loading history list on mount
  const [error, setError] = useState('');                       // Stores file size, type validation, or server API error messages to display
  const [dragActive, setDragActive] = useState(false);           // Boolean flag indicating if a file is currently being dragged over the drop zone UI area

  // --- FETCH HISTORY ON MOUNT ---
  useEffect(function() {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setFetchingHistory(true);
    try {
      const res = await api.get('/resumes');
      setResumesHistory(res.data.resumes || []);
    } catch (err) {
      console.error('Failed to fetch resume history:', err);
    } finally {
      setFetchingHistory(false);
    }
  }

  // --- DRAG & DROP HANDLERS ---
  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      validateFile(selected);
    }
  }

  // --- FILE SELECTION HANDLER ---
  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      validateFile(selected);
    }
  }

  function validateFile(selected) {
    if (selected.type !== 'application/pdf') {
      setError('Invalid file type. Only PDF files are allowed!');
      setFile(null);
    } else if (selected.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB!');
      setFile(null);
    } else {
      setFile(selected);
      setError('');
    }
  }

  // --- UPLOAD & EVALUATE SUBMIT ---
  async function handleUpload(e) {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.post('/resumes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const newResume = res.data.resume;
      setSelectedResume(newResume);
      
      // Update history list
      setResumesHistory(function(prev) {
        const updated = [newResume];
        for (let i = 0; i < prev.length; i++) {
          updated.push(prev[i]);
        }
        return updated;
      });
      
      setFile(null);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        'Failed to evaluate resume. Please make sure the PDF has selectable text.'
      );
    } finally {
      setLoading(false);
    }
  }

  // --- DELETE EVALUATION ---
  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      await api.delete(`/resumes/${id}`);

      // Filter deleted item from history
      setResumesHistory(function(prev) {
        const updated = [];
        for (let i = 0; i < prev.length; i++) {
          if (prev[i].id !== id) {
            updated.push(prev[i]);
          }
        }
        return updated;
      });

      // Clear selection if we deleted the active resume
      setSelectedResume(function(prev) {
        if (prev && prev.id === id) {
          return null;
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to delete resume review:', err);
      alert('Failed to delete resume review. Please try again.');
    }
  }

  // --- RENDER DYNAMIC LISTS USING LOOPS (NO MAPS) ---
  const strengthItems = [];
  if (selectedResume && Array.isArray(selectedResume.strengths)) {
    for (let i = 0; i < selectedResume.strengths.length; i++) {
      strengthItems.push(
        <li key={'s-' + i} className="flex items-start gap-2.5 text-slate-600 text-xs leading-relaxed">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
          <span>{selectedResume.strengths[i]}</span>
        </li>
      );
    }
  }

  const weaknessItems = [];
  if (selectedResume && Array.isArray(selectedResume.weaknesses)) {
    for (let i = 0; i < selectedResume.weaknesses.length; i++) {
      weaknessItems.push(
        <li key={'w-' + i} className="flex items-start gap-2.5 text-slate-600 text-xs leading-relaxed">
          <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
          <span>{selectedResume.weaknesses[i]}</span>
        </li>
      );
    }
  }

  const suggestionItems = [];
  if (selectedResume && Array.isArray(selectedResume.suggestions)) {
    for (let i = 0; i < selectedResume.suggestions.length; i++) {
      suggestionItems.push(
        <li key={'p-' + i} className="flex items-start gap-2.5 text-slate-600 text-xs leading-relaxed">
          <Lightbulb className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
          <span>{selectedResume.suggestions[i]}</span>
        </li>
      );
    }
  }

  const historyItems = [];
  if (resumesHistory) {
    for (let i = 0; i < resumesHistory.length; i++) {
      const item = resumesHistory[i];
      const isSelected = selectedResume && selectedResume.id === item.id;
      const dateStr = new Date(item.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      historyItems.push(
        <div
          key={item.id}
          onClick={function() { setSelectedResume(item); }}
          className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
            isSelected
              ? 'bg-slate-100 border-slate-350 text-slate-900 font-semibold'
              : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden mr-2">
            <FileText className="h-4 w-4 shrink-0 text-blue-650" />
            <div className="truncate text-xs font-bold text-slate-700">{item.file_name}</div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] text-slate-400 font-semibold">{dateStr}</span>
            <button
              onClick={function(e) {
                e.stopPropagation();
                handleDelete(item.id);
              }}
              className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
              title="Delete review"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-8 w-full">
        
        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg flex items-center gap-2.5 text-sm">
            <AlertCircle className="h-4.5 w-4.5 text-rose-650 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* LEFT BAR: HISTORY */}
          <div className="lg:col-span-1 bg-white border border-slate-200 p-4 rounded-xl flex flex-col h-[calc(100vh-12rem)] min-h-[400px]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>Review History</span>
            </h2>
            <div className="flex-grow overflow-y-auto space-y-2 pr-1">
              {fetchingHistory ? (
                <div className="flex justify-center items-center py-10">
                  <RefreshCw className="h-5 w-5 text-blue-650 animate-spin" />
                </div>
              ) : historyItems.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs italic">
                  No resumes analyzed yet.
                </div>
              ) : (
                historyItems
              )}
            </div>
          </div>

          {/* RIGHT AREA: DETAILED DISPLAY OR UPLOAD */}
          <div className="lg:col-span-3 flex flex-col h-[calc(100vh-12rem)] min-h-[500px]">
            
            {/* UPLOAD SCREEN */}
            {!selectedResume && !loading && (
              <div className="flex-grow flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl p-8 max-w-2xl mx-auto w-full">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-full mb-4">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Upload your Resume</h3>
                <p className="text-xs text-slate-500 text-center mb-6 max-w-sm">
                  Upload a selectable-text PDF resume. We will review it for placement compatibility and key guidelines.
                </p>

                {/* Drag and drop zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`w-full max-w-md border border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
                    dragActive ? 'border-blue-500 bg-blue-50/20' : 'border-slate-300 bg-slate-50 hover:bg-slate-100/50'
                  }`}
                >
                  <input
                    type="file"
                    id="resume-file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="resume-file" className="cursor-pointer block">
                    {file ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-blue-600 animate-bounce" />
                        <span className="text-sm font-bold text-slate-800 truncate max-w-xs">{file.name}</span>
                        <span className="text-xs text-slate-450">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-slate-600 font-bold mb-1">Drag and drop your file here, or</p>
                        <p className="text-xs text-blue-605 font-bold">browse files</p>
                        <p className="text-[10px] text-slate-440 mt-2">Only PDF files (Max 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={!file}
                  className={`mt-6 w-full max-w-xs py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-300 border ${
                    file
                      ? 'bg-blue-600 border-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95'
                      : 'bg-slate-100 text-slate-400 border-slate-205 cursor-not-allowed'
                  }`}
                >
                  Review Resume
                </button>
              </div>
            )}

            {/* LOADING STATE */}
            {loading && (
              <div className="flex-grow flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl p-8 max-w-2xl mx-auto w-full">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mb-4" />
                <h3 className="text-base font-bold mb-2 text-center text-slate-900">Analyzing your resume content...</h3>
                <p className="text-xs text-slate-500 text-center max-w-xs leading-relaxed">
                  We are extracting keywords, assessing language quality, and generating custom improvement suggestions. This may take a few seconds.
                </p>
              </div>
            )}

            {/* DETAILED ANALYSIS SECTION */}
            {selectedResume && !loading && (
              <div className="flex-grow flex flex-col bg-white border border-slate-200 rounded-xl p-6 overflow-y-auto">
                
                {/* Header inside display */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <div className="flex items-center gap-1 text-blue-605 text-xs font-semibold mb-1">
                      Review Report
                    </div>
                    <h3 className="text-lg font-bold text-slate-950 truncate max-w-xl">{selectedResume.file_name}</h3>
                  </div>
                  <button
                    onClick={function() { setSelectedResume(null); setFile(null); setError(''); }}
                    className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-205 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors active:scale-95 shrink-0 self-start sm:self-center cursor-pointer"
                  >
                    Upload New Resume
                  </button>
                </div>

                {/* THREE COLUMN GRID OF METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* STRENGTHS */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col">
                    <div className="flex items-center gap-2 font-bold text-emerald-700 mb-4 border-b border-slate-100 pb-2">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Key Strengths</h4>
                    </div>
                    {strengthItems.length === 0 ? (
                      <p className="text-slate-400 text-xs italic">No strengths listed.</p>
                    ) : (
                      <ul className="space-y-4 flex-grow">{strengthItems}</ul>
                    )}
                  </div>

                  {/* WEAKNESSES */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col">
                    <div className="flex items-center gap-2 font-bold text-rose-700 mb-4 border-b border-slate-100 pb-2">
                      <AlertCircle className="h-4.5 w-4.5 text-rose-650" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Areas to Improve</h4>
                    </div>
                    {weaknessItems.length === 0 ? (
                      <p className="text-slate-400 text-xs italic">No gaps identified.</p>
                    ) : (
                      <ul className="space-y-4 flex-grow">{weaknessItems}</ul>
                    )}
                  </div>

                  {/* ACTIONABLE TIPS */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col">
                    <div className="flex items-center gap-2 font-bold text-amber-700 mb-4 border-b border-slate-100 pb-2">
                      <Lightbulb className="h-4.5 w-4.5 text-amber-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Suggestions</h4>
                    </div>
                    {suggestionItems.length === 0 ? (
                      <p className="text-slate-400 text-xs italic">No suggestions.</p>
                    ) : (
                      <ul className="space-y-4 flex-grow">{suggestionItems}</ul>
                    )}
                  </div>

                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
}
