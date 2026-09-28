import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Table, FileText, CheckCircle, HardDrive } from 'lucide-react';
import { api } from '../services/api';

export const SqliteInspector: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<string>('workout_plans');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDatabaseSummary();
      if (res.success) {
        setSummary(res.summary);
      }
    } catch (e) {
      console.error('Failed to load DB summary:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const tables = summary ? Object.keys(summary) : [];
  const currentTableData = summary?.[selectedTable];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <HardDrive className="w-3.5 h-3.5" /> SQLite Persistent Storage
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Database Inspector: <span className="text-emerald-400 font-mono text-lg sm:text-xl">fitbuddy.db</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time SQLite database viewer. All users, plans, refinements, and nutrition tips persist to disk.
          </p>
        </div>

        <button
          onClick={fetchSummary}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* Table Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'workout_plans', name: 'workout_plans', label: 'Workout Plans' },
          { id: 'nutrition_tips', name: 'nutrition_tips', label: 'Nutrition Tips' },
          { id: 'users', name: 'users', label: 'User Profiles' },
          { id: 'workout_logs', name: 'workout_logs', label: 'Workout Logs' },
        ].map((tbl) => {
          const count = summary?.[tbl.name]?.count ?? 0;
          const isSelected = selectedTable === tbl.name;
          return (
            <button
              key={tbl.id}
              onClick={() => setSelectedTable(tbl.name)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500 shadow-md'
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Table className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                  {count} rows
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-white">
                {tbl.name}
              </div>
              <span className="text-[11px] text-slate-400">{tbl.label}</span>
            </button>
          );
        })}
      </div>

      {/* Table Data View */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white font-mono">
              TABLE: {selectedTable}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing latest {currentTableData?.rows?.length || 0} records
          </span>
        </div>

        {currentTableData?.rows?.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No rows found in <span className="font-mono">{selectedTable}</span>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="space-y-3">
              {currentTableData?.rows?.map((row: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <span className="text-emerald-400 font-bold">
                      ROW #{idx + 1} • ID: {row.id || 'N/A'}
                    </span>
                    {row.updated_at && (
                      <span className="text-slate-400 text-[11px]">
                        Updated: {new Date(row.updated_at).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-slate-300">
                    {Object.entries(row).map(([k, val]) => {
                      if (k.endsWith('_json')) {
                        let parsed = val;
                        try {
                          parsed = JSON.parse(val as string);
                        } catch {}
                        return (
                          <div key={k} className="col-span-full bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 mt-1">
                            <span className="text-emerald-400 font-semibold block mb-1">{k}:</span>
                            <pre className="text-[11px] text-slate-300 overflow-x-auto max-h-48 whitespace-pre-wrap">
                              {typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : String(val)}
                            </pre>
                          </div>
                        );
                      }
                      return (
                        <div key={k} className="truncate">
                          <span className="text-slate-400">{k}:</span>{' '}
                          <span className="text-white font-medium">{String(val)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
