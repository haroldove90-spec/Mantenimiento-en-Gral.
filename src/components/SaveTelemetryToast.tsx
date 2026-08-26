import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Database, CheckCircle2, AlertCircle, X, Zap, Clock, Hash } from 'lucide-react';

export const SaveTelemetryToast: React.FC = () => {
  const { latestSaveTelemetry, dismissSaveTelemetry, setIsAuditModalOpen } = useApp();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (latestSaveTelemetry) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        dismissSaveTelemetry();
      }, 6500);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [latestSaveTelemetry, dismissSaveTelemetry]);

  if (!latestSaveTelemetry || !isVisible) return null;

  const isSuccess = latestSaveTelemetry.status === 'success';

  return (
    <div
      id="supabase-telemetry-toast"
      className="fixed bottom-20 lg:bottom-6 right-4 z-50 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div
        className={`bg-slate-900/95 backdrop-blur-md text-white border rounded-2xl shadow-2xl p-4 transition-all ${
          isSuccess ? 'border-emerald-500/50 shadow-emerald-950/40' : 'border-rose-500/50 shadow-rose-950/40'
        }`}
      >
        {/* Header with Semáforo and Supabase branding */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="relative flex items-center justify-center">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isSuccess ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500 animate-ping'
                }`}
              />
              <span
                className={`absolute w-4 h-4 rounded-full opacity-40 animate-ping ${
                  isSuccess ? 'bg-emerald-400' : 'bg-rose-500'
                }`}
              />
            </div>
            <div className="flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-extrabold text-xs tracking-wide text-emerald-300">
                {isSuccess ? 'Persistencia Supabase Confirmada' : 'Error en Supabase'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1 bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full text-emerald-400">
              <Zap className="w-2.5 h-2.5 text-amber-400" />
              <span>{latestSaveTelemetry.latencyMs} ms</span>
            </span>
            <button
              onClick={() => {
                setIsVisible(false);
                dismissSaveTelemetry();
              }}
              className="text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-slate-800 transition-colors"
              title="Cerrar telemetría"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="py-2.5 space-y-2 text-xs">
          <div className="flex items-start space-x-2.5">
            {isSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-100 text-xs truncate">
                {latestSaveTelemetry.identifier}
              </p>
              <p className="text-[11px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300">
                  {latestSaveTelemetry.action}
                </span>
                <span className="text-slate-400 font-mono">
                  tabla: <strong className="text-slate-200">{latestSaveTelemetry.table}</strong>
                </span>
              </p>
            </div>
          </div>

          {/* Audit Count & Timestamp Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] font-mono">
            {latestSaveTelemetry.preCount !== undefined && latestSaveTelemetry.postCount !== undefined && (
              <div className="bg-slate-800/80 rounded-lg px-2.5 py-1.5 border border-slate-700/60 flex items-center justify-between">
                <span className="text-slate-400 text-[10px] flex items-center space-x-1">
                  <Hash className="w-3 h-3 text-cyan-400" />
                  <span>Auditoría BD:</span>
                </span>
                <span className="font-bold text-emerald-300 text-[10px]">
                  {latestSaveTelemetry.preCount} ➔ {latestSaveTelemetry.postCount} (
                  {latestSaveTelemetry.deltaCount !== undefined && latestSaveTelemetry.deltaCount >= 0
                    ? `+${latestSaveTelemetry.deltaCount}`
                    : latestSaveTelemetry.deltaCount}
                  )
                </span>
              </div>
            )}

            <div className="bg-slate-800/80 rounded-lg px-2.5 py-1.5 border border-slate-700/60 flex items-center justify-between col-span-full">
              <span className="text-slate-400 text-[10px] flex items-center space-x-1">
                <Clock className="w-3 h-3 text-purple-400" />
                <span>Estampa:</span>
              </span>
              <span className="font-medium text-slate-300 text-[10px] truncate">
                {latestSaveTelemetry.formattedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Button to Open Audit Modal */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 text-[10px]">Guardado en nube Supabase</span>
          <button
            onClick={() => {
              setIsVisible(false);
              setIsAuditModalOpen(true);
            }}
            className="text-sij-cyan hover:text-cyan-300 font-bold hover:underline cursor-pointer"
          >
            Ver Bitácora de Auditoría ➔
          </button>
        </div>
      </div>
    </div>
  );
};
