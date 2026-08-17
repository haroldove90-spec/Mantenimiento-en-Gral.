import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, X, Wrench, Building2, Crown, UserCheck } from 'lucide-react';
import { Notification } from '../types';

export const NotificationToast: React.FC = () => {
  const { notifications, activeRole, currentUser, markNotificationRead } = useApp();
  const [activeToast, setActiveToast] = useState<Notification | null>(null);

  // Monitor latest unread notification
  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[0];
    if (!latest.read) {
      // Check if matches active role or user
      const isForCurrentRole =
        activeRole === 'home' ||
        latest.targetRole === activeRole ||
        (currentUser?.role && latest.targetRole === currentUser.role);

      if (isForCurrentRole) {
        setActiveToast(latest);
        const timer = setTimeout(() => {
          setActiveToast(prev => (prev?.id === latest.id ? null : prev));
        }, 6000);
        return () => clearTimeout(timer);
      }
    }
  }, [notifications, activeRole, currentUser]);

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
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700 shadow-2xl rounded-2xl p-4 flex items-start space-x-3">
        <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
          {getRoleIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sij-cyan">
              {activeToast.orderFolio || 'Aviso del Sistema'}
            </span>
            <button
              onClick={() => {
                markNotificationRead(activeToast.id);
                setActiveToast(null);
              }}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h4 className="text-sm font-bold text-slate-100 mt-0.5 truncate">
            {activeToast.title}
          </h4>
          <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
            {activeToast.message}
          </p>
        </div>
      </div>
    </div>
  );
};
