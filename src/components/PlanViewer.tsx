import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Flame,
  CheckCircle,
  Clock,
  Repeat,
  Target,
  MessageSquare,
  ArrowRight,
  History,
  Timer,
  Info,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { WorkoutPlan, DayWorkoutPlan, WorkoutLog } from '../types';
import { RestTimerModal } from './RestTimerModal';

interface PlanViewerProps {
  plan: WorkoutPlan;
  onRefine: (planId: string, feedback: string) => Promise<void>;
  isRefining: boolean;
  onToggleExercise: (dayNumber: number, exerciseName: string, completed: boolean) => Promise<void>;
  onToggleDay: (dayNumber: number, completed: boolean) => Promise<void>;
  progressLogs: WorkoutLog[];
  latestChangesSummary?: string | null;
}

export const PlanViewer: React.FC<PlanViewerProps> = ({
  plan,
  onRefine,
  isRefining,
  onToggleExercise,
  onToggleDay,
  progressLogs,
  latestChangesSummary,
}) => {
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [showFeedbackDrawer, setShowFeedbackDrawer] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Rest Timer State
  const [timerOpen, setTimerOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [timerExercise, setTimerExercise] = useState('');

  const days: DayWorkoutPlan[] = plan.plan_data.days || [];
  const currentDay = days.find((d) => d.dayNumber === selectedDayNumber) || days[0];

  // Find progress log for selected day
  const dayLog = progressLogs.find((l) => l.day_number === selectedDayNumber);
  const completedExercises: string[] = dayLog?.completed_exercises || [];
  const isDayFullyCompleted = !!dayLog?.completed;

  // Calculate day completion percentage
  const totalExercises = currentDay?.exercises?.length || 0;
  const completedCount = completedExercises.length;
  const completionPercentage = totalExercises > 0
    ? Math.round((completedCount / totalExercises) * 100)
    : (isDayFullyCompleted ? 100 : 0);

  const startRestTimer = (seconds: number, exerciseName: string) => {
    setTimerSeconds(seconds);
    setTimerExercise(exerciseName);
    setTimerOpen(true);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackInput.trim()) return;
    await onRefine(plan.id, feedbackInput.trim());
    setFeedbackInput('');
  };

  const applyQuickFeedback = (text: string) => {
    setFeedbackInput(text);
    setShowFeedbackDrawer(true);
  };

  return (
    <div className="space-y-6">
      {/* Rest Timer Modal */}
      <RestTimerModal
        isOpen={timerOpen}
        onClose={() => setTimerOpen(false)}
        initialSeconds={timerSeconds}
        exerciseName={timerExercise}
      />

      {/* Plan Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Plan Version {plan.version}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold text-xs capitalize">
                Goal: {plan.goal.replace('_', ' ')}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold text-xs capitalize flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> {plan.intensity} Intensity
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {plan.title}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              {plan.summary}
            </p>

            {plan.plan_data.weeklyFocus && (
              <div className="flex items-center gap-2 text-xs text-emerald-400/90 font-medium bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-xl w-fit">
                <Target className="w-3.5 h-3.5 shrink-0" />
                <span>Weekly Focus: {plan.plan_data.weeklyFocus}</span>
              </div>
            )}
          </div>

          {/* Quick Refine Button & Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={() => setShowFeedbackDrawer(!showFeedbackDrawer)}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-slate-950" />
              <span>Refine with AI (Scenario 2)</span>
              {showFeedbackDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {plan.feedback_history && plan.feedback_history.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
              >
                <History className="w-3.5 h-3.5" />
                <span>History ({plan.feedback_history.length} updates)</span>
              </button>
            )}
          </div>
        </div>

        {/* Latest Changes Banner if refined */}
        {latestChangesSummary && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs sm:text-sm flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-300 uppercase tracking-wide text-xs block mb-0.5">
                AI Refinement Applied:
              </span>
              <p className="leading-relaxed">{latestChangesSummary}</p>
            </div>
          </div>
        )}
      </div>

      {/* Scenario 2: Feedback & Refinement Drawer */}
      {showFeedbackDrawer && (
        <div className="p-6 rounded-3xl bg-slate-900 border-2 border-emerald-500/40 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3" /> Scenario 2: Dynamic Feedback Loop
              </div>
              <h3 className="text-lg font-bold text-white">
                Request Changes to Your Workout Plan
              </h3>
              <p className="text-xs text-slate-400">
                FitBuddy regenerates your 7-day routine based on your evolving goals, soreness, or schedule.
              </p>
            </div>
          </div>

          {/* Quick feedback suggestions */}
          <div className="mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Common Adjustments (Click to apply):
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                'More focus on cardio and fat burn',
                'Include more rest and recovery days',
                'Shorten workouts to 30 minutes',
                'Low impact on knees (remove jumping/deep squats)',
                'More upper body push and pull exercises',
                'Swap gym barbell lifts for home dumbbells',
              ].map((fb) => (
                <button
                  key={fb}
                  type="button"
                  onClick={() => applyQuickFeedback(fb)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition-all text-left"
                >
                  + {fb}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <textarea
              required
              rows={3}
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              placeholder="e.g. Please add 15 minutes of HIIT cardio to Day 2 and Day 4, and make Day 5 a restorative yoga day."
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-all"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowFeedbackDrawer(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isRefining || !feedbackInput.trim()}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-60 cursor-pointer"
              >
                {isRefining ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Regenerating Plan with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Update &amp; Regenerate Plan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Version History Modal / Drawer */}
      {showHistory && plan.feedback_history && plan.feedback_history.length > 0 && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" /> Refinement History
            </h4>
            <span className="text-xs text-slate-400">
              Stored persistently in SQLite
            </span>
          </div>

          <div className="space-y-2.5">
            {plan.feedback_history.map((h, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                  <span className="text-emerald-400 font-bold">Version {h.version}</span>
                  <span>{new Date(h.appliedAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-200 font-medium">
                  Feedback: <span className="italic text-slate-300">"{h.feedback}"</span>
                </p>
                <p className="text-emerald-400/90 text-[11px]">
                  Applied: {h.changesSummary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-Day Tab Selector */}
      <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {days.map((day) => {
            const isSelected = day.dayNumber === selectedDayNumber;
            const log = progressLogs.find((l) => l.day_number === day.dayNumber);
            const isCompleted = log?.completed || (log?.completed_exercises?.length === day.exercises?.length && day.exercises?.length > 0);

            return (
              <button
                key={day.dayNumber}
                onClick={() => setSelectedDayNumber(day.dayNumber)}
                className={`relative p-3 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-[11px] font-mono uppercase ${isSelected ? 'text-slate-900 font-extrabold' : 'text-slate-400'}`}>
                    Day {day.dayNumber}
                  </span>
                  {isCompleted ? (
                    <CheckCircle className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-emerald-400'}`} />
                  ) : day.isRestDay ? (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded ${isSelected ? 'bg-slate-900 text-emerald-400' : 'bg-slate-900 text-cyan-400'}`}>
                      REST
                    </span>
                  ) : null}
                </div>

                <div className="text-xs font-semibold truncate leading-tight">
                  {day.focus}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Workout Details */}
      {currentDay && (
        <div className="space-y-6">
          {/* Day Overview Header */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Day {currentDay.dayNumber} Schedule
                </span>
                {currentDay.isRestDay ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold">
                    Rest &amp; Recovery
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                    Active Training Day
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {currentDay.dayName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Primary Focus: <span className="text-white font-medium">{currentDay.focus}</span>
              </p>
            </div>

            {/* Completion & Calorie stats */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="text-xs text-slate-400 flex items-center justify-end gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400" /> Est. Burn
                </div>
                <div className="text-base font-extrabold text-white">
                  {currentDay.estimatedCalories} kcal
                </div>
              </div>

              <div className="h-8 w-px bg-slate-800" />

              <div>
                <button
                  onClick={() => onToggleDay(currentDay.dayNumber, !isDayFullyCompleted)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isDayFullyCompleted
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {isDayFullyCompleted ? 'Day Completed!' : 'Mark Day Complete'}
                </button>
              </div>
            </div>
          </div>

          {/* Warmup Section */}
          {currentDay.warmup && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white">Dynamic Warm-Up Protocol</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {currentDay.warmup.duration}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentDay.warmup.exercises.map((warmupEx, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/80 text-slate-300 text-xs font-medium border border-slate-700/60"
                  >
                    • {warmupEx}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Exercises List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                Exercises &amp; Prescriptions ({currentDay.exercises.length})
              </h3>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {completedCount} of {totalExercises} completed ({completionPercentage}%)
              </span>
            </div>

            {currentDay.exercises.map((ex, idx) => {
              const isChecked = completedExercises.includes(ex.name);
              const parsedRestSeconds = parseInt(ex.rest) || 60;

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border transition-all ${
                    isChecked
                      ? 'bg-slate-900/40 border-emerald-500/30 opacity-80'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Left: Checkbox + Name + Muscle */}
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => onToggleExercise(currentDay.dayNumber, ex.name, !isChecked)}
                        className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'border-2 border-slate-600 hover:border-emerald-400 bg-slate-800'
                        }`}
                      >
                        {isChecked && <CheckCircle className="w-4 h-4 fill-slate-950 text-emerald-500" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-base font-bold text-white ${isChecked ? 'line-through text-slate-400' : ''}`}>
                            {ex.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold">
                            {ex.targetMuscle}
                          </span>
                        </div>

                        {ex.tips && (
                          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                            <span className="font-semibold text-slate-300">Form Tip:</span> {ex.tips}
                          </p>
                        )}

                        {ex.alternative && (
                          <p className="text-[11px] text-slate-400">
                            <span className="text-slate-400">Alternative:</span> {ex.alternative}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Prescription Tags + Rest Timer Button */}
                    <div className="flex flex-wrap items-center sm:flex-col sm:items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
                          {ex.sets} Sets
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
                          {ex.reps} Reps
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          {ex.rest}
                        </span>
                      </div>

                      {/* Launch Rest Timer */}
                      <button
                        onClick={() => startRestTimer(parsedRestSeconds, ex.name)}
                        className="px-3 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Start Rest Timer"
                      >
                        <Timer className="w-3.5 h-3.5" />
                        <span>Timer ({ex.rest})</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cooldown Section */}
          {currentDay.cooldown && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold text-white">Cool-Down &amp; Tissue Recovery</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {currentDay.cooldown.duration}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentDay.cooldown.exercises.map((cdEx, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/80 text-slate-300 text-xs font-medium border border-slate-700/60"
                  >
                    • {cdEx}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Daily Coach Advice Note */}
          {currentDay.coachNote && (
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/30 text-emerald-300 text-xs flex items-center gap-3">
              <Info className="w-4 h-4 shrink-0 text-emerald-400" />
              <div>
                <span className="font-bold uppercase tracking-wider text-[10px] block text-emerald-400">
                  FitBuddy Coach Directive:
                </span>
                <p>{currentDay.coachNote}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
