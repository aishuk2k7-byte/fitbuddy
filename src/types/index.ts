export interface UserProfile {
  id: string;
  name: string;
  age: number;
  weight: number;
  weight_unit: string;
  goal: string;
  intensity: 'low' | 'medium' | 'high';
  experience_level: string;
  equipment: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExerciseItem {
  name: string;
  sets: number;
  reps: string;
  duration?: string;
  rest: string;
  targetMuscle: string;
  tips: string;
  alternative?: string;
}

export interface DayWorkoutPlan {
  dayNumber: number;
  dayName: string;
  focus: string;
  isRestDay: boolean;
  warmup: {
    duration: string;
    exercises: string[];
  };
  exercises: ExerciseItem[];
  cooldown: {
    duration: string;
    exercises: string[];
  };
  estimatedCalories: number;
  coachNote: string;
}

export interface WorkoutPlan {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  goal: string;
  intensity: string;
  version: number;
  plan_data: {
    title: string;
    summary: string;
    weeklyFocus: string;
    primaryGoal: string;
    intensity: string;
    nutritionHighlight: string;
    days: DayWorkoutPlan[];
  };
  feedback_history: Array<{
    version: number;
    feedback: string;
    changesSummary: string;
    appliedAt: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface NutritionTip {
  id: string;
  user_id?: string;
  goal: string;
  category: 'nutrition' | 'recovery' | 'hydration' | 'timing';
  title: string;
  tip: string;
  actionableStep?: string;
  actionable_step?: string;
  whyItWorks?: string;
  why_it_works?: string;
  suggestedMeals?: string[];
  suggested_meals?: string[];
  hydrationTip?: string;
  hydration_tip?: string;
  created_at: string;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  plan_id: string;
  day_number: number;
  completed: number;
  completed_exercises: string[];
  completed_at?: string;
}
