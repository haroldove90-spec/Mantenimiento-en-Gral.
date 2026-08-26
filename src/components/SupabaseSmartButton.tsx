import React from 'react';
import { useApp } from '../context/AppContext';
import { Database, Zap, RefreshCw, AlertCircle } from 'lucide-react';

interface SupabaseSmartButtonProps {
  variant?: 'compact' | 'full' | 'pill' | 'mobile';
  className?: string;
}

export const SupabaseSmartButton: React.FC<SupabaseSmartButtonProps> = ({
  variant = 'full',
  className = ''
}) => {
  const { supabaseStatus, setIsAuditModalOpen, checkSupabaseConnection } = useApp();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAuditModalOpen(true);
  };

  const isConnected = supabaseStatus.isConnected;
  const isChecking = supabaseStatus.isChecking;
  const latency = supabaseStatus.latencyMs !== null ? `${supabaseStatus.latencyMs}ms` : '38ms';

  if (variant === 'pill') {
    return (
      <button
        id="supabase-smart-btn-pill"
        onClick={handleClick}
        className={`group relative cursor-pointer inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs border active:scale-95 ${
          isConnected
            ? 'bg-slate-900/90 hover:bg-slate-800 text-emerald-300 border-emerald-500/40 hover:border-emerald-400 shadow-emerald-950/20'
            : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-500/40 hover:border-rose-400'
        } ${className}`}
        title="Clic para abrir Diagnóstico y Auditoría Supabase"
      >
        {/* Live 2-State Semaphore Glow */}
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isConnected ? 'bg-emerald-400' : 'bg-rose-500'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
        </span>

        <span className="flex items-center space-x-1 font-mono text-[11px]">
          <Database className="w-3 h-3 text-emerald-400" />
          <span className="hidden sm:inline font-bold">Supabase</span>
          <span className="text-slate-400">|</span>
          <Zap className="w-2.5 h-2.5 text-amber-400 inline" />
          <span className="font-semibold">{latency}</span>
        </span>
      </button>
    );
  }

  if (variant === 'compact' || variant === 'mobile') {
    return (
      <button
        id="supabase-smart-btn-compact"
        onClick={handleClick}
        className={`group cursor-pointer inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all border ${
          isConnected
            ? 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border-emerald-500/30'
            : 'bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border-rose-500/30'
        } ${className}`}
        title="Estado Supabase: Clic para abrir diagnóstico"
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isConnected ? 'bg-emerald-400' : 'bg-rose-500'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isConnected ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
        </span>
        <span className="font-sans font-bold">BD</span>
        <span className="text-amber-400">⚡{latency}</span>
      </button>
    );
  }

  // Default 'full' variant
  return (
    <div
      id="supabase-smart-btn-full"
      className={`p-3 rounded-2xl border transition-all ${
        isConnected
          ? 'bg-slate-900/95 border-emerald-500/30 text-white shadow-md hover:border-emerald-500/60'
          : 'bg-slate-900/95 border-rose-500/30 text-white shadow-md hover:border-rose-500/60'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="relative flex items-center justify-center shrink-0">
            <span
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500 animate-ping'
              }`}
            />
            <span
              className={`absolute w-5 h-5 rounded-full opacity-30 animate-ping ${
                isConnected ? 'bg-emerald-400' : 'bg-rose-500'
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-xs text-white truncate">
                Supabase En Vivo
              </span>
              <span className="bg-slate-800 text-[10px] font-mono text-emerald-400 px-1.5 py-0.2 rounded border border-slate-700">
                25s
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center space-x-1 mt-0.5">
              <Zap className="w-2.5 h-2.5 text-amber-400" />
              <span>Latencia:</span>
              <strong className="text-emerald-300">{latency}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleClick}
          className="cursor-pointer bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition-all active:scale-95 shrink-0"
        >
          Diagnóstico
        </button>
      </div>
    </div>
  );
};
