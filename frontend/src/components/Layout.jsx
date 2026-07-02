import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  HelpCircle,
  FileText,
  Briefcase,
  Compass,
  LogOut,
  ShieldCheck,
  User
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/companies', label: 'Explore Companies', icon: Building2 },
    { path: '/experiences', label: 'Read Experiences', icon: MessageSquare },
    { path: '/mock-interview', label: 'Mock Interview', icon: HelpCircle },
    { path: '/resume-evaluator', label: 'Resume Reviewer', icon: FileText },
    { path: '/application-tracker', label: 'Application Tracker', icon: Briefcase },
    { path: '/roadmaps', label: 'Study Planner', icon: Compass },
    { path: '/profile', label: 'My Profile', icon: User }
  ];

  const sidebarLinks = [];
  for (let i = 0; i < navItems.length; i++) {
    const item = navItems[i];
    const IconComponent = item.icon;
    const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

    sidebarLinks.push(
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <IconComponent className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* TOP NAVBAR */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 flex items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold text-slate-900 tracking-tight">PlaceMentor</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-650 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <User className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-medium">{user?.name}</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 px-2 py-1.5 rounded transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* CORE SIDEBAR + CONTENT CONTAINER */}
      <div className="flex flex-1 flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden">
        {/* SIDEBAR PANEL */}
        <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-1 shrink-0 overflow-y-auto">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-3 mb-2 hidden md:block">
            Student Platform
          </div>
          <nav className="flex flex-col gap-1.5">
            {sidebarLinks}
          </nav>
        </aside>

        {/* MAIN DISPLAY AREA */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
