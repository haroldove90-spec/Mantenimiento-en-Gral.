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
  ChevronRight
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
      case 'office': return 'Módulo de Oficina';
      case 'tech': return 'Módulo Técnico';
      case 'client': return 'Portal de Cliente';
      default: return 'Sistema de Mantenimiento';
    }
  };

  return (
    <>
      {/* ------------------- DESKTOP LEFT SIDEBAR (lg:flex) ------------------- */}
      <aside
        id="app-sidebar-desktop"
        className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-white h-screen fixed top-0 left-0 z-40 p-4 shadow-xl overflow-y-auto"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <button
            onClick={() => setActiveRole('home')}
            className="flex items-center space-x-3 text-left group focus:outline-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 group-hover:bg-blue-500 transition-colors flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-white block leading-tight">Gestión OS</span>
              <span className="text-[10px] text-slate-400 font-normal">Sistema de Servicios</span>
            </div>
          </button>
        </div>

        {/* Navigation Menu with Sub-Modules */}
        <div className="mt-4 flex-1 space-y-5">
          
          {/* Section: INICIO */}
          <div>
            <div className="px-2 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Navegación General
            </div>
            <button
              id="role-btn-home"
              onClick={() => setActiveRole('home')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeRole === 'home'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>Inicio / Menú Principal</span>
            </button>
          </div>

          {/* Section: OFICINA & SUB-MÓDULOS */}
          <div className="space-y-1">
            <div className="px-2 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Módulos de Oficina</span>
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
            </div>

            <button
              onClick={() => {
                setActiveRole('office');
                setOfficeSubTab('orders');
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeRole === 'office' && officeSubTab === 'orders'
                  ? 'bg-blue-600 text-white shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Órdenes de Servicio</span>
            </button>

            <button
              onClick={() => {
                setActiveRole('office');
                setOfficeSubTab('budgets');
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeRole === 'office' && officeSubTab === 'budgets'
                  ? 'bg-blue-600 text-white shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
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
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeRole === 'office' && officeSubTab === 'catalogs'
                  ? 'bg-blue-600 text-white shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4 shrink-0 text-indigo-400" />
              <span>Catálogos, Clientes e Historial</span>
            </button>

            <button
              onClick={() => {
                setActiveRole('office');
                setOfficeSubTab('reports');
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeRole === 'office' && officeSubTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0 text-purple-400" />
              <span>Reportes y Métricas</span>
            </button>
          </div>

          {/* Section: TÉCNICO DE CAMPO */}
          <div>
            <div className="px-2 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Módulo Técnico</span>
              <Wrench className="w-3.5 h-3.5 text-emerald-400" />
            </div>

            <button
              id="role-btn-tech"
              onClick={() => setActiveRole('tech')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
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
            <div className="px-2 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Portal de Cliente</span>
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
            </div>

            <button
              id="role-btn-client"
              onClick={() => setActiveRole('client')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
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
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
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
          {activeRole !== 'home' && (
            <button
              onClick={() => setActiveRole('home')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition-colors border border-rose-500/20"
              title="Cerrar sesión y volver al menú principal"
            >
              <span>Cerrar Sesión</span>
              <LogOut className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center space-x-2.5 px-1 text-slate-400 text-[11px]">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-300">Sistema en Línea</span>
          </div>
        </div>
      </aside>

      {/* ------------------- MOBILE & TABLET TOP HEADER BAR (lg:hidden) ------------------- */}
      {/* Replaces bottom bar with a top bar containing Logout button to return to Home */}
      {activeRole !== 'home' && (
        <header
          id="app-mobile-top-header"
          className="lg:hidden bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 px-4 py-2.5 flex items-center justify-between shadow-md"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-white block leading-tight">Gestión OS</span>
              <span className="text-[10px] text-blue-400 font-semibold">{getRoleName()}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Create Button for Office */}
            {activeRole === 'office' && onOpenCreateModal && (
              <button
                onClick={onOpenCreateModal}
                className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Reporte</span>
              </button>
            )}

            {/* Logout / Exit to Home Icon Button */}
            <button
              onClick={() => setActiveRole('home')}
              className="flex items-center space-x-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              title="Cerrar sesión e ir al Inicio"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </header>
      )}
    </>
  );
};



