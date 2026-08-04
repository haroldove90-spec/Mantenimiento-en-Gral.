import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, Wrench, UserCheck, ArrowRight, Crown, Download, Smartphone, CheckCircle, Info, UserPlus, LogIn } from 'lucide-react';
import { UserAuthModal } from './UserAuthModal';

export const HomeDashboard: React.FC = () => {
  const { setActiveRole } = useApp();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'register' | 'login'>('register');

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
      // Check if iOS or desktop without prompt
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIos) {
        setShowIosInstructions(true);
      } else {
        alert('Para instalar SIJ en tu dispositivo, busca la opción "Agregar a la pantalla principal" o "Instalar aplicación" en el menú de tu navegador.');
      }
    }
  };

  return (
    <div id="home-dashboard" className="max-w-4xl mx-auto px-4 py-6 sm:py-10 flex flex-col items-center justify-center min-h-[80vh] space-y-6 sm:space-y-8">
      
      {/* Brand Logo & Header above role accesses */}
      <div className="text-center space-y-3 max-w-lg mx-auto">
        <img
          src="https://battwitnhrezwotkcvbc.supabase.co/storage/v1/object/public/logo/sij.png"
          alt="SIJ Logo"
          className="w-28 h-28 sm:w-36 sm:h-36 mx-auto object-contain"
        />
        <div>
          <p className="text-sm sm:text-base font-bold text-sij-blue">
            Sistema de Mantenimiento y Servicios
          </p>
          <p className="text-xs text-sij-dark/70 font-medium mt-1">
            Selecciona tu perfil de usuario para ingresar al sistema
          </p>
        </div>

        {/* REGISTER & LOGIN ADMIN BUTTONS */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => {
              setAuthModalMode('register');
              setIsAuthModalOpen(true);
            }}
            className="cursor-pointer inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-emerald-200" />
            <span>Registrar Usuario Admin</span>
          </button>

          <button
            onClick={() => {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
            className="cursor-pointer inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <LogIn className="w-4 h-4 text-sij-cyan" />
            <span>Ingresar</span>
          </button>

          {!isInstalled && (
            <button
              id="install-pwa-btn"
              onClick={handleInstallClick}
              className="group cursor-pointer inline-flex items-center space-x-2 bg-sij-blue hover:bg-sij-navy text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <Smartphone className="w-4 h-4 text-sij-cyan group-hover:animate-bounce" />
              <span>Instalar App Movil</span>
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
                <span>Toca el botón de <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba) en la barra de Safari.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-blue-600">2.</span>
                <span>Desplázate hacia abajo y selecciona <strong>"Agregar a inicio"</strong> (Add to Home Screen).</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>Toca <strong>"Agregar"</strong> en la esquina superior derecha.</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIosInstructions(false)}
              className="w-full bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
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
          onClick={() => setActiveRole('owner')}
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
          onClick={() => setActiveRole('office')}
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
          onClick={() => setActiveRole('tech')}
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
          onClick={() => setActiveRole('client')}
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

      {/* User Auth Registration / Login Modal */}
      <UserAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

    </div>
  );
};


