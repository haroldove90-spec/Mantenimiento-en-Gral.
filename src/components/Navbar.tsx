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
  Crown
} from 'lucide-react';

export const Navbar: React.FC<{ onOpenCreateModal?: () => void }> = ({ onOpenCreateModal }) => {
  const {
    activeRole,
    setActiveRole,
    officeSubTab,
    setOfficeSubTab,
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
      case 'owner': return 'Rol Dueño (Administración General)';
      case 'office': return 'Módulo de Oficina';
      case 'tech': return 'Módulo Técnico';
      case 'client': return 'Portal de Cliente';
      default: return '';
    }
  };

  return (
    <>
      {/* ------------------- DESKTOP LEFT SIDEBAR (lg:flex, ONLY WHEN INSIDE A ROLE) ------------------- */}
      {activeRole !== 'home' && (
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
                src="https://battwitnhrezwotkcvbc.supabase.co/storage/v1/object/public/logo/sijicono.png"
                alt="SIJ Logo"
                className="h-10 w-auto object-contain shrink-0 drop-shadow-sm"
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

            {/* Section: DUEÑO */}
            <div>
              <div className="px-2 mb-2 text-xs font-bold text-white/50 uppercase tracking-wider flex items-center justify-between">
                <span>Administración</span>
                <Crown className="w-4 h-4 text-sij-orange" />
              </div>

              <button
                id="role-btn-owner"
                onClick={() => setActiveRole('owner')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeRole === 'owner'
                    ? 'bg-sij-orange text-white shadow-md font-bold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Crown className="w-4 h-4 shrink-0 text-sij-orange" />
                <span>Panel del Dueño</span>
              </button>
            </div>

            {/* Section: OFICINA & SUB-MÓDULOS */}
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
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
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
                  setOfficeSubTab('budgets');
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeRole === 'office' && officeSubTab === 'budgets'
                    ? 'bg-sij-blue text-white shadow-md font-bold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Presupuestos & Cotizaciones</span>
              </button>

              <button
                onClick={() => {
                  setActiveRole('office');
                  setOfficeSubTab('catalogs');
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeRole === 'office' && officeSubTab === 'catalogs'
                    ? 'bg-sij-blue text-white shadow-md font-bold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Users className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Catálogos, Clientes e Historial</span>
              </button>

              <button
                onClick={() => {
                  setActiveRole('office');
                  setOfficeSubTab('reports');
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeRole === 'office' && officeSubTab === 'reports'
                    ? 'bg-sij-blue text-white shadow-md font-bold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0 text-sij-cyan" />
                <span>Reportes y Métricas</span>
              </button>
            </div>

            {/* Section: TÉCNICO DE CAMPO */}
            <div>
              <div className="px-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Módulo Técnico</span>
                <Wrench className="w-4 h-4 text-emerald-400" />
              </div>

              <button
                id="role-btn-tech"
                onClick={() => setActiveRole('tech')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeRole === 'tech'
                    ? 'bg-emerald-600 text-white shadow-md font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Wrench className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Mis Trabajos Asignados</span>
              </button>
            </div>

            {/* Section: PORTAL DEL CLIENTE */}
            <div>
              <div className="px-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Portal de Cliente</span>
                <UserCheck className="w-4 h-4 text-purple-400" />
              </div>

              <button
                id="role-btn-client"
                onClick={() => setActiveRole('client')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeRole === 'client'
                    ? 'bg-purple-600 text-white shadow-md font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0 text-purple-400" />
                <span>Aprobación de Cotizaciones</span>
              </button>
            </div>

          </div>

          {/* Office Quick Actions */}
          {activeRole === 'office' && onOpenCreateModal && (
            <div className="mb-3 pt-3 border-t border-slate-800">
              <button
                id="sidebar-create-order-btn"
                onClick={onOpenCreateModal}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Crear Reporte Mtto</span>
              </button>
            </div>
          )}

          {/* Notifications & System Profile Footer */}
          <div className="pt-3 border-t border-slate-800 space-y-2 relative">
            <button
              id="sidebar-notif-btn"
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 transition-colors text-xs font-medium"
            >
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-blue-400" />
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
                    <Bell className="w-4 h-4 text-blue-400" />
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

            {/* Logout / Switch Role Button */}
            <button
              onClick={() => setActiveRole('home')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition-colors border border-rose-500/20"
              title="Cerrar sesión y volver al menú principal"
            >
              <span>Cerrar Sesión</span>
              <LogOut className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2.5 px-1 text-slate-400 text-[11px]">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-300">Sistema en Línea</span>
            </div>
          </div>
        </aside>
      )}

      {/* ------------------- MOBILE TOP HEADER (lg:hidden, SHOWN WHEN IN A ROLE) ------------------- */}
      {activeRole !== 'home' && (
        <header
          id="app-mobile-top-header"
          className="lg:hidden bg-sij-navy text-white border-b border-sij-navy sticky top-0 z-30 shadow-md"
        >
          <div className="px-3.5 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 text-left">
              <img
                src="https://battwitnhrezwotkcvbc.supabase.co/storage/v1/object/public/logo/sijicono.png"
                alt="SIJ Logo"
                className="h-9 w-auto object-contain shrink-0 drop-shadow-sm"
              />
              <div>
                <span className="font-extrabold text-base text-white block leading-tight tracking-wider">SIJ</span>
                <span className="text-[11px] text-sij-cyan font-bold">{getRoleName()}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Notifications Button */}
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="p-2 rounded-xl text-slate-300 hover:text-white relative bg-slate-800 border border-slate-700"
                title="Notificaciones"
              >
                <Bell className="w-4 h-4 text-blue-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
                )}
              </button>

              {/* Logout Button to return to Home and pick another role */}
              <button
                onClick={() => setActiveRole('home')}
                className="flex items-center space-x-1 bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs"
                title="Cerrar sesión e ir al menú de roles"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
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
      )}

      {/* ------------------- MOBILE APP BOTTOM NAVIGATION BAR (lg:hidden, SHOWN WHEN IN A ROLE) ------------------- */}
      {activeRole !== 'home' && (
        <nav
          id="app-mobile-bottom-nav"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-white shadow-2xl px-2 py-2"
        >
          {/* Office Role Sub-modules Tabs */}
          {activeRole === 'office' && (
            <div className="grid grid-cols-4 gap-1 text-center">
              <button
                onClick={() => setOfficeSubTab('orders')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                  officeSubTab === 'orders'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FileText className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Órdenes</span>
              </button>

              <button
                onClick={() => setOfficeSubTab('budgets')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                  officeSubTab === 'budgets'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 mb-0.5 text-emerald-400" />
                <span className="text-[10px]">Cotizaciones</span>
              </button>

              <button
                onClick={() => setOfficeSubTab('catalogs')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                  officeSubTab === 'catalogs'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-4 h-4 mb-0.5 text-indigo-400" />
                <span className="text-[10px]">Catálogos</span>
              </button>

              <button
                onClick={() => setOfficeSubTab('reports')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                  officeSubTab === 'reports'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <BarChart3 className="w-4 h-4 mb-0.5 text-purple-400" />
                <span className="text-[10px]">Reportes</span>
              </button>
            </div>
          )}

          {/* Tech Role Tab */}
          {activeRole === 'tech' && (
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold w-full justify-center">
                <Wrench className="w-4 h-4 text-emerald-400" />
                <span>Módulo Técnico • Trabajos Asignados</span>
              </div>
            </div>
          )}

          {/* Client Role Tab */}
          {activeRole === 'client' && (
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2 bg-purple-600/20 text-purple-300 border border-purple-500/30 px-4 py-2 rounded-xl text-xs font-bold w-full justify-center">
                <UserCheck className="w-4 h-4 text-purple-400" />
                <span>Portal de Cliente • Aprobación de Cotizaciones</span>
              </div>
            </div>
          )}
        </nav>
      )}
    </>
  );
};




