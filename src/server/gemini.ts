import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  duration?: string;
  rest: string;
  targetMuscle: string;
  tips: string;
  alternative?: string;
}

export interface DayWorkout {
  dayNumber: number;
  dayName: string;
  focus: string;
  isRestDay: boolean;
  warmup: {
    duration: string;
    exercises: string[];
  };
  exercises: Exercise[];
  cooldown: {
    duration: string;
    exercises: string[];
  };
  estimatedCalories: number;
  coachNote: string;
}

export interface WorkoutPlanData {
  title: string;
  summary: string;
  weeklyFocus: string;
  primaryGoal: string;
  intensity: string;
  nutritionHighlight: string;
  days: DayWorkout[];
}

export interface FeedbackRefinementResult {
  updatedPlan: WorkoutPlanData;
  changesSummary: string;
}

export interface NutritionRecoveryTip {
  title: string;
  goal: string;
  category: 'nutrition' | 'recovery' | 'hydration' | 'timing';
  tip: string;
  actionableStep: string;
  whyItWorks: string;
  suggestedMeals: string[];
  hydrationTip: string;
}

// Scenario 1: Generate 7-Day Workout Plan
export async function generateWorkoutPlan(params: {
  name: string;
  age: number;
  weight: number;
  weightUnit: string;
  goal: string;
  intensity: string;
  experienceLevel?: string;
  equipment?: string;
  specialRequests?: string;
}): Promise<WorkoutPlanData> {
  const {
    name,
    age,
    weight,
    weightUnit,
    goal,
    intensity,
    experienceLevel = 'intermediate',
    equipment = 'standard gym or dumbbells',
    specialRequests = '',
  } = params;

  const prompt = `You are FitBuddy, an elite certified fitness trainer, sports scientist, and exercise physiologist.
Create a personalized, scientifically sound 7-Day Workout Plan for:
- User Name: ${name}
- Age: ${age} years old
- Weight: ${weight} ${weightUnit}
- Primary Fitness Goal: ${goal} (e.g. weight loss, muscle gain, general wellness, endurance, athletic toning)
- Preferred Workout Intensity: ${intensity} (low, medium, or high)
- Experience Level: ${experienceLevel}
- Available Equipment: ${equipment}
${specialRequests ? `- Special Requests/Injuries: ${specialRequests}` : ''}

CRITICAL REQUIREMENTS:
1. Provide an exact 7-day schedule (Day 1 through Day 7).
2. For high intensity: 4-5 rigorous workout days, 1-2 active recovery/cardio, 1 rest day.
3. For medium intensity: 3-4 structured workout days, 2 active recovery/mobility, 1-2 rest days.
4. For low intensity / wellness: 3 gentle strength or cardio days, 3 mobility/brisk walking days, 1 complete rest day.
5. Tailor exercise choices, rep ranges, sets, and rest intervals directly to the primary goal:
   - "weight loss": high metabolic conditioning, supersets, cardiovascular intervals, functional compound movements.
   - "muscle gain": progressive overload, hypertrophy rep ranges (8-12 reps), adequate rest (60-90s), compound lifts.
   - "general wellness": balanced functional movements, core stability, joint mobility, moderate heart rate training.
6. Each workout day must have warmup, 4 to 6 specific exercises with sets, reps, rest time, target muscle, practical form tips, and cooldown.
7. Return strictly valid JSON matching the requested schema.`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not configured, using fallback intelligent plan generator');
      return getFallbackWorkoutPlan(params);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are FitBuddy, a top-tier fitness and sports science AI. Always output clean, valid, detailed JSON without markdown wrapping.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            weeklyFocus: { type: Type.STRING },
            primaryGoal: { type: Type.STRING },
            intensity: { type: Type.STRING },
            nutritionHighlight: { type: Type.STRING },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER },
                  dayName: { type: Type.STRING },
                  focus: { type: Type.STRING },
                  isRestDay: { type: Type.BOOLEAN },
                  warmup: {
                    type: Type.OBJECT,
                    properties: {
                      duration: { type: Type.STRING },
                      exercises: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: ['duration', 'exercises'],
                  },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        sets: { type: Type.INTEGER },
                        reps: { type: Type.STRING },
                        duration: { type: Type.STRING },
                        rest: { type: Type.STRING },
                        targetMuscle: { type: Type.STRING },
                        tips: { type: Type.STRING },
                        alternative: { type: Type.STRING },
                      },
                      required: ['name', 'sets', 'reps', 'rest', 'targetMuscle', 'tips'],
                    },
                  },
                  cooldown: {
                    type: Type.OBJECT,
                    properties: {
                      duration: { type: Type.STRING },
                      exercises: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: ['duration', 'exercises'],
                  },
                  estimatedCalories: { type: Type.INTEGER },
                  coachNote: { type: Type.STRING },
                },
                required: [
                  'dayNumber',
                  'dayName',
                  'focus',
                  'isRestDay',
                  'warmup',
                  'exercises',
                  'cooldown',
                  'estimatedCalories',
                  'coachNote',
                ],
              },
            },
          },
          required: [
            'title',
            'summary',
            'weeklyFocus',
            'primaryGoal',
            'intensity',
            'nutritionHighlight',
            'days',
          ],
        },
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text) as WorkoutPlanData;
    return parsed;
  } catch (error) {
    console.error('Gemini plan generation error:', error);
    return getFallbackWorkoutPlan(params);
  }
}

// Scenario 2: Refine Workout Plan based on User Feedback
export async function refineWorkoutPlan(params: {
  existingPlan: WorkoutPlanData;
  feedback: string;
  userProfile: {
    name: string;
    age: number;
    weight: number;
    weightUnit: string;
    goal: string;
    intensity: string;
  };
}): Promise<FeedbackRefinementResult> {
  const { existingPlan, feedback, userProfile } = params;

  const prompt = `You are FitBuddy AI. A user is submitting feedback on their current 7-day workout plan.
User Profile:
- Name: ${userProfile.name}
- Age: ${userProfile.age}
- Weight: ${userProfile.weight} ${userProfile.weightUnit}
- Goal: ${userProfile.goal}
- Intensity: ${userProfile.intensity}

Current Workout Plan:
Title: ${existingPlan.title}
Weekly Focus: ${existingPlan.weeklyFocus}
Days Summary: ${existingPlan.days.map((d) => `Day ${d.dayNumber}: ${d.dayName} (${d.focus}, ${d.isRestDay ? 'Rest' : d.exercises.length + ' exercises'})`).join('; ')}

USER FEEDBACK:
"${feedback}"
Examples of feedback might be "more focus on cardio", "include more rest days", "remove squats due to knee pain", "make sessions 30 mins max".

YOUR TASK:
1. Regenerate and adjust the 7-day workout plan to directly incorporate the user's feedback while preserving their primary goal (${userProfile.goal}).
2. Provide a clear, concise bulleted or sentence summary of the exact modifications made in the 'changesSummary' field (e.g., "Increased HIIT cardio intervals on Days 2 & 5, converted Day 4 into an active rest & mobility day, replaced high-impact jumping exercises with joint-friendly cycling").
3. Ensure all 7 days are complete and structured.`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not configured, using fallback refinement generator');
      return getFallbackRefinedPlan(existingPlan, feedback, userProfile);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are FitBuddy AI coach. Output strictly valid JSON responding to plan refinement.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            changesSummary: {
              type: Type.STRING,
              description: 'Summary of how the plan was modified according to feedback',
            },
            updatedPlan: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                weeklyFocus: { type: Type.STRING },
                primaryGoal: { type: Type.STRING },
                intensity: { type: Type.STRING },
                nutritionHighlight: { type: Type.STRING },
                days: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      dayNumber: { type: Type.INTEGER },
                      dayName: { type: Type.STRING },
                      focus: { type: Type.STRING },
                      isRestDay: { type: Type.BOOLEAN },
                      warmup: {
                        type: Type.OBJECT,
                        properties: {
                          duration: { type: Type.STRING },
                          exercises: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                          },
                        },
                        required: ['duration', 'exercises'],
                      },
                      exercises: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            sets: { type: Type.INTEGER },
                            reps: { type: Type.STRING },
                            duration: { type: Type.STRING },
                            rest: { type: Type.STRING },
                            targetMuscle: { type: Type.STRING },
                            tips: { type: Type.STRING },
                            alternative: { type: Type.STRING },
                          },
                          required: ['name', 'sets', 'reps', 'rest', 'targetMuscle', 'tips'],
                        },
                      },
                      cooldown: {
                        type: Type.OBJECT,
                        properties: {
                          duration: { type: Type.STRING },
                          exercises: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                          },
                        },
                        required: ['duration', 'exercises'],
                      },
                      estimatedCalories: { type: Type.INTEGER },
                      coachNote: { type: Type.STRING },
                    },
                    required: [
                      'dayNumber',
                      'dayName',
                      'focus',
                      'isRestDay',
                      'warmup',
                      'exercises',
                      'cooldown',
                      'estimatedCalories',
                      'coachNote',
                    ],
                  },
                },
              },
              required: [
                'title',
                'summary',
                'weeklyFocus',
                'primaryGoal',
                'intensity',
                'nutritionHighlight',
                'days',
              ],
            },
          },
          required: ['changesSummary', 'updatedPlan'],
        },
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text) as FeedbackRefinementResult;
    return parsed;
  } catch (error) {
    console.error('Gemini refinement error:', error);
    return getFallbackRefinedPlan(existingPlan, feedback, userProfile);
  }
}

// Scenario 3: Targeted Nutrition & Recovery Tip
export async function generateNutritionTip(params: {
  goal: string;
  intensity: string;
  category?: string;
  userName?: string;
  specificQuery?: string;
}): Promise<NutritionRecoveryTip> {
  const { goal, intensity, category = 'nutrition', userName = 'Athlete', specificQuery } = params;

  const prompt = `You are FitBuddy's sports nutritionist and recovery specialist.
Generate a concise, highly targeted, evidence-based nutrition or recovery tip for:
- User Name: ${userName}
- Fitness Goal: ${goal} (e.g. weight loss, muscle gain, general wellness, endurance)
- Current Workout Intensity: ${intensity}
- Focus Category: ${category} (nutrition, recovery, hydration, or timing)
${specificQuery ? `- User Query / Request: ${specificQuery}` : ''}

EXAMPLES:
- For "muscle gain": "Include 25-35g of high-leucine protein (whey, Greek yogurt, or chicken breast) within 60-90 minutes post-workout to trigger muscle protein synthesis."
- For "weight loss": "Prioritize high-volume, fiber-rich vegetables and lean protein before carbohydrates to sustain satiety and regulate postprandial glucose."
- For "wellness": "Incorporate dynamic mobility and magnesium-rich foods in the evening to enhance parasympathetic nervous recovery."

Return strictly JSON matching the required schema.`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not configured, using fallback nutrition tip');
      return getFallbackNutritionTip(params);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are an expert sports nutrition and exercise recovery scientist. Deliver actionable, concise, motivating recommendations in JSON format.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            goal: { type: Type.STRING },
            category: {
              type: Type.STRING,
              enum: ['nutrition', 'recovery', 'hydration', 'timing'],
            },
            tip: { type: Type.STRING },
            actionableStep: { type: Type.STRING },
            whyItWorks: { type: Type.STRING },
            suggestedMeals: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            hydrationTip: { type: Type.STRING },
          },
          required: [
            'title',
            'goal',
            'category',
            'tip',
            'actionableStep',
            'whyItWorks',
            'suggestedMeals',
            'hydrationTip',
          ],
        },
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text) as NutritionRecoveryTip;
    return parsed;
  } catch (error) {
    console.error('Gemini nutrition tip error:', error);
    return getFallbackNutritionTip(params);
  }
}

// Fallback Generators for offline / local resilience
function getFallbackWorkoutPlan(params: {
  name: string;
  age: number;
  weight: number;
  weightUnit: string;
  goal: string;
  intensity: string;
}): WorkoutPlanData {
  const isMuscle = params.goal.toLowerCase().includes('muscle');
  const isLoss = params.goal.toLowerCase().includes('loss') || params.goal.toLowerCase().includes('weight');

  return {
    title: `${params.name}'s Personalized 7-Day ${isMuscle ? 'Muscle Hypertrophy' : isLoss ? 'Fat Burn & Conditioning' : 'Total Body Wellness'} Plan`,
    summary: `Tailored for ${params.name} (${params.age}yo, ${params.weight}${params.weightUnit}) with a ${params.intensity} intensity target for ${params.goal}.`,
    weeklyFocus: isMuscle ? 'Progressive mechanical tension and muscle fiber recruitment' : isLoss ? 'Metabolic rate elevation and core stability' : 'Functional strength and joint mobility',
    primaryGoal: params.goal,
    intensity: params.intensity,
    nutritionHighlight: isMuscle ? 'Aim for 1.6-2.0g protein per kg of bodyweight.' : 'Maintain a slight 300-500 kcal deficit while keeping protein high.',
    days: [
      {
        dayNumber: 1,
        dayName: 'Day 1 - Push Power & Core',
        focus: isMuscle ? 'Chest, Shoulders & Triceps' : 'Full Body Metabolic Push',
        isRestDay: false,
        warmup: {
          duration: '6 mins',
          exercises: ['Arm Circles & Shoulder Dislocates', 'Inchworms to Push-up', 'Cat-Cow Stretch'],
        },
        exercises: [
          {
            name: isMuscle ? 'Dumbbell Bench Press' : 'Push-Ups to Pike',
            sets: 4,
            reps: isMuscle ? '8-10' : '12-15',
            rest: '60s',
            targetMuscle: 'Pectorals & Triceps',
            tips: 'Keep scapulae retracted and lower with a controlled 2-second eccentric phase.',
            alternative: 'Floor Dumbbell Press',
          },
          {
            name: 'Overhead Dumbbell Shoulder Press',
            sets: 3,
            reps: '10-12',
            rest: '60s',
            targetMuscle: 'Anterior & Lateral Deltoids',
            tips: 'Brace your core tightly without arching the lower back.',
          },
          {
            name: 'Incline Dumbbell Flyes',
            sets: 3,
            reps: '12',
            rest: '45s',
            targetMuscle: 'Upper Chest',
            tips: 'Maintain a soft bend at the elbows throughout the fly arc.',
          },
          {
            name: 'Overhead Tricep Extension',
            sets: 3,
            reps: '12-15',
            rest: '45s',
            targetMuscle: 'Long Head Triceps',
            tips: 'Keep elbows tucked in toward temples.',
          },
          {
            name: 'Plank Shoulder Taps',
            sets: 3,
            reps: '20 taps total',
            rest: '30s',
            targetMuscle: 'Core & Anti-rotational Stability',
            tips: 'Minimize hip sway by widening your foot stance.',
          },
        ],
        cooldown: {
          duration: '5 mins',
          exercises: ['Doorway Chest Stretch', 'Cross-Body Shoulder Stretch', 'Child’s Pose'],
        },
        estimatedCalories: params.intensity === 'high' ? 420 : 310,
        coachNote: 'Focus on deliberate mind-muscle connection rather than swinging the weights.',
      },
      {
        dayNumber: 2,
        dayName: 'Day 2 - Pull Strength & Posterior Chain',
        focus: 'Back, Biceps & Hamstrings',
        isRestDay: false,
        warmup: {
          duration: '6 mins',
          exercises: ['Band Pull-Aparts', 'Glute Bridges', 'Torso Twists'],
        },
        exercises: [
          {
            name: 'Bent-Over Dumbbell Rows',
            sets: 4,
            reps: '10-12',
            rest: '60s',
            targetMuscle: 'Latissimus Dorsi & Rhomboids',
            tips: 'Pull elbows toward your hip pockets rather than straight upward.',
          },
          {
            name: 'Romanian Deadlifts',
            sets: 4,
            reps: '10-12',
            rest: '75s',
            targetMuscle: 'Hamstrings & Gluteus Maximus',
            tips: 'Hinge deeply at the hips while maintaining a neutral spine.',
          },
          {
            name: 'Single-Arm Dumbbell Rows',
            sets: 3,
            reps: '10 each side',
            rest: '45s',
            targetMuscle: 'Middle Traps & Lats',
            tips: 'Squeeze the shoulder blade at the peak of contraction.',
          },
          {
            name: 'Standing Alternating Bicep Curls',
            sets: 3,
            reps: '12',
            rest: '45s',
            targetMuscle: 'Biceps Brachii',
            tips: 'Supinate your wrists as you ascend.',
          },
          {
            name: 'Deadbugs',
            sets: 3,
            reps: '12 each side',
            rest: '30s',
            targetMuscle: 'Transverse Abdominis',
            tips: 'Press your lower spine firmly flat against the floor.',
          },
        ],
        cooldown: {
          duration: '5 mins',
          exercises: ['Seated Hamstring Stretch', 'Cobra Stretch', 'Kneeling Lat Stretch'],
        },
        estimatedCalories: params.intensity === 'high' ? 440 : 330,
        coachNote: 'Feel the stretch across your back muscles on every repetition.',
      },
      {
        dayNumber: 3,
        dayName: 'Day 3 - Active Recovery & Mobility Flow',
        focus: 'Joint Health, Flexibility & Lymphatic Flow',
        isRestDay: true,
        warmup: {
          duration: '5 mins',
          exercises: ['Deep Diaphragmatic Breathing', 'Ankle & Wrist Rotations'],
        },
        exercises: [
          {
            name: '30-Minute Low-Intensity Walk',
            sets: 1,
            reps: '30 mins',
            duration: '30 mins',
            rest: 'None',
            targetMuscle: 'Cardiovascular Aerobic Base',
            tips: 'Keep a conversational pace (Zone 2 heart rate).',
          },
          {
            name: 'Full Body Mobility Flow',
            sets: 3,
            reps: '10 reps each',
            rest: '30s',
            targetMuscle: 'Thoracic Spine, Hips & Ankles',
            tips: 'World’s greatest stretch, 90/90 hip switches, and downward dog.',
          },
        ],
        cooldown: {
          duration: '5 mins',
          exercises: ['Legs-Up-The-Wall Pose', 'Guided Box Breathing (4-4-4-4)'],
        },
        estimatedCalories: 150,
        coachNote: 'Rest days are when muscle fibers rebuild stronger. Stay well-hydrated!',
      },
      {
        dayNumber: 4,
        dayName: 'Day 4 - Lower Body Quads & Calves',
        focus: 'Leg Power & Knee Stability',
        isRestDay: false,
        warmup: {
          duration: '7 mins',
          exercises: ['Bodyweight Squats', 'Leg Swings (Front/Back & Side)', 'Cossack Squats'],
        },
        exercises: [
          {
            name: 'Goblet Squats',
            sets: 4,
            reps: '10-12',
            rest: '75s',
            targetMuscle: 'Quadriceps & Glutes',
            tips: 'Keep chest proud and elbows tucked inside the knees at bottom.',
          },
          {
            name: 'Walking Dumbbell Lunges',
            sets: 3,
            reps: '12 strides per leg',
            rest: '60s',
            targetMuscle: 'Quads & Hamstring Balance',
            tips: 'Step forward smoothly with 90-degree bend at both knees.',
          },
          {
            name: 'Bulgarian Split Squats',
            sets: 3,
            reps: '8-10 per leg',
            rest: '60s',
            targetMuscle: 'Glute Medius & Quad Tear-drop',
            tips: 'Elevate rear foot on bench and lean slightly forward.',
          },
          {
            name: 'Standing Calf Raises',
            sets: 4,
            reps: '15-20',
            rest: '45s',
            targetMuscle: 'Gastrocnemius & Soleus',
            tips: 'Pause for a full 1-second squeeze at the apex.',
          },
        ],
        cooldown: {
          duration: '6 mins',
          exercises: ['Standing Quad Stretch', 'Figure Four Glute Stretch', 'Calf Wall Stretch'],
        },
        estimatedCalories: params.intensity === 'high' ? 460 : 350,
        coachNote: 'Lower body work burns high metabolic energy. Fuel with clean complex carbs.',
      },
      {
        dayNumber: 5,
        dayName: 'Day 5 - Metabolic Conditioning & Core',
        focus: 'Cardio Intervals & Abdominal Definition',
        isRestDay: false,
        warmup: {
          duration: '5 mins',
          exercises: ['Jumping Jacks', 'High Knees', 'Mountain Climbers'],
        },
        exercises: [
          {
            name: 'Kettlebell or Dumbbell Swings',
            sets: 4,
            reps: '15',
            rest: '45s',
            targetMuscle: 'Glutes, Lower Back & Hamstrings',
            tips: 'Explosive hip snap without pulling using arm strength.',
          },
          {
            name: 'Mountain Climbers to Push-up',
            sets: 4,
            reps: '30 seconds',
            duration: '30s work / 30s rest',
            rest: '30s',
            targetMuscle: 'Full Body Conditioning',
            tips: 'Keep hips low and drive knees rapidly toward chest.',
          },
          {
            name: 'Dumbbell Renegade Rows',
            sets: 3,
            reps: '8 each arm',
            rest: '45s',
            targetMuscle: 'Core & Upper Back',
            tips: 'Resist rotating your torso as you row.',
          },
          {
            name: 'Bicycle Crunches',
            sets: 3,
            reps: '20 total',
            rest: '30s',
            targetMuscle: 'Obliques & Rectus Abdominis',
            tips: 'Rotate shoulder toward opposite knee rather than pulling neck.',
          },
        ],
        cooldown: {
          duration: '5 mins',
          exercises: ['Seated Butterfly Stretch', 'Cobra Ab Stretch', 'Hamstring Fold'],
        },
        estimatedCalories: params.intensity === 'high' ? 430 : 320,
        coachNote: 'Maintain steady pacing through the intervals to optimize fat oxidation.',
      },
      {
        dayNumber: 6,
        dayName: 'Day 6 - Total Body Functional Circuit',
        focus: 'Muscular Endurance & Agility',
        isRestDay: false,
        warmup: {
          duration: '6 mins',
          exercises: ['Arm Hugs & Butt Kicks', 'Bear Crawl Hold', 'Dynamic Hip Openers'],
        },
        exercises: [
          {
            name: 'Dumbbell Thrusters',
            sets: 4,
            reps: '10-12',
            rest: '60s',
            targetMuscle: 'Legs, Core & Shoulders',
            tips: 'Use leg drive momentum from squat to press overhead.',
          },
          {
            name: 'Dumbbell Farmer’s Walk',
            sets: 3,
            reps: '45 seconds',
            duration: '45s',
            rest: '45s',
            targetMuscle: 'Grip Strength, Forearms & Trapezius',
            tips: 'Stand tall with shoulders rolled back; take steady, measured strides.',
          },
          {
            name: 'Bodyweight Dips (Bench or Parallel)',
            sets: 3,
            reps: '10-15',
            rest: '45s',
            targetMuscle: 'Triceps & Lower Pectorals',
            tips: 'Lower until elbows reach roughly 90 degrees.',
          },
          {
            name: 'Russian Twists with Weight',
            sets: 3,
            reps: '20 taps',
            rest: '30s',
            targetMuscle: 'Rotational Core',
            tips: 'Elevate heels slightly if intermediate/advanced.',
          },
        ],
        cooldown: {
          duration: '5 mins',
          exercises: ['Standing Side Stretches', 'Child’s Pose with Side Reach', 'Deep Breathing'],
        },
        estimatedCalories: params.intensity === 'high' ? 450 : 340,
        coachNote: 'Push through the final circuit—this solidifies your weekly consistency!',
      },
      {
        dayNumber: 7,
        dayName: 'Day 7 - Complete Rest & Restoration',
        focus: 'Neural Recovery & Sleep Optimization',
        isRestDay: true,
        warmup: {
          duration: '5 mins',
          exercises: ['Gentle Neck Rolls', 'Shoulder Shrugs & Deep Belly Breaths'],
        },
        exercises: [
          {
            name: 'Gentle Restorative Stretching / Yin Yoga',
            sets: 1,
            reps: '20 mins',
            duration: '20 mins',
            rest: 'None',
            targetMuscle: 'Total Body Fascia & Tendons',
            tips: 'Hold each relaxing stretch for 45-60 seconds without bouncing.',
          },
        ],
        cooldown: {
          duration: '5 mins',
          exercises: ['Savasana / Relaxed Supine Meditation'],
        },
        estimatedCalories: 100,
        coachNote: 'Celebrate completing your 7-day training cycle! Prepare mentally for week 2.',
      },
    ],
  };
}

function getFallbackRefinedPlan(
  existing: WorkoutPlanData,
  feedback: string,
  userProfile: any
): FeedbackRefinementResult {
  const lowerFb = feedback.toLowerCase();
  const updatedDays = JSON.parse(JSON.stringify(existing.days)) as DayWorkout[];

  let summary = `Updated your 7-day routine based on: "${feedback}".`;

  if (lowerFb.includes('cardio') || lowerFb.includes('aerobic')) {
    summary = 'Added dedicated 15-minute HIIT and Zone-2 cardio blocks across training days, and integrated dynamic jump rope intervals.';
    updatedDays.forEach((day) => {
      if (!day.isRestDay) {
        day.exercises.push({
          name: 'Cardio Interval Blast (Jump Rope or High Knees)',
          sets: 3,
          reps: '45s work / 15s rest',
          duration: '3 mins',
          rest: '30s',
          targetMuscle: 'Cardiovascular System',
          tips: 'Keep pace steady to maximize caloric burn and VO2 max.',
        });
        day.estimatedCalories = Math.round(day.estimatedCalories * 1.15);
      }
    });
  } else if (lowerFb.includes('rest') || lowerFb.includes('recover') || lowerFb.includes('tired')) {
    summary = 'Converted Day 5 into a restorative mobility and active recovery day to optimize neuromuscular recovery and reduce fatigue.';
    if (updatedDays[4]) {
      updatedDays[4].isRestDay = true;
      updatedDays[4].dayName = 'Day 5 - Restorative Mobility & Active Recovery';
      updatedDays[4].focus = 'Joint Decompression & Foam Rolling';
      updatedDays[4].exercises = [
        {
          name: 'Full Body Foam Rolling & Fascial Release',
          sets: 1,
          reps: '15 mins',
          rest: 'None',
          targetMuscle: 'Fascia & Muscle Recovery',
          tips: 'Roll tender spots slowly, pausing on trigger points.',
        },
        {
          name: 'Deep Parasympathetic Breathing Flow',
          sets: 1,
          reps: '10 mins',
          rest: 'None',
          targetMuscle: 'Nervous System Recovery',
          tips: 'Inhale for 4 seconds, exhale for 6 seconds.',
        },
      ];
      updatedDays[4].estimatedCalories = 120;
    }
  } else if (lowerFb.includes('knee') || lowerFb.includes('joint') || lowerFb.includes('impact')) {
    summary = 'Replaced high-impact lower body exercises with knee-friendly alternatives (glute bridges, box step-ups, straight-leg deadlifts) without deep patellar stress.';
    updatedDays.forEach((day) => {
      day.exercises = day.exercises.map((ex) => {
        if (ex.name.toLowerCase().includes('squat') || ex.name.toLowerCase().includes('jump')) {
          return {
            ...ex,
            name: 'Low-Impact Elevated Glute Bridge & Step-Ups',
            targetMuscle: 'Glutes & Hamstrings (Zero Knee Stress)',
            tips: 'Drive strictly through the heels with no knee shearing force.',
          };
        }
        return ex;
      });
    });
  }

  return {
    updatedPlan: {
      ...existing,
      title: `${existing.title} (Refined)`,
      summary: `${existing.summary} [Refinement: ${feedback}]`,
      days: updatedDays,
    },
    changesSummary: summary,
  };
}

function getFallbackNutritionTip(params: {
  goal: string;
  intensity: string;
  category?: string;
}): NutritionRecoveryTip {
  const isMuscle = params.goal.toLowerCase().includes('muscle');
  const isLoss = params.goal.toLowerCase().includes('loss') || params.goal.toLowerCase().includes('weight');

  if (isMuscle) {
    return {
      title: 'Post-Workout Leucine Trigger for Muscle Hypertrophy',
      goal: params.goal,
      category: 'nutrition',
      tip: 'Consume 25 to 35 grams of high-quality protein containing at least 2.5g of leucine within 60 to 90 minutes post-workout.',
      actionableStep: 'Have a post-workout shake with 1 scoop whey/plant protein and 1 banana, or 1 cup of plain Greek yogurt with berries and honey.',
      whyItWorks: 'Leucine acts as the primary chemical trigger for the mTOR pathway, initiating muscle protein synthesis to repair micro-tears induced by weight training.',
      suggestedMeals: [
        'Greek yogurt bowl with chia seeds, banana slices, and walnuts',
        'Grilled chicken breast with roasted sweet potatoes and steamed broccoli',
        'Whey isolate smoothie blended with almond butter, oats, and frozen berries',
        'Tofu & edamame quinoa bowl with avocado and sesame dressing',
      ],
      hydrationTip: 'Drink 500ml of electrolyte water within 30 minutes after training to restore fluid balance.',
    };
  } else if (isLoss) {
    return {
      title: 'Protein Satiety & Glucose Anchoring Strategy',
      goal: params.goal,
      category: 'nutrition',
      tip: 'Structure every meal with a minimum of 30g lean protein and 8-10g dietary fiber before eating starchy carbohydrates.',
      actionableStep: 'Start your lunch and dinner by eating the protein and leafy vegetables first; this blunts blood glucose spikes and suppresses ghrelin (hunger hormone).',
      whyItWorks: 'Protein has the highest thermic effect of food (20-30% of calories burned just digesting it) and maximizes lean muscle preservation during a caloric deficit.',
      suggestedMeals: [
        'Large mixed green salad with grilled salmon, cucumber, and olive oil vinaigrette',
        'Egg white omelet loaded with spinach, mushrooms, and feta cheese',
        'Turkey breast lettuce wraps with hummus and sliced bell peppers',
        'Lentil and vegetable soup with shredded chicken',
      ],
      hydrationTip: 'Drink a full glass of cold water 15 minutes before every meal to boost satiety and digestive enzyme readiness.',
    };
  } else {
    return {
      title: 'Cellular Hydration & Magnesium Recovery for Vitality',
      goal: params.goal,
      category: 'recovery',
      tip: 'Incorporate 300-400mg of elemental magnesium (glycinate or citrate) with your evening meal or before bedtime alongside steady daily hydration.',
      actionableStep: 'Keep a 1-liter reusable bottle by your desk and consume pumpkin seeds, dark leafy greens, or an evening magnesium herbal tea.',
      whyItWorks: 'Magnesium regulates over 300 biochemical reactions including cellular ATP synthesis, muscle relaxation, and deep REM sleep phases.',
      suggestedMeals: [
        'Baked wild cod with sauteed swiss chard and quinoa',
        'Overnight oats made with chia seeds, almond milk, and raw pumpkin seeds',
        'Avocado and smoked salmon on whole grain sourdough',
        'Warm chamomile tea with a squeeze of lemon and a pinch of pink salt',
      ],
      hydrationTip: 'Aim for half your body weight in ounces of pure water daily (e.g., 70kg / 154lbs = ~77 fl oz / 2.3 liters).',
    };
  }
}
