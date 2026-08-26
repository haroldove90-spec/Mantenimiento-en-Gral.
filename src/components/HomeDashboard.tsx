import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RoleType } from '../types';
import { Building2, Wrench, UserCheck, ArrowRight, Crown, Smartphone, Info, Trash2, RotateCcw, ShieldAlert } from 'lucide-react';
import { UserAuthModal } from './UserAuthModal';
import { SupabaseSmartButton } from './SupabaseSmartButton';

export const HomeDashboard: React.FC = () => {
  const { setActiveRole, setOwnerSubTab, setOfficeSubTab, clearSampleData, resetToDemoData, currentUser, setCurrentUser, logout } = useApp();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  
  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleType>('owner');
  const [authModalMode, setAuthModalMode] = useState<'register' | 'login'>('login');

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIos) {
        setShowIosInstructions(true);
      } else {
        alert('Para instalar SIJ en tu dispositivo, busca la opción "Agregar a la pantalla principal" o "Instalar aplicación" en el menú de tu navegador.');
      }
    }
  };

  const handleRoleCardClick = (role: RoleType) => {
    if (currentUser) {
      // If user is already logged in, check permissions
      const uRole = currentUser.role;
      const canAccess =
        uRole === 'owner' ||
        (uRole === 'office' && role !== 'owner') ||
        (uRole === 'tech' && (role === 'tech' || role === 'client')) ||
        (uRole === 'client' && role === 'client');

      if (canAccess) {
        setActiveRole(role);
        if (role === 'owner') setOwnerSubTab('analytics');
        if (role === 'office') setOfficeSubTab('orders');
        return;
      }
    }

    setSelectedRole(role);
    setAuthModalMode('login'); // Default to login mode when clicking a role card
    setIsAuthModalOpen(true);
  };

  const handleGoToMyDashboard = () => {
    if (!currentUser) return;
    const target = currentUser.role || 'client';
    setActiveRole(target);
    if (target === 'owner') setOwnerSubTab('analytics');
    if (target === 'office') setOfficeSubTab('orders');
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div id="home-dashboard" className="max-w-4xl mx-auto px-4 py-6 sm:py-10 flex flex-col items-center justify-center min-h-[80vh] space-y-6 sm:space-y-8">
      
      {/* Active User Session Banner (if logged in) */}
      {currentUser && (
        <div className="w-full bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-800/60 rounded-3xl p-4 sm:p-5 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center space-x-3.5 text-left">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-sij-cyan flex items-center justify-center font-bold text-lg shrink-0">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                  Sesión Activa ({currentUser.role === 'owner' ? 'Admin / Dueño' : currentUser.role === 'office' ? 'Oficina' : currentUser.role === 'tech' ? 'Técnico' : 'Cliente'})
                </span>
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                {currentUser.name}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {currentUser.email}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <button
              onClick={handleGoToMyDashboard}
              className="flex-1 sm:flex-none cursor-pointer bg-gradient-to-r from-sij-blue to-sij-cyan hover:from-sij-navy hover:to-sij-blue text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2 active:scale-95"
            >
              <span>Ir a mi Panel</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              className="cursor-pointer bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-bold text-xs px-3.5 py-2.5 rounded-2xl transition-all border border-white/10"
              title="Cerrar sesión activa"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      {/* Brand Logo & Header above role accesses */}
      <div className="text-center space-y-3 max-w-lg mx-auto">
        <img
          src="https://battwitnhrezwotkcvbc.supabase.co/storage/v1/object/public/logo/sij.png"
          alt="SIJ Logo"
          className="w-28 h-28 sm:w-36 sm:h-36 mx-auto object-contain"
        />
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Mantenimiento y Servicios SIJ
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Plataforma Integral de Servicios Técnicos y Operaciones
          </p>
          <div className="mt-2.5 flex justify-center">
            <SupabaseSmartButton variant="pill" />
          </div>
        </div>

        {/* Global Access CTA Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {!currentUser ? (
            <>
              <button
                onClick={() => {
                  setSelectedRole('client');
                  setAuthModalMode('register');
                  setIsAuthModalOpen(true);
                }}
                className="cursor-pointer inline-flex items-center space-x-2 bg-gradient-to-r from-sij-blue to-sij-navy hover:from-sij-navy hover:to-slate-900 text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <span>Crear Cuenta / Registrarse</span>
              </button>

              <button
                onClick={() => {
                  setSelectedRole('client');
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="cursor-pointer inline-flex items-center space-x-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-2xl transition-all shadow-xs hover:shadow-md active:scale-95"
              >
                <span>Iniciar Sesión</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleGoToMyDashboard}
              className="cursor-pointer inline-flex items-center space-x-2 bg-gradient-to-r from-sij-blue to-sij-navy hover:from-sij-navy hover:to-slate-900 text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <span>Acceder a la Plataforma</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* PWA Install button */}
          {!isInstalled && (
            <button
              id="install-pwa-btn"
              onClick={handleInstallClick}
              className="group cursor-pointer inline-flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-2xl transition-all shadow-xs"
            >
              <Smartphone className="w-4 h-4 text-sij-blue group-hover:animate-bounce" />
              <span>Instalar App</span>
            </button>
          )}
        </div>
      </div>

      {/* iOS Installation Instruction Modal */}
      {showIosInstructions && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl relative border border-slate-100">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto text-blue-600 font-bold">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Instalar SIJ en iPhone / iPad</h3>
            <ol className="text-xs text-slate-600 text-left space-y-2 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <li className="flex items-start space-x-2">
                <span className="font-bold text-blue-600">1.</span>
                <span>Toca el botón de <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba) en Safari.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-blue-600">2.</span>
                <span>Selecciona <strong>"Agregar a inicio"</strong> (Add to Home Screen).</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>Toca <strong>"Agregar"</strong>.</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIosInstructions(false)}
              className="w-full bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Role Access Cards (2 columns on mobile, 4 columns on desktop) */}
      <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Role 0: Dueño / Administrador General */}
        <button
          id="home-role-owner"
          onClick={() => handleRoleCardClick('owner')}
          className="group cursor-pointer bg-white border border-sij-orange/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center text-center gap-3 shadow-xs hover:shadow-xl hover:border-sij-orange/60 transition-all duration-300"
        >
          <div className="w-14 h-14 sm:w-18 sm:h-18 bg-sij-orange/10 border border-sij-orange/20 rounded-2xl flex items-center justify-center group-hover:bg-sij-orange transition-colors duration-300 shrink-0">
            <Crown className="w-7 h-7 sm:w-9 sm:h-9 text-sij-orange group-hover:text-white transition-colors duration-300" />
          </div>
          <div>
            <span className="text-sm sm:text-base font-bold text-sij-dark group-hover:text-sij-orange transition-colors block">
              Dueño / Admin
            </span>
            <span className="text-[11px] text-sij-dark/60 hidden sm:block mt-0.5">
              Finanzas, gastos, ventas y personal
            </span>
          </div>
          <div className="inline-flex items-center space-x-1 text-xs font-bold text-sij-orange group-hover:translate-x-1 transition-transform">
            <span>Ingresar</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </button>

        {/* Role 1: Oficina / Administración */}
        <button
          id="home-role-office"
          onClick={() => handleRoleCardClick('office')}
          className="group cursor-pointer bg-white border border-sij-blue/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center text-center gap-3 shadow-xs hover:shadow-xl hover:border-sij-blue transition-all duration-300"
        >
          <div className="w-14 h-14 sm:w-18 sm:h-18 bg-sij-blue/10 border border-sij-blue/20 rounded-2xl flex items-center justify-center group-hover:bg-sij-blue transition-colors duration-300 shrink-0">
            <Building2 className="w-7 h-7 sm:w-9 sm:h-9 text-sij-blue group-hover:text-white transition-colors duration-300" />
          </div>
          <div>
            <span className="text-sm sm:text-base font-bold text-sij-dark group-hover:text-sij-blue transition-colors block">
              Oficina / Admin
            </span>
            <span className="text-[11px] text-sij-dark/60 hidden sm:block mt-0.5">
              Gestión global, cotizaciones y reportes
            </span>
          </div>
          <div className="inline-flex items-center space-x-1 text-xs font-bold text-sij-blue group-hover:translate-x-1 transition-transform">
            <span>Ingresar</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </button>

        {/* Role 2: Técnico */}
        <button
          id="home-role-tech"
          onClick={() => handleRoleCardClick('tech')}
          className="group cursor-pointer bg-white border border-sij-cyan/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center text-center gap-3 shadow-xs hover:shadow-xl hover:border-sij-cyan transition-all duration-300"
        >
          <div className="w-14 h-14 sm:w-18 sm:h-18 bg-sij-cyan/10 border border-sij-cyan/20 rounded-2xl flex items-center justify-center group-hover:bg-sij-cyan transition-colors duration-300 shrink-0">
            <Wrench className="w-7 h-7 sm:w-9 sm:h-9 text-sij-cyan group-hover:text-white transition-colors duration-300" />
          </div>
          <div>
            <span className="text-sm sm:text-base font-bold text-sij-dark group-hover:text-sij-cyan transition-colors block">
              Módulo Técnico
            </span>
            <span className="text-[11px] text-sij-dark/60 hidden sm:block mt-0.5">
              Trabajos asignados y diagnóstico en campo
            </span>
          </div>
          <div className="inline-flex items-center space-x-1 text-xs font-bold text-sij-cyan group-hover:translate-x-1 transition-transform">
            <span>Ingresar</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </button>

        {/* Role 3: Cliente */}
        <button
          id="home-role-client"
          onClick={() => handleRoleCardClick('client')}
          className="group cursor-pointer bg-white border border-sij-navy/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center text-center gap-3 shadow-xs hover:shadow-xl hover:border-sij-navy transition-all duration-300"
        >
          <div className="w-14 h-14 sm:w-18 sm:h-18 bg-sij-navy/10 border border-sij-navy/20 rounded-2xl flex items-center justify-center group-hover:bg-sij-navy transition-colors duration-300 shrink-0">
            <UserCheck className="w-7 h-7 sm:w-9 sm:h-9 text-sij-navy group-hover:text-white transition-colors duration-300" />
          </div>
          <div>
            <span className="text-sm sm:text-base font-bold text-sij-dark group-hover:text-sij-navy transition-colors block">
              Portal Cliente
            </span>
            <span className="text-[11px] text-sij-dark/60 hidden sm:block mt-0.5">
              Autorización y firma de cotizaciones
            </span>
          </div>
          <div className="inline-flex items-center space-x-1 text-xs font-bold text-sij-navy group-hover:translate-x-1 transition-transform">
            <span>Ingresar</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </button>
      </div>

      {/* User Auth Modal */}
      <UserAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        targetRole={selectedRole}
        initialMode={authModalMode}
      />

    </div>
  );
};
