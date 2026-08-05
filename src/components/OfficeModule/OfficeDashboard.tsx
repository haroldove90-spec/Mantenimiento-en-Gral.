import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OrderStatus, ServiceOrder } from '../../types';
import { CreateOrderModal } from './CreateOrderModal';
import { BudgetGeneratorModal } from './BudgetGeneratorModal';
import { PdfQuoteModal } from '../PdfQuoteModal';
import { ClientsAndCatalog } from './ClientsAndCatalog';
import { ReportsAndMetrics } from './ReportsAndMetrics';
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
  Trash2
} from 'lucide-react';

const STAGES: OrderStatus[] = [
  'Pendiente de Visita',
  'En Diagnóstico',
  'Presupuesto Pendiente',
  'Esperando Aprobación',
  'En Reparación',
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
    clearSampleData
  } = useApp();

  const activeTab = officeSubTab;
  const setActiveTab = setOfficeSubTab;

  const [viewType, setViewType] = useState<'kanban' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTechRoute, setSelectedTechRoute] = useState<string>(technicians[0]?.id || '');
  const [selectedRouteDate, setSelectedRouteDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [budgetOrder, setBudgetOrder] = useState<ServiceOrder | null>(null);
  const [pdfOrder, setPdfOrder] = useState<ServiceOrder | null>(null);
  const [detailOrder, setDetailOrder] = useState<ServiceOrder | null>(null);

  // Warranty reopen modal
  const [warrantyOrder, setWarrantyOrder] = useState<ServiceOrder | null>(null);
  const [warrantyReason, setWarrantyReason] = useState('');

  const q = (searchQuery || '').toLowerCase();
  const filteredOrders = orders.filter(
    o =>
      (o.folio || '').toLowerCase().includes(q) ||
      (o.clientName || '').toLowerCase().includes(q) ||
      (o.departmentName || '').toLowerCase().includes(q) ||
      (o.equipmentType || '').toLowerCase().includes(q)
  );

  // Route calculation for active technician
  const currentTechRouteOrders = orders
    .filter(o => o.technicianId === selectedTechRoute && o.status !== 'Cobrado/Cerrado')
    .sort((a, b) => (a.routeOrder || 99) - (b.routeOrder || 99));

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
            onClick={() => {
              if (window.confirm('⚠️ ¿Deseas borrar los datos de muestra del sistema (órdenes, clientes y refacciones de prueba)?')) {
                clearSampleData();
              }
            }}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0"
            title="Limpiar datos de prueba"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Borrar Datos de Muestra</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-xs flex items-center justify-center space-x-2 shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            <span>+ Crear Orden de Servicio (OS)</span>
          </button>
        </div>
      </div>

      {/* SUBMODULE 1: GESTIÓN DE ÓRDENES DE SERVICIO (OS) */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          
          {/* Action bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por folio, cliente, ubicación o equipo..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewType('list')}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all ${
                    viewType === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Vista Lista Horizontal"
                >
                  <List className="w-4 h-4" />
                  <span>Vista Lista Horizontal</span>
                </button>
                <button
                  onClick={() => setViewType('kanban')}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all ${
                    viewType === 'kanban' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Vista Tablero"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Tablero Stage</span>
                </button>
              </div>

              <button
                onClick={() => setIsCreateOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-xs transition-all whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Crear Orden OS</span>
              </button>
            </div>
          </div>

          {/* LIST VIEW (HORIZONTALLY EXPANDED FULL-WIDTH CARDS) */}
          {viewType === 'list' ? (
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-medium text-base">
                  No se encontraron órdenes de servicio con los criterios especificados.
                </div>
              ) : (
                filteredOrders.map(ord => (
                  <div
                    key={ord.id}
                    className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                      ord.isWarranty ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200'
                    }`}
                  >
                    {/* Column 1: Folio, Equipment & Badges */}
                    <div className="flex items-start lg:items-center space-x-4 min-w-[220px]">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-base shrink-0 ${
                        ord.isWarranty ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-blue-50 border border-blue-100 text-blue-600'
                      }`}>
                        {ord.folio.replace('OS-', '')}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-mono font-bold text-base text-blue-600">{ord.folio}</span>
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
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Admin Status Dropdown */}
                          <div className="flex items-center space-x-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estatus:</span>
                            <select
                              value={ord.status}
                              onChange={e => {
                                const newSt = e.target.value as OrderStatus;
                                updateOrderStatus(ord.id, newSt, 'Estatus modificado directamente por Administración');
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer focus:outline-hidden transition-all shadow-2xs ${
                                ord.status === 'Garantía Reabierta'
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
                              title="Haz clic para cambiar el estatus de la orden como Admin"
                            >
                              {STAGES.map(stage => (
                                <option key={stage} value={stage} className="bg-white text-slate-900 font-medium">
                                  {stage}
                                </option>
                              ))}
                            </select>
                          </div>

                          {ord.equipmentType && (
                            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                              ⚙️ {ord.equipmentType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Client & Description */}
                    <div className="flex-1 min-w-[240px]">
                      <h3 className="font-bold text-slate-900 text-base sm:text-lg">{ord.clientName}</h3>
                      <p className="text-sm font-semibold text-slate-500 mt-0.5">{ord.departmentName}</p>
                      <p className="text-sm text-slate-700 mt-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                        {ord.description}
                      </p>
                    </div>

                    {/* Column 3: Tech Assigned & Scheduled Date */}
                    <div className="min-w-[220px] bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
                        Técnico & Agenda Ruta
                      </span>
                      {ord.technicianName ? (
                        <div className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          <span>{ord.technicianName}</span>
                        </div>
                      ) : (
                        <select
                          value=""
                          onChange={e => assignTechnician(ord.id, e.target.value)}
                          className="w-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold rounded-lg p-2 focus:outline-hidden"
                        >
                          <option value="">+ Asignar Técnico de Campo...</option>
                          {technicians.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.specialty})
                            </option>
                          ))}
                        </select>
                      )}

                      <div className="text-[11px] font-semibold text-slate-600 flex items-center space-x-1 pt-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Fecha: {ord.scheduledDate || 'Sin programar'}</span>
                      </div>
                    </div>

                    {/* Column 4: Actions */}
                    <div className="flex flex-wrap items-center space-x-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 justify-end">
                      {ord.status === 'Presupuesto Pendiente' ? (
                        <button
                          onClick={() => setBudgetOrder(ord)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center space-x-1.5 shadow-xs"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          <span>Generar Cotización</span>
                        </button>
                      ) : null}

                      {ord.status === 'Cobrado/Cerrado' && (
                        <button
                          onClick={() => setWarrantyOrder(ord)}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center space-x-1 shadow-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reabrir Garantía</span>
                        </button>
                      )}

                      <button
                        onClick={() => setDetailOrder(ord)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center space-x-1"
                      >
                        <span>Ver Detalles</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
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

                            <div className="pt-1 flex items-center justify-between text-xs">
                              <span className="text-slate-600 font-medium truncate">
                                {ord.technicianName ? (
                                  <span className="text-slate-800 font-semibold">👨‍🔧 {ord.technicianName}</span>
                                ) : (
                                  <span className="text-amber-600 font-semibold">⚠️ Sin Técnico</span>
                                )}
                              </span>

                              <button
                                onClick={() => setDetailOrder(ord)}
                                className="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-0.5"
                              >
                                <span>Ver</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
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
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Programación y Generación de Rutas Optimizadas</h3>
                <p className="text-xs text-slate-500">Asignación de folios por técnico según zonas geográficas y direcciones de entrega</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="font-bold text-slate-700">Técnico:</span>
                  <select
                    value={selectedTechRoute}
                    onChange={e => setSelectedTechRoute(e.target.value)}
                    className="bg-slate-100 border border-slate-300 text-slate-900 font-bold px-3 py-2 rounded-xl focus:outline-hidden"
                  >
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.specialty})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="font-bold text-slate-700">Fecha:</span>
                  <input
                    type="date"
                    value={selectedRouteDate}
                    onChange={e => setSelectedRouteDate(e.target.value)}
                    className="bg-slate-100 border border-slate-300 text-slate-900 font-bold px-3 py-1.5 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Tech Route List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Secuencia de Visitas Programadas en Domicilio ({currentTechRouteOrders.length})
              </h4>

              {currentTechRouteOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 font-medium text-xs">
                  No hay servicios programados en la ruta para este técnico en la fecha seleccionada.
                </div>
              ) : (
                currentTechRouteOrders.map((ord, idx) => {
                  const client = clients.find(c => c.id === ord.clientId);
                  const dept = client?.departments.find(d => d.id === ord.departmentId);

                  return (
                    <div
                      key={ord.id}
                      className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white transition-all shadow-2xs"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                          #{ord.routeOrder || idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-blue-600">{ord.folio}</span>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
                              {ord.status}
                            </span>
                          </div>
                          <h5 className="font-bold text-slate-900 text-sm mt-0.5">{ord.clientName}</h5>
                          <p className="text-xs text-slate-500 flex items-center mt-0.5">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                            <span>{dept?.address || client?.deliveryAddress || client?.fiscalAddress || 'Domicilio en registro'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0 justify-end">
                        <div className="text-right text-xs">
                          <span className="font-bold text-indigo-900 block">{ord.equipmentType || 'Equipo General'}</span>
                          <span className="text-slate-500">Contacto: {dept?.contactName} ({dept?.phone})</span>
                        </div>

                        <button
                          onClick={() => {
                            const newPos = prompt('Ingresa la nueva posición de orden en ruta:', String(ord.routeOrder || idx + 1));
                            if (newPos && !isNaN(parseInt(newPos))) {
                              updateOrderRoute(ord.id, parseInt(newPos), selectedRouteDate);
                            }
                          }}
                          className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl"
                        >
                          Reordenar Posición
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBMODULE 3: PRESUPUESTOS Y COTIZACIONES */}
      {activeTab === 'budgets' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base mb-1">Módulo de Presupuestos y Cotizaciones</h3>
            <p className="text-xs text-slate-500 mb-4">
              Recepción de refacciones de campo, cálculo de mano de obra y envío de enlaces de aprobación.
            </p>

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
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Cotizar / Editar</span>
                      </button>

                      {ord.budget && (
                        <button
                          onClick={() => setPdfOrder(ord)}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl border border-slate-200 transition-colors"
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

      {/* SUBMODULE 4: CATÁLOGOS Y CLIENTES */}
      {activeTab === 'catalogs' && <ClientsAndCatalog />}

      {/* SUBMODULE 5: REPORTES Y MÉTRICAS */}
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

              <div>
                <span className="font-bold text-slate-700 block">Ubicación / Departamento:</span>
                <span className="text-slate-600 font-medium">{detailOrder.departmentName}</span>
              </div>

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

    </div>
  );
};
