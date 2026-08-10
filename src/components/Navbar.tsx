import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  Wrench,
  UserCheck,
  Home,
  Bell,
  PlusCircle,
  X,
  Clock,
  FileText,
  FileSpreadsheet,
  Users,
  BarChart3,
  LogOut,
  Crown,
  Navigation,
  Sparkles,
  PieChart
} from 'lucide-react';

export const Navbar: React.FC<{ onOpenCreateModal?: () => void }> = ({ onOpenCreateModal }) => {
  const {
    activeRole,
    setActiveRole,
    currentUser,
    setCurrentUser,
    officeSubTab,
    setOfficeSubTab,
    ownerSubTab,
    setOwnerSubTab,
    notifications,
    markNotificationRead
  } = useApp();

  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const roleNotifs = notifications.filter(
    n => activeRole === 'home' || n.targetRole === activeRole
  );
  const unreadCount = roleNotifs.filter(n => !n.read).length;

  const getRoleName = () => {
    switch (activeRole) {
      case 'owner': return 'Rol Dueño';
      case 'office': return 'Módulo Oficina';
      case 'tech': return 'Módulo Técnico';
      case 'client': return 'Portal Cliente';
      default: return 'Inicio SIJ';
    }
  };

  const userRole = currentUser?.role;
  const canSeeOwner = !userRole || userRole === 'owner';
  const canSeeOffice = !userRole || userRole === 'owner' || userRole === 'office';
  const canSeeTech = !userRole || userRole === 'owner' || userRole === 'tech';
  const canSeeClient = !userRole || userRole === 'owner' || userRole === 'client';

  if (activeRole === 'home') {
    return null;
  }

  return (
    <>
      {/* ------------------- DESKTOP LEFT SIDEBAR (lg:flex, ALWAYS VISIBLE ON DESKTOP) ------------------- */}
      <aside
        id="app-sidebar-desktop"
        className="hidden lg:flex flex-col w-64 bg-sij-navy border-r border-sij-navy text-white h-screen fixed top-0 left-0 z-40 p-4 shadow-xl overflow-y-auto"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <button
            onClick={() => setActiveRole('home')}
            className="flex items-center space-x-3 text-left group focus:outline-hidden"
          >
            <img
              src="https://battwitnhrezwotkcvbc.supabase.co/storage/v1/object/public/logo/sij.png"
              alt="SIJ Logo"
              className="h-10 w-auto object-contain shrink-0"
            />
            <div>
              <span className="font-extrabold text-lg text-white block leading-tight tracking-wider">SIJ</span>
              <span className="text-[10px] text-sij-cyan font-semibold">Mantenimiento y Servicios</span>
            </div>
          </button>
        </div>

        {/* Navigation Menu with Sub-Modules */}
        <div className="mt-4 flex-1 space-y-5">
          
          {/* Section: INICIO */}
          <div>
            <div className="px-2 mb-2 text-xs font-bold text-white/50 uppercase tracking-wider">
              Navegación General
            </div>
            <button
              id="role-btn-home"
              onClick={() => setActiveRole('home')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeRole === 'home'
                  ? 'bg-sij-cyan text-white shadow-md font-bold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>Inicio / Menú Principal</span>
            </button>
          </div>

          {/* Section: DUEÑO / ADMINISTRACIÓN (Only for Owner/Admin) */}
          {canSeeOwner && (
            <div className="space-y-1">
              <div className="px-2 mb-2 text-xs font-bold text-white/50 uppercase tracking-wider flex items-center justify-between">
                <span>Administración</span>
                <Crown className="w-4 h-4 text-sij-orange" />
              </div>

              <button
                id="role-btn-owner-analytics"
                onClick={() => {
                  setActiveRole('owner');
                  setOwnerSubTab('analytics');
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeRole === 'owner' && ownerSubTab === 'analytics'
                    ? 'bg-sij-orange text-white shadow-md font-bold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0 text-sij-orange" />
                <span>Analítica & Cobranza</span>
              </button>

              <button
                id="role-btn-owner-financials"
                onClick={() => {
                  setActiveRole('owner');
                  setOwnerSubTab('financials');
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeRole === 'owner' && ownerSubTab === 'financials'
                    ? 'bg-sij-orange text-white shadow-md font-bold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Reportes Financieros</span>
              </button>

              <button
                id="role-btn-owner-users"
                onClick={() => {
                  setActiveRole('owner');
                  setOwnerSubTab('users');
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeRole === 'owner' && ownerSubTab === 'users'
                    ? 'bg-sij-orange text-white shadow-md font-bold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Users className="w-4 h-4 shrink-0 text-sij-cyan" />
                <span>Gestión de Usuarios</span>
              </button>
            </div>
          )}

          {/* Section: OFICINA & SUB-MÓDULOS (Owner and Office) */}
          {canSeeOffice && (
            <div className="space-y-1">
              <div className="px-2 mb-2 text-xs font-bold text-white/50 uppercase tracking-wider flex items-center justify-between">
                <span>Módulos de Oficina</span>
                <Building2 className="w-4 h-4 text-sij-cyan" />
              </div>

              <button
                onClick={() => {
                  setActiveRole('office');
                  setOfficeSubTab('orders');
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeRole === 'office' && officeSubTab === 'orders'
                    ? 'bg-sij-blue text-white shadow-md font-bold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0 text-sij-cyan" />
                <span>Órdenes de Servicio</span>
              </button>

              <button
                onClick={() => {
                  setActiveRole('office');
                  setOfficeSubTab('routes');
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeRole === 'office' && officeSubTab === 'routes'
                    ? 'bg-sij-blue text-white shadow-md font-bold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Navigation className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Agenda & Rutas</span>
              </button>

              <button
                onClick={() => {
                  setActiveRole('office');
                  setOfficeSubTab('budgets');
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeRole === 'office' && officeSubTab === 'budgets'
                    ? 'bg-sij-blue text-white shadow-md font-bold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Cotizaciones & Presupuestos</span>
              </button>

              <button
                onClick={() => {
                  setActiveRole('office');
                  setOfficeSubTab('catalogs');
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeRole === 'office' && officeSubTab === 'catalogs'
                    ? 'bg-sij-blue text-white shadow-md font-bold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Users className="w-4 h-4 shrink-0 text-purple-400" />
                <span>Clientes & Catálogo</span>
              </button>

              <button
                onClick={() => {
                  setActiveRole('office');
                  setOfficeSubTab('reports');
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeRole === 'office' && officeSubTab === 'reports'
                    ? 'bg-sij-blue text-white shadow-md font-bold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0 text-sij-cyan" />
                <span>Reportes & Rendimiento</span>
              </button>
            </div>
          )}

          {/* Section: TÉCNICO DE CAMPO (Owner and Tech) */}
          {canSeeTech && (
            <div>
              <div className="px-2 mb-2 text-xs font-bold text-white/50 uppercase tracking-wider flex items-center justify-between">
                <span>Módulo Técnico</span>
                <Wrench className="w-4 h-4 text-emerald-400" />
              </div>

              <button
                id="role-btn-tech"
                onClick={() => setActiveRole('tech')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeRole === 'tech'
                    ? 'bg-emerald-600 text-white shadow-md font-bold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Wrench className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Mis Trabajos Asignados</span>
              </button>
            </div>
          )}

          {/* Section: PORTAL DEL CLIENTE (Owner and Client) */}
          {canSeeClient && (
            <div>
              <div className="px-2 mb-2 text-xs font-bold text-white/50 uppercase tracking-wider flex items-center justify-between">
                <span>Portal de Cliente</span>
                <UserCheck className="w-4 h-4 text-purple-400" />
              </div>

              <button
                id="role-btn-client"
                onClick={() => setActiveRole('client')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeRole === 'client'
                    ? 'bg-purple-600 text-white shadow-md font-bold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0 text-purple-400" />
                <span>Aprobación de Cotizaciones</span>
              </button>
            </div>
          )}

        </div>

        {/* Office Quick Actions */}
        {activeRole === 'office' && onOpenCreateModal && (
          <div className="mb-3 pt-3 border-t border-white/10">
            <button
              id="sidebar-create-order-btn"
              onClick={onOpenCreateModal}
              className="w-full flex items-center justify-center space-x-2 bg-sij-blue hover:bg-blue-600 text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Crear Reporte Mtto</span>
            </button>
          </div>
        )}

        {/* Notifications & System Profile Footer */}
        <div className="pt-3 border-t border-white/10 space-y-2 relative">
          <button
            id="sidebar-notif-btn"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 transition-colors text-xs font-medium"
          >
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-sij-cyan" />
              <span>Alertas del Sistema</span>
            </div>
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown for Sidebar */}
          {showNotifMenu && (
            <div
              id="sidebar-notif-dropdown"
              className="absolute bottom-16 left-0 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-sij-cyan" />
                  <span className="text-xs font-bold text-white">Notificaciones</span>
                  {unreadCount > 0 && (
                    <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowNotifMenu(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                {roleNotifs.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    Sin notificaciones recientes.
                  </div>
                ) : (
                  roleNotifs.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 text-xs cursor-pointer transition-colors ${
                        n.read ? 'bg-slate-900 text-slate-400' : 'bg-slate-800/50 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-bold text-blue-400">{n.orderFolio}</span>
                        <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{n.timestamp}</span>
                        </span>
                      </div>
                      <div className="font-semibold text-slate-100">{n.title}</div>
                      <p className="text-slate-400 text-[11px] line-clamp-2 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Logged-in User Profile Card */}
          {currentUser && (
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10 mb-2 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-sij-cyan/20 border border-sij-cyan/40 text-sij-cyan flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-xs">
                {currentUser.name ? currentUser.name.charAt(0) : (currentUser.username ? currentUser.username.charAt(0) : 'U')}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-extrabold text-white truncate leading-tight">{currentUser.name || currentUser.username}</p>
                <p className="text-[10px] text-sij-cyan truncate font-medium">@{currentUser.username || currentUser.email.split('@')[0]}</p>
              </div>
            </div>
          )}

          {/* Logout / Switch Role Button */}
          {activeRole !== 'home' && (
            <button
              onClick={() => {
                setCurrentUser(null);
                setActiveRole('home');
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition-colors border border-rose-500/20 cursor-pointer"
              title="Cerrar sesión y volver al menú principal"
            >
              <span>Cerrar Sesión</span>
              <LogOut className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center space-x-2.5 px-1 text-slate-400 text-[11px]">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-300">SIJ Sistema Activo</span>
          </div>
        </div>
      </aside>

      {/* ------------------- MOBILE TOP HEADER (lg:hidden, SHOWN ON MOBILE & TABLET) ------------------- */}
      <header
        id="app-mobile-top-header"
        className="lg:hidden bg-sij-navy text-white border-b border-sij-navy sticky top-0 z-30 shadow-md max-w-full overflow-x-hidden"
      >
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-left shrink-0">
            <img
              src="https://battwitnhrezwotkcvbc.supabase.co/storage/v1/object/public/logo/sij.png"
              alt="SIJ Logo"
              className="h-7 sm:h-8 w-auto object-contain shrink-0"
            />
            <div>
              <span className="text-xs sm:text-sm font-bold text-sij-cyan block leading-tight">{getRoleName()}</span>
              {currentUser && (
                <span className="text-[10px] text-slate-300 font-semibold block truncate max-w-[130px]">
                  👤 {currentUser.name || currentUser.username}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Notifications Button */}
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-1.5 rounded-xl text-slate-300 hover:text-white relative bg-slate-800 border border-slate-700"
              title="Notificaciones"
            >
              <Bell className="w-4 h-4 text-sij-cyan" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
              )}
            </button>

            {/* Logout Button Mobile */}
            {activeRole !== 'home' && (
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setActiveRole('home');
                }}
                className="flex items-center space-x-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications Dropdown Mobile */}
        {showNotifMenu && (
          <div className="bg-slate-900 border-b border-slate-800 p-3 max-h-60 overflow-y-auto divide-y divide-slate-800">
            <div className="flex items-center justify-between pb-2 mb-1">
              <span className="text-xs font-bold text-white">Notificaciones ({unreadCount})</span>
              <button onClick={() => setShowNotifMenu(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            {roleNotifs.length === 0 ? (
              <div className="py-4 text-center text-slate-400 text-xs">Sin notificaciones.</div>
            ) : (
              roleNotifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  className="py-2 text-xs"
                >
                  <div className="font-bold text-blue-400">{n.orderFolio} - {n.title}</div>
                  <div className="text-slate-300 text-[11px]">{n.message}</div>
                </div>
              ))
            )}
          </div>
        )}
      </header>

      {/* ------------------- MOBILE APP BOTTOM NAVIGATION BAR (lg:hidden, SHOWN ON MOBILE & TABLET) ------------------- */}
      <nav
        id="app-mobile-bottom-nav"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sij-navy/95 backdrop-blur-md border-t border-sij-navy text-white shadow-2xl px-1.5 py-1.5 max-w-full"
      >
        {/* Home Role Bottom Bar */}
        {activeRole === 'home' && (
          <div className="grid grid-cols-5 gap-1 text-center">
            <button
              onClick={() => setActiveRole('home')}
              className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl bg-sij-cyan text-white font-bold"
            >
              <Home className="w-4 h-4 mb-0.5" />
              <span className="text-[9px] truncate w-full">Inicio</span>
            </button>
            <button
              onClick={() => setActiveRole('owner')}
              className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
            >
              <Crown className="w-4 h-4 mb-0.5 text-sij-orange" />
              <span className="text-[9px] truncate w-full">Dueño</span>
            </button>
            <button
              onClick={() => setActiveRole('office')}
              className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
            >
              <Building2 className="w-4 h-4 mb-0.5 text-sij-cyan" />
              <span className="text-[9px] truncate w-full">Oficina</span>
            </button>
            <button
              onClick={() => setActiveRole('tech')}
              className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
            >
              <Wrench className="w-4 h-4 mb-0.5 text-emerald-400" />
              <span className="text-[9px] truncate w-full">Técnico</span>
            </button>
            <button
              onClick={() => setActiveRole('client')}
              className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
            >
              <UserCheck className="w-4 h-4 mb-0.5 text-purple-400" />
              <span className="text-[9px] truncate w-full">Cliente</span>
            </button>
          </div>
        )}

        {/* Owner Role Bottom Bar */}
        {activeRole === 'owner' && (
          <div className="grid grid-cols-4 gap-1 text-center">
            <button
              onClick={() => setOwnerSubTab('analytics')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                ownerSubTab === 'analytics'
                  ? 'bg-sij-orange text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] truncate w-full">Analítica</span>
            </button>

            <button
              onClick={() => setOwnerSubTab('financials')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                ownerSubTab === 'financials'
                  ? 'bg-sij-orange text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 mb-0.5 text-emerald-400" />
              <span className="text-[10px] truncate w-full">Finanzas</span>
            </button>

            <button
              onClick={() => setOwnerSubTab('users')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                ownerSubTab === 'users'
                  ? 'bg-sij-orange text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4 mb-0.5 text-sij-cyan" />
              <span className="text-[10px] truncate w-full">Usuarios</span>
            </button>

            <button
              onClick={() => setActiveRole('home')}
              className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
            >
              <Home className="w-4 h-4 mb-0.5 text-slate-400" />
              <span className="text-[10px] truncate w-full">Inicio</span>
            </button>
          </div>
        )}

        {/* Office Role Sub-modules Tabs */}
        {activeRole === 'office' && (
          <div className="grid grid-cols-6 gap-0.5 text-center">
            <button
              onClick={() => setOfficeSubTab('orders')}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-all ${
                officeSubTab === 'orders'
                  ? 'bg-sij-blue text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-3.5 h-3.5 mb-0.5" />
              <span className="text-[9px] truncate w-full">Órdenes</span>
            </button>

            <button
              onClick={() => setOfficeSubTab('routes')}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-all ${
                officeSubTab === 'routes'
                  ? 'bg-sij-blue text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 mb-0.5 text-emerald-400" />
              <span className="text-[9px] truncate w-full">Rutas</span>
            </button>

            <button
              onClick={() => setOfficeSubTab('budgets')}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-all ${
                officeSubTab === 'budgets'
                  ? 'bg-sij-blue text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mb-0.5 text-amber-400" />
              <span className="text-[9px] truncate w-full">Cotización</span>
            </button>

            <button
              onClick={() => setOfficeSubTab('catalogs')}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-all ${
                officeSubTab === 'catalogs'
                  ? 'bg-sij-blue text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-3.5 h-3.5 mb-0.5 text-purple-400" />
              <span className="text-[9px] truncate w-full">Catálogo</span>
            </button>

            <button
              onClick={() => setOfficeSubTab('reports')}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-all ${
                officeSubTab === 'reports'
                  ? 'bg-sij-blue text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 mb-0.5 text-sij-cyan" />
              <span className="text-[9px] truncate w-full">Reportes</span>
            </button>

            <button
              onClick={() => setActiveRole('home')}
              className="flex flex-col items-center justify-center py-1 px-0.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
            >
              <Home className="w-3.5 h-3.5 mb-0.5 text-slate-400" />
              <span className="text-[9px] truncate w-full">Inicio</span>
            </button>
          </div>
        )}

        {/* Tech Role Tab */}
        {activeRole === 'tech' && (
          <div className="grid grid-cols-2 gap-2 text-center">
            <button
              onClick={() => setActiveRole('tech')}
              className="flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              <Wrench className="w-4 h-4 text-white" />
              <span>Mis Trabajos</span>
            </button>
            <button
              onClick={() => setActiveRole('home')}
              className="flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
            >
              <Home className="w-4 h-4 text-sij-cyan" />
              <span>Menú Inicio</span>
            </button>
          </div>
        )}

        {/* Client Role Tab */}
        {activeRole === 'client' && (
          <div className="grid grid-cols-2 gap-2 text-center">
            <button
              onClick={() => setActiveRole('client')}
              className="flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-purple-600 text-white font-bold text-xs"
            >
              <UserCheck className="w-4 h-4 text-white" />
              <span>Mis Cotizaciones</span>
            </button>
            <button
              onClick={() => setActiveRole('home')}
              className="flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
            >
              <Home className="w-4 h-4 text-sij-cyan" />
              <span>Menú Inicio</span>
            </button>
          </div>
        )}
      </nav>
    </>
  );
};
