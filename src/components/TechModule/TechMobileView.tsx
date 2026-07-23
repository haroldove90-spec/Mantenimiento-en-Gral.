import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder } from '../../types';
import { InspectionDiagnosticsModal } from './InspectionDiagnosticsModal';
import { ExecutionAndCloseModal } from './ExecutionAndCloseModal';
import {
  Wrench,
  Smartphone,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Camera,
  PlayCircle,
  FileCheck,
  ChevronRight,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

export const TechMobileView: React.FC = () => {
  const { orders, technicians, notifications } = useApp();

  const [activeTechId, setActiveTechId] = useState<string>(technicians[0]?.id || 'tech-1');
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority');

  const currentTech = technicians.find(t => t.id === activeTechId);

  // Modals state
  const [diagOrder, setDiagOrder] = useState<ServiceOrder | null>(null);
  const [execOrder, setExecOrder] = useState<ServiceOrder | null>(null);

  // Assigned orders for selected technician
  const assignedOrders = orders.filter(
    o => o.technicianId === activeTechId || (!o.technicianId && activeTechId === 'tech-1')
  );

  const sortedOrders = [...assignedOrders].sort((a, b) => {
    if (sortBy === 'priority') {
      const pMap = { Alta: 1, Media: 2, Baja: 3 };
      return pMap[a.priority] - pMap[b.priority];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const techNotifs = notifications.filter(
    n => n.targetRole === 'tech' || n.targetRole === 'office'
  );

  return (
    <div id="tech-module" className="w-full px-4 sm:px-6 py-4 space-y-4">
      
      {/* Top Banner & Technician Switcher */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Active Tech Info */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Módulo Técnico de Campo
            </div>
            <h2 className="text-lg font-bold text-slate-900">{currentTech?.name} ({currentTech?.specialty})</h2>
          </div>
        </div>

        {/* Technician Selector & Sorting */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Cambiar Técnico:</label>
            <select
              value={activeTechId}
              onChange={e => setActiveTechId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              {technicians.map(t => (
                <option key={t.id} value={t.id}>
                  👨‍🔧 {t.name} ({t.specialty})
                </option>
              ))}
            </select>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setSortBy('priority')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                sortBy === 'priority' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Por Prioridad
            </button>
            <button
              onClick={() => setSortBy('date')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                sortBy === 'date' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Por Fecha
            </button>
          </div>
        </div>

      </div>

      {/* Notification Banner */}
      {techNotifs.length > 0 && (
        <div className="bg-amber-500 text-slate-950 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 shrink-0 animate-bounce" />
            <span>Alerta de Campo: {techNotifs[0].title} — {techNotifs[0].message}</span>
          </div>
        </div>
      )}

      {/* Full-width Orders View List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="font-bold text-slate-800 uppercase tracking-wider text-sm">
            Mis Trabajos Asignados ({sortedOrders.length})
          </span>
        </div>

        {sortedOrders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl text-center py-16 text-slate-400 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700 text-base">No tienes órdenes pendientes asignadas en este momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedOrders.map(ord => {
              const isApproved = ord.budget?.status === 'Aprobado';

              return (
                <div
                  key={ord.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 hover:border-emerald-500 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="flex-1 space-y-3">
                    {/* Priority tag & Folio */}
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-sm text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                        {ord.folio}
                      </span>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          ord.priority === 'Alta'
                            ? 'bg-rose-100 text-rose-800'
                            : ord.priority === 'Media'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        Prioridad {ord.priority}
                      </span>
                    </div>

                    {/* Client & location */}
                    <div>
                      <h4 className="font-bold text-slate-900 text-base sm:text-lg">{ord.clientName}</h4>
                      <div className="text-sm font-semibold text-slate-500 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{ord.departmentName}</span>
                      </div>
                    </div>

                    {/* Problem description */}
                    <p className="text-sm text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-medium">
                      {ord.description}
                    </p>

                    {/* Budget approval notification badge */}
                    {isApproved && ord.status !== 'Finalizada' && (
                      <div className="bg-emerald-600 text-white p-3 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 animate-pulse">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>¡Presupuesto APROBADO por el Cliente! Puedes iniciar la reparación.</span>
                      </div>
                    )}

                    {/* Status indicator */}
                    <div className="text-sm text-slate-600 font-medium flex items-center space-x-2 pt-1">
                      <span>Estatus actual:</span>
                      <strong className="text-slate-900 font-bold bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">{ord.status}</strong>
                    </div>
                  </div>

                  {/* Tech action buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {ord.status === 'Finalizada' ? (
                      <div className="w-full text-center bg-slate-100 text-slate-600 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Orden Concluida Exitosamente</span>
                      </div>
                    ) : isApproved || ord.status === 'En Reparación' ? (
                      <button
                        onClick={() => setExecOrder(ord)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Ejecución y Cierre (Evidencia)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setDiagOrder(ord)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Diagnóstico e Inspección</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODALS */}
      {diagOrder && (
        <InspectionDiagnosticsModal
          order={diagOrder}
          isOpen={!!diagOrder}
          onClose={() => setDiagOrder(null)}
        />
      )}

      {execOrder && (
        <ExecutionAndCloseModal
          order={execOrder}
          isOpen={!!execOrder}
          onClose={() => setExecOrder(null)}
        />
      )}

    </div>
  );
};
