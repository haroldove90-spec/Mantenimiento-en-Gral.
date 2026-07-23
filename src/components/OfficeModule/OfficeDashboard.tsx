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

  const [viewType, setViewType] = useState<'kanban' | 'list'>('kanban');
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
    <div id="office-dashboard" className="w-full px-4 sm:px-6 py-4 space-y-4">
      
      {/* Streamlined Top Title Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-2xs shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">Módulo de Administración y Oficina</h2>
            <p className="text-[11px] text-slate-500">Gestión global de órdenes de servicio, presupuestos, catálogos y métricas</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center space-x-1.5 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Crear Reporte Mtto</span>
        </button>
      </div>

      {/* SUBMODULE 1: GESTIÓN DE ÓRDENES DE SERVICIO (OS) */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          
          {/* Action bar: Search, View switcher & New order button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por folio, cliente o ubicación..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setViewType('kanban')}
                  className={`p-1.5 rounded-md text-xs font-medium flex items-center space-x-1 ${
                    viewType === 'kanban' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                  }`}
                  title="Vista Kanban"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-[11px] font-semibold sm:hidden">Kanban</span>
                </button>
                <button
                  onClick={() => setViewType('list')}
                  className={`p-1.5 rounded-md text-xs font-medium flex items-center space-x-1 ${
                    viewType === 'list' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                  }`}
                  title="Vista Lista"
                >
                  <List className="w-4 h-4" />
                  <span className="text-[11px] font-semibold sm:hidden">Lista</span>
                </button>
              </div>

              <button
                onClick={() => setIsCreateOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-all whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Crear Reporte</span>
              </button>
            </div>
          </div>

          {/* KANBAN BOARD VIEW (7 STAGES - HORIZONTAL SCROLLING WITHOUT EXCESS VERTICAL BLANK SPACES) */}
          {viewType === 'kanban' ? (
            <div className="flex overflow-x-auto gap-3 pb-3 pt-1 min-w-full items-start">
              {STAGES.map(stage => {
                const stageOrders = filteredOrders.filter(o => o.status === stage);

                return (
                  <div
                    key={stage}
                    className="bg-slate-100/90 border border-slate-200/90 rounded-xl p-2.5 flex flex-col w-72 shrink-0 max-h-[620px] shadow-2xs"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight truncate">
                        {stage}
                      </span>
                      <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {stageOrders.length}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                      {stageOrders.length === 0 ? (
                        <div className="text-center py-4 text-[11px] text-slate-400 font-medium bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                          Sin órdenes
                        </div>
                      ) : (
                        stageOrders.map(ord => (
                          <div
                            key={ord.id}
                            className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs hover:shadow-md transition-all space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-xs text-blue-600">{ord.folio}</span>
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
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
                              <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{ord.clientName}</h4>
                              <p className="text-[11px] text-slate-500 line-clamp-1">{ord.departmentName}</p>
                            </div>

                            <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-1.5 rounded-md border border-slate-100">
                              {ord.description}
                            </p>

                            {/* Tech assignment */}
                            <div className="pt-1 flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-medium truncate">
                                {ord.technicianName ? (
                                  <span className="text-slate-700 font-semibold">👨‍🔧 {ord.technicianName}</span>
                                ) : (
                                  <span className="text-amber-600 font-semibold">⚠️ Sin Técnico</span>
                                )}
                              </span>

                              <button
                                onClick={() => setDetailOrder(ord)}
                                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-0.5"
                              >
                                <span>Ver</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Action shortcuts based on stage */}
                            {ord.status === 'Esperando Presupuesto' || ord.status === 'En Cotización' ? (
                              <button
                                onClick={() => setBudgetOrder(ord)}
                                className="w-full mt-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold py-1 rounded-md transition-colors flex items-center justify-center space-x-1"
                              >
                                <FileSpreadsheet className="w-3 h-3" />
                                <span>Generar Cotización</span>
                              </button>
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">Folio</th>
                    <th className="py-3 px-4">Cliente / Ubicación</th>
                    <th className="py-3 px-4">Descripción</th>
                    <th className="py-3 px-4">Prioridad</th>
                    <th className="py-3 px-4">Técnico</th>
                    <th className="py-3 px-4">Estatus</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(ord => (
                    <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{ord.folio}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{ord.clientName}</div>
                        <div className="text-[11px] text-slate-500">{ord.departmentName}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{ord.description}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.priority === 'Alta'
                              ? 'bg-rose-100 text-rose-800'
                              : ord.priority === 'Media'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {ord.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {ord.technicianName ? (
                          <span className="font-semibold text-slate-800">{ord.technicianName}</span>
                        ) : (
                          <select
                            value=""
                            onChange={e => assignTechnician(ord.id, e.target.value)}
                            className="bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold rounded-md p-1"
                          >
                            <option value="">Asignar técnico...</option>
                            {technicians.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{ord.status}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setDetailOrder(ord)}
                          className="text-blue-600 hover:text-blue-800 font-bold"
                        >
                          Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
