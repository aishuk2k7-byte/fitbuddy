import React, { useState } from 'react';
import { Code2, Play, Terminal, CheckCircle2, Copy, AlertCircle } from 'lucide-react';

interface EndpointConfig {
  id: string;
  name: string;
  method: 'GET' | 'POST';
  path: string;
  scenario: string;
  description: string;
  defaultBody?: any;
}

const ENDPOINTS: EndpointConfig[] = [
  {
    id: 'generate_plan',
    name: 'Generate 7-Day Workout Plan',
    method: 'POST',
    path: '/api/plan/generate',
    scenario: 'Scenario 1',
    description: 'Takes user personal information (name, age, weight, goal, intensity) and generates a structured 7-day routine, persisting to SQLite.',
    defaultBody: {
      name: 'Sarah Connor',
      age: 29,
      weight: 64,
      weight_unit: 'kg',
      goal: 'weight_loss',
      intensity: 'high',
      experience_level: 'intermediate',
      equipment: 'Gym or Dumbbells',
      special_requests: 'More focus on cardio and metabolic conditioning',
    },
  },
  {
    id: 'refine_plan',
    name: 'Refine Existing Workout Plan',
    method: 'POST',
    path: '/api/plan/refine',
    scenario: 'Scenario 2',
    description: 'Submits feedback on an existing plan to regenerate the plan and record changes summary in feedback history.',
    defaultBody: {
      plan_id: 'sample_plan_id',
      feedback: 'Include more rest days and add joint mobility exercises',
    },
  },
  {
    id: 'generate_tip',
    name: 'Generate Nutrition & Recovery Tip',
    method: 'POST',
    path: '/api/tips/generate',
    scenario: 'Scenario 3',
    description: 'Delivers a concise, scientifically grounded nutrition or recovery tip matching the selected fitness goal.',
    defaultBody: {
      goal: 'muscle_gain',
      intensity: 'high',
      category: 'nutrition',
      specific_query: 'What is the optimal post-workout protein timing and quantity?',
    },
  },
  {
    id: 'get_users',
    name: 'List Users',
    method: 'GET',
    path: '/api/users',
    scenario: 'Persistence',
    description: 'Returns all saved athlete profiles from the SQLite database.',
  },
  {
    id: 'get_db_summary',
    name: 'Database Summary',
    method: 'GET',
    path: '/api/database/summary',
    scenario: 'Database',
    description: 'Returns table row counts and schema overview for fitbuddy.db.',
  },
];

export const ApiConsole: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointConfig>(ENDPOINTS[0]);
  const [requestBodyText, setRequestBodyText] = useState<string>(
    JSON.stringify(ENDPOINTS[0].defaultBody, null, 2)
  );
  const [responseOutput, setResponseOutput] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const selectEndpoint = (ep: EndpointConfig) => {
    setSelectedEndpoint(ep);
    setRequestBodyText(ep.defaultBody ? JSON.stringify(ep.defaultBody, null, 2) : '');
    setResponseOutput(null);
    setResponseStatus(null);
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setResponseOutput(null);
    const start = performance.now();

    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (selectedEndpoint.method === 'POST') {
        try {
          options.body = JSON.stringify(JSON.parse(requestBodyText));
        } catch {
          alert('Invalid JSON in request body');
          setIsLoading(false);
          return;
        }
      }

      const res = await fetch(selectedEndpoint.path, options);
      const elapsed = Math.round(performance.now() - start);
      setResponseTimeMs(elapsed);
      setResponseStatus(res.status);

      const data = await res.json();
      setResponseOutput(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponseOutput(JSON.stringify({ error: err.message }, null, 2));
      setResponseStatus(500);
    } finally {
      setIsLoading(false);
    }
  };

  const copyCurl = () => {
    let curl = `curl -X ${selectedEndpoint.method} "${window.location.origin}${selectedEndpoint.path}"`;
    if (selectedEndpoint.method === 'POST') {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBodyText.replace(/\n/g, '')}'`;
    }
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Terminal className="w-3.5 h-3.5" /> Interactive REST API Tester
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            FitBuddy API Console
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Test and inspect backend endpoints directly. Corresponds to FastAPI / REST endpoints with Gemini AI and SQLite.
          </p>
        </div>

        <button
          onClick={copyCurl}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all shrink-0 cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>{copied ? 'Copied cURL!' : 'Copy cURL Command'}</span>
        </button>
      </div>

      {/* Main Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Endpoint List */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block px-2 mb-2">
            Available Endpoints
          </span>
          {ENDPOINTS.map((ep) => {
            const isSelected = selectedEndpoint.id === ep.id;
            return (
              <div
                key={ep.id}
                onClick={() => selectEndpoint(ep)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        ep.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="text-xs font-bold text-white truncate">{ep.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {ep.scenario}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 truncate">{ep.path}</p>
              </div>
            );
          })}
        </div>

        {/* Right: Request & Response Inspector */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Endpoint Info */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400">
                  {selectedEndpoint.method}
                </span>
                <span className="text-sm font-mono font-bold text-white">
                  {selectedEndpoint.path}
                </span>
              </div>
              <p className="text-xs text-slate-400">{selectedEndpoint.description}</p>
            </div>

            <button
              onClick={handleExecute}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-slate-950" />
              )}
              <span>Execute</span>
            </button>
          </div>

          {/* Request Body Editor (if POST) */}
          {selectedEndpoint.method === 'POST' && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Request Payload (JSON)
              </span>
              <textarea
                rows={8}
                value={requestBodyText}
                onChange={(e) => setRequestBodyText(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 font-mono text-xs text-emerald-300 border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Response Box */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Response
              </span>
              {responseStatus !== null && (
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span
                    className={`font-bold ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    Status: {responseStatus}
                  </span>
                  {responseTimeMs !== null && (
                    <span className="text-slate-400">{responseTimeMs}ms</span>
                  )}
                </div>
              )}
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto max-h-96 whitespace-pre-wrap border border-slate-800">
              {isLoading
                ? '// Waiting for API response from FitBuddy server...'
                : responseOutput || '// Click "Execute" to trigger this endpoint.'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
