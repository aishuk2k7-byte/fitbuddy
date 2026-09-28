import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let db: Database | null = null;
const DB_FILE = path.resolve(process.cwd(), 'fitbuddy.db');

export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('Could not read existing fitbuddy.db, creating fresh database:', e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Initialize SQLite tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      weight REAL NOT NULL,
      weight_unit TEXT DEFAULT 'kg',
      goal TEXT NOT NULL,
      intensity TEXT NOT NULL,
      experience_level TEXT DEFAULT 'intermediate',
      equipment TEXT DEFAULT 'all',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      goal TEXT NOT NULL,
      intensity TEXT NOT NULL,
      plan_json TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      feedback_history_json TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS nutrition_tips (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      goal TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      tip TEXT NOT NULL,
      actionable_step TEXT NOT NULL,
      why_it_works TEXT,
      suggested_meals_json TEXT,
      hydration_tip TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      day_number INTEGER NOT NULL,
      completed INTEGER DEFAULT 0,
      completed_exercises_json TEXT DEFAULT '[]',
      notes TEXT,
      completed_at TEXT
    );
  `);

  saveDb();
  return db;
}

export function saveDb(): void {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to persist SQLite database to disk:', err);
  }
}

// User helper methods
export interface UserRecord {
  id: string;
  name: string;
  age: number;
  weight: number;
  weight_unit: string;
  goal: string;
  intensity: string;
  experience_level: string;
  equipment: string;
  created_at: string;
  updated_at: string;
}

export async function getAllUsers(): Promise<UserRecord[]> {
  const database = await getDb();
  const stmt = database.prepare('SELECT * FROM users ORDER BY updated_at DESC');
  const results: UserRecord[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as UserRecord);
  }
  stmt.free();
  return results;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const database = await getDb();
  const stmt = database.prepare('SELECT * FROM users WHERE id = :id');
  stmt.bind({ ':id': id });
  if (stmt.step()) {
    const res = stmt.getAsObject() as unknown as UserRecord;
    stmt.free();
    return res;
  }
  stmt.free();
  return null;
}

export async function upsertUser(user: Partial<UserRecord> & { id: string; name: string }): Promise<UserRecord> {
  const database = await getDb();
  const now = new Date().toISOString();
  const existing = await getUserById(user.id);

  if (existing) {
    database.run(
      `UPDATE users SET
        name = :name,
        age = :age,
        weight = :weight,
        weight_unit = :weight_unit,
        goal = :goal,
        intensity = :intensity,
        experience_level = :experience_level,
        equipment = :equipment,
        updated_at = :updated_at
      WHERE id = :id`,
      {
        ':id': user.id,
        ':name': user.name,
        ':age': user.age ?? existing.age,
        ':weight': user.weight ?? existing.weight,
        ':weight_unit': user.weight_unit ?? existing.weight_unit,
        ':goal': user.goal ?? existing.goal,
        ':intensity': user.intensity ?? existing.intensity,
        ':experience_level': user.experience_level ?? existing.experience_level,
        ':equipment': user.equipment ?? existing.equipment,
        ':updated_at': now,
      }
    );
  } else {
    database.run(
      `INSERT INTO users (id, name, age, weight, weight_unit, goal, intensity, experience_level, equipment, created_at, updated_at)
       VALUES (:id, :name, :age, :weight, :weight_unit, :goal, :intensity, :experience_level, :equipment, :created_at, :updated_at)`,
      {
        ':id': user.id,
        ':name': user.name,
        ':age': user.age ?? 28,
        ':weight': user.weight ?? 70,
        ':weight_unit': user.weight_unit ?? 'kg',
        ':goal': user.goal ?? 'weight_loss',
        ':intensity': user.intensity ?? 'medium',
        ':experience_level': user.experience_level ?? 'intermediate',
        ':equipment': user.equipment ?? 'all',
        ':created_at': now,
        ':updated_at': now,
      }
    );
  }

  saveDb();
  return (await getUserById(user.id))!;
}

// Workout plan helpers
export interface WorkoutPlanRecord {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  goal: string;
  intensity: string;
  plan_json: string;
  version: number;
  feedback_history_json: string;
  created_at: string;
  updated_at: string;
}

export async function getPlanById(planId: string): Promise<WorkoutPlanRecord | null> {
  const database = await getDb();
  const stmt = database.prepare('SELECT * FROM workout_plans WHERE id = :id');
  stmt.bind({ ':id': planId });
  if (stmt.step()) {
    const res = stmt.getAsObject() as unknown as WorkoutPlanRecord;
    stmt.free();
    return res;
  }
  stmt.free();
  return null;
}

export async function getLatestPlanForUser(userId: string): Promise<WorkoutPlanRecord | null> {
  const database = await getDb();
  const stmt = database.prepare('SELECT * FROM workout_plans WHERE user_id = :user_id ORDER BY updated_at DESC LIMIT 1');
  stmt.bind({ ':user_id': userId });
  if (stmt.step()) {
    const res = stmt.getAsObject() as unknown as WorkoutPlanRecord;
    stmt.free();
    return res;
  }
  stmt.free();
  return null;
}

export async function saveWorkoutPlan(plan: {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  goal: string;
  intensity: string;
  plan_json: string;
  version: number;
  feedback_history_json: string;
}): Promise<WorkoutPlanRecord> {
  const database = await getDb();
  const now = new Date().toISOString();
  const existing = await getPlanById(plan.id);

  if (existing) {
    database.run(
      `UPDATE workout_plans SET
        title = :title,
        summary = :summary,
        goal = :goal,
        intensity = :intensity,
        plan_json = :plan_json,
        version = :version,
        feedback_history_json = :feedback_history_json,
        updated_at = :updated_at
      WHERE id = :id`,
      {
        ':id': plan.id,
        ':title': plan.title,
        ':summary': plan.summary,
        ':goal': plan.goal,
        ':intensity': plan.intensity,
        ':plan_json': plan.plan_json,
        ':version': plan.version,
        ':feedback_history_json': plan.feedback_history_json,
        ':updated_at': now,
      }
    );
  } else {
    database.run(
      `INSERT INTO workout_plans (id, user_id, title, summary, goal, intensity, plan_json, version, feedback_history_json, created_at, updated_at)
       VALUES (:id, :user_id, :title, :summary, :goal, :intensity, :plan_json, :version, :feedback_history_json, :created_at, :updated_at)`,
      {
        ':id': plan.id,
        ':user_id': plan.user_id,
        ':title': plan.title,
        ':summary': plan.summary,
        ':goal': plan.goal,
        ':intensity': plan.intensity,
        ':plan_json': plan.plan_json,
        ':version': plan.version,
        ':feedback_history_json': plan.feedback_history_json,
        ':created_at': now,
        ':updated_at': now,
      }
    );
  }

  saveDb();
  return (await getPlanById(plan.id))!;
}

// Nutrition tip helpers
export interface NutritionTipRecord {
  id: string;
  user_id?: string;
  goal: string;
  category: string;
  title: string;
  tip: string;
  actionable_step: string;
  why_it_works?: string;
  suggested_meals_json?: string;
  hydration_tip?: string;
  created_at: string;
}

export async function saveNutritionTip(tip: NutritionTipRecord): Promise<void> {
  const database = await getDb();
  database.run(
    `INSERT INTO nutrition_tips (id, user_id, goal, category, title, tip, actionable_step, why_it_works, suggested_meals_json, hydration_tip, created_at)
     VALUES (:id, :user_id, :goal, :category, :title, :tip, :actionable_step, :why_it_works, :suggested_meals_json, :hydration_tip, :created_at)`,
    {
      ':id': tip.id,
      ':user_id': tip.user_id || null,
      ':goal': tip.goal,
      ':category': tip.category,
      ':title': tip.title,
      ':tip': tip.tip,
      ':actionable_step': tip.actionable_step,
      ':why_it_works': tip.why_it_works || null,
      ':suggested_meals_json': tip.suggested_meals_json || '[]',
      ':hydration_tip': tip.hydration_tip || null,
      ':created_at': tip.created_at || new Date().toISOString(),
    }
  );
  saveDb();
}

export async function getNutritionTips(goal?: string, userId?: string): Promise<NutritionTipRecord[]> {
  const database = await getDb();
  let query = 'SELECT * FROM nutrition_tips';
  const conditions: string[] = [];
  const params: Record<string, string> = {};

  if (userId) {
    conditions.push('(user_id = :userId OR user_id IS NULL)');
    params[':userId'] = userId;
  }
  if (goal) {
    conditions.push('goal = :goal');
    params[':goal'] = goal;
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY created_at DESC LIMIT 50';

  const stmt = database.prepare(query);
  stmt.bind(params);
  const results: NutritionTipRecord[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as NutritionTipRecord);
  }
  stmt.free();
  return results;
}

// Workout progress tracking
export async function getWorkoutLogs(userId: string, planId: string) {
  const database = await getDb();
  const stmt = database.prepare('SELECT * FROM workout_logs WHERE user_id = :userId AND plan_id = :planId');
  stmt.bind({ ':userId': userId, ':planId': planId });
  const logs: any[] = [];
  while (stmt.step()) {
    logs.push(stmt.getAsObject());
  }
  stmt.free();
  return logs;
}

export async function toggleExerciseLog(
  userId: string,
  planId: string,
  dayNumber: number,
  exerciseName: string,
  completed: boolean
) {
  const database = await getDb();
  const stmt = database.prepare('SELECT * FROM workout_logs WHERE user_id = :userId AND plan_id = :planId AND day_number = :dayNumber');
  stmt.bind({ ':userId': userId, ':planId': planId, ':dayNumber': dayNumber });

  let row: any = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();

  const now = new Date().toISOString();
  if (row) {
    let completedExercises: string[] = [];
    try {
      completedExercises = JSON.parse(row.completed_exercises_json || '[]');
    } catch {
      completedExercises = [];
    }

    if (completed) {
      if (!completedExercises.includes(exerciseName)) {
        completedExercises.push(exerciseName);
      }
    } else {
      completedExercises = completedExercises.filter((e) => e !== exerciseName);
    }

    database.run(
      `UPDATE workout_logs SET
        completed_exercises_json = :completed_exercises_json,
        completed_at = :completed_at
       WHERE id = :id`,
      {
        ':id': row.id,
        ':completed_exercises_json': JSON.stringify(completedExercises),
        ':completed_at': now,
      }
    );
  } else {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const completedExercises = completed ? [exerciseName] : [];
    database.run(
      `INSERT INTO workout_logs (id, user_id, plan_id, day_number, completed, completed_exercises_json, completed_at)
       VALUES (:id, :userId, :planId, :dayNumber, 0, :completedExercises, :completed_at)`,
      {
        ':id': id,
        ':userId': userId,
        ':planId': planId,
        ':dayNumber': dayNumber,
        ':completedExercises': JSON.stringify(completedExercises),
        ':completed_at': now,
      }
    );
  }

  saveDb();
  return getWorkoutLogs(userId, planId);
}

export async function toggleDayCompleted(
  userId: string,
  planId: string,
  dayNumber: number,
  completed: boolean
) {
  const database = await getDb();
  const stmt = database.prepare('SELECT * FROM workout_logs WHERE user_id = :userId AND plan_id = :planId AND day_number = :dayNumber');
  stmt.bind({ ':userId': userId, ':planId': planId, ':dayNumber': dayNumber });

  let row: any = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();

  const now = new Date().toISOString();
  if (row) {
    database.run(
      `UPDATE workout_logs SET completed = :completed, completed_at = :completed_at WHERE id = :id`,
      {
        ':id': row.id,
        ':completed': completed ? 1 : 0,
        ':completed_at': now,
      }
    );
  } else {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    database.run(
      `INSERT INTO workout_logs (id, user_id, plan_id, day_number, completed, completed_exercises_json, completed_at)
       VALUES (:id, :userId, :planId, :dayNumber, :completed, '[]', :completed_at)`,
      {
        ':id': id,
        ':userId': userId,
        ':planId': planId,
        ':dayNumber': dayNumber,
        ':completed': completed ? 1 : 0,
        ':completed_at': now,
      }
    );
  }

  saveDb();
  return getWorkoutLogs(userId, planId);
}

export async function getDatabaseSummary() {
  const database = await getDb();
  const tables = ['users', 'workout_plans', 'nutrition_tips', 'workout_logs'];
  const summary: Record<string, { count: number; rows: any[] }> = {};

  for (const table of tables) {
    const countStmt = database.prepare(`SELECT COUNT(*) as c FROM ${table}`);
    countStmt.step();
    const count = (countStmt.getAsObject() as any).c;
    countStmt.free();

    const rowsStmt = database.prepare(`SELECT * FROM ${table} ORDER BY rowid DESC LIMIT 10`);
    const rows: any[] = [];
    while (rowsStmt.step()) {
      rows.push(rowsStmt.getAsObject());
    }
    rowsStmt.free();

    summary[table] = { count, rows };
  }

  return summary;
}
