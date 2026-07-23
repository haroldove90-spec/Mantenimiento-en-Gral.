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
  const [isMobileFrame, setIsMobileFrame] = useState(true);
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
    <div id="tech-module" className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Technician Switcher & Layout Toggle */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Active Tech Selector */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Técnico Activo en Campo:
            </label>
            <select
              value={activeTechId}
              onChange={e => setActiveTechId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              {technicians.map(t => (
                <option key={t.id} value={t.id}>
                  👨‍🔧 {t.name} ({t.specialty})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sorting & Device View Mode */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setSortBy('priority')}
              className={`px-3 py-1 rounded-lg transition-all ${
                sortBy === 'priority' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Por Prioridad
            </button>
            <button
              onClick={() => setSortBy('date')}
              className={`px-3 py-1 rounded-lg transition-all ${
                sortBy === 'date' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Por Fecha
            </button>
          </div>

          <button
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center space-x-1 transition-all ${
              isMobileFrame
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300'
            }`}
            title="Cambiar vista móvil / escritorio"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">{isMobileFrame ? 'Marco Móvil' : 'Vista Expandida'}</span>
          </button>
        </div>

      </div>

      {/* Main Content Area */}
      <div className={isMobileFrame ? 'flex justify-center' : ''}>
        
        {/* Smartphone Device Mockup Frame */}
        <div
          className={
            isMobileFrame
              ? 'w-full max-w-sm bg-slate-900 p-3 rounded-[36px] shadow-2xl border-4 border-slate-800 relative'
              : 'w-full'
          }
        >
          {/* Mobile Screen Container */}
          <div className="bg-slate-50 rounded-[28px] overflow-hidden min-h-[620px] flex flex-col border border-slate-200">
            
            {/* App Mobile Top Bar */}
            <div className="bg-emerald-700 text-white p-4 flex items-center justify-between shadow-xs">
              <div>
                <div className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider">
                  App de Campo Técnico
                </div>
                <div className="text-sm font-bold">{currentTech?.name}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-400">
                OS
              </div>
            </div>

            {/* Notification Alert Banner */}
            {techNotifs.length > 0 && (
              <div className="bg-amber-500 text-slate-950 px-3 py-2 text-xs font-semibold flex items-center justify-between border-b border-amber-600">
                <div className="flex items-center space-x-2 truncate">
                  <Bell className="w-4 h-4 shrink-0 animate-bounce" />
                  <span className="truncate">{techNotifs[0].title}: {techNotifs[0].message}</span>
                </div>
              </div>
            )}

            {/* Orders List Container */}
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Mis Trabajos Asignados ({sortedOrders.length})
                </span>
              </div>

              {sortedOrders.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>No tienes órdenes pendientes asignadas en este momento.</p>
                </div>
              ) : (
                sortedOrders.map(ord => {
                  const isApproved = ord.budget?.status === 'Aprobado';

                  return (
                    <div
                      key={ord.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 relative hover:border-emerald-500 transition-all"
                    >
                      {/* Priority tag & Folio */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {ord.folio}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                        <h4 className="font-bold text-slate-900 text-xs">{ord.clientName}</h4>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{ord.departmentName}</span>
                        </div>
                      </div>

                      {/* Problem description */}
                      <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        {ord.description}
                      </p>

                      {/* Budget approval notification badge */}
                      {isApproved && ord.status !== 'Finalizada' && (
                        <div className="bg-emerald-500 text-white p-2 rounded-xl text-xs font-bold flex items-center space-x-2 animate-pulse">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>¡Presupuesto APROBADO! Puedes iniciar la reparación.</span>
                        </div>
                      )}

                      {/* Status indicator */}
                      <div className="text-[11px] text-slate-600 font-medium flex items-center justify-between pt-1">
                        <span>Estatus: <strong className="text-slate-800">{ord.status}</strong></span>
                      </div>

                      {/* Tech action buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        {ord.status === 'Finalizada' ? (
                          <div className="w-full text-center bg-slate-100 text-slate-600 text-xs font-bold py-1.5 rounded-xl flex items-center justify-center space-x-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Orden Concluida</span>
                          </div>
                        ) : isApproved || ord.status === 'En Reparación' ? (
                          <button
                            onClick={() => setExecOrder(ord)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Ejecución y Cierre</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setDiagOrder(ord)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Diagnóstico e Inspección</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

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
