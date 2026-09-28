import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getDb,
  getAllUsers,
  getUserById,
  upsertUser,
  saveWorkoutPlan,
  getLatestPlanForUser,
  getPlanById,
  saveNutritionTip,
  getNutritionTips,
  getWorkoutLogs,
  toggleExerciseLog,
  toggleDayCompleted,
  getDatabaseSummary,
} from './src/server/db.js';
import {
  generateWorkoutPlan,
  refineWorkoutPlan,
  generateNutritionTip,
} from './src/server/gemini.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize SQLite database on startup
getDb()
  .then(() => {
    console.log('FitBuddy SQLite database initialized successfully at fitbuddy.db');
  })
  .catch((err) => {
    console.error('Failed to initialize SQLite database:', err);
  });

// --- API Endpoints ---

// 1. Health & Database check
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const summary = await getDatabaseSummary();
    res.json({
      status: 'ok',
      sqlite: 'connected',
      timestamp: new Date().toISOString(),
      stats: {
        usersCount: summary.users.count,
        plansCount: summary.workout_plans.count,
        tipsCount: summary.nutrition_tips.count,
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. Users endpoints
app.get('/api/users', async (_req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const { id, name, age, weight, weight_unit, goal, intensity, experience_level, equipment } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'User name is required' });
    }
    const userId = id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const saved = await upsertUser({
      id: userId,
      name,
      age: age ? Number(age) : 28,
      weight: weight ? Number(weight) : 70,
      weight_unit: weight_unit || 'kg',
      goal: goal || 'weight_loss',
      intensity: intensity || 'medium',
      experience_level: experience_level || 'intermediate',
      equipment: equipment || 'standard gym',
    });
    res.json({ success: true, user: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const latestPlan = await getLatestPlanForUser(user.id);
    const tips = await getNutritionTips(user.goal, user.id);
    res.json({
      success: true,
      user,
      latestPlan: latestPlan ? { ...latestPlan, plan_json: JSON.parse(latestPlan.plan_json), feedback_history_json: JSON.parse(latestPlan.feedback_history_json) } : null,
      tips,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Scenario 1: Generate 7-Day Workout Plan
app.post('/api/plan/generate', async (req: Request, res: Response) => {
  try {
    const {
      name,
      age,
      weight,
      weight_unit = 'kg',
      goal,
      intensity,
      experience_level = 'intermediate',
      equipment = 'standard gym or home weights',
      special_requests = '',
      user_id,
    } = req.body;

    if (!name || !goal || !intensity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: name, goal, and intensity are required.',
      });
    }

    // 1. Ensure user is created or updated in SQLite
    const activeUserId = user_id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const user = await upsertUser({
      id: activeUserId,
      name,
      age: Number(age) || 28,
      weight: Number(weight) || 70,
      weight_unit,
      goal,
      intensity,
      experience_level,
      equipment,
    });

    // 2. Generate plan using Gemini AI
    const planData = await generateWorkoutPlan({
      name,
      age: Number(age) || 28,
      weight: Number(weight) || 70,
      weightUnit: weight_unit,
      goal,
      intensity,
      experienceLevel: experience_level,
      equipment,
      specialRequests: special_requests,
    });

    // 3. Save to SQLite database
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const savedPlan = await saveWorkoutPlan({
      id: planId,
      user_id: user.id,
      title: planData.title,
      summary: planData.summary,
      goal,
      intensity,
      plan_json: JSON.stringify(planData),
      version: 1,
      feedback_history_json: JSON.stringify([]),
    });

    // 4. Also generate an initial nutrition tip matching the user goal
    const initialTip = await generateNutritionTip({
      goal,
      intensity,
      userName: name,
    });

    const tipId = `tip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await saveNutritionTip({
      id: tipId,
      user_id: user.id,
      goal,
      category: initialTip.category,
      title: initialTip.title,
      tip: initialTip.tip,
      actionable_step: initialTip.actionableStep,
      why_it_works: initialTip.whyItWorks,
      suggested_meals_json: JSON.stringify(initialTip.suggestedMeals),
      hydration_tip: initialTip.hydrationTip,
      created_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      user,
      plan: {
        id: savedPlan.id,
        user_id: savedPlan.user_id,
        title: savedPlan.title,
        summary: savedPlan.summary,
        goal: savedPlan.goal,
        intensity: savedPlan.intensity,
        version: savedPlan.version,
        plan_data: planData,
        feedback_history: [],
        created_at: savedPlan.created_at,
        updated_at: savedPlan.updated_at,
      },
      initialTip: {
        id: tipId,
        ...initialTip,
      },
    });
  } catch (error: any) {
    console.error('Error generating workout plan:', error);
    res.status(500).json({ success: false, error: error.message || 'Plan generation failed' });
  }
});

// 4. Scenario 2: Refine Workout Plan via Feedback
app.post('/api/plan/refine', async (req: Request, res: Response) => {
  try {
    const { plan_id, feedback } = req.body;
    if (!plan_id || !feedback || !feedback.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Both plan_id and feedback string are required to refine a plan.',
      });
    }

    const existingRecord = await getPlanById(plan_id);
    if (!existingRecord) {
      return res.status(404).json({ success: false, error: 'Workout plan not found' });
    }

    const user = await getUserById(existingRecord.user_id);
    const existingPlanData = JSON.parse(existingRecord.plan_json);

    let feedbackHistory: any[] = [];
    try {
      feedbackHistory = JSON.parse(existingRecord.feedback_history_json || '[]');
    } catch {
      feedbackHistory = [];
    }

    // Call Gemini refinement
    const refinementResult = await refineWorkoutPlan({
      existingPlan: existingPlanData,
      feedback: feedback.trim(),
      userProfile: {
        name: user ? user.name : 'Athlete',
        age: user ? user.age : 28,
        weight: user ? user.weight : 70,
        weightUnit: user ? user.weight_unit : 'kg',
        goal: existingRecord.goal,
        intensity: existingRecord.intensity,
      },
    });

    const newVersion = existingRecord.version + 1;
    feedbackHistory.push({
      version: newVersion,
      feedback: feedback.trim(),
      changesSummary: refinementResult.changesSummary,
      appliedAt: new Date().toISOString(),
    });

    // Save updated plan in SQLite
    const updatedRecord = await saveWorkoutPlan({
      id: existingRecord.id,
      user_id: existingRecord.user_id,
      title: refinementResult.updatedPlan.title,
      summary: refinementResult.updatedPlan.summary,
      goal: existingRecord.goal,
      intensity: existingRecord.intensity,
      plan_json: JSON.stringify(refinementResult.updatedPlan),
      version: newVersion,
      feedback_history_json: JSON.stringify(feedbackHistory),
    });

    res.json({
      success: true,
      changesSummary: refinementResult.changesSummary,
      plan: {
        id: updatedRecord.id,
        user_id: updatedRecord.user_id,
        title: updatedRecord.title,
        summary: updatedRecord.summary,
        goal: updatedRecord.goal,
        intensity: updatedRecord.intensity,
        version: updatedRecord.version,
        plan_data: refinementResult.updatedPlan,
        feedback_history: feedbackHistory,
        updated_at: updatedRecord.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error refining plan:', error);
    res.status(500).json({ success: false, error: error.message || 'Plan refinement failed' });
  }
});

// 5. Scenario 3: Targeted Nutrition & Recovery Tip
app.post('/api/tips/generate', async (req: Request, res: Response) => {
  try {
    const { goal, intensity = 'medium', category = 'nutrition', user_id, specific_query } = req.body;
    if (!goal) {
      return res.status(400).json({ success: false, error: 'Goal is required to generate targeted tips' });
    }

    let userName = 'Athlete';
    if (user_id) {
      const user = await getUserById(user_id);
      if (user) userName = user.name;
    }

    const tipData = await generateNutritionTip({
      goal,
      intensity,
      category,
      userName,
      specificQuery: specific_query,
    });

    const tipId = `tip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await saveNutritionTip({
      id: tipId,
      user_id: user_id || undefined,
      goal,
      category: tipData.category,
      title: tipData.title,
      tip: tipData.tip,
      actionable_step: tipData.actionableStep,
      why_it_works: tipData.whyItWorks,
      suggested_meals_json: JSON.stringify(tipData.suggestedMeals),
      hydration_tip: tipData.hydrationTip,
      created_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      tip: {
        id: tipId,
        user_id,
        ...tipData,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating nutrition tip:', error);
    res.status(500).json({ success: false, error: error.message || 'Tip generation failed' });
  }
});

// 6. List nutrition tips
app.get('/api/tips', async (req: Request, res: Response) => {
  try {
    const goal = req.query.goal as string | undefined;
    const userId = req.query.userId as string | undefined;
    const rawTips = await getNutritionTips(goal, userId);
    const parsed = rawTips.map((t) => ({
      ...t,
      suggested_meals: t.suggested_meals_json ? JSON.parse(t.suggested_meals_json) : [],
    }));
    res.json({ success: true, tips: parsed });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Workout progress tracking
app.get('/api/progress/:userId/:planId', async (req: Request, res: Response) => {
  try {
    const { userId, planId } = req.params;
    const logs = await getWorkoutLogs(userId, planId);
    const parsed = logs.map((l) => ({
      ...l,
      completed_exercises: l.completed_exercises_json ? JSON.parse(l.completed_exercises_json) : [],
    }));
    res.json({ success: true, logs: parsed });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/progress/toggle-exercise', async (req: Request, res: Response) => {
  try {
    const { userId, planId, dayNumber, exerciseName, completed } = req.body;
    if (!userId || !planId || dayNumber === undefined || !exerciseName) {
      return res.status(400).json({ success: false, error: 'Missing required progress parameters' });
    }
    const updatedLogs = await toggleExerciseLog(userId, planId, Number(dayNumber), exerciseName, !!completed);
    res.json({
      success: true,
      logs: updatedLogs.map((l) => ({
        ...l,
        completed_exercises: l.completed_exercises_json ? JSON.parse(l.completed_exercises_json) : [],
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/progress/toggle-day', async (req: Request, res: Response) => {
  try {
    const { userId, planId, dayNumber, completed } = req.body;
    if (!userId || !planId || dayNumber === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }
    const updatedLogs = await toggleDayCompleted(userId, planId, Number(dayNumber), !!completed);
    res.json({
      success: true,
      logs: updatedLogs.map((l) => ({
        ...l,
        completed_exercises: l.completed_exercises_json ? JSON.parse(l.completed_exercises_json) : [],
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. SQLite database inspector endpoint
app.get('/api/database/summary', async (_req: Request, res: Response) => {
  try {
    const summary = await getDatabaseSummary();
    res.json({ success: true, summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Interactive API docs specification
app.get('/api/docs', (_req: Request, res: Response) => {
  res.json({
    appName: 'FitBuddy API',
    description: 'AI-Powered Workout & Nutrition Planning API with SQLite Database Support',
    version: '1.0.0',
    endpoints: [
      {
        path: '/api/plan/generate',
        method: 'POST',
        scenario: 'Scenario 1: Generate 7-Day Workout Plan',
        description: 'Takes user personal details (name, age, weight, goal, intensity) and produces a personalized 7-day routine with Gemini AI, saving to SQLite.',
        bodyExample: {
          name: 'Sarah Connor',
          age: 29,
          weight: 65,
          weight_unit: 'kg',
          goal: 'weight_loss',
          intensity: 'high',
          experience_level: 'intermediate',
        },
      },
      {
        path: '/api/plan/refine',
        method: 'POST',
        scenario: 'Scenario 2: Feedback & Dynamic Plan Refinement',
        description: 'Accepts feedback on an existing plan (e.g. "more focus on cardio" or "include more rest days") and regenerates the updated plan with changes summary.',
        bodyExample: {
          plan_id: 'plan_123456',
          feedback: 'more focus on cardio and reduce shoulder strain',
        },
      },
      {
        path: '/api/tips/generate',
        method: 'POST',
        scenario: 'Scenario 3: Targeted Nutrition & Recovery Tip',
        description: 'Delivers a concise, actionable nutritional or recovery recommendation tailored to the user fitness goal.',
        bodyExample: {
          goal: 'muscle_gain',
          intensity: 'high',
          category: 'nutrition',
        },
      },
      {
        path: '/api/users',
        method: 'GET',
        description: 'Retrieves all saved user profiles from SQLite database.',
      },
      {
        path: '/api/database/summary',
        method: 'GET',
        description: 'Inspects SQLite tables (users, workout_plans, nutrition_tips, workout_logs) in real time.',
      },
    ],
  });
});

// Serve frontend: Vite dev middleware in development, static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FitBuddy server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start FitBuddy server:', err);
});
