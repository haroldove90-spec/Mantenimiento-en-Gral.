import React from 'react';
import { useApp } from '../context/AppContext';
import { Building2, Wrench, UserCheck, ArrowRight, Activity, FileCheck, CheckCircle2 } from 'lucide-react';

export const HomeDashboard: React.FC = () => {
  const { setActiveRole, orders } = useApp();

  const activeCount = orders.filter(o => o.status !== 'Finalizada').length;
  const quoteCount = orders.filter(o => o.status === 'Esperando Presupuesto' || o.status === 'En Cotización' || o.status === 'Esperando Aprobación').length;
  const doneCount = orders.filter(o => o.status === 'Finalizada').length;

  return (
    <div id="home-dashboard" className="max-w-5xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
      {/* Compact Quick Status Counter Strip */}
      <div className="w-full grid grid-cols-3 gap-3 sm:gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center space-x-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">{activeCount}</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Activas</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center space-x-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">{quoteCount}</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Cotizaciones</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center space-x-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">{doneCount}</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Finalizadas</div>
          </div>
        </div>
      </div>

      {/* Role Access Cards (Matching Clean Minimalism archetype) */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {/* Role 1: Oficina / Administración */}
        <button
          id="home-role-office"
          onClick={() => setActiveRole('office')}
          className="group cursor-pointer bg-white border border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-5 shadow-xs hover:shadow-xl hover:border-blue-500/30 transition-all duration-300"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 transition-colors duration-300">
            <Building2 className="w-10 h-10 text-blue-500 group-hover:text-white transition-colors duration-300" />
          </div>
          <span className="text-lg font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
            Administración
          </span>
          <div className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
            <span>Ingresar</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        {/* Role 2: Técnico */}
        <button
          id="home-role-tech"
          onClick={() => setActiveRole('tech')}
          className="group cursor-pointer bg-white border border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-5 shadow-xs hover:shadow-xl hover:border-blue-500/30 transition-all duration-300"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 transition-colors duration-300">
            <Wrench className="w-10 h-10 text-blue-500 group-hover:text-white transition-colors duration-300" />
          </div>
          <span className="text-lg font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
            Técnico
          </span>
          <div className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
            <span>Ingresar</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        {/* Role 3: Cliente */}
        <button
          id="home-role-client"
          onClick={() => setActiveRole('client')}
          className="group cursor-pointer bg-white border border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-5 shadow-xs hover:shadow-xl hover:border-blue-500/30 transition-all duration-300"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 transition-colors duration-300">
            <UserCheck className="w-10 h-10 text-blue-500 group-hover:text-white transition-colors duration-300" />
          </div>
          <span className="text-lg font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
            Cliente
          </span>
          <div className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
            <span>Ingresar</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Active Modules Status Bar */}
      <div className="mt-12 w-full max-w-5xl bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Módulos Activos</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-[10px] font-semibold text-slate-600">Gestión OS</span>
            <span className="px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-[10px] font-semibold text-slate-600">Presupuestos</span>
            <span className="px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-[10px] font-semibold text-slate-600">Diagnóstico</span>
            <span className="px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-[10px] font-semibold text-slate-600">Portal Cliente</span>
          </div>
        </div>
        <div className="text-xs font-medium text-slate-400 italic">Sincronización en tiempo real activa</div>
      </div>
    </div>
  );
};

