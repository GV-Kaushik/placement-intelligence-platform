import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  Compass,
  Trash2,
  Plus,
  Calendar,
  BookOpen,
  CheckSquare,
  ExternalLink,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import api from "../services/api";
import Layout from "../components/Layout";

export default function Roadmap() {
  const { user } = useAuth();

  // --- STATE VARIABLES ---
  const [roadmaps, setRoadmaps] = useState([]); // Stores the list of previously generated preparation roadmaps from the database
  const [activeRoadmap, setActiveRoadmap] = useState(null); // Stores the currently selected active roadmap object (nested milestones, topics, resources) to view

  // Form states
  const [companyName, setCompanyName] = useState(""); // Stores the target company name input typed by the student (defaults to their user target company)
  const [daysAvailable, setDaysAvailable] = useState("30"); // Stores the duration of the roadmap (e.g. 30 days, 60 days, 90 days) select input

  // App states
  const [loadingHistory, setLoadingHistory] = useState(true); // Boolean flag to show loading spinner while fetching roadmap list on page load
  const [generating, setGenerating] = useState(false); // Boolean flag to show AI roadmap generation spinner and disable buttons during creation
  const [deletingId, setDeletingId] = useState(null); // Stores the roadmap ID currently undergoing deletion to show inline loaders
  const [error, setError] = useState(""); // Stores validation or backend generation error messages to display
  const [success, setSuccess] = useState(""); // Stores success message strings (e.g. "Roadmap generated successfully")

  // Checkbox progress state
  const [checkedTopics, setCheckedTopics] = useState({}); // Key-value map representing checkbox progress states (e.g. { "topic_id": true }) for tracking topic completion for all ROADMAPS

  // --- 1. LOAD ROADMAPS HISTORY ON PAGE MOUNT ---
  useEffect(
    function () {
      fetchRoadmapsHistory();
      if (user && user.target_company) {
        setCompanyName(user.target_company);
      }
    },
    [user],
  );

  async function fetchRoadmapsHistory() {
    setLoadingHistory(true);
    setError("");
    try {
      const res = await api.get("/roadmaps");
      setRoadmaps(res.data.roadmaps);

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
        newList = [];
        for (let i = 0; i < currentList.length; i++) {
          if (currentList[i] !== topicKey) {
            newList.push(currentList[i]);
          }
        }
      } else {
        newList = [...currentList, topicKey];
      }

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

      setRoadmaps(function (prev) {
        return [newRoadmap, ...prev];
      });

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
    e.stopPropagation();
    if (
      !window.confirm("Are you sure you want to delete this study roadmap?")
    ) {
      return;
    }

    setDeletingId(roadmapId);
    setError("");

    try {
      await api.delete(`/roadmaps/${roadmapId}`);
      localStorage.removeItem(`roadmap_progress_${roadmapId}`);

      const updatedList = [];
      for (let i = 0; i < roadmaps.length; i++) {
        if (roadmaps[i].id !== roadmapId) {
          updatedList.push(roadmaps[i]);
        }
      }
      setRoadmaps(updatedList);

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
            ? "bg-slate-100 border-slate-300 text-slate-900 font-semibold"
            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
        }`}
      >
        <div className="min-w-0 pr-2">
          <p className="font-bold text-xs truncate text-slate-800">
            {rm.target_company}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-450 mt-1">
            <span>{rm.days_available} Days</span>
            <span>•</span>
            <span
              className={
                stats.percent === 100
                  ? "text-emerald-600 font-bold"
                  : "font-medium"
              }
            >
              {stats.percent}% done
            </span>
          </div>
        </div>

        <button
          disabled={deletingId === rm.id}
          onClick={function (e) {
            handleDeleteRoadmap(e, rm.id);
          }}
          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
          title="Delete roadmap" // will be shown when we hoveron trash icon
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>,
    );
  }

  // Build week cards and topic checkboxes
  const weekElements = [];
  if (activeRoadmap && activeRoadmap.roadmap_data) {
    const data = activeRoadmap.roadmap_data;
    for (let weekIndex = 0; weekIndex < data.length; weekIndex++) {
      const week = data[weekIndex];

      const topicElements = [];
      if (week.topics) {
        for (let topicIndex = 0;topicIndex < week.topics.length;topicIndex++) {
          const topic = week.topics[topicIndex];
          const topicKey = `${weekIndex}-${topicIndex}`;
          const isChecked = (checkedTopics[activeRoadmap.id] || []).includes(
            topicKey,
          );

          // Build reference URL (direct link or Google search)
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
              className={`p-4 rounded-xl border transition-all flex items-start gap-3 ${
                isChecked
                  ? "bg-slate-50 border-slate-200 opacity-60"
                  : "bg-white border-slate-200 hover:border-slate-350"
              }`}
            >
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  id={`topic-${weekIndex}-${topicIndex}`}
                  checked={isChecked}
                  onChange={function () {
                    handleToggleTopic(activeRoadmap.id, weekIndex, topicIndex);
                  }}
                  className="h-4.5 w-4.5 bg-white border-slate-350 rounded text-blue-650 focus:ring-blue-600 transition-all cursor-pointer accent-blue-600"
                />
              </div>

              <div className="flex-grow min-w-0">
                <label
                  htmlFor={`topic-${weekIndex}-${topicIndex}`}
                  className={`font-bold text-sm cursor-pointer select-none ${
                    isChecked ? "text-slate-400 line-through" : "text-slate-800"
                  }`}
                >
                  {topic.name}
                </label>

                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  {topic.description}
                </p>

                {topic.resource && (
                  <div className="mt-2.5">
                    <a
                      href={resourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-605 hover:text-blue-700 font-bold transition-colors"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                      <span>Reference: {topic.resource}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>,
          );
        }
      }

      weekElements.push(
        <div
          key={weekIndex}
          className="bg-white border border-slate-200 rounded-xl p-6 relative overflow-hidden"
        >
          {/* Visual accent left line */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600"></div>

          {/* Week Title & Details */}
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Week {week.week || weekIndex + 1}:{" "}
              {week.title || "Placement Syllabus"}
            </h3>
            {week.milestone && (
              <div className="mt-2 bg-blue-50 border border-blue-100 rounded px-2.5 py-1 text-[10px] text-blue-700 font-bold inline-block">
                🏁 Goal: {week.milestone}
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
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-8 w-full">
        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg flex items-center gap-2.5 text-sm">
            <AlertCircle className="h-4.5 w-4.5 text-rose-600 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-250 text-emerald-700 p-4 rounded-lg flex items-center gap-2.5 text-sm">
            <CheckSquare className="h-4.5 w-4.5 text-emerald-650 flex-shrink-0" />
            <p>{success}</p>
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Roadmap</span>
            </button>

            {/* Previous Roadmaps Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Study History</span>
              </h3>

              {loadingHistory ? (
                <div className="text-slate-405 text-xs py-4 text-center italic">
                  Loading history...
                </div>
              ) : roadmaps.length === 0 ? (
                <div className="text-slate-405 text-xs py-6 text-center italic">
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
              <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 max-w-2xl">
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-655">
                    <Compass className="h-5.5 w-5.5 text-blue-605" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Study Planner
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Input your target company and prepare a customized
                      day-by-day technical curriculum.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleGenerateRoadmap} className="space-y-5">
                  {/* Target Company Input */}
                  <div>
                    <label
                      htmlFor="companyName"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-550 mb-1.5"
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
                      className="w-full bg-white border border-slate-350 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-4 py-2 text-slate-900 outline-none text-sm placeholder-slate-400 transition-colors"
                      required
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      System compiles topics based on company-specific patterns
                      and questions.
                    </p>
                  </div>

                  {/* Timeline Choice */}
                  <div>
                    <label
                      htmlFor="daysAvailable"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-550 mb-1.5"
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
                      className="w-full bg-white border border-slate-350 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-4 py-2 text-slate-900 outline-none text-sm placeholder-slate-400 transition-colors"
                      required
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      Provide between 7 and 180 days. Plans are structured in
                      week-long modules.
                    </p>
                  </div>

                  {/* Form Actions */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={generating}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 border border-blue-600 text-sm cursor-pointer"
                    >
                      {generating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Generating preparation plan...</span>
                        </>
                      ) : (
                        <>
                          <Compass className="h-4 w-4" />
                          <span>Generate Study Plan</span>
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
                <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {activeRoadmap.target_company} Study Plan
                    </h2>
                    <p className="text-slate-550 text-xs mt-1">
                      Custom syllabus structured across{" "}
                      <span className="font-semibold text-blue-600">
                        {activeRoadmap.days_available} days
                      </span>
                      .
                    </p>
                  </div>

                  {/* Progress Summary */}
                  <div className="w-full md:w-64 flex flex-col gap-2 flex-shrink-0">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-450 flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                        <span>Progress</span>
                      </span>
                      <span className="font-bold text-slate-655">
                        {completed}/{total} Topics Checked ({percent}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="bg-blue-600 h-full transition-all duration-300 rounded-full"
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
      </div>
    </Layout>
  );
}
