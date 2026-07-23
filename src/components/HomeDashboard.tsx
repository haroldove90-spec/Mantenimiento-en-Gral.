import React from 'react';
import { useApp } from '../context/AppContext';
import { Building2, Wrench, UserCheck, ArrowRight } from 'lucide-react';

export const HomeDashboard: React.FC = () => {
  const { setActiveRole } = useApp();

  return (
    <div id="home-dashboard" className="max-w-4xl mx-auto px-4 py-12 sm:py-20 flex flex-col items-center justify-center min-h-[70vh]">
      {/* Role Access Cards (Icon + Name + Enter action) */}
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
    </div>
  );
};


