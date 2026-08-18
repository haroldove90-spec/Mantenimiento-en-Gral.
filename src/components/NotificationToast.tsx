import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, X, Wrench, Building2, Crown, UserCheck } from 'lucide-react';
import { Notification } from '../types';

export const NotificationToast: React.FC = () => {
  const {
    notifications,
    activeRole,
    currentUser,
    markNotificationRead,
    technicians,
    selectedClientOrderFolio
  } = useApp();
  const [activeToast, setActiveToast] = useState<Notification | null>(null);

  // Monitor latest unread notification
  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[0];
    if (!latest.read) {
      const uRole = currentUser?.role || (activeRole !== 'home' ? activeRole : undefined);

      let isForCurrentRole = false;

      if (uRole === 'owner' || activeRole === 'owner') {
        // Admin/Owner receives notifications intended for owner or office
        isForCurrentRole = latest.targetRole === 'owner' || latest.targetRole === 'office';
      } else if (uRole === 'office' || activeRole === 'office') {
        // Office receives notifications intended for office
        isForCurrentRole = latest.targetRole === 'office';
      } else if (uRole === 'tech' || activeRole === 'tech') {
        // Technician ONLY receives notifications for tech role and for THIS specific technician
        if (latest.targetRole === 'tech') {
          const curId = currentUser?.id || localStorage.getItem('sij_tech_active_filter');
          const curName = currentUser?.name?.trim().toLowerCase();
          const curEmail = currentUser?.email?.trim().toLowerCase();

          // Find current technician record
          const currentTech = technicians.find(
            t =>
              (curId && t.id === curId) ||
              (curEmail && t.email && t.email.toLowerCase() === curEmail) ||
              (curName && t.name.toLowerCase() === curName)
          );

          if (!latest.targetTechnicianId && !latest.targetTechnicianName) {
            // General technician bulletin
            isForCurrentRole = true;
          } else {
            const matchId =
              latest.targetTechnicianId &&
              (latest.targetTechnicianId === curId ||
                latest.targetTechnicianId === currentTech?.id ||
                latest.targetTechnicianId === currentTech?.name);
            const matchName =
              latest.targetTechnicianName &&
              ((curName && latest.targetTechnicianName.toLowerCase() === curName) ||
                (currentTech && latest.targetTechnicianName.toLowerCase() === currentTech.name.toLowerCase()));

            isForCurrentRole = Boolean(matchId || matchName);
          }
        }
      } else if (uRole === 'client' || activeRole === 'client') {
        // Client ONLY receives notifications for client role AND matching their specific order or client ID
        if (latest.targetRole === 'client') {
          const activeFolio = (selectedClientOrderFolio || '').trim().toLowerCase();
          const notifFolio = (latest.orderFolio || '').trim().toLowerCase();
          const curClientId = currentUser?.id;

          if (latest.targetClientId && curClientId && latest.targetClientId === curClientId) {
            isForCurrentRole = true;
          } else if (activeFolio && notifFolio && activeFolio === notifFolio) {
            isForCurrentRole = true;
          }
        }
      }

      if (isForCurrentRole) {
        setActiveToast(latest);
        const timer = setTimeout(() => {
          setActiveToast(prev => (prev?.id === latest.id ? null : prev));
        }, 7000);
        return () => clearTimeout(timer);
      }
    }
  }, [notifications, activeRole, currentUser, selectedClientOrderFolio, technicians]);

  if (!activeToast) return null;

  const getRoleIcon = () => {
    switch (activeToast.targetRole) {
      case 'tech':
        return <Wrench className="w-5 h-5 text-emerald-400" />;
      case 'office':
        return <Building2 className="w-5 h-5 text-blue-400" />;
      case 'owner':
        return <Crown className="w-5 h-5 text-amber-400" />;
      case 'client':
        return <UserCheck className="w-5 h-5 text-purple-400" />;
      default:
        return <Bell className="w-5 h-5 text-sij-cyan" />;
    }
  };

  return (
    <aside
      aria-label="Notificaciones del Sistema"
      className="fixed top-3 inset-x-3 sm:inset-x-auto sm:right-4 sm:top-4 z-50 flex justify-center sm:block pointer-events-auto w-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="w-full max-w-sm sm:max-w-md bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 shadow-2xl rounded-2xl p-3.5 sm:p-4 flex items-start space-x-3 mx-auto">
        <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
          {getRoleIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sij-cyan truncate">
              {activeToast.orderFolio || 'Aviso del Sistema'}
            </span>
            <button
              onClick={() => {
                markNotificationRead(activeToast.id);
                setActiveToast(null);
              }}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 cursor-pointer shrink-0"
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h4 className="text-sm font-bold text-slate-100 mt-0.5 leading-snug break-words">
            {activeToast.title}
          </h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed break-words">
            {activeToast.message}
          </p>
        </div>
      </div>
    </aside>
  );
};
