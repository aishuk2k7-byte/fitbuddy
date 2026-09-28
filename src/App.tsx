/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PlanForm } from './components/PlanForm';
import { PlanViewer } from './components/PlanViewer';
import { NutritionHub } from './components/NutritionHub';
import { WorkoutTracker } from './components/WorkoutTracker';
import { SqliteInspector } from './components/SqliteInspector';
import { ApiConsole } from './components/ApiConsole';
import { api } from './services/api';
import { UserProfile, WorkoutPlan, NutritionTip, WorkoutLog } from './types';
import { Dumbbell, PlusCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'plan' | 'nutrition' | 'tracker' | 'sqlite' | 'api'>('plan');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | null>(null);
  const [nutritionTips, setNutritionTips] = useState<NutritionTip[]>([]);
  const [progressLogs, setProgressLogs] = useState<WorkoutLog[]>([]);

  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [isRefiningPlan, setIsRefiningPlan] = useState<boolean>(false);
  const [isGeneratingTip, setIsGeneratingTip] = useState<boolean>(false);
  const [latestChangesSummary, setLatestChangesSummary] = useState<string | null>(null);
  const [sqliteConnected, setSqliteConnected] = useState<boolean>(true);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  // Initialize app data from SQLite
  useEffect(() => {
    const initialize = async () => {
      try {
        const health = await api.checkHealth();
        setSqliteConnected(health.status === 'ok');

        const savedUsers = await api.getUsers();
        setUsers(savedUsers);

        if (savedUsers.length > 0) {
          const firstUser = savedUsers[0];
          setCurrentUser(firstUser);
          await loadUserData(firstUser.id);
        } else {
          // No user yet, show form
          setShowCreateForm(true);
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setSqliteConnected(false);
        setShowCreateForm(true);
      }
    };

    initialize();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      const details = await api.getUserDetails(userId);
      setCurrentUser(details.user);
      setCurrentPlan(details.latestPlan);
      setNutritionTips(details.tips);

      if (details.latestPlan) {
        const logs = await api.getProgress(userId, details.latestPlan.id);
        setProgressLogs(logs);
        setShowCreateForm(false);
      } else {
        setShowCreateForm(true);
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  };

  const handleSelectUser = async (user: UserProfile) => {
    setCurrentUser(user);
    await loadUserData(user.id);
  };

  const handleNewUser = () => {
    setCurrentPlan(null);
    setShowCreateForm(true);
    setActiveTab('plan');
  };

  // Scenario 1: Generate 7-Day Workout Plan
  const handleGeneratePlan = async (data: {
    name: string;
    age: number;
    weight: number;
    weight_unit: string;
    goal: string;
    intensity: 'low' | 'medium' | 'high';
    experience_level: string;
    equipment: string;
    special_requests: string;
    user_id?: string;
  }) => {
    setIsGeneratingPlan(true);
    setLatestChangesSummary(null);
    try {
      const res = await api.generatePlan(data);
      setCurrentUser(res.user);
      setCurrentPlan(res.plan);

      if (res.initialTip) {
        setNutritionTips([res.initialTip, ...nutritionTips]);
      }

      // Refresh users list
      const updatedUsers = await api.getUsers();
      setUsers(updatedUsers);

      setProgressLogs([]);
      setShowCreateForm(false);
    } catch (err: any) {
      alert(`Error generating plan: ${err.message}`);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Scenario 2: Refine Workout Plan via Feedback
  const handleRefinePlan = async (planId: string, feedback: string) => {
    setIsRefiningPlan(true);
    try {
      const res = await api.refinePlan(planId, feedback);
      setCurrentPlan(res.plan);
      setLatestChangesSummary(res.changesSummary);
    } catch (err: any) {
      alert(`Error refining plan: ${err.message}`);
    } finally {
      setIsRefiningPlan(false);
    }
  };

  // Scenario 3: Generate Nutrition & Recovery Tip
  const handleGenerateTip = async (params: {
    goal: string;
    intensity: string;
    category: string;
    specific_query?: string;
  }) => {
    setIsGeneratingTip(true);
    try {
      const tip = await api.generateTip({
        ...params,
        user_id: currentUser?.id,
      });
      setNutritionTips([tip, ...nutritionTips]);
    } catch (err: any) {
      alert(`Error generating tip: ${err.message}`);
    } finally {
      setIsGeneratingTip(false);
    }
  };

  // Exercise check-off
  const handleToggleExercise = async (dayNumber: number, exerciseName: string, completed: boolean) => {
    if (!currentUser || !currentPlan) return;
    try {
      const updatedLogs = await api.toggleExercise({
        userId: currentUser.id,
        planId: currentPlan.id,
        dayNumber,
        exerciseName,
        completed,
      });
      setProgressLogs(updatedLogs);
    } catch (err) {
      console.error('Error toggling exercise:', err);
    }
  };

  // Full day complete toggle
  const handleToggleDay = async (dayNumber: number, completed: boolean) => {
    if (!currentUser || !currentPlan) return;
    try {
      const updatedLogs = await api.toggleDay({
        userId: currentUser.id,
        planId: currentPlan.id,
        dayNumber,
        completed,
      });
      setProgressLogs(updatedLogs);
    } catch (err) {
      console.error('Error toggling day:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        users={users}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        onNewUser={handleNewUser}
        sqliteConnected={sqliteConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab 1: Workout Plan (Scenario 1 & Scenario 2) */}
        {activeTab === 'plan' && (
          <div className="space-y-8">
            {showCreateForm || !currentPlan ? (
              <PlanForm
                onGenerate={handleGeneratePlan}
                isLoading={isGeneratingPlan}
                currentUser={currentUser}
              />
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Active Plan for {currentUser?.name}
                  </span>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create Different Routine</span>
                  </button>
                </div>

                <PlanViewer
                  plan={currentPlan}
                  onRefine={handleRefinePlan}
                  isRefining={isRefiningPlan}
                  onToggleExercise={handleToggleExercise}
                  onToggleDay={handleToggleDay}
                  progressLogs={progressLogs}
                  latestChangesSummary={latestChangesSummary}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Nutrition & Recovery Hub (Scenario 3) */}
        {activeTab === 'nutrition' && (
          <NutritionHub
            currentUser={currentUser}
            tips={nutritionTips}
            onGenerateTip={handleGenerateTip}
            isGenerating={isGeneratingTip}
          />
        )}

        {/* Tab 3: Workout Tracker */}
        {activeTab === 'tracker' && (
          <WorkoutTracker
            plan={currentPlan}
            progressLogs={progressLogs}
            onToggleDay={handleToggleDay}
          />
        )}

        {/* Tab 4: SQLite Database Inspector */}
        {activeTab === 'sqlite' && <SqliteInspector />}

        {/* Tab 5: REST API Console */}
        {activeTab === 'api' && <ApiConsole />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 mt-12 bg-slate-950/60 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">FitBuddy</span>
            <span>•</span>
            <span>AI-Driven Workout Plans, Refinement Loops &amp; Nutrition Intelligence</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              SQLite Persistent
            </span>
            <span>•</span>
            <span>Gemini 3.8 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
