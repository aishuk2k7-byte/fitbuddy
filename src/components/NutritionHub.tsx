import React, { useState } from 'react';
import {
  Apple,
  Sparkles,
  Droplets,
  Flame,
  Dumbbell,
  Clock,
  Heart,
  Bookmark,
  CheckCircle,
  Lightbulb,
  Utensils,
  Calculator,
  RefreshCw,
} from 'lucide-react';
import { NutritionTip, UserProfile } from '../types';

interface NutritionHubProps {
  currentUser: UserProfile | null;
  tips: NutritionTip[];
  onGenerateTip: (params: {
    goal: string;
    intensity: string;
    category: string;
    specific_query?: string;
  }) => Promise<void>;
  isGenerating: boolean;
}

export const NutritionHub: React.FC<NutritionHubProps> = ({
  currentUser,
  tips,
  onGenerateTip,
  isGenerating,
}) => {
  const [selectedGoal, setSelectedGoal] = useState<string>(currentUser?.goal || 'weight_loss');
  const [selectedCategory, setSelectedCategory] = useState<string>('nutrition');
  const [customQuery, setCustomQuery] = useState<string>('');

  const latestTip = tips[0] || null;

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await onGenerateTip({
      goal: selectedGoal,
      intensity: currentUser?.intensity || 'medium',
      category: selectedCategory,
      specific_query: customQuery.trim() || undefined,
    });
    setCustomQuery('');
  };

  // Dynamic Macro & Caloric estimation
  const weightKg = currentUser ? (currentUser.weight_unit === 'lbs' ? currentUser.weight * 0.453592 : currentUser.weight) : 70;
  const age = currentUser?.age || 28;
  const intensity = currentUser?.intensity || 'medium';

  const baseBMR = 10 * weightKg + 6.25 * 175 - 5 * age + 5; // approximate Mifflin-St Jeor
  const multiplier = intensity === 'high' ? 1.65 : intensity === 'medium' ? 1.45 : 1.3;
  const maintenanceCalories = Math.round(baseBMR * multiplier);

  let targetCalories = maintenanceCalories;
  let targetProtein = Math.round(weightKg * 2.0); // 2g/kg
  let targetCarbs = Math.round((maintenanceCalories * 0.45) / 4);
  let targetFat = Math.round((maintenanceCalories * 0.25) / 9);

  if (selectedGoal.includes('loss') || selectedGoal.includes('weight')) {
    targetCalories = Math.round(maintenanceCalories - 450);
    targetProtein = Math.round(weightKg * 2.2);
    targetCarbs = Math.round((targetCalories * 0.35) / 4);
    targetFat = Math.round((targetCalories * 0.25) / 9);
  } else if (selectedGoal.includes('muscle')) {
    targetCalories = Math.round(maintenanceCalories + 350);
    targetProtein = Math.round(weightKg * 2.0);
    targetCarbs = Math.round((targetCalories * 0.5) / 4);
    targetFat = Math.round((targetCalories * 0.25) / 9);
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Scenario 3: Nutrition &amp; Recovery Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Fuel, Repair &amp; Adapt
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Targeted nutritional blueprints designed specifically to accelerate your{' '}
              <span className="text-emerald-400 font-bold capitalize">
                {selectedGoal.replace('_', ' ')}
              </span>{' '}
              training regimen.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-4 bg-slate-800/80 border border-slate-700 p-4 rounded-2xl shrink-0">
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Estimated TDEE</span>
              <span className="text-xl font-extrabold text-white">{targetCalories}</span>
              <span className="text-[10px] text-emerald-400 block font-semibold">kcal / day</span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Daily Protein</span>
              <span className="text-xl font-extrabold text-white">{targetProtein}g</span>
              <span className="text-[10px] text-cyan-400 block font-semibold">optimal target</span>
            </div>
          </div>
        </div>
      </div>

      {/* Generator Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-emerald-400" /> Request a Targeted Suggestion
            </h3>
            <p className="text-xs text-slate-400">
              Select your goal or ask a specific question to generate evidence-based dietary advice.
            </p>
          </div>
        </div>

        {/* Goal Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: 'weight_loss', label: 'Weight Loss', icon: Flame },
            { id: 'muscle_gain', label: 'Muscle Gain', icon: Dumbbell },
            { id: 'general_wellness', label: 'General Wellness', icon: Heart },
            { id: 'endurance', label: 'Endurance', icon: Droplets },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = selectedGoal === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedGoal(item.id)}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-md ring-1 ring-emerald-500'
                    : 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 uppercase font-semibold mr-1">Focus Category:</span>
          {[
            { id: 'nutrition', label: 'Meal Nutrition', icon: Utensils },
            { id: 'recovery', label: 'Muscle Recovery & Sleep', icon: Heart },
            { id: 'hydration', label: 'Hydration & Electrolytes', icon: Droplets },
            { id: 'timing', label: 'Nutrient Timing', icon: Clock },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <cat.icon className="w-3 h-3 text-emerald-400" />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Custom Query Input & Generate Button */}
        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Optional specific question (e.g. 'Best post-workout shake' or 'How much water during cardio?')"
            className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={isGenerating}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all shrink-0 disabled:opacity-60 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Formulating Tip with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Nutrition Tip</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Featured Latest Tip (Scenario 3 Focus) */}
      {latestTip && (
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 border-2 border-emerald-500/40 p-6 sm:p-8 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Apple className="w-3.5 h-3.5" /> {latestTip.category || 'nutrition'} Protocol
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold capitalize">
                Goal: {latestTip.goal?.replace('_', ' ')}
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Saved in SQLite • {new Date(latestTip.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-3">
            {latestTip.title}
          </h2>

          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-100 text-sm sm:text-base font-medium leading-relaxed mb-6">
            "{latestTip.tip}"
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Actionable Step */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Action Step for Today
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {latestTip.actionableStep || latestTip.actionable_step}
              </p>
            </div>

            {/* Why it works */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" /> The Physiological Rationale
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {latestTip.whyItWorks || latestTip.why_it_works}
              </p>
            </div>
          </div>

          {/* Suggested Meals / Snacks */}
          {((latestTip.suggestedMeals && latestTip.suggestedMeals.length > 0) ||
            (latestTip.suggested_meals && latestTip.suggested_meals.length > 0)) && (
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-3">
                <Utensils className="w-3.5 h-3.5 text-amber-400" /> Recommended Meals &amp; Snack Ideas
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(latestTip.suggestedMeals || latestTip.suggested_meals || []).map((meal, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                  >
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{meal}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hydration Note */}
          {(latestTip.hydrationTip || latestTip.hydration_tip) && (
            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/30 text-cyan-300 text-xs flex items-center gap-3">
              <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold uppercase tracking-wider text-[10px] block text-cyan-400">
                  Targeted Hydration Directive:
                </span>
                <p>{latestTip.hydrationTip || latestTip.hydration_tip}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Target Macro Breakdown Calculator Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Calculated Macronutrient Distribution
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Based on {currentUser?.name || 'Athlete'} ({currentUser?.weight || 70} {currentUser?.weight_unit || 'kg'})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-400">Protein</span>
              <span className="text-xs font-mono text-emerald-400 font-bold">{targetProtein}g</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-2">
              <div className="bg-emerald-500 h-full rounded-full w-[35%]" />
            </div>
            <p className="text-[11px] text-slate-400">
              Essential for muscle tissue protein synthesis and preserving lean mass during deficits.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-400">Carbohydrates</span>
              <span className="text-xs font-mono text-cyan-400 font-bold">{targetCarbs}g</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-2">
              <div className="bg-cyan-500 h-full rounded-full w-[45%]" />
            </div>
            <p className="text-[11px] text-slate-400">
              Primary glycogen fuel for high-intensity training, recovery, and central nervous support.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-400">Healthy Fats</span>
              <span className="text-xs font-mono text-amber-400 font-bold">{targetFat}g</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-2">
              <div className="bg-amber-500 h-full rounded-full w-[25%]" />
            </div>
            <p className="text-[11px] text-slate-400">
              Crucial for endocrine hormone production, joint lubrication, and fat-soluble vitamin absorption.
            </p>
          </div>
        </div>
      </div>

      {/* Past Tips Archive from SQLite */}
      {tips.length > 1 && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-emerald-400" />
              Saved Advice Archive ({tips.length} in SQLite)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tips.slice(1).map((pastTip, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-semibold capitalize text-[10px]">
                    {pastTip.category}
                  </span>
                  <span className="text-slate-400 text-[10px] font-mono">
                    {new Date(pastTip.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white line-clamp-1">
                  {pastTip.title}
                </h4>
                <p className="text-xs text-slate-300 line-clamp-2">
                  {pastTip.tip}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
