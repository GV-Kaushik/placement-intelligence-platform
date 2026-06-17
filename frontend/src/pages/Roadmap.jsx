import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  Sparkles,
  Trash2,
  Plus,
  Calendar,
  BookOpen,
  CheckSquare,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import api from "../services/api";

export default function Roadmap() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- STATE VARIABLES ---
  const [roadmaps, setRoadmaps] = useState([]);
  const [activeRoadmap, setActiveRoadmap] = useState(null);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [daysAvailable, setDaysAvailable] = useState("30");

  // App states
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Checkbox progress state
  // Key: "roadmap_id", Value: Array of checked topic keys (e.g. "weekIndex-topicIndex")
  const [checkedTopics, setCheckedTopics] = useState({});

  // --- 1. LOAD ROADMAPS HISTORY ON PAGE MOUNT ---
  useEffect(
    function () {
      fetchRoadmapsHistory();
      // Default the target company to user's preferred company if available
      if (user && user.target_company) {
        setCompanyName(user.target_company);
      }
    },
    [user],
  );

  // Fetch all roadmaps for the logged-in user
  async function fetchRoadmapsHistory() {
    setLoadingHistory(true);
    setError("");
    try {
      const res = await api.get("/roadmaps");
      setRoadmaps(res.data.roadmaps);

      // If there are roadmaps and no active roadmap is selected, default to the latest one
      if (res.data.roadmaps.length > 0 && !activeRoadmap) {
        selectRoadmap(res.data.roadmaps[0]);
      }
    } catch (err) {
      console.error("Failed to load roadmap history:", err);
      setError("Could not retrieve your study roadmaps history.");
    } finally {
      setLoadingHistory(false);
    }
  }

  // --- 2. SELECT & LOAD A ROADMAP ---
  function selectRoadmap(roadmap) {
    setActiveRoadmap(roadmap);
    setError("");
    setSuccess("");

    // Load checkbox states from localStorage for this specific roadmap
    if (roadmap && roadmap.id) {
      const stored = localStorage.getItem(`roadmap_progress_${roadmap.id}`);
      if (stored) {
        try {
          setCheckedTopics(function (prev) {
            return {
              ...prev,
              [roadmap.id]: JSON.parse(stored),
            };
          });
        } catch (e) {
          console.error("Failed to parse stored roadmap progress:", e);
        }
      } else {
        // Initialize as empty list for this roadmap if nothing stored
        setCheckedTopics(function (prev) {
          if (prev[roadmap.id]) return prev;
          return {
            ...prev,
            [roadmap.id]: [],
          };
        });
      }
    }
  }

  // --- 3. TOGGLE TOPIC CHECKBOX ---
  function handleToggleTopic(roadmapId, weekIndex, topicIndex) {
    const topicKey = `${weekIndex}-${topicIndex}`;

    setCheckedTopics(function (prev) {
      const currentList = prev[roadmapId] || [];
      let newList;

      if (currentList.includes(topicKey)) {
        // Uncheck it: filter out of the array
        newList = [];
        for (let i = 0; i < currentList.length; i++) {
          if (currentList[i] !== topicKey) {
            newList.push(currentList[i]);
          }
        }
      } else {
        // Check it: add to array
        newList = [...currentList, topicKey];
      }

      // Save updated array to localStorage
      localStorage.setItem(
        `roadmap_progress_${roadmapId}`,
        JSON.stringify(newList),
      );

      return {
        ...prev,
        [roadmapId]: newList,
      };
    });
  }

  // --- 4. GENERATE NEW ROADMAP ---
  async function handleGenerateRoadmap(e) {
    e.preventDefault();
    if (!companyName.trim()) {
      setError("Please specify a target company.");
      return;
    }

    const days = parseInt(daysAvailable, 10);
    if (isNaN(days) || days <= 0) {
      setError("Please enter a valid number of days.");
      return;
    }

    setGenerating(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/roadmaps", {
        target_company: companyName,
        days_available: days,
      });

      const newRoadmap = res.data.roadmap;

      // Append to the list of roadmaps in history
      setRoadmaps(function (prev) {
        return [newRoadmap, ...prev];
      });

      // Set as active
      selectRoadmap(newRoadmap);
      setSuccess(`Successfully generated study roadmap for ${companyName}!`);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to generate study roadmap. Please try again.",
      );
    } finally {
      setGenerating(false);
    }
  }

  // --- 5. DELETE A ROADMAP ---
  async function handleDeleteRoadmap(e, roadmapId) {
    e.stopPropagation(); // Stop click from triggering parent selectRoadmap
    if (
      !window.confirm("Are you sure you want to delete this study roadmap?")
    ) {
      return;
    }

    setDeletingId(roadmapId);
    setError("");

    try {
      await api.delete(`/roadmaps/${roadmapId}`);

      // Remove from localStorage progress tracker
      localStorage.removeItem(`roadmap_progress_${roadmapId}`);

      // Filter out of current state list
      const updatedList = [];
      for (let i = 0; i < roadmaps.length; i++) {
        if (roadmaps[i].id !== roadmapId) {
          updatedList.push(roadmaps[i]);
        }
      }
      setRoadmaps(updatedList);

      // If active roadmap was deleted, select next one or set to null
      if (activeRoadmap && activeRoadmap.id === roadmapId) {
        if (updatedList.length > 0) {
          selectRoadmap(updatedList[0]);
        } else {
          setActiveRoadmap(null);
        }
      }
      setSuccess("Roadmap deleted successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to delete study roadmap.");
    } finally {
      setDeletingId(null);
    }
  }

  // --- PROGRESS CALCULATIONS ---
  function getProgressStats(roadmap) {
    if (!roadmap || !roadmap.roadmap_data)
      return { total: 0, completed: 0, percent: 0 };

    let totalTopics = 0;
    const roadmapId = roadmap.id;
    const activeChecked = checkedTopics[roadmapId] || [];

    // Loop through weeks and topics to find total number of topics
    const data = roadmap.roadmap_data;
    for (let w = 0; w < data.length; w++) {
      const week = data[w];
      if (week.topics) {
        totalTopics = totalTopics + week.topics.length;
      }
    }

    const completed = activeChecked.length;
    const percent =
      totalTopics > 0 ? Math.round((completed / totalTopics) * 100) : 0;

    return { total: totalTopics, completed, percent };
  }

  const { total, completed, percent } = getProgressStats(activeRoadmap);

  // --- BUILD STUDY HISTORY ELEMENTS USING A LOOP ---
  const roadmapHistoryElements = [];
  for (let i = 0; i < roadmaps.length; i++) {
    const rm = roadmaps[i];
    const isSelected = activeRoadmap && activeRoadmap.id === rm.id;
    const stats = getProgressStats(rm);

    roadmapHistoryElements.push(
      <div
        key={rm.id}
        onClick={function () {
          selectRoadmap(rm);
        }}
        className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer flex justify-between items-center group ${
          isSelected
            ? "bg-slate-800 border-indigo-500 text-white"
            : "bg-slate-950 border-slate-850 hover:bg-slate-850 text-slate-300"
        }`}
      >
        <div className="min-w-0 pr-2">
          <p className="font-semibold text-sm truncate">{rm.target_company}</p>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>{rm.days_available} Days</span>
            <span>•</span>
            <span className={stats.percent === 100 ? "text-emerald-400" : ""}>
              {stats.percent}% done
            </span>
          </div>
        </div>

        <button
          disabled={deletingId === rm.id}
          onClick={function (e) {
            handleDeleteRoadmap(e, rm.id);
          }}
          className="text-slate-500 hover:text-red-400 p-1.5 rounded transition-colors"
          title="Delete roadmap"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>,
    );
  }

  // --- BUILD WEEK ELEMENTS USING A NESTED LOOP ---
  const weekElements = [];
  if (activeRoadmap && activeRoadmap.roadmap_data) {
    const data = activeRoadmap.roadmap_data;
    for (let weekIndex = 0; weekIndex < data.length; weekIndex++) {
      const week = data[weekIndex];

      const topicElements = [];
      if (week.topics) {
        for (
          let topicIndex = 0;
          topicIndex < week.topics.length;
          topicIndex++
        ) {
          const topic = week.topics[topicIndex];
          const topicKey = `${weekIndex}-${topicIndex}`;
          const isChecked = (checkedTopics[activeRoadmap.id] || []).includes(
            topicKey,
          );

          // Construct dynamic Google Search link or direct URL
          const searchQuery = topic.resource
            ? `${topic.name} ${topic.resource}`
            : topic.name;
          const isDirectLink =
            topic.resource &&
            (topic.resource.startsWith("http://") ||
              topic.resource.startsWith("https://"));
          const resourceUrl = isDirectLink
            ? topic.resource
            : `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

          topicElements.push(
            <div
              key={topicIndex}
              className={`p-4 rounded-lg border transition-all ${
                isChecked
                  ? "bg-slate-950/40 border-slate-850 opacity-70"
                  : "bg-slate-950 border-slate-850 hover:border-slate-800"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox wrapper */}
                <div className="pt-1">
                  <input
                    type="checkbox"
                    id={`topic-${weekIndex}-${topicIndex}`}
                    checked={isChecked}
                    onChange={function () {
                      handleToggleTopic(
                        activeRoadmap.id,
                        weekIndex,
                        topicIndex,
                      );
                    }}
                    className="h-5 w-5 bg-slate-900 border-slate-800 rounded text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 focus:ring-offset-2 transition-all cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Topic contents */}
                <div className="flex-grow min-w-0">
                  <label
                    htmlFor={`topic-${weekIndex}-${topicIndex}`}
                    className={`font-semibold text-sm cursor-pointer select-none ${
                      isChecked
                        ? "text-slate-400 line-through"
                        : "text-slate-200"
                    }`}
                  >
                    {topic.name}
                  </label>

                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    {topic.description}
                  </p>

                  {/* Resource Link */}
                  {topic.resource && (
                    <div className="mt-2.5">
                      <a
                        href={resourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Reference: {topic.resource}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>,
          );
        }
      }

      weekElements.push(
        <div
          key={weekIndex}
          className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-sm relative overflow-hidden"
        >
          {/* Visual accent left line */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>

          {/* Week Title & Details */}
          <div className="border-b border-slate-850 pb-4 mb-4">
            <h3 className="text-lg font-bold text-slate-100">
              Week {week.week || weekIndex + 1}:{" "}
              {week.title || "Placement Syllabus"}
            </h3>
            {week.milestone && (
              <div className="mt-2 bg-indigo-950/30 border border-indigo-900/60 rounded px-3 py-1.5 text-xs text-indigo-300 font-medium inline-block">
                🏁 Weekly Goal: {week.milestone}
              </div>
            )}
          </div>

          {/* Topic Checkboxes */}
          <div className="space-y-4">{topicElements}</div>
        </div>,
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* --- HEADER NAVBAR --- */}
      <nav className="border-b border-slate-800 bg-slate-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-slate-300 hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-semibold text-sm">Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
              <span className="text-lg font-bold">AI Study Roadmap</span>
            </div>
            <div className="w-10"></div> {/* Spacer for symmetry */}
          </div>
        </div>
      </nav>

      {/* --- MAIN PAGE GRID --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        {/* Alerts for messages */}
        {error && (
          <div className="mb-6 bg-red-950/50 border border-red-800 text-red-300 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-emerald-950/50 border border-emerald-800 text-emerald-300 p-4 rounded-lg flex items-center gap-3">
            <CheckSquare className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <p className="text-sm">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* --- LEFT SIDEBAR: ROADMAP HISTORY --- */}
          <div className="lg:col-span-1 space-y-6">
            {/* Create New Button */}
            <button
              onClick={function () {
                setActiveRoadmap(null);
                setError("");
                setSuccess("");
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border border-indigo-500 shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Roadmap</span>
            </button>

            {/* Previous Roadmaps Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-400" />
                <span>Study History</span>
              </h3>

              {loadingHistory ? (
                <div className="text-slate-500 text-sm py-4 text-center">
                  Loading list...
                </div>
              ) : roadmaps.length === 0 ? (
                <div className="text-slate-500 text-sm py-6 text-center">
                  No roadmaps generated yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {roadmapHistoryElements}
                </div>
              )}
            </div>
          </div>

          {/* --- RIGHT PANEL: FORM OR ROADMAP TIMELINE --- */}
          <div className="lg:col-span-3">
            {!activeRoadmap ? (
              /* --- STATE A: GENERATION FORM --- */
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 md:p-8 shadow-lg max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-indigo-900/40 border border-indigo-800 rounded-lg text-indigo-400">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">AI Study Planner</h2>
                    <p className="text-sm text-slate-400">
                      Input your target company and prepare a customized
                      day-by-day technical curriculum.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleGenerateRoadmap} className="space-y-6">
                  {/* Target Company Input */}
                  <div>
                    <label
                      htmlFor="companyName"
                      className="block text-sm font-semibold text-slate-300 mb-2"
                    >
                      Target Company Name
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      placeholder="e.g. Google, Amazon, TCS, Infosys"
                      value={companyName}
                      onChange={function (e) {
                        setCompanyName(e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1.5">
                      Gemini compiles topics based on company-specific patterns
                      and questions.
                    </p>
                  </div>

                  {/* Timeline Choice */}
                  <div>
                    <label
                      htmlFor="daysAvailable"
                      className="block text-sm font-semibold text-slate-300 mb-2"
                    >
                      Preparation Time Limit (in Days)
                    </label>
                    <input
                      id="daysAvailable"
                      type="number"
                      min="7"
                      max="180"
                      value={daysAvailable}
                      onChange={function (e) {
                        setDaysAvailable(e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1.5">
                      Provide between 7 and 180 days. Plans are structured in
                      week-long modules.
                    </p>
                  </div>

                  {/* Form Actions */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={generating}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:bg-slate-800 disabled:text-slate-500 border border-indigo-500 shadow-lg"
                    >
                      {generating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-400 border-t-transparent"></div>
                          <span>Consulting Gemini AI...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>Generate Custom Study Plan</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* --- STATE B: ROADMAP DETAILS & TIMELINE DISPLAY --- */
              <div className="space-y-6">
                {/* Roadmap Information Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-white">
                        {activeRoadmap.target_company} Study Plan
                      </h2>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">
                      Custom syllabus structured across{" "}
                      <span className="font-semibold text-indigo-400">
                        {activeRoadmap.days_available} days
                      </span>
                      .
                    </p>
                  </div>

                  {/* Circular/Linear Progress Summary */}
                  <div className="w-full md:w-64 flex flex-col gap-2 flex-shrink-0">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Progress</span>
                      </span>
                      <span className="font-bold text-indigo-300">
                        {completed}/{total} Topics Completed ({percent}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Timeline Week List */}
                <div className="space-y-6">{weekElements}</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
