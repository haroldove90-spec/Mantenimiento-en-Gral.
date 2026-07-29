import React from 'react';
import { useApp } from '../context/AppContext';
import { Building2, Wrench, UserCheck, ArrowRight, Crown } from 'lucide-react';

export const HomeDashboard: React.FC = () => {
  const { setActiveRole } = useApp();

  return (
    <div id="home-dashboard" className="max-w-4xl mx-auto px-4 py-6 sm:py-12 flex flex-col items-center justify-center min-h-[80vh] space-y-6 sm:space-y-10">
      
      {/* Brand Logo & Header above role accesses */}
      <div className="text-center space-y-3 max-w-lg mx-auto">
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/20 ring-8 ring-blue-50">
          <Wrench className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Gestión OS
          </h1>
          <p className="text-sm sm:text-base font-semibold text-blue-600 mt-1">
            Sistema de Mantenimiento y Servicios
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Selecciona tu perfil de usuario para ingresar al sistema
          </p>
        </div>
      </div>

      {/* Role Access Cards (2 columns on mobile, 4 columns on desktop) */}
      <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Role 0: Dueño / Administrador General */}
        <button
          id="home-role-owner"
          onClick={() => setActiveRole('owner')}
          className="group cursor-pointer bg-white border border-amber-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center text-center gap-3 shadow-xs hover:shadow-xl hover:border-amber-500/50 transition-all duration-300"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center group-hover:bg-amber-500 transition-colors duration-300 shrink-0">
            <Crown className="w-7 h-7 sm:w-9 sm:h-9 text-amber-600 group-hover:text-slate-950 transition-colors duration-300" />
          </div>
          <div>
            <span className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-amber-700 transition-colors block">
              Dueño / Admin
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:block mt-0.5">
              Finanzas, gastos, ventas y gestión de personal
            </span>
          </div>
          <div className="inline-flex items-center space-x-1 text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
            <span>Ingresar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* Role 1: Oficina / Administración */}
        <button
          id="home-role-office"
          onClick={() => setActiveRole('office')}
          className="group cursor-pointer bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-7 flex flex-col items-center justify-center text-center gap-3 sm:gap-4 shadow-xs hover:shadow-xl hover:border-blue-500/40 transition-all duration-300"
        >
          <div className="w-14 h-14 sm:w-20 sm:h-20 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300 shrink-0">
            <Building2 className="w-7 h-7 sm:w-10 sm:h-10 text-blue-600 group-hover:text-white transition-colors duration-300" />
          </div>
          <div>
            <span className="text-sm sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors block">
              Oficina / Admin
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:block mt-0.5">
              Gestión global, cotizaciones y reportes
            </span>
          </div>
          <div className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
            <span>Ingresar</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </button>

        {/* Role 2: Técnico */}
        <button
          id="home-role-tech"
          onClick={() => setActiveRole('tech')}
          className="group cursor-pointer bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-7 flex flex-col items-center justify-center text-center gap-3 sm:gap-4 shadow-xs hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300"
        >
          <div className="w-14 h-14 sm:w-20 sm:h-20 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors duration-300 shrink-0">
            <Wrench className="w-7 h-7 sm:w-10 sm:h-10 text-emerald-600 group-hover:text-white transition-colors duration-300" />
          </div>
          <div>
            <span className="text-sm sm:text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors block">
              Módulo Técnico
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:block mt-0.5">
              Trabajos asignados y diagnóstico en campo
            </span>
          </div>
          <div className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
            <span>Ingresar</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </button>

        {/* Role 3: Cliente */}
        <button
          id="home-role-client"
          onClick={() => setActiveRole('client')}
          className="group cursor-pointer bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-7 flex flex-col items-center justify-center text-center gap-3 sm:gap-4 shadow-xs hover:shadow-xl hover:border-purple-500/40 transition-all duration-300 col-span-2 md:col-span-1"
        >
          <div className="w-14 h-14 sm:w-20 sm:h-20 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 transition-colors duration-300 shrink-0">
            <UserCheck className="w-7 h-7 sm:w-10 sm:h-10 text-purple-600 group-hover:text-white transition-colors duration-300" />
          </div>
          <div>
            <span className="text-sm sm:text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors block">
              Portal Cliente
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:block mt-0.5">
              Autorización y firma de cotizaciones
            </span>
          </div>
          <div className="inline-flex items-center space-x-1 text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
            <span>Ingresar</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </button>
      </div>

    </div>
  );
};


