import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';

export default function ApplicationTracker() {
  // --- STATE VARIABLES ---
  const [applications, setApplications] = useState([]);  // Stores the list of student's job applications fetched from the database
  const [companies, setCompanies] = useState([]);        // Stores the list of all companies from the database to populate the dropdown selection
  const [loading, setLoading] = useState(false);          // Boolean flag to show loading spinner while fetching applications and companies
  const [submitting, setSubmitting] = useState(false);    // Boolean flag to show loading spinner/disabled button while submitting a new application
  const [error, setError] = useState('');                // Stores any error messages to show at the top of the tracker page
  const [filterStatus, setFilterStatus] = useState('All'); // Keeps track of active UI filter selection (All, Applied, Interviewing, Offered, Rejected)
  const [showAddForm, setShowAddForm] = useState(false);  // Boolean flag to toggle display of the "Add New Application" form popup card

  // --- FORM STATES ---
  const [selectedCompanyId, setSelectedCompanyId] = useState(''); // Stores the selected company ID from the new application creation dropdown
  const [role, setRole] = useState('');                           // Stores the job role text input (e.g. "Front-End Developer Intern")
  const [status, setStatus] = useState('Applied');               // Stores the initial job application status select input (Applied, etc.)

  // --- LOAD DATA ON MOUNT ---
  useEffect(function() {
    fetchApplications();
    fetchCompanies();
  }, []);

  async function fetchApplications() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/applications');
      setApplications(res.data.applications || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
      setError('Failed to fetch job applications.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCompanies() {
    try {
      const res = await api.get('/companies');
      setCompanies(res.data.companies || []);
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  }

  // --- SUBMIT NEW APPLICATION ---
  async function handleAddApplication(e) {
    e.preventDefault();
    if (!selectedCompanyId || !role.trim()) {
      setError('Please select a company and enter a role.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/applications', {
        company_id: selectedCompanyId,
        role: role.trim(),
        status: status
      });

      const newApp = res.data.application;

      // Prepend to list (using loop to construct array)
      setApplications(function(prev) {
        const updated = [newApp];
        for (let i = 0; i < prev.length; i++) {
          updated.push(prev[i]);
        }
        return updated;
      });

      // Reset form states
      setSelectedCompanyId('');
      setRole('');
      setStatus('Applied');
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to add job application.');
    } finally {
      setSubmitting(false);
    }
  }

  // --- UPDATE APPLICATION STATUS ---
  async function handleStatusChange(id, newStatus) {
    try {
      const res = await api.put(`/applications/${id}`, { status: newStatus });
      const updatedApp = res.data.application;

      // Update application in state list
      setApplications(function(prev) {
        const updated = [];
        for (let i = 0; i < prev.length; i++) {
          if (prev[i].id === id) {
            // Update status while preserving company metadata
            updated.push({
              ...prev[i],
              status: updatedApp.status
            });
          } else {
            updated.push(prev[i]);
          }
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update application status.');
    }
  }

  // --- DELETE APPLICATION ---
  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this application?')) return;

    try {
      await api.delete(`/applications/${id}`);

      // Filter state array using loop
      setApplications(function(prev) {
        const updated = [];
        for (let i = 0; i < prev.length; i++) {
          if (prev[i].id !== id) {
            updated.push(prev[i]);
          }
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to delete application:', err);
      alert('Failed to delete application.');
    }
  }

  // --- RENDER DYNAMIC SELECT OPTIONS USING LOOPS ---
  const companyOptions = [
    <option key="default" value="">-- Select Company --</option>
  ];
  for (let i = 0; i < companies.length; i++) {
    companyOptions.push(
      <option key={companies[i].id} value={companies[i].id}>
        {companies[i].name}
      </option>
    );
  }

  // --- FILTER APPLICATIONS BY STATUS AND RENDER ROWS USING LOOPS ---
  const filteredApps = [];
  for (let i = 0; i < applications.length; i++) {
    const app = applications[i];
    if (filterStatus === 'All' || app.status === filterStatus) {
      filteredApps.push(app);
    }
  }

  const applicationRows = [];
  for (let i = 0; i < filteredApps.length; i++) {
    const app = filteredApps[i];
    const dateStr = new Date(app.applied_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    // Determine status badge classes
    let badgeColor = 'bg-slate-100 text-slate-750 border border-slate-205';
    if (app.status === 'OA') badgeColor = 'bg-blue-50 text-blue-700 border border-blue-200';
    if (app.status === 'Interviewing') badgeColor = 'bg-amber-50 text-amber-705 border border-amber-205';
    if (app.status === 'Selected') badgeColor = 'bg-emerald-50 text-emerald-705 border border-emerald-200';
    if (app.status === 'Rejected') badgeColor = 'bg-rose-50 text-rose-705 border border-rose-200';

    applicationRows.push(
      <div key={app.id} className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-slate-350 transition-colors">
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <Briefcase className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">{app.role}</h4>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span className="font-bold text-slate-600">{app.company_name}</span>
              <span>•</span>
              <span>Applied on {dateStr}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          {/* Status selector */}
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${badgeColor}`}>
              {app.status}
            </span>
            <select
              value={app.status}
              onChange={function(e) { handleStatusChange(app.id, e.target.value); }}
              className="bg-white border border-slate-300 text-[11px] font-semibold text-slate-600 rounded px-2.5 py-1 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="Applied">Applied</option>
              <option value="OA">OA</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <button
            onClick={function() { handleDelete(app.id); }}
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors border border-transparent hover:border-rose-100 hover:bg-rose-50 cursor-pointer"
            title="Delete Application"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER FILTER TAB BUTTONS USING LOOPS ---
  const filterTabs = ['All', 'Applied', 'OA', 'Interviewing', 'Selected', 'Rejected'];
  const filterTabElements = [];
  for (let i = 0; i < filterTabs.length; i++) {
    const tab = filterTabs[i];
    const isActive = filterStatus === tab;
    filterTabElements.push(
      <button
        key={tab}
        onClick={function() { setFilterStatus(tab); }}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
          isActive
            ? 'bg-blue-600 border-blue-600 text-white'
            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-350'
        }`}
      >
        {tab}
      </button>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-8 w-full flex-grow flex flex-col">

        {/* TOP ROW: title + Add Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 tracking-tight">
              <FolderOpen className="h-6 w-6 text-blue-600" />
              <span>Job Applications</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">Track interview stages and offers in one unified dashboard.</p>
          </div>

          <button
            onClick={function() { setShowAddForm(!showAddForm); }}
            className="flex items-center gap-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Application</span>
          </button>
        </div>

        {/* ERROR BOX */}
        {error && (
          <div className="mb-6 flex items-center gap-2.5 text-rose-700 text-xs border border-rose-250 bg-rose-50 px-3 py-2 rounded-lg">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* ADD APPLICATION CARD (COLLAPSIBLE FORM) */}
        {showAddForm && (
          <div className="mb-6 bg-white border border-slate-200 p-6 rounded-xl">
            <h3 className="text-xs font-bold text-slate-500 mb-4 border-b border-slate-100 pb-2 uppercase tracking-wider">Add New Application</h3>
            <form onSubmit={handleAddApplication} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1.5">Company</label>
                <select
                  value={selectedCompanyId}
                  onChange={function(e) { setSelectedCompanyId(e.target.value); }}
                  className="w-full bg-white border border-slate-350 text-sm rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 transition-colors"
                >
                  {companyOptions}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1.5">Role / Position</label>
                <input
                  type="text"
                  placeholder="e.g. SDE Intern"
                  value={role}
                  onChange={function(e) { setRole(e.target.value); }}
                  className="w-full bg-white border border-slate-350 text-sm rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-grow">
                  <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1.5">Initial Status</label>
                  <select
                    value={status}
                    onChange={function(e) { setStatus(e.target.value); }}
                    className="w-full bg-white border border-slate-350 text-sm rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 transition-colors"
                  >
                    <option value="Applied">Applied</option>
                    <option value="OA">OA</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Selected">Selected</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 border border-blue-600"
                >
                  {submitting ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STATUS FILTER TABS */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filterTabElements}
        </div>

        {/* APPLICATIONS LIST */}
        {loading ? (
          <div className="flex justify-center py-20 flex-grow">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        ) : applicationRows.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-xl flex-grow flex flex-col justify-center items-center">
            <Briefcase className="h-12 w-12 text-slate-300 mb-4 animate-pulse" />
            <p className="text-slate-800 font-bold text-sm">No job applications logged.</p>
            <p className="text-slate-505 text-xs mt-1">
              {filterStatus === 'All' ? 'Click "Add Application" above to track your first target job.' : `No applications found with status "${filterStatus}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applicationRows}
          </div>
        )}

      </div>
    </Layout>
  );
}
