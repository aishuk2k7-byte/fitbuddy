import React from 'react';
import {
  CheckCircle2,
  Calendar,
  Flame,
  Award,
  Zap,
  TrendingUp,
  Circle,
  Dumbbell,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WorkoutPlan, WorkoutLog } from '../types';

interface WorkoutTrackerProps {
  plan: WorkoutPlan | null;
  progressLogs: WorkoutLog[];
  onToggleDay: (dayNumber: number, completed: boolean) => Promise<void>;
}

export const WorkoutTracker: React.FC<WorkoutTrackerProps> = ({
  plan,
  progressLogs,
  onToggleDay,
}) => {
  if (!plan) {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
        <Dumbbell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">No Active Plan Found</h3>
        <p className="text-xs text-slate-400 mt-1">
          Generate a 7-day workout plan first to start tracking your daily progress.
        </p>
      </div>
    );
  }

  const days = plan.plan_data.days || [];
  const totalDays = days.length;

  const completedDaysCount = days.filter((d) => {
    const log = progressLogs.find((l) => l.day_number === d.dayNumber);
    return log?.completed || (log?.completed_exercises?.length === d.exercises?.length && d.exercises?.length > 0);
  }).length;

  const totalExercises = days.reduce((acc, d) => acc + (d.exercises?.length || 0), 0);
  const completedExercisesCount = progressLogs.reduce(
    (acc, log) => acc + (log.completed_exercises?.length || 0),
    0
  );

  const totalCaloriesPlanned = days.reduce((acc, d) => acc + (d.estimatedCalories || 0), 0);
  const caloriesBurned = days.reduce((acc, d) => {
    const log = progressLogs.find((l) => l.day_number === d.dayNumber);
    if (log?.completed) return acc + (d.estimatedCalories || 0);
    const exRatio = d.exercises?.length ? (log?.completed_exercises?.length || 0) / d.exercises.length : 0;
    return acc + Math.round((d.estimatedCalories || 0) * exRatio);
  }, 0);

  const completionPercentage = totalDays > 0 ? Math.round((completedDaysCount / totalDays) * 100) : 0;

  const handleToggle = async (dayNumber: number, completed: boolean) => {
    await onToggleDay(dayNumber, completed);
    if (completed) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Weekly Adherence</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {completionPercentage}%
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            {completedDaysCount} of {totalDays} days finished
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Exercises Done</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {completedExercisesCount} <span className="text-sm font-normal text-slate-400">/ {totalExercises}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Logged across individual workout sets
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Calories Burned</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {caloriesBurned} <span className="text-sm font-normal text-slate-400">/ {totalCaloriesPlanned} kcal</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Active metabolic caloric expenditure
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Plan Status</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white truncate">
            {plan.plan_data.primaryGoal.replace('_', ' ')}
          </div>
          <span className="text-xs font-mono text-emerald-400 font-semibold mt-3 block">
            Version {plan.version} • {plan.intensity}
          </span>
        </div>
      </div>

      {/* 7-Day Completion Checklist Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" /> 7-Day Completion Log
            </h3>
            <p className="text-xs text-slate-400">
              Check off completed workouts. Progress persists automatically in SQLite.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {days.map((day) => {
            const log = progressLogs.find((l) => l.day_number === day.dayNumber);
            const isCompleted = !!log?.completed;
            const exCompletedCount = log?.completed_exercises?.length || 0;

            return (
              <div
                key={day.dayNumber}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(day.dayNumber, !isCompleted)}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-500 text-slate-950'
                        : 'border-2 border-slate-600 hover:border-emerald-400 bg-slate-800 text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 fill-current" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        DAY {day.dayNumber}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {day.dayName}
                      </span>
                      {day.isRestDay && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-semibold">
                          Recovery
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Focus: <span className="text-slate-300">{day.focus}</span> • {day.exercises.length} Exercises
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right text-xs">
                    <span className="text-slate-400 block font-mono">
                      {exCompletedCount}/{day.exercises.length} Exercises
                    </span>
                    <span className="text-orange-400 font-semibold">
                      {day.estimatedCalories} kcal
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggle(day.dayNumber, !isCompleted)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isCompleted ? 'Finished' : 'Mark Done'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
