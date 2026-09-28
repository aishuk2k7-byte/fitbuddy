import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Volume2 } from 'lucide-react';

interface RestTimerModalProps {
  initialSeconds: number;
  isOpen: boolean;
  onClose: () => void;
  exerciseName?: string;
}

export const RestTimerModal: React.FC<RestTimerModalProps> = ({
  initialSeconds,
  isOpen,
  onClose,
  exerciseName,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    if (isOpen) {
      setIsActive(true);
    }
  }, [initialSeconds, isOpen]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      setIsActive(false);
      playChime();
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
      // AudioContext may be restricted by browser policy if unprompted
    }
  };

  if (!isOpen) return null;

  const progress = ((initialSeconds - secondsLeft) / initialSeconds) * 100;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Volume2 className="w-3.5 h-3.5" /> Rest Interval
        </div>

        {exerciseName && (
          <h3 className="text-sm text-slate-300 font-medium mb-4 line-clamp-1">
            After: <span className="text-white font-semibold">{exerciseName}</span>
          </h3>
        )}

        {/* Circular Progress & Display */}
        <div className="relative w-44 h-44 mx-auto my-4 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="88"
              cy="88"
              r="76"
              className="text-slate-800"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="88"
              cy="88"
              r="76"
              className={`${secondsLeft === 0 ? 'text-emerald-400' : 'text-emerald-500'} transition-all duration-300`}
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 76}
              strokeDashoffset={2 * Math.PI * 76 * (1 - progress / 100)}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-black tracking-tight text-white font-mono">
              {timeFormatted}
            </span>
            <span className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
              {secondsLeft === 0 ? 'Ready for next set!' : 'Resting'}
            </span>
          </div>
        </div>

        {/* Quick add time buttons */}
        <div className="flex justify-center gap-2 mb-6">
          {[30, 60, 90].map((t) => (
            <button
              key={t}
              onClick={() => {
                setSecondsLeft(t);
                setIsActive(true);
              }}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                secondsLeft === t
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {t}s
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setSecondsLeft(initialSeconds)}
            className="p-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsActive(!isActive)}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
          >
            {isActive ? (
              <>
                <Pause className="w-5 h-5 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" /> {secondsLeft === 0 ? 'Restart' : 'Resume'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
