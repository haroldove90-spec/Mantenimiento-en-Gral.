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
  CheckCircle2
} from 'lucide-react';

const STAGES: OrderStatus[] = [
  'Pendiente de Revisión',
  'En Diagnóstico',
  'Esperando Presupuesto',
  'En Cotización',
  'Esperando Aprobación',
  'En Reparación',
  'Finalizada'
];

export const OfficeDashboard: React.FC = () => {
  const {
    orders,
    technicians,
    assignTechnician,
    updateOrderStatus,
    officeSubTab,
    setOfficeSubTab
  } = useApp();

  const activeTab = officeSubTab;
  const setActiveTab = setOfficeSubTab;

  const [viewType, setViewType] = useState<'kanban' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [budgetOrder, setBudgetOrder] = useState<ServiceOrder | null>(null);
  const [pdfOrder, setPdfOrder] = useState<ServiceOrder | null>(null);
  const [detailOrder, setDetailOrder] = useState<ServiceOrder | null>(null);

  const filteredOrders = orders.filter(
    o =>
      o.folio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.departmentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="office-dashboard" className="w-full px-4 sm:px-8 py-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Streamlined Top Title Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">Módulo de Administración y Oficina</h2>
            <p className="text-sm text-slate-500 mt-0.5">Gestión global de órdenes de servicio, presupuestos, catálogos y métricas</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-xs flex items-center justify-center space-x-2 shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          <span>+ Crear Reporte Mtto</span>
        </button>
      </div>

      {/* SUBMODULE 1: GESTIÓN DE ÓRDENES DE SERVICIO (OS) */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          
          {/* Action bar: Search, View switcher & New order button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por folio, cliente o ubicación..."
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
                <span>Crear Reporte</span>
              </button>
            </div>
          </div>

          {/* LIST VIEW (HORIZONTALLY EXPANDED FULL-WIDTH WEBPAGE CARDS) */}
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
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                  >
                    {/* Column 1: Folio & Badges */}
                    <div className="flex items-start lg:items-center space-x-4 min-w-[200px]">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-mono font-bold text-base shrink-0">
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
                        <span className="inline-block px-3 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {ord.status}
                        </span>
                      </div>
                    </div>

                    {/* Column 2: Client & Location */}
                    <div className="flex-1 min-w-[240px]">
                      <h3 className="font-bold text-slate-900 text-base sm:text-lg">{ord.clientName}</h3>
                      <p className="text-sm font-semibold text-slate-500 mt-0.5">{ord.departmentName}</p>
                      <p className="text-sm text-slate-700 mt-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                        {ord.description}
                      </p>
                    </div>

                    {/* Column 3: Tech Assigned */}
                    <div className="min-w-[220px] bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">
                        Técnico Asignado
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
                    </div>

                    {/* Column 4: Actions */}
                    <div className="flex items-center space-x-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 justify-end">
                      {ord.status === 'Esperando Presupuesto' || ord.status === 'En Cotización' ? (
                        <button
                          onClick={() => setBudgetOrder(ord)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center space-x-1.5 shadow-xs"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          <span>Generar Cotización</span>
                        </button>
                      ) : null}

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
                            className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:shadow-md transition-all space-y-2"
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

      {/* SUBMODULE 2: PRESUPUESTOS Y COTIZACIONES */}
      {activeTab === 'budgets' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base mb-1">Módulo de Presupuestos y Cotizaciones</h3>
            <p className="text-xs text-slate-500 mb-4">
              Recepción de refacciones de campo, cálculo de mano de obra y envío de enlaces de aprobación.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders
                .filter(o => o.requestedParts.length > 0 || o.budget)
                .map(ord => (
                  <div
                    key={ord.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 relative hover:bg-white transition-all shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-blue-600">{ord.folio}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ord.budget?.status === 'Aprobado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.budget?.status === 'Enviado'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.budget?.status || 'Pendiente de Cotizar'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{ord.clientName}</h4>
                      <p className="text-[11px] text-slate-500">{ord.departmentName}</p>
                    </div>

                    {/* Parts count */}
                    <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-800 block">
                        Refacciones pedidas ({ord.requestedParts.length}):
                      </span>
                      <ul className="list-disc list-inside text-[11px] text-slate-500 truncate">
                        {ord.requestedParts.map((p, i) => (
                          <li key={i}>
                            {p.quantity}x {p.name}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => setBudgetOrder(ord)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors flex items-center space-x-1"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Cotizar / Editar</span>
                      </button>

                      {ord.budget && (
                        <button
                          onClick={() => setPdfOrder(ord)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-bold"
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

      {/* SUBMODULE 3: CATÁLOGOS Y CLIENTES */}
      {activeTab === 'catalogs' && <ClientsAndCatalog />}

      {/* SUBMODULE 4: REPORTES Y MÉTRICAS */}
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

      {/* ORDER DETAIL MODAL */}
      {detailOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="font-mono font-bold text-blue-600 text-sm">{detailOrder.folio}</span>
                <h3 className="font-bold text-slate-900 text-base">{detailOrder.clientName}</h3>
              </div>
              <button
                onClick={() => setDetailOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-700 block">Ubicación / Departamento:</span>
                <span className="text-slate-600">{detailOrder.departmentName}</span>
              </div>

              <div>
                <span className="font-bold text-slate-700 block">Problema Reportado:</span>
                <span className="text-slate-600">{detailOrder.description}</span>
              </div>

              {/* Photos from tech */}
              {detailOrder.diagnosticPhotos.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Evidencia Fotográfica de Diagnóstico:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {detailOrder.diagnosticPhotos.map((p, idx) => (
                      <img key={idx} src={p} alt="Diag" className="w-full h-28 object-cover rounded-lg border" />
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
          </div>
        </div>
      )}

    </div>
  );
};
