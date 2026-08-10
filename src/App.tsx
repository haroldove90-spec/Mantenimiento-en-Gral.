import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { OfficeDashboard } from './components/OfficeModule/OfficeDashboard';
import { OwnerDashboard } from './components/OwnerModule/OwnerDashboard';
import { TechMobileView } from './components/TechModule/TechMobileView';
import { ClientPortalView } from './components/ClientModule/ClientPortalView';
import { CreateOrderModal } from './components/OfficeModule/CreateOrderModal';

function MainContent() {
  const { activeRole, currentUser } = useApp();
  const [isNavCreateOpen, setIsNavCreateOpen] = useState(false);

  // RBAC Guard: Restrict views based on currentUser role
  let effectiveRole = activeRole;
  if (currentUser) {
    if (currentUser.role === 'tech' && (activeRole === 'owner' || activeRole === 'office')) {
      effectiveRole = 'tech';
    } else if (currentUser.role === 'office' && activeRole === 'owner') {
      effectiveRole = 'office';
    } else if (currentUser.role === 'client' && (activeRole === 'owner' || activeRole === 'office' || activeRole === 'tech')) {
      effectiveRole = 'client';
    }
  }

  return (
    <div className="min-h-screen bg-white text-sij-dark font-sans flex flex-col selection:bg-sij-cyan selection:text-white max-w-full overflow-x-hidden">
      {/* Navigation (Left Sidebar on desktop, Top Header + Bottom Navbar on Mobile/Tablet) */}
      <Navbar onOpenCreateModal={() => setIsNavCreateOpen(true)} />

      {/* Main Content Area (Offset for Desktop Sidebar when inside a role module) */}
      <main className={`flex-1 transition-all ${effectiveRole !== 'home' ? 'lg:pl-64 pb-24 lg:pb-0' : 'pb-8'}`}>
        {effectiveRole === 'home' && <HomeDashboard />}
        {effectiveRole === 'owner' && <OwnerDashboard />}
        {effectiveRole === 'office' && <OfficeDashboard />}
        {effectiveRole === 'tech' && <TechMobileView />}
        {effectiveRole === 'client' && <ClientPortalView />}
      </main>

      {/* Global Quick Modal for Navbar */}
      <CreateOrderModal
        isOpen={isNavCreateOpen}
        onClose={() => setIsNavCreateOpen(false)}
      />

      {/* Clean Subtle Footer */}
      <footer className={`${activeRole !== 'home' ? 'lg:pl-64 pb-20 lg:pb-0' : ''} border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-500 no-print`}>
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
