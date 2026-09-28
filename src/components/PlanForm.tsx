import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Flame,
  Dumbbell,
  Heart,
  TrendingUp,
  User,
  Activity,
  Shield,
  Layers,
} from 'lucide-react';
import { UserProfile } from '../types';

interface PlanFormProps {
  onGenerate: (data: {
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
  }) => Promise<void>;
  isLoading: boolean;
  currentUser: UserProfile | null;
}

export const PlanForm: React.FC<PlanFormProps> = ({
  onGenerate,
  isLoading,
  currentUser,
}) => {
  const [name, setName] = useState(currentUser?.name || 'Alex Hunter');
  const [age, setAge] = useState<number>(currentUser?.age || 27);
  const [weight, setWeight] = useState<number>(currentUser?.weight || 72);
  const [weightUnit, setWeightUnit] = useState<string>(currentUser?.weight_unit || 'kg');
  const [goal, setGoal] = useState<string>(currentUser?.goal || 'weight_loss');
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>(
    currentUser?.intensity || 'medium'
  );
  const [experienceLevel, setExperienceLevel] = useState<string>(
    currentUser?.experience_level || 'intermediate'
  );
  const [equipment, setEquipment] = useState<string>(
    currentUser?.equipment || 'Full gym (dumbbells, barbells, cables)'
  );
  const [specialRequests, setSpecialRequests] = useState<string>('');

  // Quick preset loader
  const loadPreset = (preset: {
    name: string;
    age: number;
    weight: number;
    unit: string;
    goal: string;
    intensity: 'low' | 'medium' | 'high';
    experience: string;
    equipment: string;
    special: string;
  }) => {
    setName(preset.name);
    setAge(preset.age);
    setWeight(preset.weight);
    setWeightUnit(preset.unit);
    setGoal(preset.goal);
    setIntensity(preset.intensity);
    setExperienceLevel(preset.experience);
    setEquipment(preset.equipment);
    setSpecialRequests(preset.special);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onGenerate({
      name: name.trim(),
      age: Number(age) || 25,
      weight: Number(weight) || 70,
      weight_unit: weightUnit,
      goal,
      intensity,
      experience_level: experienceLevel,
      equipment,
      special_requests: specialRequests,
      user_id: currentUser?.id,
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
      {/* Header and Quick Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Scenario 1: AI Plan Generation
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Configure Your Fitness Profile
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            FitBuddy utilizes Gemini AI to calculate biomechanically structured 7-day routines.
          </p>
        </div>

        {/* 1-Click Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Quick Presets:
          </span>
          <button
            type="button"
            onClick={() =>
              loadPreset({
                name: 'Sarah Connor',
                age: 29,
                weight: 64,
                unit: 'kg',
                goal: 'weight_loss',
                intensity: 'high',
                experience: 'intermediate',
                equipment: 'Gym or Dumbbells',
                special: 'Focus on high metabolic conditioning and core definition',
              })
            }
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Flame className="w-3 h-3 text-orange-400" />
            Weight Loss (Sarah, 29)
          </button>

          <button
            type="button"
            onClick={() =>
              loadPreset({
                name: 'Marcus Vance',
                age: 24,
                weight: 78,
                unit: 'kg',
                goal: 'muscle_gain',
                intensity: 'high',
                experience: 'intermediate',
                equipment: 'Full gym (barbells, dumbbells, cables)',
                special: 'Hypertrophy rep ranges, emphasize upper chest and lats',
              })
            }
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Dumbbell className="w-3 h-3 text-emerald-400" />
            Muscle Gain (Marcus, 24)
          </button>

          <button
            type="button"
            onClick={() =>
              loadPreset({
                name: 'David Miller',
                age: 46,
                weight: 82,
                unit: 'kg',
                goal: 'general_wellness',
                intensity: 'low',
                experience: 'beginner',
                equipment: 'Dumbbells and resistance bands',
                special: 'Low joint impact, protect lumbar spine, enhance mobility',
              })
            }
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Heart className="w-3 h-3 text-cyan-400" />
            Wellness (David, 46)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Core Personal Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" /> Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Hunter"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Age (Years)
            </label>
            <input
              type="number"
              required
              min={12}
              max={99}
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value, 10))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Current Weight
            </label>
            <div className="flex rounded-xl border border-slate-700 bg-slate-800/80 overflow-hidden">
              <input
                type="number"
                required
                min={25}
                max={300}
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm"
              />
              <button
                type="button"
                onClick={() => setWeightUnit(weightUnit === 'kg' ? 'lbs' : 'kg')}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs uppercase transition-colors"
              >
                {weightUnit}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" /> Fitness Level
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition-all text-sm cursor-pointer"
            >
              <option value="beginner">Beginner (0-6 months training)</option>
              <option value="intermediate">Intermediate (6+ months training)</option>
              <option value="advanced">Advanced (2+ years progressive overload)</option>
            </select>
          </div>
        </div>

        {/* Primary Fitness Goal Cards */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Primary Fitness Goal
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                id: 'weight_loss',
                label: 'Weight Loss',
                desc: 'Caloric burn, metabolic intervals & lean muscle preservation',
                icon: Flame,
                color: 'text-orange-400',
                border: 'border-orange-500/40',
                bg: 'bg-orange-500/10',
              },
              {
                id: 'muscle_gain',
                label: 'Muscle Gain',
                desc: 'Hypertrophy rep ranges, compound lifts & mechanical overload',
                icon: Dumbbell,
                color: 'text-emerald-400',
                border: 'border-emerald-500/40',
                bg: 'bg-emerald-500/10',
              },
              {
                id: 'general_wellness',
                label: 'General Wellness',
                desc: 'Mobility, core longevity, energy & cardiovascular vitality',
                icon: Heart,
                color: 'text-cyan-400',
                border: 'border-cyan-500/40',
                bg: 'bg-cyan-500/10',
              },
              {
                id: 'endurance',
                label: 'Athletic Endurance',
                desc: 'Aerobic base, stamina, stamina pacing & functional speed',
                icon: Activity,
                color: 'text-indigo-400',
                border: 'border-indigo-500/40',
                bg: 'bg-indigo-500/10',
              },
            ].map((g) => {
              const Icon = g.icon;
              const isSelected = goal === g.id;
              return (
                <div
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className={`relative p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? `${g.border} ${g.bg} ring-2 ring-emerald-500/50 shadow-lg`
                      : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={`w-4 h-4 ${g.color}`} />
                    <span className="text-sm font-bold text-white">{g.label}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{g.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workout Intensity Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Preferred Workout Intensity
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'low',
                label: 'Low Intensity',
                desc: 'Moderate heart rate, gentle pacing, joint-friendly movements & extra recovery.',
                badge: 'Easy Pace • 3-4 days',
                color: 'text-blue-400',
              },
              {
                id: 'medium',
                label: 'Medium Intensity',
                desc: 'Balanced volume, moderate weights, structured rest intervals and steady progress.',
                badge: 'Steady Build • 4-5 days',
                color: 'text-emerald-400',
              },
              {
                id: 'high',
                label: 'High Intensity',
                desc: 'Challenging supersets, heavy compound loads, high metabolic demand & short rest.',
                badge: 'Maximum Push • 5-6 days',
                color: 'text-rose-400',
              },
            ].map((item) => {
              const isSelected = intensity === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setIntensity(item.id as any)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 shadow-md'
                      : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-white">{item.label}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 ${item.color}`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Equipment & Special Customizations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Available Equipment
            </label>
            <input
              type="text"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="e.g. Full gym, Dumbbells & Bench, or Calisthenics bodyweight"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" /> Special Requests or Injuries (Optional)
            </label>
            <input
              type="text"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="e.g. Mild knee tendinitis, prefer dumbbell presses over barbells"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all text-sm"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-base tracking-wide flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 transition-all transform active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Synthesizing Your 7-Day Routine with Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 fill-slate-950" />
                <span>Generate Personalized 7-Day Workout Plan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
