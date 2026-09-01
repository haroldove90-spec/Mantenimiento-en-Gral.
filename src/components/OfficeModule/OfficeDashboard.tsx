import React, { useState, useMemo } from 'react';
import { useApp, deduplicateTechnicians, normalizeStr, getOrderClientInfo } from '../../context/AppContext';
import { OrderStatus, ServiceOrder } from '../../types';
import { CreateOrderModal } from './CreateOrderModal';
import { BudgetGeneratorModal } from './BudgetGeneratorModal';
import { PdfQuoteModal } from '../PdfQuoteModal';
import { ClientsAndCatalog } from './ClientsAndCatalog';
import { ClientsModule } from './ClientsModule';
import { ServicesModule } from './ServicesModule';
import { ReportsAndMetrics } from './ReportsAndMetrics';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import { SendCredentialsWhatsAppModal } from '../SendCredentialsWhatsAppModal';
import { exportToExcel, exportToPDF, exportSingleOrderPDF } from '../../lib/exportUtils';
import {
  Building2,
  LayoutGrid,
  List,
  PlusCircle,
  FileSpreadsheet,
  Users,
  BarChart3,
  Search,
  Wrench,
  Clock,
  ArrowRight,
  ChevronRight,
  Eye,
  AlertCircle,
  CheckCircle2,
  Navigation,
  MapPin,
  Calendar,
  RotateCcw,
  ShieldAlert,
  Phone,
  Send,
  Trash2,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Map,
  ExternalLink,
  CalendarDays,
  Compass,
  UserCheck,
  PhoneCall,
  UserPlus,
  Printer,
  CheckSquare,
  Square,
  Download,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

const STAGES: OrderStatus[] = [
  'Pendiente de Visita',
  'En Diagnóstico',
  'Presupuesto Pendiente',
  'Esperando Aprobación',
  'En Reparación',
  'Pendiente de Entrega',
  'Cobrado/Cerrado',
  'Garantía Reabierta'
];

export const OfficeDashboard: React.FC = () => {
  const {
    orders,
    technicians,
    clients,
    currentUser,
    assignTechnician,
    updateOrderStatus,
    updateOrderRoute,
    reopenWarrantyOrder,
    officeSubTab,
    setOfficeSubTab,
    clearSampleData,
    resetToDemoData,
    deleteOrder,
    syncAllDataToSupabase
  } = useApp();

  const uniqueTechnicians = useMemo(
    () =>
      deduplicateTechnicians(technicians).filter(
        t =>
          t.status !== 'Inactivo' &&
          !['tecnico 1', 'tecnico 2', 'técnico 1', 'técnico 2'].includes(t.name.toLowerCase().trim())
      ),
    [technicians]
  );

  const activeTab = officeSubTab;
  const setActiveTab = setOfficeSubTab;

  const [viewType, setViewType] = useState<'kanban' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // WhatsApp Credentials & Access Modal state
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    type: 'client' | 'tech';
    recipientName: string;
    recipientPhone?: string;
    recipientEmail?: string;
    recipientPassword?: string;
    folio?: string;
    title?: string;
  } | null>(null);
  
  // Multi-Selection for Orders
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Supabase Sync in Office
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSyncSupabase = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncAllDataToSupabase();
      setIsSyncing(false);
      if (res.success) {
        setSyncResult({ type: 'success', text: res.message });
      } else {
        setSyncResult({ type: 'error', text: res.message });
      }
    } catch (e: any) {
      setIsSyncing(false);
      setSyncResult({ type: 'error', text: e.message || 'Error de conexión con Supabase' });
    }
  };

  // Routes & Scheduling state
  const [selectedTechRoute, setSelectedTechRoute] = useState<string>('ALL');
  const [selectedRouteDate, setSelectedRouteDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateFilterMode, setDateFilterMode] = useState<'all' | 'specific'>('all');
  const [routeFeedbackMsg, setRouteFeedbackMsg] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [budgetOrder, setBudgetOrder] = useState<ServiceOrder | null>(null);
  const [pdfOrder, setPdfOrder] = useState<ServiceOrder | null>(null);
  const [detailOrder, setDetailOrder] = useState<ServiceOrder | null>(null);

  // Delete modal state
  const [orderToDelete, setOrderToDelete] = useState<ServiceOrder | null>(null);

  // Warranty reopen modal
  const [warrantyOrder, setWarrantyOrder] = useState<ServiceOrder | null>(null);
  const [warrantyReason, setWarrantyReason] = useState('');

  const q = (searchQuery || '').toLowerCase();
  const filteredOrders = orders.filter(
    o =>
      ((statusFilter === 'ALL' || o.status === statusFilter)) &&
      ((o.folio || '').toLowerCase().includes(q) ||
      (o.clientName || '').toLowerCase().includes(q) ||
      (o.departmentName || '').toLowerCase().includes(q) ||
      (o.equipmentType || '').toLowerCase().includes(q))
  );

  // Multi-Selection helpers for Orders
  const isAllOrdersSelected =
    filteredOrders.length > 0 && filteredOrders.every(o => selectedOrderIds.includes(o.id));

  const handleSelectAllOrders = () => {
    if (isAllOrdersSelected) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const handleToggleSelectOrder = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedOrderIds(prev => [...prev, id]);
    }
  };

  // EXPORT HANDLERS FOR ORDERS
  const handleExportOrdersExcel = (onlySelected = false) => {
    const list =
      onlySelected && selectedOrderIds.length > 0
        ? orders.filter(o => selectedOrderIds.includes(o.id))
        : filteredOrders;

    const headers = [
      'Folio',
      'Cliente',
      'Departamento / Sucursal',
      'Tipo de Equipo',
      'Prioridad',
      'Estatus Actual',
      'Técnico Asignado',
      'Fecha Programada',
      'Turno Ruta',
      'Monto Cobrado (MXN)'
    ];

    const rows = list.map(o => [
      o.folio,
      o.clientName,
      o.departmentName || 'Matriz',
      o.equipmentType || 'General',
      o.priority,
      o.status,
      o.technicianName || 'Sin asignar',
      o.scheduledDate || 'Sin programar',
      o.routeOrder || 1,
      o.collectedAmount || 0
    ]);

    const titleSuffix = onlySelected ? 'Seleccionadas' : 'Listado';
    exportToExcel(`Ordenes_Servicio_SIJ_${titleSuffix}_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const handleExportOrdersPDF = (onlySelected = false) => {
    const list =
      onlySelected && selectedOrderIds.length > 0
        ? orders.filter(o => selectedOrderIds.includes(o.id))
        : filteredOrders;

    const headers = ['Folio', 'Cliente', 'Equipo', 'Prioridad', 'Estatus', 'Técnico', 'Fecha Programada'];
    const rows = list.map(o => [
      o.folio,
      o.clientName,
      o.equipmentType || 'Equipo General',
      o.priority,
      o.status,
      o.technicianName || 'Sin Asignar',
      o.scheduledDate || 'Sin fecha'
    ]);

    exportToPDF({
      title: 'Reporte de Órdenes de Servicio (SIJ)',
      subtitle: `Listado de Folios y Control Operativo (${list.length} órdenes)`,
      headers,
      rows,
      summaryCards: [
        { label: 'Total Órdenes', value: list.length },
        { label: 'En Reparación', value: list.filter(o => o.status === 'En Reparación').length },
        { label: 'Cobrado / Cerrado', value: list.filter(o => o.status === 'Cobrado/Cerrado').length }
      ]
    });
  };

  const handleExportSingleOrderExcel = (ord: ServiceOrder) => {
    const headers = ['Campo', 'Valor'];
    const rows = [
      ['Folio', ord.folio],
      ['Cliente', ord.clientName],
      ['Ubicación / Sucursal', ord.departmentName || 'N/A'],
      ['Tipo de Equipo', ord.equipmentType || 'General'],
      ['Prioridad', ord.priority],
      ['Estatus Actual', ord.status],
      ['Técnico Asignado', ord.technicianName || 'Sin Asignar'],
      ['Fecha Programada', ord.scheduledDate || 'N/A'],
      ['Turno de Ruta', ord.routeOrder || 1],
      ['Descripción de la Falla', ord.description],
      ['Notas de Diagnóstico', ord.diagnosticNotes || 'N/A'],
      ['Monto Cobrado (MXN)', ord.collectedAmount || 0],
      ['Método de Pago', ord.paymentMethod || 'N/A']
    ];
    exportToExcel(`Ficha_Orden_${ord.folio}`, headers, rows);
  };

  // EXPORT HANDLERS FOR ROUTES
  const handleExportRoutesExcel = () => {
    const headers = [
      'Turno Ruta',
      'Folio',
      'Técnico Asignado',
      'Cliente',
      'Ubicación / Dirección',
      'Tipo de Equipo',
      'Prioridad',
      'Estatus',
      'Fecha Programada'
    ];

    const rows = currentTechRouteOrders.map((o, idx) => [
      o.routeOrder || idx + 1,
      o.folio,
      o.technicianName || 'Sin Asignar',
      o.clientName,
      o.departmentName || 'Dirección no especificada',
      o.equipmentType || 'General',
      o.priority,
      o.status,
      o.scheduledDate || selectedRouteDate
    ]);

    exportToExcel(`Hoja_Ruta_Tecnica_${selectedRouteDate}`, headers, rows);
  };

  const handleExportRoutesPDF = () => {
    const headers = ['# Parada', 'Folio', 'Técnico', 'Cliente', 'Equipo', 'Prioridad', 'Estatus'];
    const rows = currentTechRouteOrders.map((o, idx) => [
      `#${o.routeOrder || idx + 1}`,
      o.folio,
      o.technicianName || 'Sin Asignar',
      o.clientName,
      o.equipmentType || 'General',
      o.priority,
      o.status
    ]);

    exportToPDF({
      title: 'Hoja de Ruta y Agenda Técnica de Campo',
      subtitle: `Planificación de Visitas • Fecha: ${selectedRouteDate} (${currentTechRouteOrders.length} paradas)`,
      headers,
      rows,
      summaryCards: [
        { label: 'Total Visitas', value: currentTechRouteOrders.length },
        { label: 'Prioridad Alta', value: currentTechRouteOrders.filter(o => o.priority === 'Alta').length },
        { label: 'Fecha', value: selectedRouteDate }
      ]
    });
  };

  // EXPORT HANDLERS FOR BUDGETS
  const handleExportBudgetsExcel = () => {
    const budgetOrdersList = orders.filter(o => o.requestedParts.length > 0 || o.budget);
    const headers = ['Folio', 'Cliente', 'Ubicación', 'Estatus Presupuesto', 'Refacciones Solicitadas', 'Total Presupuesto (MXN)'];
    const rows = budgetOrdersList.map(o => {
      const partsSummary = o.requestedParts.map(p => `${p.quantity}x ${p.name}`).join('; ');
      const totalBudget = o.budget ? o.budget.parts.reduce((s, p) => s + p.quantity * p.estimatedUnitPrice, 0) + o.budget.laborCost : 0;
      return [
        o.folio,
        o.clientName,
        o.departmentName || 'N/A',
        o.budget?.status || 'Pendiente de Cotizar',
        partsSummary || 'Sin refacciones',
        totalBudget
      ];
    });

    exportToExcel(`Cotizaciones_Presupuestos_SIJ_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const handleExportBudgetsPDF = () => {
    const budgetOrdersList = orders.filter(o => o.requestedParts.length > 0 || o.budget);
    const headers = ['Folio', 'Cliente', 'Refacciones', 'Estado Cotización', 'Total (MXN)'];
    const rows = budgetOrdersList.map(o => {
      const totalBudget = o.budget ? o.budget.parts.reduce((s, p) => s + p.quantity * p.estimatedUnitPrice, 0) + o.budget.laborCost : 0;
      return [
        o.folio,
        o.clientName,
        `${o.requestedParts.length} piezas solicitadas`,
        o.budget?.status || 'Pendiente de Cotizar',
        `$${totalBudget.toLocaleString('es-MX')} MXN`
      ];
    });

    exportToPDF({
      title: 'Reporte de Presupuestos y Cotizaciones',
      subtitle: `Control de Refacciones y Mano de Obra (${budgetOrdersList.length} cotizaciones)`,
      headers,
      rows
    });
  };

  // Active unclosed orders
  const activeUnclosedOrders = orders.filter(o => o.status !== 'Cobrado/Cerrado');

  // Orders not yet assigned to any technician or in need of scheduling
  const unassignedRouteOrders = activeUnclosedOrders.filter(
    o => !o.technicianId || o.status === 'Pendiente de Visita'
  );

  // Route calculation for active technician / filter
  const currentTechRouteOrders = activeUnclosedOrders
    .filter(o => {
      // Tech filter
      if (selectedTechRoute === 'UNASSIGNED') {
        if (o.technicianId) return false;
      } else if (selectedTechRoute !== 'ALL') {
        if (o.technicianId !== selectedTechRoute) return false;
      }
      // Date filter
      if (dateFilterMode === 'specific' && selectedRouteDate) {
        if (o.scheduledDate !== selectedRouteDate) return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Priority ordering first if no route order, else routeOrder
      if (a.scheduledDate !== b.scheduledDate) {
        return (a.scheduledDate || '').localeCompare(b.scheduledDate || '');
      }
      return (a.routeOrder || 99) - (b.routeOrder || 99);
    });

  // Auto-optimize and generate routes intelligently
  const handleAutoOptimizeRoutes = () => {
    let count = 0;
    const targetTechs = selectedTechRoute === 'ALL' || selectedTechRoute === 'UNASSIGNED'
      ? technicians
      : technicians.filter(t => t.id === selectedTechRoute);

    // If unassigned orders exist, distribute them among available technicians
    const unassigned = orders.filter(o => !o.technicianId && o.status !== 'Cobrado/Cerrado');
    if (unassigned.length > 0 && targetTechs.length > 0) {
      unassigned.forEach((ord, index) => {
        const assignedTech = targetTechs[index % targetTechs.length];
        assignTechnician(ord.id, assignedTech.id, index + 1, ord.scheduledDate || selectedRouteDate);
        count++;
      });
    }

    // Now re-sequence orders per technician by priority (Alta -> Media -> Baja)
    targetTechs.forEach(t => {
      const techOrders = orders.filter(o => o.technicianId === t.id && o.status !== 'Cobrado/Cerrado');
      const priorityWeight: Record<string, number> = { Alta: 1, Media: 2, Baja: 3 };
      
      techOrders.sort((a, b) => {
        const weightA = priorityWeight[a.priority] || 2;
        const weightB = priorityWeight[b.priority] || 2;
        return weightA - weightB;
      });

      techOrders.forEach((ord, idx) => {
        const newPos = idx + 1;
        updateOrderRoute(ord.id, newPos, ord.scheduledDate || selectedRouteDate);
        count++;
      });
    });

    setRouteFeedbackMsg(`¡Rutas optimizadas y generadas automáticamente con éxito (${count} folios organizados)!`);
    setTimeout(() => setRouteFeedbackMsg(null), 5000);
  };

  // Move route order up/down
  const handleMoveRoutePosition = (orderId: string, currentPos: number, direction: 'up' | 'down') => {
    const newPos = direction === 'up' ? Math.max(1, currentPos - 1) : currentPos + 1;
    const targetOrd = orders.find(o => o.id === orderId);
    if (targetOrd) {
      updateOrderRoute(orderId, newPos, targetOrd.scheduledDate || selectedRouteDate);
    }
  };

  const handleReopenWarranty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warrantyOrder || !warrantyReason.trim()) return;
    reopenWarrantyOrder(warrantyOrder.id, warrantyReason.trim());
    setWarrantyReason('');
    setWarrantyOrder(null);
  };

  return (
    <div id="office-dashboard" className="w-full px-3 sm:px-8 py-6 space-y-6 max-w-7xl mx-auto overflow-x-hidden">
      
      {/* Streamlined Top Title Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {currentUser?.name ? `¡Bienvenido, ${currentUser.name}!` : 'Módulo de Administración y Oficina'}
              </h2>
              {currentUser && (
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                  @{currentUser.username || currentUser.email.split('@')[0]}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">Gestión global de órdenes de servicio, agenda de rutas, presupuestos y garantías</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-xs flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            <span>+ Crear Orden de Servicio (OS)</span>
          </button>
        </div>
      </div>

      {/* SUBMODULE 1: GESTIÓN DE ÓRDENES DE SERVICIO (OS) */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          
          {/* Action bar & Filters */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por folio, cliente, ubicación o equipo..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Status filter */}
                <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                  <span className="font-bold text-slate-500">Estatus:</span>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 outline-hidden cursor-pointer"
                  >
                    <option value="ALL">Todos los Estados</option>
                    {STAGES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* View switcher */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewType('list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                      viewType === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Vista Lista Horizontal"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Lista</span>
                  </button>
                  <button
                    onClick={() => setViewType('kanban')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                      viewType === 'kanban' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Vista Tablero"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Tablero</span>
                  </button>
                </div>

                {/* Supabase Sync and Export All Buttons */}
                <button
                  onClick={handleSyncSupabase}
                  disabled={isSyncing}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all active:scale-95"
                  title="Sincronizar todas las órdenes y datos con Supabase"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Sincronizando...' : 'Supabase'}</span>
                </button>

                <button
                  onClick={() => handleExportOrdersExcel(false)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all active:scale-95"
                  title="Exportar listado completo de órdenes a Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>

                <button
                  onClick={() => handleExportOrdersPDF(false)}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all active:scale-95"
                  title="Imprimir / Exportar reporte de órdenes en PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>

                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Crear OS</span>
                </button>
              </div>
            </div>

            {/* Sync Result Banner */}
            {syncResult && (
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                syncResult.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{syncResult.text}</span>
                </div>
                <button onClick={() => setSyncResult(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                  ✕
                </button>
              </div>
            )}

            {/* Selection bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-100 gap-2 text-xs">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSelectAllOrders}
                  className="flex items-center space-x-2 text-slate-700 font-bold hover:text-blue-700 cursor-pointer"
                >
                  {isAllOrdersSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>
                    {isAllOrdersSelected
                      ? 'Deseleccionar Todas'
                      : selectedOrderIds.length > 0
                      ? `Seleccionadas (${selectedOrderIds.length} de ${filteredOrders.length})`
                      : `Seleccionar Todas (${filteredOrders.length})`}
                  </span>
                </button>
              </div>

              {selectedOrderIds.length > 0 && (
                <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
                  <span className="font-bold text-blue-900 text-xs">Exportar {selectedOrderIds.length} seleccionadas:</span>
                  <button
                    onClick={() => handleExportOrdersExcel(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-bold shadow-2xs flex items-center space-x-1 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3 h-3" />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={() => handleExportOrdersPDF(true)}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-2.5 py-1 rounded-lg font-bold shadow-2xs flex items-center space-x-1 cursor-pointer"
                  >
                    <Printer className="w-3 h-3" />
                    <span>PDF</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* LIST VIEW (CLEAN RESPONSIVE CARDS) */}
          {viewType === 'list' ? (
            <div className="space-y-3.5">
              {filteredOrders.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-medium text-base">
                  No se encontraron órdenes de servicio con los criterios especificados.
                </div>
              ) : (
                filteredOrders.map(ord => {
                  const isSelected = selectedOrderIds.includes(ord.id);
                  return (
                    <div
                      key={ord.id}
                      className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col gap-4 ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-400/20 bg-blue-50/10'
                          : ord.isWarranty
                          ? 'border-amber-400 bg-amber-50/20'
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Card Header: Selection, Folio, Priority, Equipment & Stage Selector */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleToggleSelectOrder(ord.id)}
                            className="cursor-pointer text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                          >
                            {isSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
                          </button>

                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-black text-base sm:text-lg text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                              {ord.folio}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                ord.priority === 'Alta'
                                  ? 'bg-rose-100 text-rose-800'
                                  : ord.priority === 'Media'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {ord.priority}
                            </span>
                            {ord.equipmentType && (
                              <span className="hidden sm:inline-flex text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md items-center space-x-1">
                                <span>⚙️</span>
                                <span>{ord.equipmentType}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Admin Status Selector */}
                        <div className="flex items-center space-x-1.5 ml-auto">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Estatus:</span>
                          <select
                            value={ord.status}
                            onChange={e => {
                              const newSt = e.target.value as OrderStatus;
                              updateOrderStatus(ord.id, newSt, 'Estatus modificado directamente por Administración');
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer focus:outline-hidden transition-all shadow-2xs ${
                              ord.status === 'Pendiente de Entrega'
                                ? 'bg-amber-300 text-slate-950 border-amber-500 ring-1 ring-amber-400'
                                : ord.status === 'Garantía Reabierta'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : ord.status === 'Cobrado/Cerrado'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : ord.status === 'En Reparación'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : ord.status === 'Esperando Aprobación'
                                ? 'bg-purple-100 text-purple-800 border-purple-300'
                                : ord.status === 'En Diagnóstico'
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                : ord.status === 'Presupuesto Pendiente'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-800 border-slate-300'
                            }`}
                            title="Haz clic para cambiar el estatus de la orden"
                          >
                            {STAGES.map(stage => (
                              <option key={stage} value={stage} className="bg-white text-slate-900 font-medium">
                                {stage}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Card Body: Client info, Problem Description & Assigned Technician */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                        {/* Client details & fault description (Span 7) */}
                        <div className="lg:col-span-7 space-y-2">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <h3 className="font-bold text-slate-900 text-base sm:text-lg">{ord.clientName}</h3>
                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              📍 {ord.departmentName || 'Matriz Principal'}
                            </span>
                          </div>

                          {/* Mobile equipment badge if hidden in header */}
                          {ord.equipmentType && (
                            <div className="sm:hidden">
                              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md inline-block">
                                ⚙️ {ord.equipmentType}
                              </span>
                            </div>
                          )}

                          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Descripción de la Falla:</span>
                            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                              {ord.description || 'Sin descripción ingresada'}
                            </p>
                          </div>
                        </div>

                        {/* Tech Assigned & Scheduling (Span 5) */}
                        <div className="lg:col-span-5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-500 uppercase tracking-wider">
                              👨‍🔧 Técnico Responsable:
                            </span>
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              {ord.technicianName ? ord.technicianName : 'Sin Asignar'}
                            </span>
                          </div>
                          
                          {/* Reassign Tech Dropdown */}
                          <select
                            value={ord.technicianId || uniqueTechnicians.find(t => normalizeStr(t.name) === normalizeStr(ord.technicianName))?.id || ''}
                            onChange={e => {
                              if (e.target.value) {
                                assignTechnician(ord.id, e.target.value, ord.routeOrder || 1, ord.scheduledDate);
                              }
                            }}
                            className="w-full bg-white border border-slate-300 hover:border-blue-400 text-slate-800 text-xs font-bold rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer shadow-2xs"
                          >
                            <option value="" disabled>
                              {ord.technicianName ? 'Cambiar / Reasignar Técnico...' : '+ Asignar Técnico de Campo...'}
                            </option>
                            {uniqueTechnicians.map(t => (
                              <option key={t.id} value={t.id}>
                                👨‍🔧 {t.name} ({t.specialty || 'General'})
                              </option>
                            ))}
                          </select>

                          <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between pt-1 border-t border-slate-200/60">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>Fecha Programada:</span>
                            </span>
                            <span className="font-bold text-slate-800">{ord.scheduledDate || 'Sin programar'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                        {/* Quick single export icons & WhatsApp */}
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => {
                              const cl = clients.find(c => c.id === ord.clientId || c.name === ord.clientName);
                              setWhatsAppModalData({
                                type: 'client',
                                recipientName: ord.clientName,
                                recipientPhone: cl?.whatsapp || cl?.phone,
                                recipientEmail: cl?.email || ord.clientEmail,
                                recipientPassword: '1234 (o tu contraseña)',
                                folio: ord.folio,
                                title: `Compartir Acceso y Folio ${ord.folio} por WhatsApp`
                              });
                            }}
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold cursor-pointer transition-colors flex items-center space-x-1"
                            title="Enviar credenciales y link de acceso directo de esta orden por WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>

                          <button
                            onClick={() => handleExportSingleOrderExcel(ord)}
                            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold cursor-pointer transition-colors"
                            title="Descargar Ficha en Excel"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => exportSingleOrderPDF(ord)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold cursor-pointer transition-colors"
                            title="Imprimir / Exportar Ficha en PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Primary Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          {ord.status === 'Presupuesto Pendiente' ? (
                            <button
                              onClick={() => setBudgetOrder(ord)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer active:scale-95"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>Generar Cotización</span>
                            </button>
                          ) : null}

                          {ord.status === 'Cobrado/Cerrado' && (
                            <button
                              onClick={() => setWarrantyOrder(ord)}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center space-x-1 shadow-xs cursor-pointer active:scale-95"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reabrir Garantía</span>
                            </button>
                          )}

                          <button
                            onClick={() => setDetailOrder(ord)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center space-x-1 cursor-pointer active:scale-95"
                          >
                            <span>Ver Detalles</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setOrderToDelete(ord)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                            title="Eliminar Orden de la base de datos"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* KANBAN BOARD VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {STAGES.map(stage => {
                const stageOrders = filteredOrders.filter(o => o.status === stage);

                return (
                  <div
                    key={stage}
                    className="bg-slate-100/90 border border-slate-200/90 rounded-2xl p-3 flex flex-col min-h-[300px] shadow-2xs"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                        {stage}
                      </span>
                      <span className="bg-slate-200 text-slate-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {stageOrders.length}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {stageOrders.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-400 font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          Sin órdenes
                        </div>
                      ) : (
                        stageOrders.map(ord => (
                          <div
                            key={ord.id}
                            className={`bg-white border rounded-xl p-3.5 shadow-2xs hover:shadow-md transition-all space-y-2 ${
                              ord.isWarranty ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-sm text-blue-600">{ord.folio}</span>
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                  ord.priority === 'Alta'
                                    ? 'bg-rose-100 text-rose-800'
                                    : ord.priority === 'Media'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {ord.priority}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{ord.clientName}</h4>
                              <p className="text-xs text-slate-500 line-clamp-1">{ord.departmentName}</p>
                            </div>

                            <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              {ord.description}
                            </p>

                            {/* Quick Stage Move Dropdown */}
                            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 font-bold">Mover a:</span>
                              <select
                                value={ord.status}
                                onChange={e => updateOrderStatus(ord.id, e.target.value as OrderStatus, 'Etapa movida desde Tablero Stage')}
                                className="bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-bold rounded-lg px-2 py-0.5 focus:outline-hidden cursor-pointer"
                              >
                                {STAGES.map(s => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Quick Technician Reassign Dropdown */}
                            <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-bold">👨‍🔧 Técnico:</span>
                              <select
                                value={ord.technicianId || uniqueTechnicians.find(t => normalizeStr(t.name) === normalizeStr(ord.technicianName))?.id || ''}
                                onChange={e => {
                                  if (e.target.value) {
                                    assignTechnician(ord.id, e.target.value, ord.routeOrder || 1, ord.scheduledDate);
                                  }
                                }}
                                className="bg-slate-50 border border-slate-200 text-slate-800 text-[11px] font-bold rounded-lg px-2 py-0.5 focus:outline-hidden cursor-pointer max-w-[140px] truncate"
                              >
                                <option value="" disabled>
                                  {ord.technicianName ? ord.technicianName : '+ Asignar...'}
                                </option>
                                {uniqueTechnicians.map(t => (
                                  <option key={t.id} value={t.id}>
                                    {t.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="pt-1 flex items-center justify-between text-xs">
                              <span className="text-slate-600 font-medium truncate text-[11px]">
                                📅 {ord.scheduledDate || 'Sin fecha'}
                              </span>

                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setDetailOrder(ord)}
                                  className="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-0.5 cursor-pointer"
                                >
                                  <span>Ver</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => setOrderToDelete(ord)}
                                  className="text-rose-600 hover:text-rose-800 p-1 rounded-md hover:bg-rose-50 cursor-pointer"
                                  title="Eliminar orden"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* SUBMODULE 2: AGENDA Y RUTAS DE ATENCIÓN OPTIMIZADAS */}
      {activeTab === 'routes' && (
        <div className="space-y-6">
          
          {/* Feedback banner for routes */}
          {routeFeedbackMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center space-x-3 text-sm font-bold shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{routeFeedbackMsg}</span>
            </div>
          )}

          {/* Main Controls Card */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Navigation className="w-4 h-4" />
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">Programación y Generación de Rutas Optimizadas</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Planificación logística, secuencia inteligente por cercanía/urgencia y navegación GPS directa para técnicos.
                </p>
              </div>

              {/* Action Buttons: Auto-Optimize & Route Exports */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportRoutesExcel}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  title="Exportar hoja de ruta de paradas y visitas a Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exportar Excel</span>
                </button>

                <button
                  onClick={handleExportRoutesPDF}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  title="Imprimir / Exportar hoja de ruta de campo en PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir PDF</span>
                </button>

                <button
                  onClick={handleAutoOptimizeRoutes}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-2 cursor-pointer"
                  title="Asignar y ordenar paradas de ruta automáticamente según urgencia y disponibilidad"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>⚡ Generar y Optimizar Rutas Automáticas</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
              
              {/* Filter by Technician */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5 flex items-center space-x-1">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Filtrar por Técnico:</span>
                </label>
                <select
                  value={selectedTechRoute}
                  onChange={e => setSelectedTechRoute(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold px-3 py-2 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">🌐 Todos los Técnicos ({activeUnclosedOrders.length} folios)</option>
                  <option value="UNASSIGNED">⚠️ Órdenes Sin Asignar ({orders.filter(o => !o.technicianId && o.status !== 'Cobrado/Cerrado').length})</option>
                  {uniqueTechnicians.map(t => {
                    const techCount = activeUnclosedOrders.filter(o => o.technicianId === t.id).length;
                    return (
                      <option key={t.id} value={t.id}>
                        👨‍🔧 {t.name} ({techCount} asignados - {t.specialty})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Date Filter Mode & Selector */}
              <div className="sm:col-span-1 lg:col-span-2 flex flex-col sm:flex-row items-start sm:items-end gap-2">
                <div className="flex-1 w-full">
                  <label className="text-xs font-bold text-slate-600 block mb-1.5 flex items-center space-x-1">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                    <span>Filtro de Fecha:</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setDateFilterMode('all')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        dateFilterMode === 'all'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Todas las Fechas
                    </button>
                    <button
                      onClick={() => {
                        setDateFilterMode('specific');
                        setSelectedRouteDate(new Date().toISOString().split('T')[0]);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        dateFilterMode === 'specific' && selectedRouteDate === new Date().toISOString().split('T')[0]
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Hoy
                    </button>
                    <input
                      type="date"
                      value={selectedRouteDate}
                      onChange={e => {
                        setSelectedRouteDate(e.target.value);
                        setDateFilterMode('specific');
                      }}
                      className="bg-slate-50 border border-slate-300 text-slate-900 font-bold px-3 py-1.5 rounded-xl text-xs focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Quick Tray: Unassigned Orders Ready to be Routed */}
          {unassignedRouteOrders.length > 0 && selectedTechRoute !== 'UNASSIGNED' && (
            <div className="bg-amber-50/70 border border-amber-200 p-4 sm:p-5 rounded-2xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    Órdenes Pendientes de Atención / Asignación ({unassignedRouteOrders.length})
                  </h4>
                </div>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Requieren Programación
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {unassignedRouteOrders.slice(0, 6).map(ord => (
                  <div key={ord.id} className="bg-white border border-amber-200/80 p-3 rounded-xl shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-blue-600">{ord.folio}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ord.priority === 'Alta' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.priority}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs truncate">{ord.clientName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{ord.equipmentType}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <select
                        defaultValue=""
                        onChange={e => {
                          if (e.target.value) {
                            assignTechnician(ord.id, e.target.value, 1, ord.scheduledDate || selectedRouteDate);
                          }
                        }}
                        className="bg-slate-50 border border-slate-300 text-slate-800 text-[11px] font-medium rounded-lg p-1 flex-1 focus:outline-hidden"
                      >
                        <option value="" disabled>Asignar a técnico...</option>
                        {uniqueTechnicians.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduled Routes Sequence */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold uppercase text-slate-800 tracking-wider flex items-center space-x-2">
                  <span>Secuencia de Visitas Programadas en Domicilio</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {currentTechRouteOrders.length}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {dateFilterMode === 'all' ? 'Mostrando todos los servicios agendados' : `Servicios agendados para ${selectedRouteDate}`}
                </p>
              </div>
            </div>

            {currentTechRouteOrders.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <Navigation className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-600 font-bold text-sm">
                  No hay servicios programados en la ruta con los filtros actuales.
                </p>
                <p className="text-slate-400 text-xs max-w-md mx-auto">
                  Selecciona "Todos los Técnicos" o haz clic en "⚡ Generar y Optimizar Rutas Automáticas" para programar los servicios activos.
                </p>
                <button
                  onClick={handleAutoOptimizeRoutes}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generar Rutas Ahora</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {currentTechRouteOrders.map((ord, idx) => {
                  const client = clients.find(c => c.id === ord.clientId);
                  const dept = client?.departments?.find(d => d.id === ord.departmentId);
                  const address = dept?.address || client?.address || client?.deliveryAddress || client?.fiscalAddress || 'Ubicación General';
                  const contactName = dept?.contactName || client?.name || 'Contacto en Sitio';
                  const contactPhone = dept?.phone || client?.phone || client?.whatsapp || '';
                  const assignedTech = uniqueTechnicians.find(t => t.id === ord.technicianId);
                  const currentPos = ord.routeOrder || idx + 1;

                  return (
                    <div
                      key={ord.id}
                      className="bg-slate-50 hover:bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all shadow-2xs hover:shadow-md"
                    >
                      {/* Left: Position Badge & Order Info */}
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex flex-col items-center justify-center shrink-0">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-base flex items-center justify-center shadow-xs">
                            #{currentPos}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Parada</span>
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-blue-600 text-sm bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                              {ord.folio}
                            </span>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
                              {ord.status}
                            </span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              ord.priority === 'Alta' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              Prioridad {ord.priority}
                            </span>
                            {ord.scheduledDate && (
                              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center space-x-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>{ord.scheduledDate}</span>
                              </span>
                            )}
                          </div>

                          <h5 className="font-bold text-slate-900 text-base leading-snug truncate">
                            {ord.clientName}
                          </h5>

                          <p className="text-xs text-slate-600 flex items-center">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                            <span className="truncate">{address}</span>
                          </p>

                          <p className="text-xs text-slate-500 flex items-center space-x-3">
                            <span>🛠️ <strong>{ord.equipmentType}</strong></span>
                            <span>•</span>
                            <span>👤 {contactName} {contactPhone && `(${contactPhone})`}</span>
                          </p>
                        </div>
                      </div>

                      {/* Middle: Technician Assignment */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shrink-0 flex flex-col justify-center text-xs space-y-1 min-w-[200px]">
                        <span className="text-slate-400 font-bold text-[10px] uppercase">Técnico Asignado:</span>
                        <div className="flex items-center space-x-2 font-bold text-slate-800">
                          <span>👨‍🔧</span>
                          <span>{assignedTech?.name || ord.technicianName || 'Sin Asignar'}</span>
                        </div>
                        <select
                          value={ord.technicianId || uniqueTechnicians.find(t => normalizeStr(t.name) === normalizeStr(ord.technicianName))?.id || ''}
                          onChange={e => {
                            if (e.target.value) {
                              assignTechnician(ord.id, e.target.value, ord.routeOrder || 1, ord.scheduledDate || selectedRouteDate);
                            }
                          }}
                          className="bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-medium rounded-lg p-1 mt-1 focus:outline-hidden cursor-pointer"
                        >
                          <option value="" disabled>Cambiar Técnico...</option>
                          {uniqueTechnicians.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.specialty})</option>
                          ))}
                        </select>
                      </div>

                      {/* Right: Actions (GPS Map, Up/Down, Reorder, Details) */}
                      <div className="flex flex-wrap lg:flex-col items-center lg:items-end justify-between gap-2 shrink-0">
                        
                        {/* GPS Navigation Link */}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                          title="Abrir ubicación en Google Maps"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>🗺️ Navegar GPS</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>

                        {/* Order Sequence Reordering Buttons */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleMoveRoutePosition(ord.id, currentPos, 'up')}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                            title="Subir parada de ruta"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveRoutePosition(ord.id, currentPos, 'down')}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                            title="Bajar parada de ruta"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const newPos = prompt('Ingresa el número de posición en ruta:', String(currentPos));
                              if (newPos && !isNaN(parseInt(newPos))) {
                                updateOrderRoute(ord.id, parseInt(newPos), ord.scheduledDate || selectedRouteDate);
                              }
                            }}
                            className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer"
                          >
                            #{currentPos}
                          </button>
                        </div>

                        {/* Detail Button */}
                        <button
                          onClick={() => setDetailOrder(ord)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center space-x-1 cursor-pointer pt-1"
                        >
                          <span>Ver Orden Completa</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      )}

      {/* SUBMODULE 3: PRESUPUESTOS Y COTIZACIONES */}
      {activeTab === 'budgets' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Módulo de Presupuestos y Cotizaciones</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recepción de refacciones de campo, cálculo de mano de obra y envío de enlaces de aprobación.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportBudgetsExcel}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all"
                  title="Exportar presupuestos a Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exportar Excel</span>
                </button>

                <button
                  onClick={handleExportBudgetsPDF}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all"
                  title="Imprimir listado de presupuestos en PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir PDF</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {orders
                .filter(o => o.requestedParts.length > 0 || o.budget)
                .map(ord => (
                  <div
                    key={ord.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-white transition-all shadow-xs"
                  >
                    {/* Header info & client */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                          {ord.folio}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            ord.budget?.status === 'Aprobado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.budget?.status === 'Enviado'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.budget?.status ? `Estado: ${ord.budget.status}` : 'Estado: Pendiente de Cotizar'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{ord.clientName}</h4>
                        <p className="text-xs text-slate-500">{ord.departmentName}</p>
                      </div>
                    </div>

                    {/* Parts summary horizontal block */}
                    <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 flex-1 max-w-xl">
                      <span className="font-bold text-slate-800 block mb-1">
                        🛠️ Refacciones solicitadas en campo ({ord.requestedParts.length}):
                      </span>
                      {ord.requestedParts.length === 0 ? (
                        <span className="text-slate-400 italic">Sin refacciones requeridas</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {ord.requestedParts.map((p, i) => (
                            <span key={i} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[11px]">
                              {p.quantity}x {p.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2 shrink-0 justify-end">
                      <button
                        onClick={() => setBudgetOrder(ord)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Cotizar / Editar</span>
                      </button>

                      {ord.budget && (
                        <button
                          onClick={() => setPdfOrder(ord)}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                        >
                          Ver PDF
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBMODULE 4: SERVICIOS */}
      {activeTab === 'services' && <ServicesModule />}

      {/* SUBMODULE 5: CLIENTES */}
      {activeTab === 'clients' && <ClientsModule />}

      {/* SUBMODULE 6: CATÁLOGOS DE REFACCIONES */}
      {activeTab === 'catalogs' && <ClientsAndCatalog />}

      {/* SUBMODULE 7: REPORTES Y MÉTRICAS */}
      {activeTab === 'reports' && <ReportsAndMetrics />}

      {/* MODALS */}
      <CreateOrderModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {budgetOrder && (
        <BudgetGeneratorModal
          order={budgetOrder}
          isOpen={!!budgetOrder}
          onClose={() => setBudgetOrder(null)}
          onOpenPdfPreview={() => {
            setPdfOrder(budgetOrder);
            setBudgetOrder(null);
          }}
        />
      )}

      {pdfOrder && (
        <PdfQuoteModal
          order={pdfOrder}
          isOpen={!!pdfOrder}
          onClose={() => setPdfOrder(null)}
        />
      )}

      {/* MODAL: REABRIR GARANTÍA */}
      {warrantyOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Reabrir Folio por Garantía</h3>
                <span className="font-mono text-xs font-bold text-blue-600">{warrantyOrder.folio}</span>
              </div>
            </div>

            <form onSubmit={handleReopenWarranty} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Motivo / Falla Recurrente Reportada por Cliente</label>
                <textarea
                  rows={3}
                  required
                  value={warrantyReason}
                  onChange={e => setWarrantyReason(e.target.value)}
                  placeholder="Escribe los detalles reportados por el cliente sobre la reincidencia de la falla..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 font-medium focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setWarrantyOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold"
                >
                  Reabrir Folio en Garantía
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAIL MODAL */}
      {detailOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0 bg-white">
              <div>
                <span className="font-mono font-bold text-blue-600 text-xs bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">{detailOrder.folio}</span>
                <h3 className="font-bold text-slate-900 text-base mt-1">{detailOrder.clientName}</h3>
              </div>
              <button
                onClick={() => setDetailOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg bg-slate-50 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              
              {/* Admin Status Controller */}
              <div className="bg-blue-50/80 border border-blue-200/90 rounded-xl p-3.5 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 text-xs flex items-center space-x-1.5">
                    <Wrench className="w-4 h-4 text-blue-600" />
                    <span>Cambiar Estatus de la Orden (Panel Admin)</span>
                  </span>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md">
                    Estatus actual: {detailOrder.status}
                  </span>
                </div>
                <select
                  value={detailOrder.status}
                  onChange={e => {
                    const newSt = e.target.value as OrderStatus;
                    updateOrderStatus(detailOrder.id, newSt, 'Estatus modificado desde modal de detalle');
                    const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
                    setDetailOrder({
                      ...detailOrder,
                      status: newSt,
                      timeline: [
                        ...detailOrder.timeline,
                        {
                          id: `tl-${Date.now()}`,
                          timestamp: nowStr,
                          title: `Cambio de estatus: ${newSt}`,
                          author: 'Oficina (Admin)',
                          note: 'Estatus modificado desde modal de detalle'
                        }
                      ]
                    });
                  }}
                  className="w-full bg-white border border-blue-300 text-slate-900 text-xs font-bold rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                >
                  {STAGES.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Admin Reassign Technician Controller */}
              <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-3.5 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 text-xs flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>👨‍🔧 Reasignar Técnico Responsable (Panel Admin)</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {detailOrder.technicianName ? `Asignado: ${detailOrder.technicianName}` : '⚠️ Sin Asignar'}
                  </span>
                </div>
                <select
                  value={detailOrder.technicianId || uniqueTechnicians.find(t => normalizeStr(t.name) === normalizeStr(detailOrder.technicianName))?.id || ''}
                  onChange={e => {
                    const targetTechId = e.target.value;
                    const tech = technicians.find(t => t.id === targetTechId);
                    if (tech) {
                      assignTechnician(detailOrder.id, tech.id, detailOrder.routeOrder || 1, detailOrder.scheduledDate);
                      const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
                      setDetailOrder({
                        ...detailOrder,
                        technicianId: tech.id,
                        technicianName: tech.name,
                        timeline: [
                          ...detailOrder.timeline,
                          {
                            id: `tl-${Date.now()}`,
                            timestamp: nowStr,
                            title: `Técnico Reasignado a ${tech.name}`,
                            author: 'Administrador (Oficina)',
                            note: `Reasignado a ${tech.name} (${tech.specialty || 'General'})`
                          }
                        ]
                      });
                    }
                  }}
                  className="w-full bg-white border border-emerald-300 text-slate-900 text-xs font-bold rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
                >
                  <option value="" disabled>
                    {detailOrder.technicianName ? 'Cambiar / Reasignar a otro Técnico...' : '+ Seleccionar Técnico Responsable...'}
                  </option>
                  {uniqueTechnicians.map(t => (
                    <option key={t.id} value={t.id}>
                      👨‍🔧 {t.name} — {t.specialty || 'Técnico de Campo'} ({t.status || 'Disponible'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Client Info Card */}
              {(() => {
                const cliInfo = getOrderClientInfo(detailOrder, clients);
                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <span className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                        <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{cliInfo.name}</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {cliInfo.departmentName}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-500 text-[10px] block">Dirección:</span>
                          <span className="font-medium text-slate-900 leading-snug">{cliInfo.address}</span>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-500 text-[10px] block">Teléfono / WhatsApp:</span>
                          <span className="font-bold text-slate-900">{cliInfo.phone || 'S/N'}</span>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Users className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-500 text-[10px] block">Contacto en Sitio:</span>
                          <span className="font-medium text-slate-900">{cliInfo.contactName}</span>
                        </div>
                      </div>

                      {cliInfo.email && (
                        <div className="flex items-start space-x-2">
                          <Send className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-500 text-[10px] block">Correo:</span>
                            <span className="font-medium text-slate-700 truncate block">{cliInfo.email}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div>
                <span className="font-bold text-slate-700 block">Tipo de Equipo:</span>
                <span className="text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 inline-block mt-0.5">
                  ⚙️ {detailOrder.equipmentType || 'Equipo General'}
                </span>
              </div>

              <div>
                <span className="font-bold text-slate-700 block">Problema Reportado:</span>
                <p className="text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium leading-relaxed">
                  {detailOrder.description}
                </p>
              </div>

              {/* Photos from tech */}
              {detailOrder.diagnosticPhotos.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Evidencia Fotográfica de Diagnóstico:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {detailOrder.diagnosticPhotos.map((p, idx) => (
                      <img key={idx} src={p} alt="Diag" className="w-full h-28 object-cover rounded-xl border border-slate-200" />
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <span className="font-bold text-slate-700 block mb-2">Historial de la Orden (Timeline):</span>
                <div className="space-y-2 border-l-2 border-slate-200 pl-3">
                  {detailOrder.timeline.map(tl => (
                    <div key={tl.id} className="relative">
                      <div className="font-semibold text-slate-800">{tl.title} ({tl.author})</div>
                      <div className="text-[10px] text-slate-400">{tl.timestamp}</div>
                      {tl.note && <p className="text-slate-600 text-[11px] mt-0.5">{tl.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end">
              <button
                onClick={() => setDetailOrder(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={() => {
          if (orderToDelete) {
            deleteOrder(orderToDelete.id);
            setOrderToDelete(null);
          }
        }}
        title="¿Eliminar orden de servicio permanentemente?"
        itemDescription={orderToDelete ? `la orden con Folio "${orderToDelete.folio}" (${orderToDelete.clientName})` : 'este registro'}
        itemType="orden de servicio"
      />

      {/* WhatsApp Credentials Sender Modal */}
      {whatsAppModalData && (
        <SendCredentialsWhatsAppModal
          isOpen={true}
          onClose={() => setWhatsAppModalData(null)}
          type={whatsAppModalData.type}
          recipientName={whatsAppModalData.recipientName}
          recipientPhone={whatsAppModalData.recipientPhone}
          recipientEmail={whatsAppModalData.recipientEmail}
          recipientPassword={whatsAppModalData.recipientPassword}
          folio={whatsAppModalData.folio}
          title={whatsAppModalData.title}
        />
      )}

    </div>
  );
};
