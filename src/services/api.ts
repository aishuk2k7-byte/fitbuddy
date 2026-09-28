import { UserProfile, WorkoutPlan, NutritionTip, WorkoutLog } from '../types';

export const api = {
  async checkHealth() {
    const res = await fetch('/api/health');
    return res.json();
  },

  async getUsers(): Promise<UserProfile[]> {
    const res = await fetch('/api/users');
    const data = await res.json();
    return data.users || [];
  },

  async getUserDetails(id: string): Promise<{ user: UserProfile; latestPlan: WorkoutPlan | null; tips: NutritionTip[] }> {
    const res = await fetch(`/api/users/${id}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch user');
    return {
      user: data.user,
      latestPlan: data.latestPlan ? {
        ...data.latestPlan,
        plan_data: data.latestPlan.plan_json,
        feedback_history: data.latestPlan.feedback_history_json,
      } : null,
      tips: data.tips || [],
    };
  },

  async saveUser(user: Partial<UserProfile> & { name: string }): Promise<UserProfile> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to save user');
    return data.user;
  },

  async generatePlan(params: {
    name: string;
    age: number;
    weight: number;
    weight_unit: string;
    goal: string;
    intensity: string;
    experience_level?: string;
    equipment?: string;
    special_requests?: string;
    user_id?: string;
  }): Promise<{ user: UserProfile; plan: WorkoutPlan; initialTip: NutritionTip }> {
    const res = await fetch('/api/plan/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Plan generation failed');
    return {
      user: data.user,
      plan: data.plan,
      initialTip: data.initialTip,
    };
  },

  async refinePlan(planId: string, feedback: string): Promise<{ plan: WorkoutPlan; changesSummary: string }> {
    const res = await fetch('/api/plan/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId, feedback }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Plan refinement failed');
    return {
      plan: data.plan,
      changesSummary: data.changesSummary,
    };
  },

  async generateTip(params: {
    goal: string;
    intensity?: string;
    category?: string;
    user_id?: string;
    specific_query?: string;
  }): Promise<NutritionTip> {
    const res = await fetch('/api/tips/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Tip generation failed');
    return data.tip;
  },

  async getTips(goal?: string, userId?: string): Promise<NutritionTip[]> {
    const params = new URLSearchParams();
    if (goal) params.append('goal', goal);
    if (userId) params.append('userId', userId);
    const res = await fetch(`/api/tips?${params.toString()}`);
    const data = await res.json();
    return data.tips || [];
  },

  async getProgress(userId: string, planId: string): Promise<WorkoutLog[]> {
    const res = await fetch(`/api/progress/${userId}/${planId}`);
    const data = await res.json();
    return data.logs || [];
  },

  async toggleExercise(params: {
    userId: string;
    planId: string;
    dayNumber: number;
    exerciseName: string;
    completed: boolean;
  }): Promise<WorkoutLog[]> {
    const res = await fetch('/api/progress/toggle-exercise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data.logs || [];
  },

  async toggleDay(params: {
    userId: string;
    planId: string;
    dayNumber: number;
    completed: boolean;
  }): Promise<WorkoutLog[]> {
    const res = await fetch('/api/progress/toggle-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data.logs || [];
  },

  async getDatabaseSummary() {
    const res = await fetch('/api/database/summary');
    return res.json();
  },

  async getApiDocs() {
    const res = await fetch('/api/docs');
    return res.json();
  },
};
