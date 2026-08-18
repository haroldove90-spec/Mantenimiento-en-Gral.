import React, { useState, useEffect, useMemo } from 'react';
import { useApp, deduplicateTechnicians } from '../../context/AppContext';
import { ServiceOrder, OrderStatus } from '../../types';
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
  UserCheck,
  Trash2,
  Activity,
  Send,
  CheckCircle,
  Hourglass,
  Calendar,
  Layers,
  ArrowRight,
  MessageSquareText,
  Radio,
  FileSpreadsheet,
  Users
} from 'lucide-react';

export const TechMobileView: React.FC = () => {
  const {
    orders,
    technicians,
    notifications,
    currentUser,
    updateOrderStatus,
    assignTechnician,
    clearSampleData
  } = useApp();

  // Identify logged in technician if user role is 'tech'
  const loggedInTech = useMemo(() => {
    if (!currentUser || currentUser.role !== 'tech') return null;
    const curEmail = (currentUser.email || '').trim().toLowerCase();
    const curName = (currentUser.name || '').trim().toLowerCase();
    const curUser = (currentUser.username || '').trim().toLowerCase();
    return (
      technicians.find(
        t =>
          (curEmail && t.email && t.email.toLowerCase() === curEmail) ||
          (t.id && t.id === currentUser.id) ||
          (curName && t.name && t.name.toLowerCase() === curName) ||
          (curUser && t.name && t.name.toLowerCase() === curUser)
      ) || null
    );
  }, [currentUser, technicians]);

  // Persistent activeTechId
  const [activeTechId, setActiveTechId] = useState<string>(() => {
    if (currentUser?.role === 'tech') {
      const curEmail = (currentUser.email || '').trim().toLowerCase();
      const curName = (currentUser.name || '').trim().toLowerCase();
      const matched = technicians.find(
        t =>
          (curEmail && t.email && t.email.toLowerCase() === curEmail) ||
          (t.id && t.id === currentUser.id) ||
          (curName && t.name && t.name.toLowerCase() === curName)
      );
      if (matched) return matched.id;
    }
    const saved = localStorage.getItem('sij_tech_active_filter');
    if (saved) return saved;
    return currentUser?.role === 'tech' && technicians.length > 0 ? technicians[0].id : 'all';
  });

  useEffect(() => {
    if (currentUser?.role === 'tech' && loggedInTech) {
      setActiveTechId(loggedInTech.id);
    }
  }, [currentUser, loggedInTech]);

  const handleSelectTechView = (val: string) => {
    setActiveTechId(val);
    localStorage.setItem('sij_tech_active_filter', val);
  };

  const [sortBy, setSortBy] = useState<'priority' | 'date'>('date');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  // Status Change Confirmation Modal State
  const [statusModalOrder, setStatusModalOrder] = useState<ServiceOrder | null>(null);
  const [targetNewStatus, setTargetNewStatus] = useState<OrderStatus>('En Reparación');
  const [statusNote, setStatusNote] = useState<string>('');
  const [statusFeedbackMsg, setStatusFeedbackMsg] = useState<string | null>(null);

  const currentTech = useMemo(() => {
    if (activeTechId === 'all') return null;
    return technicians.find(t => t.id === activeTechId) || (loggedInTech && activeTechId === loggedInTech.id ? loggedInTech : null);
  }, [activeTechId, technicians, loggedInTech]);

  // Modals state
  const [diagOrder, setDiagOrder] = useState<ServiceOrder | null>(null);
  const [execOrder, setExecOrder] = useState<ServiceOrder | null>(null);

  // Assigned orders for selected technician (STRICT single-technician matching)
  const assignedOrders = useMemo(() => {
    // If a specific technician is selected (or when logged in as technician)
    if (activeTechId !== 'all') {
      const targetTech = currentTech || technicians.find(t => t.id === activeTechId);
      const targetId = targetTech ? targetTech.id : activeTechId;
      const targetName = targetTech ? targetTech.name.trim().toLowerCase() : '';
      const targetEmail = targetTech?.email ? targetTech.email.trim().toLowerCase() : '';

      return orders.filter(o => {
        // Direct ID match
        if (o.technicianId && o.technicianId === targetId) return true;

        // Exact Name match (case insensitive)
        if (targetName && o.technicianName && o.technicianName.trim().toLowerCase() === targetName) return true;

        // Exact Email match
        if (targetEmail && (o as any).technicianEmail && (o as any).technicianEmail.trim().toLowerCase() === targetEmail) return true;

        return false;
      });
    }

    // If 'all' is selected:
    // If logged in as technician, strictly limit to his orders
    if (currentUser?.role === 'tech' && loggedInTech) {
      const myId = loggedInTech.id;
      const myName = loggedInTech.name.trim().toLowerCase();
      return orders.filter(o => {
        if (o.technicianId && o.technicianId === myId) return true;
        if (myName && o.technicianName && o.technicianName.trim().toLowerCase() === myName) return true;
        return false;
      });
    }

    // Admins and Office seeing global list
    return orders;
  }, [orders, activeTechId, currentTech, technicians, currentUser, loggedInTech]);

  const effectiveOrders = assignedOrders;

  // Filter by lifecycle category
  const filteredByStatus = effectiveOrders.filter(o => {
    if (statusFilter === 'pending') {
      return (
        o.status === 'Pendiente de Visita' ||
        o.status === 'Presupuesto Pendiente' ||
        o.status === 'Esperando Aprobación' ||
        o.status === 'Garantía Reabierta' ||
        (o.status as any) === 'Recepción Inicial' ||
        (o.status as any) === 'Asignada'
      );
    }
    if (statusFilter === 'in_progress') {
      return o.status === 'En Diagnóstico' || o.status === 'En Reparación' || (o.status as any) === 'En proceso';
    }
    if (statusFilter === 'completed') {
      return o.status === 'Cobrado/Cerrado' || (o.status as any) === 'Terminado' || (o.status as any) === 'Finalizada';
    }
    return true;
  });

  // Sort orders: Newest & Active (Non-closed) orders strictly in primer plano (top)
  const sortedOrders = [...filteredByStatus].sort((a, b) => {
    // 1. Put active orders before closed orders
    const aClosed = a.status === 'Cobrado/Cerrado' ? 1 : 0;
    const bClosed = b.status === 'Cobrado/Cerrado' ? 1 : 0;
    if (aClosed !== bClosed) return aClosed - bClosed;

    // 2. Custom sort
    if (sortBy === 'priority') {
      const pMap = { Alta: 1, Media: 2, Baja: 3 };
      return pMap[a.priority] - pMap[b.priority];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const techNotifs = notifications.filter(
    n => n.targetRole === 'tech' || n.targetRole === 'office'
  );

  // Helper to categorize status into the 3 core pillars: Pendiente, En Proceso, Terminado
  const getStatusGroup = (status: OrderStatus): 'pending' | 'in_progress' | 'completed' => {
    if (status === 'Cobrado/Cerrado') return 'completed';
    if (status === 'En Diagnóstico' || status === 'En Reparación') return 'in_progress';
    return 'pending';
  };

  // Open modal to confirm status change
  const handleOpenStatusModal = (order: ServiceOrder, newSt: OrderStatus) => {
    setStatusModalOrder(order);
    setTargetNewStatus(newSt);
    setStatusNote('');
  };

  // Execute status change
  const handleConfirmStatusChange = () => {
    if (!statusModalOrder) return;

    const author = currentTech ? `${currentTech.name} (Técnico de Campo)` : (currentUser?.name || 'Técnico de Campo');
    updateOrderStatus(statusModalOrder.id, targetNewStatus, statusNote.trim() || undefined, author);

    setStatusFeedbackMsg(`¡Estatus de orden ${statusModalOrder.folio} actualizado a "${targetNewStatus}"! Se notificó a Admin, Oficina y Cliente.`);
    setTimeout(() => setStatusFeedbackMsg(null), 5000);

    setStatusModalOrder(null);
    setStatusNote('');
  };

  // Direct quick switch for the 3 main buttons
  const handleQuickStatusPillClick = (order: ServiceOrder, group: 'pending' | 'in_progress' | 'completed') => {
    let newSt: OrderStatus = 'Pendiente de Visita';
    if (group === 'pending') {
      newSt = 'Pendiente de Visita';
    } else if (group === 'in_progress') {
      newSt = order.budget?.status === 'Aprobado' ? 'En Reparación' : 'En Diagnóstico';
    } else if (group === 'completed') {
      newSt = 'Cobrado/Cerrado';
    }

    if (order.status === newSt) return;
    handleOpenStatusModal(order, newSt);
  };

  const ALL_STATUSES: OrderStatus[] = [
    'Pendiente de Visita',
    'En Diagnóstico',
    'Presupuesto Pendiente',
    'Esperando Aprobación',
    'En Reparación',
    'Cobrado/Cerrado',
    'Garantía Reabierta'
  ];

  return (
    <div id="tech-module" className="w-full px-4 sm:px-6 py-4 space-y-5">
      
      {/* Feedback Toast */}
      {statusFeedbackMsg && (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-emerald-500/30 flex items-center justify-between animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center space-x-3 text-xs sm:text-sm font-bold">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <span>{statusFeedbackMsg}</span>
          </div>
          <button
            onClick={() => setStatusFeedbackMsg(null)}
            className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner & Technician Switcher */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Active Tech Info */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <span>Módulo Técnico de Campo</span>
              {currentUser && (
                <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Usuario: {currentUser.name}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {currentTech ? `${currentTech.name} (${currentTech.specialty})` : 'Técnico de Campo'}
            </h2>
          </div>
        </div>

        {/* Technician Selector & Sorting */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Vista Técnico:</label>
            <select
              value={activeTechId}
              onChange={e => handleSelectTechView(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
            >
              <option value="all">🌐 Ver Todas las Órdenes ({orders.length})</option>
              {deduplicateTechnicians(technicians).map(t => {
                const count = orders.filter(
                  o => o.technicianId === t.id || (o.technicianName && o.technicianName.toLowerCase() === t.name.toLowerCase())
                ).length;
                return (
                  <option key={t.id} value={t.id}>
                    👨‍🔧 {t.name} ({count} asignadas)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setSortBy('priority')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                sortBy === 'priority' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Por Prioridad
            </button>
            <button
              onClick={() => setSortBy('date')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                sortBy === 'date' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600'
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

      {/* Status Filter Tabs (Todos, Pendientes, En Proceso, Terminados) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todos ({assignedOrders.length})</span>
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-800 hover:bg-amber-50 bg-amber-50/50'
            }`}
          >
            <Hourglass className="w-3.5 h-3.5" />
            <span>
              Pendientes ({assignedOrders.filter(o => getStatusGroup(o.status) === 'pending').length})
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              statusFilter === 'in_progress'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-800 hover:bg-blue-50 bg-blue-50/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>
              En Proceso ({assignedOrders.filter(o => getStatusGroup(o.status) === 'in_progress').length})
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-800 hover:bg-emerald-50 bg-emerald-50/50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              Terminados ({assignedOrders.filter(o => getStatusGroup(o.status) === 'completed').length})
            </span>
          </button>
        </div>

        <div className="text-xs font-bold text-slate-500 px-2 flex items-center space-x-1">
          <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>Sincronización en tiempo real con Admin, Oficina y Cliente</span>
        </div>
      </div>

      {/* Orders List View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="font-bold text-slate-800 uppercase tracking-wider text-sm">
            Mis Trabajos Asignados ({sortedOrders.length})
          </span>
        </div>

        {sortedOrders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl text-center py-12 px-6 text-slate-400 space-y-4 shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1 max-w-md mx-auto">
              <p className="font-bold text-slate-800 text-base">
                {orders.length > 0
                  ? `No hay órdenes asignadas a "${currentTech?.name || currentUser?.name || 'este técnico'}" en esta vista.`
                  : 'No hay órdenes de servicio en el sistema actualmente.'}
              </p>
              <p className="text-xs text-slate-500">
                {orders.length > 0
                  ? `Existen ${orders.length} orden(es) en el sistema (por ejemplo, asignadas a "Tecnico 1" o sin asignar).`
                  : 'El administrador u oficina pueden crear una orden desde el panel de Oficina.'}
              </p>
            </div>

            {orders.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => {
                    handleSelectTechView('all');
                    setStatusFilter('all');
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>🌐 Ver Todas las Órdenes ({orders.length})</span>
                </button>

                {technicians.filter(t => t.id !== activeTechId).map(t => {
                  const tOrdersCount = orders.filter(o => o.technicianId === t.id || (o.technicianName && o.technicianName.toLowerCase() === t.name.toLowerCase())).length;
                  if (tOrdersCount === 0) return null;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        handleSelectTechView(t.id);
                        setStatusFilter('all');
                      }}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ver órdenes de {t.name} ({tOrdersCount})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {sortedOrders.map(ord => {
              const isApproved = ord.budget?.status === 'Aprobado';
              const currentGroup = getStatusGroup(ord.status);

              return (
                <div
                  key={ord.id}
                  className={`bg-white border rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 transition-all ${
                    ord.status === 'Cobrado/Cerrado'
                      ? 'border-emerald-200 bg-emerald-50/10'
                      : ord.status === 'En Reparación' || ord.status === 'En Diagnóstico'
                      ? 'border-blue-300 ring-2 ring-blue-500/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Header: Folio, Priority & Detailed Status Selector */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-sm sm:text-base text-emerald-900 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
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

                      {ord.scheduledDate && (
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ord.scheduledDate} (Turno #{ord.routeOrder || 1})</span>
                        </span>
                      )}
                    </div>

                    {/* Detailed Stage Dropdown Selector */}
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                        Estatus Detallado:
                      </span>
                      <select
                        value={ord.status}
                        onChange={e => handleOpenStatusModal(ord, e.target.value as OrderStatus)}
                        className={`text-xs font-bold rounded-xl px-3 py-1.5 border cursor-pointer outline-hidden transition-all shadow-2xs ${
                          ord.status === 'Cobrado/Cerrado'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : ord.status === 'En Reparación'
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : ord.status === 'En Diagnóstico'
                            ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                            : ord.status === 'Esperando Aprobación'
                            ? 'bg-purple-100 text-purple-900 border-purple-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        {ALL_STATUSES.map(st => (
                          <option key={st} value={st} className="bg-white text-slate-900">
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Client & Fault Description */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">{ord.clientName}</h4>
                        <div className="text-xs font-semibold text-slate-500 flex items-center space-x-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{ord.departmentName || 'Matriz Principal'}</span>
                        </div>
                      </div>

                      {ord.equipmentType && (
                        <span className="text-xs font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl">
                          ⚙️ {ord.equipmentType}
                        </span>
                      )}
                    </div>

                    {/* Assigned Tech Attribution & Quick Claim */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 font-bold">👨‍🔧 Técnico Responsable:</span>
                        <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {ord.technicianName || '⚠️ Sin Asignar'}
                        </span>
                      </div>

                      {currentTech && ord.technicianName !== currentTech.name && (
                        <button
                          onClick={() => {
                            assignTechnician(ord.id, currentTech.id, ord.routeOrder || 1, ord.scheduledDate);
                            setStatusFeedbackMsg(`¡Orden ${ord.folio} reasignada a ti (${currentTech.name})!`);
                            setTimeout(() => setStatusFeedbackMsg(null), 4000);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center space-x-1"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>⚡ Reasignar a mí ({currentTech.name})</span>
                        </button>
                      )}
                    </div>

                    {/* Description box */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                      <span className="font-bold text-slate-400 uppercase text-[10px] block mb-0.5">Descripción de la Falla:</span>
                      {ord.description}
                    </div>

                    {/* Budget approval alert */}
                    {isApproved && ord.status !== 'Cobrado/Cerrado' && (
                      <div className="bg-emerald-600 text-white p-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2.5 shadow-xs">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>¡Presupuesto APROBADO por el Cliente! Puedes iniciar la reparación o concluir la orden.</span>
                      </div>
                    )}
                  </div>

                  {/* ================= PRIMARY STATUS CONTROL BAR (PENDIENTE, EN PROCESO, TERMINADO) ================= */}
                  <div className="bg-slate-100/80 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Cambiar Estatus del Servicio (Sincronizado con Todos los Roles)</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        Estatus actual: <span className="text-slate-800 font-black">{ord.status}</span>
                      </span>
                    </div>

                    {/* The 3 Main Interactive Buttons: Pendiente | En Proceso | Terminado */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* 1. Pendiente */}
                      <button
                        onClick={() => handleQuickStatusPillClick(ord, 'pending')}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer border ${
                          currentGroup === 'pending'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/30'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-900'
                        }`}
                      >
                        <Hourglass className={`w-4 h-4 ${currentGroup === 'pending' ? 'text-white' : 'text-amber-500'}`} />
                        <span>1. Pendiente</span>
                        {currentGroup === 'pending' && <CheckCircle className="w-3.5 h-3.5 ml-1 text-white" />}
                      </button>

                      {/* 2. En Proceso */}
                      <button
                        onClick={() => handleQuickStatusPillClick(ord, 'in_progress')}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer border ${
                          currentGroup === 'in_progress'
                            ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-400/30'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-900'
                        }`}
                      >
                        <Activity className={`w-4 h-4 ${currentGroup === 'in_progress' ? 'text-white' : 'text-blue-600 animate-spin'}`} />
                        <span>2. En Proceso</span>
                        {currentGroup === 'in_progress' && <CheckCircle className="w-3.5 h-3.5 ml-1 text-white" />}
                      </button>

                      {/* 3. Terminado */}
                      <button
                        onClick={() => handleQuickStatusPillClick(ord, 'completed')}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer border ${
                          currentGroup === 'completed'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400/30'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-900'
                        }`}
                      >
                        <CheckCircle2 className={`w-4 h-4 ${currentGroup === 'completed' ? 'text-white' : 'text-emerald-600'}`} />
                        <span>3. Terminado</span>
                        {currentGroup === 'completed' && <CheckCircle className="w-3.5 h-3.5 ml-1 text-white" />}
                      </button>
                    </div>
                  </div>

                  {/* Actions Bar: Diagnostic / Inspection & Execution / Close */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      {ord.status === 'Cobrado/Cerrado' ? (
                        <div className="w-full sm:w-auto bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Trabajo Concluido y Cobrado (${(ord.collectedAmount || 0).toLocaleString('es-MX')} MXN)</span>
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-slate-500">
                          {ord.diagnosticPhotos?.length > 0 && (
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg mr-2 font-bold">
                              📸 {ord.diagnosticPhotos.length} foto(s) capturadas
                            </span>
                          )}
                          {ord.requestedParts?.length > 0 && (
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold">
                              ⚙️ {ord.requestedParts.length} refacción(es) solicitada(s)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                      {/* Diagnostic Modal Button */}
                      <button
                        onClick={() => setDiagOrder(ord)}
                        className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                        title="Capturar fotos y refacciones requeridas"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Diagnóstico e Inspección</span>
                      </button>

                      {/* Execution & Close Modal Button */}
                      <button
                        onClick={() => setExecOrder(ord)}
                        className={`flex-1 sm:flex-initial text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer ${
                          ord.status === 'Cobrado/Cerrado'
                            ? 'bg-slate-800 hover:bg-slate-900'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                        title="Registrar evidencia de solución, firma y cobro"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>{ord.status === 'Cobrado/Cerrado' ? 'Ver / Editar Cierre' : 'Ejecución y Cierre (Evidencia)'}</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= MODAL: CAMBIO DE ESTATUS CON NOTA Y CONFIRMACIÓN ================= */}
      {statusModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-black text-sm text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    {statusModalOrder.folio}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{statusModalOrder.clientName}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">Confirmar Cambio de Estatus</h3>
              </div>
              <button
                onClick={() => setStatusModalOrder(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Status Transition Visualizer */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Estatus Actual:</span>
                <span className="font-bold text-slate-800 text-sm">{statusModalOrder.status}</span>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-right">
                <span className="text-[10px] font-bold text-emerald-600 uppercase block">Nuevo Estatus:</span>
                <span className="font-black text-emerald-700 text-sm">{targetNewStatus}</span>
              </div>
            </div>

            {/* Selector to change target status if desired */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Seleccionar Estatus de Destino:</label>
              <select
                value={targetNewStatus}
                onChange={e => setTargetNewStatus(e.target.value as OrderStatus)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              >
                {ALL_STATUSES.map(st => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Note / Observaciones */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <MessageSquareText className="w-3.5 h-3.5 text-slate-400" />
                <span>Observación o Nota de Campo (Opcional):</span>
              </label>
              <textarea
                rows={3}
                value={statusNote}
                onChange={e => setStatusNote(e.target.value)}
                placeholder="Ej. Llegué a las instalaciones del cliente e inicié revisión del equipo / Reparación concluida satisfactoriamente."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none"
              />
            </div>

            {/* Broadcast Notice Alert */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start space-x-3 text-xs text-emerald-900">
              <Radio className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-0.5">
                <span className="font-bold block">Notificación Multirrol Instantánea</span>
                <p className="text-[11px] text-emerald-800">
                  Al confirmar, se actualizará el estatus en tiempo real en la base de datos y se notificará automáticamente al <strong>Administrador</strong>, <strong>Oficina</strong>, y al <strong>Cliente</strong>.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalOrder(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmStatusChange}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirmar y Notificar a Todos</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DIAGNOSTIC MODAL */}
      {diagOrder && (
        <InspectionDiagnosticsModal
          order={diagOrder}
          isOpen={!!diagOrder}
          onClose={() => setDiagOrder(null)}
        />
      )}

      {/* EXECUTION & CLOSE MODAL */}
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
