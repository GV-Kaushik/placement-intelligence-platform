import React, { useState, useEffect } from 'react';
import { 
  User, 
  GraduationCap, 
  Code2, 
  Check, 
  Save, 
  RefreshCw, 
  AlertCircle,
  Trophy,
  BookOpen,
  Edit,
  X
} from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';

// Inline brand icon fallbacks since they are missing from this lucide-react version
const Github = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function Profile() {
  // --- STATE VARIABLES ---
  const [profile, setProfile] = useState({
    college_name: '',             // Stores the student's college name (e.g. "IIT Bombay")
    cgpa: '',                     // Stores the student's graduation CGPA (e.g. "8.5")
    graduation_year: '',          // Stores the student's graduation year (e.g. "2026")
    github_url: '',               // Stores the student's GitHub profile link
    linkedin_url: ''              // Stores the student's LinkedIn profile link
  });
  
  // Handles
  const [lcUsername, setLcUsername] = useState('');   // Stores the student's LeetCode username handle (for live statistic fetching)
  const [cfUsername, setCfUsername] = useState('');   // Stores the student's Codeforces username handle
  const [gfgUsername, setGfgUsername] = useState(''); // Stores the student's GeeksForGeeks username handle
  
  // Platform stats display
  const [platformStats, setPlatformStats] = useState([]); // Stores the synced coding platform results (solved counts) fetched from the backend database
  
  // Skills lists
  const [allSkills, setAllSkills] = useState([]);             // Stores the master list of all available tech skills fetched from the server
  const [selectedSkillIds, setSelectedSkillIds] = useState([]); // Stores the list of skill IDs selected/checked by the student

  // Loaders and errors
  const [loading, setLoading] = useState(true);          // Boolean flag to show loading spinner while retrieving profile, stats, and skills on mount
  const [saving, setSaving] = useState(false);            // Boolean flag to show loading spinner / disable save button while updating profile details
  const [error, setError] = useState('');                // Stores profile validation or API error messages to display
  const [success, setSuccess] = useState('');            // Stores success feedback messages (e.g. "Profile updated successfully")
  const [isEditing, setIsEditing] = useState(false);      // Boolean flag that toggles the UI between read-only View Mode (false) and form Edit Mode (true)

  // --- LOAD DATA ON MOUNT ---
  useEffect(() => {
    fetchProfileAndSkills();
  }, []);

  async function fetchProfileAndSkills() {
    setLoading(true);
    setError('');
    try {
      // 1. Get Master Skills List
      const skillsRes = await api.get('/auth/skills');
      setAllSkills(skillsRes.data.skills || []);

      // 2. Get User Profile Data
      const profileRes = await api.get('/auth/profile');
      
      if (profileRes.data.profile) {
        setProfile({
          college_name: profileRes.data.profile.college_name || '',
          cgpa: profileRes.data.profile.cgpa || '',
          graduation_year: profileRes.data.profile.graduation_year || '',
          github_url: profileRes.data.profile.github_url || '',
          linkedin_url: profileRes.data.profile.linkedin_url || ''
        });
      }

      // Populate platform usernames
      const stats = profileRes.data.platformStats || [];
      setPlatformStats(stats);
      for (let i = 0; i < stats.length; i++) {
        if (stats[i].platform_name === 'LeetCode') setLcUsername(stats[i].username || '');
        if (stats[i].platform_name === 'Codeforces') setCfUsername(stats[i].username || '');
        if (stats[i].platform_name === 'GeeksforGeeks') setGfgUsername(stats[i].username || '');
      }

      // Populate user's skills
      const userSkills = profileRes.data.skills || [];
      const userSkillIds = [];
      for (let i = 0; i < userSkills.length; i++) {
        userSkillIds.push(userSkills[i].id);
      }
      setSelectedSkillIds(userSkillIds);

    } catch (err) {
      console.error(err);
      setError('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  }

  // --- TOGGLE SKILL ---
  function handleToggleSkill(skillId) {
    setSelectedSkillIds(function(prev) {
      if (prev.includes(skillId)) {
        const updated = [];
        for (let i = 0; i < prev.length; i++) {
          if (prev[i] !== skillId) {
            updated.push(prev[i]);
          }
        }
        return updated;
      } else {
        return [...prev, skillId];
      }
    });
  }

  // --- SAVE PROFILE ---
  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    // Prepare platform stats array for database
    const statsPayload = [];
    if (lcUsername.trim()) {
      // Find existing LC entry if any
      const existing = findStatsByPlatform('LeetCode');
      statsPayload.push({
        platform_name: 'LeetCode',
        username: lcUsername.trim(),
        solved_count: existing ? existing.solved_count : null
      });
    }
    if (cfUsername.trim()) {
      const existing = findStatsByPlatform('Codeforces');
      statsPayload.push({
        platform_name: 'Codeforces',
        username: cfUsername.trim(),
        solved_count: existing ? existing.solved_count : null
      });
    }
    if (gfgUsername.trim()) {
      const existing = findStatsByPlatform('GeeksforGeeks');
      statsPayload.push({
        platform_name: 'GeeksforGeeks',
        username: gfgUsername.trim(),
        solved_count: existing ? existing.solved_count : null
      });
    }

    try {
      await api.put('/auth/profile', {
        profile: {
          college_name: profile.college_name,
          cgpa: profile.cgpa ? parseFloat(profile.cgpa) : null,
          graduation_year: profile.graduation_year ? parseInt(profile.graduation_year, 10) : null,
          github_url: profile.github_url,
          linkedin_url: profile.linkedin_url
        },
        platformStats: statsPayload,
        skillIds: selectedSkillIds
      });

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      // Reload stats from backend to get generated mock rating/counts
      const updatedProfile = await api.get('/auth/profile');
      setPlatformStats(updatedProfile.data.platformStats || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  function findStatsByPlatform(platform) {
    for (let i = 0; i < platformStats.length; i++) {
      if (platformStats[i].platform_name === platform) {
        return platformStats[i];
      }
    }
    return null;
  }

  // Group skill checkboxes by category
  const dsaCheckboxes = [];
  const coreCheckboxes = [];
  const devCheckboxes = [];

  for (let i = 0; i < allSkills.length; i++) {
    const skill = allSkills[i];
    const isChecked = selectedSkillIds.includes(skill.id);
    const element = (
      <label 
        key={skill.id} 
        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer select-none ${
          isChecked 
            ? 'bg-blue-50 border-blue-200 text-blue-700' 
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        <input 
          type="checkbox"
          checked={isChecked}
          onChange={function() { handleToggleSkill(skill.id); }}
          className="hidden"
        />
        <div className={`h-4 w-4 rounded flex items-center justify-center border shrink-0 ${
          isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-350'
        }`}>
          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
        </div>
        <span>{skill.name}</span>
      </label>
    );

    if (skill.category === 'DSA') dsaCheckboxes.push(element);
    else if (skill.category === 'CS Core') coreCheckboxes.push(element);
    else devCheckboxes.push(element);
  }

  // Render platform stats cards
  const statsCards = [];
  for (let i = 0; i < platformStats.length; i++) {
    const stat = platformStats[i];
    statsCards.push(
      <div key={stat.platform_name} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800">{stat.platform_name}</h4>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">Username: {stat.username}</p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Solved</span>
            <p className="text-sm font-bold text-slate-900">{stat.solved_count} Questions</p>
          </div>
          
        </div>
      </div>
    );
  }

  // --- RENDER SKILLS BADGES FOR VIEW MODE ---
  const viewDsaBadges = [];
  const viewCoreBadges = [];
  const viewDevBadges = [];

  for (let i = 0; i < allSkills.length; i++) {
    const skill = allSkills[i];
    const isChecked = selectedSkillIds.includes(skill.id);
    if (isChecked) {
      const element = (
        <span 
          key={skill.id} 
          className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold"
        >
          {skill.name}
        </span>
      );
      if (skill.category === 'DSA') viewDsaBadges.push(element);
      else if (skill.category === 'CS Core') viewCoreBadges.push(element);
      else viewDevBadges.push(element);
    }
  }
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-8 w-full">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <User className="h-6 w-6 text-blue-600" />
              <span>Student Profile</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">Manage your educational information, coding handles, and skills dashboard.</p>
          </div>
          {!isEditing && (
            <button
              onClick={function() { setIsEditing(true); setSuccess(''); setError(''); }}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg flex items-center gap-2.5 text-sm">
            <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-250 text-emerald-700 p-4 rounded-lg flex items-center gap-2.5 text-sm">
            <Check className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        ) : isEditing ? (
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* 1. STUDENT DETAILS */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl">
              <h2 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <GraduationCap className="h-4.5 w-4.5 text-blue-600" />
                <span>Academic & Professional Details</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1.5">College Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. National Institute of Technology"
                    value={profile.college_name}
                    onChange={function(e) { setProfile({...profile, college_name: e.target.value}); }}
                    className="w-full bg-white border border-slate-350 text-sm rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1.5">CGPA</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="e.g. 9.15"
                    value={profile.cgpa}
                    onChange={function(e) { setProfile({...profile, cgpa: e.target.value}); }}
                    className="w-full bg-white border border-slate-350 text-sm rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1.5">Graduation Year</label>
                  <input 
                    type="number"
                    placeholder="e.g. 2026"
                    value={profile.graduation_year}
                    onChange={function(e) { setProfile({...profile, graduation_year: e.target.value}); }}
                    className="w-full bg-white border border-slate-350 text-sm rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 transition-colors"
                  />
                </div>

                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1.5 flex items-center gap-1">
                      <Github className="h-3 w-3 text-slate-400" />
                      <span>GitHub Profile Link</span>
                    </label>
                    <input 
                      type="url"
                      placeholder="https://github.com/your-username"
                      value={profile.github_url}
                      onChange={function(e) { setProfile({...profile, github_url: e.target.value}); }}
                      className="w-full bg-white border border-slate-350 text-sm rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1.5 flex items-center gap-1">
                      <Linkedin className="h-3 w-3 text-slate-400" />
                      <span>LinkedIn Profile Link</span>
                    </label>
                    <input 
                      type="url"
                      placeholder="https://linkedin.com/in/your-username"
                      value={profile.linkedin_url}
                      onChange={function(e) { setProfile({...profile, linkedin_url: e.target.value}); }}
                      className="w-full bg-white border border-slate-350 text-sm rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CODING PLATFORMS */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl">
              <h2 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <Code2 className="h-4.5 w-4.5 text-blue-600" />
                <span>Coding Platform Handles</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1.5">LeetCode Handle</label>
                  <input 
                    type="text"
                    placeholder="LeetCode username"
                    value={lcUsername}
                    onChange={function(e) { setLcUsername(e.target.value); }}
                    className="w-full bg-white border border-slate-350 text-sm rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1.5">Codeforces Handle</label>
                  <input 
                    type="text"
                    placeholder="Codeforces username"
                    value={cfUsername}
                    onChange={function(e) { setCfUsername(e.target.value); }}
                    className="w-full bg-white border border-slate-350 text-sm rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1.5">GeeksforGeeks Handle</label>
                  <input 
                    type="text"
                    placeholder="GFG username"
                    value={gfgUsername}
                    onChange={function(e) { setGfgUsername(e.target.value); }}
                    className="w-full bg-white border border-slate-350 text-sm rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>

              {/* Stats Cards Display */}
              {statsCards.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-blue-600" />
                    <span>Synchronized Platform Stats</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {statsCards}
                  </div>
                </div>
              )}
            </div>

            {/* 3. SKILLS SELECTION */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl">
              <h2 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <BookOpen className="h-4.5 w-4.5 text-blue-600" />
                <span>Target Skill Matrix</span>
              </h2>

              <div className="space-y-5">
                {/* DSA */}
                {dsaCheckboxes.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Data Structures & Algorithms</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {dsaCheckboxes}
                    </div>
                  </div>
                )}

                {/* CS Core */}
                {coreCheckboxes.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">CS Core Subjects</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {coreCheckboxes}
                    </div>
                  </div>
                )}

                {/* Development */}
                {devCheckboxes.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Software Development</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {devCheckboxes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save & Cancel Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={function() { fetchProfileAndSkills(); setIsEditing(false); }}
                className="py-2.5 px-6 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold text-xs rounded-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                disabled={saving}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Profile Settings</span>
                  </>
                )}
              </button>
            </div>

          </form>
        ) : (
          /* VIEW MODE VIEW */
          <div className="space-y-6">
            
            {/* 1. STUDENT DETAILS */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl">
              <h2 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <GraduationCap className="h-4.5 w-4.5 text-blue-600" />
                <span>Academic & Professional Details</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-3">
                  <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">College Name</span>
                  <p className="text-sm font-bold text-slate-800">{profile.college_name || <span className="text-slate-400 font-normal italic">Not specified</span>}</p>
                </div>

                <div>
                  <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">CGPA</span>
                  <p className="text-sm font-bold text-slate-800">{profile.cgpa ? `${profile.cgpa} / 10.00` : <span className="text-slate-400 font-normal italic">Not specified</span>}</p>
                </div>

                <div>
                  <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Graduation Year</span>
                  <p className="text-sm font-bold text-slate-800">{profile.graduation_year || <span className="text-slate-400 font-normal italic">Not specified</span>}</p>
                </div>

                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
                  <div>
                    <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1">
                      <Github className="h-3.5 w-3.5 text-slate-400" />
                      <span>GitHub Profile</span>
                    </span>
                    {profile.github_url ? (
                      <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:underline break-all">
                        {profile.github_url}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Not connected</span>
                    )}
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1">
                      <Linkedin className="h-3.5 w-3.5 text-slate-400" />
                      <span>LinkedIn Profile</span>
                    </span>
                    {profile.linkedin_url ? (
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:underline break-all">
                        {profile.linkedin_url}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Not connected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CODING PLATFORMS */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl">
              <h2 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <Code2 className="h-4.5 w-4.5 text-blue-600" />
                <span>Coding Platform Profiles</span>
              </h2>

              {/* Handles View */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg">
                  <span className="block text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">LeetCode</span>
                  <p className="text-xs font-bold text-slate-800">{lcUsername || <span className="text-slate-400 font-normal italic">Not configured</span>}</p>
                </div>
                <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg">
                  <span className="block text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Codeforces</span>
                  <p className="text-xs font-bold text-slate-800">{cfUsername || <span className="text-slate-400 font-normal italic">Not configured</span>}</p>
                </div>
                <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg">
                  <span className="block text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">GeeksforGeeks</span>
                  <p className="text-xs font-bold text-slate-800">{gfgUsername || <span className="text-slate-400 font-normal italic">Not configured</span>}</p>
                </div>
              </div>

              {/* Stats Cards Display */}
              {statsCards.length > 0 ? (
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-blue-600" />
                    <span>Synchronized Platform Stats</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {statsCards}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No synchronized platform stats found. Add your handles and save to sync stats.</p>
              )}
            </div>

            {/* 3. SKILLS MATRIX */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl">
              <h2 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <BookOpen className="h-4.5 w-4.5 text-blue-600" />
                <span>Target Skill Matrix</span>
              </h2>

              <div className="space-y-5">
                {/* DSA */}
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Data Structures & Algorithms</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewDsaBadges.length > 0 ? viewDsaBadges : <span className="text-xs text-slate-400 italic">None selected</span>}
                  </div>
                </div>

                {/* CS Core */}
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">CS Core Subjects</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewCoreBadges.length > 0 ? viewCoreBadges : <span className="text-xs text-slate-400 italic">None selected</span>}
                  </div>
                </div>

                {/* Development */}
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Software Development</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewDevBadges.length > 0 ? viewDevBadges : <span className="text-xs text-slate-400 italic">None selected</span>}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </Layout>
  );
}
