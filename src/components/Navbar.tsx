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
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';

export const Navbar: React.FC<{ onOpenCreateModal?: () => void }> = ({ onOpenCreateModal }) => {
  const { activeRole, setActiveRole, notifications, markNotificationRead } = useApp();
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const roleNotifs = notifications.filter(
    n => activeRole === 'home' || n.targetRole === activeRole
  );
  const unreadCount = roleNotifs.filter(n => !n.read).length;

  return (
    <header id="app-navbar" className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Home button */}
        <div className="flex items-center space-x-3">
          <button
            id="nav-home-btn"
            onClick={() => setActiveRole('home')}
            className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors focus:outline-hidden"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="hidden sm:block text-left">
              <span className="font-semibold text-base block leading-none">Gestión OS</span>
              <span className="text-xs text-slate-400 font-normal">Mantenimiento & Servicios</span>
            </div>
          </button>
        </div>

        {/* Role Selectors & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <nav className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/60">
            <button
              id="role-btn-home"
              onClick={() => setActiveRole('home')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeRole === 'home'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
              title="Inicio"
            >
              <Home className="w-4 h-4" />
              <span className="hidden md:inline">Inicio</span>
            </button>

            <button
              id="role-btn-office"
              onClick={() => setActiveRole('office')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeRole === 'office'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Oficina</span>
            </button>

            <button
              id="role-btn-tech"
              onClick={() => setActiveRole('tech')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeRole === 'tech'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Técnico</span>
            </button>

            <button
              id="role-btn-client"
              onClick={() => setActiveRole('client')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeRole === 'client'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Cliente</span>
            </button>
          </nav>

          {/* New Order Button for Office */}
          {activeRole === 'office' && onOpenCreateModal && (
            <button
              id="nav-create-order-btn"
              onClick={onOpenCreateModal}
              className="hidden sm:flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nueva Orden</span>
            </button>
          )}

          {/* Notifications Toggle */}
          <div className="relative">
            <button
              id="nav-notif-btn"
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-slate-900" />
              )}
            </button>

            {/* Notifications Menu */}
            {showNotifMenu && (
              <div
                id="notif-dropdown"
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-3 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-white">Notificaciones</span>
                    {unreadCount > 0 && (
                      <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full font-medium">
                        {unreadCount} nuevas
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowNotifMenu(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                  {roleNotifs.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm">
                      Sin notificaciones recientes.
                    </div>
                  ) : (
                    roleNotifs.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-3 text-xs cursor-pointer transition-colors ${
                          n.read ? 'bg-slate-900 text-slate-400' : 'bg-slate-800/40 text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-semibold text-blue-400">{n.orderFolio}</span>
                          <span className="text-slate-500 flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{n.timestamp}</span>
                          </span>
                        </div>
                        <div className="font-medium text-slate-100 mb-0.5">{n.title}</div>
                        <p className="text-slate-400 line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
