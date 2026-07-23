import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { OfficeDashboard } from './components/OfficeModule/OfficeDashboard';
import { TechMobileView } from './components/TechModule/TechMobileView';
import { ClientPortalView } from './components/ClientModule/ClientPortalView';
import { CreateOrderModal } from './components/OfficeModule/CreateOrderModal';

function MainContent() {
  const { activeRole } = useApp();
  const [isNavCreateOpen, setIsNavCreateOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-blue-500 selection:text-white">
      <Navbar onOpenCreateModal={() => setIsNavCreateOpen(true)} />

      <main className="flex-1">
        {activeRole === 'home' && <HomeDashboard />}
        {activeRole === 'office' && <OfficeDashboard />}
        {activeRole === 'tech' && <TechMobileView />}
        {activeRole === 'client' && <ClientPortalView />}
      </main>

      {/* Global Quick Modal for Navbar */}
      <CreateOrderModal
        isOpen={isNavCreateOpen}
        onClose={() => setIsNavCreateOpen(false)}
      />

      {/* Clean Subtle Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} Sistema de Mantenimiento & Servicios
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Módulos por Rol: Oficina • Técnico • Cliente
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
