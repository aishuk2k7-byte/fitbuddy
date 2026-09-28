import React from 'react';
import {
  Dumbbell,
  Sparkles,
  Database,
  Apple,
  CheckCircle2,
  Code2,
  User,
  Plus,
} from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  activeTab: 'plan' | 'nutrition' | 'tracker' | 'sqlite' | 'api';
  setActiveTab: (tab: 'plan' | 'nutrition' | 'tracker' | 'sqlite' | 'api') => void;
  users: UserProfile[];
  currentUser: UserProfile | null;
  onSelectUser: (user: UserProfile) => void;
  onNewUser: () => void;
  sqliteConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  users,
  currentUser,
  onSelectUser,
  onNewUser,
  sqliteConnected,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Dumbbell className="w-5 h-5 text-slate-950 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  FitBuddy
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> AI Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Personalized Workout &amp; Nutrition Intelligence
              </p>
            </div>
          </div>

          {/* User Profile Switcher */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1 text-xs">
              <div className="flex items-center gap-2 px-2.5 py-1 text-slate-300">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline font-medium text-slate-400">Profile:</span>
                <select
                  value={currentUser?.id || ''}
                  onChange={(e) => {
                    const selected = users.find((u) => u.id === e.target.value);
                    if (selected) onSelectUser(selected);
                  }}
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer max-w-[120px] truncate"
                >
                  {users.length === 0 && <option value="">No profiles yet</option>}
                  {users.map((u) => (
                    <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                      {u.name} ({u.goal.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={onNewUser}
                title="Create New Profile"
                className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 transition-all font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* SQLite Status Indicator */}
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300"
              title="SQLite database active at fitbuddy.db"
            >
              <Database className={`w-3.5 h-3.5 ${sqliteConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span>SQLite</span>
              <span className={`w-1.5 h-1.5 rounded-full ${sqliteConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800/60 no-scrollbar">
          <button
            onClick={() => setActiveTab('plan')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'plan'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            7-Day Workout Plan
          </button>

          <button
            onClick={() => setActiveTab('nutrition')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'nutrition'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            Nutrition &amp; Recovery
          </button>

          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'tracker'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Workout Tracker
          </button>

          <button
            onClick={() => setActiveTab('sqlite')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'sqlite'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            SQLite Inspector
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'api'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            API Console
          </button>
        </div>
      </div>
    </header>
  );
};
