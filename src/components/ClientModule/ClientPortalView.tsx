import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  FileSpreadsheet,
  Building,
  Wrench,
  Camera,
  MessageSquare,
  Search,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Trash2
} from 'lucide-react';

export const ClientPortalView: React.FC = () => {
  const {
    orders,
    approveBudget,
    rejectBudget,
    clearSampleData,
    selectedClientOrderFolio,
    setSelectedClientOrderFolio
  } = useApp();

  const selectedFolio = selectedClientOrderFolio || orders[0]?.folio || '';
  const setSelectedFolio = (f: string) => setSelectedClientOrderFolio(f);

  const [rejectComment, setRejectComment] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentOrder =
    orders.find(
      o => (o.folio || '').toLowerCase() === (selectedFolio || '').toLowerCase()
    ) || orders[0];

  const budget = currentOrder?.budget;

  const handleApprove = () => {
    if (!currentOrder) return;
    approveBudget(currentOrder.id, 'Presupuesto autorizado por el cliente vía portal.');
    setToastMessage(`¡Presupuesto para la orden ${currentOrder.folio} APROBADO exitosamente!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder || !rejectComment.trim()) return;
    rejectBudget(currentOrder.id, rejectComment.trim());
    setShowRejectForm(false);
    setRejectComment('');
    setToastMessage(`Solicitud de ajuste enviada para la orden ${currentOrder.folio}.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (!currentOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4 animate-in fade-in">
        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-inner">
          <UserCheck className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Portal de Seguimiento para Clientes</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          No hay órdenes de servicio activas asociadas a este folio en este momento. Las cotizaciones y órdenes creadas por la administración aparecerán aquí automáticamente.
        </p>
      </div>
    );
  }

  const partsSubtotal = budget?.parts.reduce(
    (sum, p) => sum + (p.quantity || 1) * (p.estimatedUnitPrice || 0),
    0
  ) || 0;
  const subtotal = (budget?.laborCost || 0) + partsSubtotal;
  const taxAmount = subtotal * (budget?.taxRate || 0.16);
  const total = subtotal + taxAmount;

  return (
    <div id="client-portal" className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-4">
      
      {/* Toast alert */}
      {toastMessage && (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center space-x-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Top Folio Switcher (Simulates direct link access without complex login) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Portal de Aprobación de Clientes</h2>
            <p className="text-xs text-slate-500">Acceso transparente mediante enlace directo a la orden</p>
          </div>
        </div>

        {/* Quick Folio Selector & Admin action */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Ver Orden (Folio):</label>
            <select
              value={selectedFolio}
              onChange={e => setSelectedFolio(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-hidden"
            >
              {orders.map(o => (
                <option key={o.id} value={o.folio}>
                  {o.folio} - {o.clientName} ({o.status})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Approval Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Banner */}
        <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/80 px-2.5 py-1 rounded-md border border-purple-800">
                {currentOrder.folio}
              </span>
              <span className="text-xs font-bold bg-white/10 text-white px-2.5 py-1 rounded-md">
                Estatus: {currentOrder.status}
              </span>
            </div>
            <h3 className="text-xl font-bold mt-2">{currentOrder.clientName}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{currentOrder.departmentName}</p>
          </div>

          <div className="text-right flex flex-col items-start sm:items-end gap-1.5">
            <span
              className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-black shadow-xs ${
                currentOrder.status === 'Cobrado/Cerrado'
                  ? 'bg-emerald-500 text-white'
                  : currentOrder.status === 'Pendiente de Entrega'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/50 animate-pulse'
                  : currentOrder.status === 'En Reparación' || currentOrder.status === 'En Diagnóstico'
                  ? 'bg-blue-500 text-white'
                  : budget?.status === 'Aprobado'
                  ? 'bg-emerald-500 text-white'
                  : budget?.status === 'Rechazado'
                  ? 'bg-rose-500 text-white'
                  : 'bg-amber-400 text-slate-950'
              }`}
            >
              {currentOrder.status === 'Cobrado/Cerrado' 
                ? '✅ Servicio Terminado' 
                : currentOrder.status === 'Pendiente de Entrega'
                ? '📦 Pendiente de Entrega / Cobro'
                : currentOrder.status === 'En Reparación' 
                ? '⚡ En Reparación' 
                : currentOrder.status === 'En Diagnóstico' 
                ? '🔍 En Diagnóstico' 
                : budget?.status 
                ? `Presupuesto ${budget.status}` 
                : '⏳ ' + currentOrder.status}
            </span>
            <span className="text-[11px] text-slate-400">Técnico Asignado: <strong>{currentOrder.technicianName || 'Por Asignar'}</strong></span>
          </div>
        </div>

        {/* Live Service Stepper / Tracker */}
        <div className="bg-slate-800/60 border-y border-slate-700/50 p-4 px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className={`p-2 rounded-xl flex flex-col items-center ${
              currentOrder.status === 'Pendiente de Visita' || currentOrder.status === 'Presupuesto Pendiente' || currentOrder.status === 'Esperando Aprobación' || currentOrder.status === 'En Diagnóstico' || currentOrder.status === 'En Reparación' || currentOrder.status === 'Pendiente de Entrega' || currentOrder.status === 'Cobrado/Cerrado'
                ? 'bg-purple-950/70 border border-purple-700/60 text-purple-200'
                : 'text-slate-500'
            }`}>
              <span className="font-bold text-[10px] uppercase tracking-wider">Paso 1</span>
              <span className="font-extrabold mt-0.5">1. Recepción & Visita</span>
            </div>

            <div className={`p-2 rounded-xl flex flex-col items-center ${
              currentOrder.status === 'En Diagnóstico' || currentOrder.status === 'Presupuesto Pendiente' || currentOrder.status === 'Esperando Aprobación' || currentOrder.status === 'En Reparación' || currentOrder.status === 'Pendiente de Entrega' || currentOrder.status === 'Cobrado/Cerrado'
                ? 'bg-indigo-950/70 border border-indigo-700/60 text-indigo-200'
                : 'text-slate-500'
            }`}>
              <span className="font-bold text-[10px] uppercase tracking-wider">Paso 2</span>
              <span className="font-extrabold mt-0.5">2. Diagnóstico en Sitio</span>
            </div>

            <div className={`p-2 rounded-xl flex flex-col items-center ${
              currentOrder.status === 'En Reparación' || currentOrder.status === 'Pendiente de Entrega' || currentOrder.status === 'Cobrado/Cerrado'
                ? 'bg-blue-950/70 border border-blue-700/60 text-blue-200'
                : currentOrder.status === 'Esperando Aprobación'
                ? 'bg-amber-950/70 border border-amber-500 text-amber-200 ring-2 ring-amber-400/40 animate-pulse'
                : 'text-slate-500'
            }`}>
              <span className="font-bold text-[10px] uppercase tracking-wider">Paso 3</span>
              <span className="font-extrabold mt-0.5">3. En Reparación</span>
            </div>

            <div className={`p-2 rounded-xl flex flex-col items-center ${
              currentOrder.status === 'Cobrado/Cerrado'
                ? 'bg-emerald-950/70 border border-emerald-500 text-emerald-200 ring-2 ring-emerald-400/40'
                : currentOrder.status === 'Pendiente de Entrega'
                ? 'bg-amber-950/70 border border-amber-500 text-amber-200 ring-2 ring-amber-400/40 animate-pulse'
                : 'text-slate-500'
            }`}>
              <span className="font-bold text-[10px] uppercase tracking-wider">Paso 4</span>
              <span className="font-extrabold mt-0.5">{currentOrder.status === 'Pendiente de Entrega' ? '4. Listo para Entrega' : '4. Concluido / Terminado'}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Problem description */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Descripción del Problema Atendido
            </h4>
            <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
              {currentOrder.description}
            </p>
          </div>

          {/* Technical Diagnostics Photos */}
          {currentOrder.diagnosticPhotos.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                <Camera className="w-4 h-4 text-purple-600" />
                <span>Fotos del Diagnóstico Técnico en Sitio</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {currentOrder.diagnosticPhotos.map((photo, idx) => (
                  <img
                    key={idx}
                    src={photo}
                    alt="Diagnóstico"
                    className="w-full h-32 object-cover rounded-xl border border-slate-200 shadow-2xs hover:scale-102 transition-transform"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Itemized Budget Breakdown */}
          {budget ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                <span>Desglose del Presupuesto</span>
              </div>

              <div className="p-4 space-y-3 text-xs">
                {/* Labor line */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800">Mano de Obra & Servicio Técnico</span>
                    <p className="text-[11px] text-slate-500">Inspección, diagnóstico y mano de obra de reparación.</p>
                  </div>
                  <span className="font-bold text-slate-900">${budget.laborCost.toLocaleString('es-MX')} MXN</span>
                </div>

                {/* Parts lines */}
                {budget.parts.map((p, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-200">
                    <div>
                      <span className="font-semibold text-slate-800">
                        {p.quantity}x {p.name}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900">
                      ${((p.quantity || 1) * (p.estimatedUnitPrice || 0)).toLocaleString('es-MX')} MXN
                    </span>
                  </div>
                ))}

                {/* Total box */}
                <div className="pt-2 space-y-1 text-right">
                  <div className="text-slate-500">Subtotal: ${subtotal.toLocaleString('es-MX')} MXN</div>
                  <div className="text-slate-500">IVA (16%): ${taxAmount.toLocaleString('es-MX')} MXN</div>
                  <div className="text-lg font-bold text-purple-700 pt-1 border-t border-slate-300">
                    TOTAL: ${total.toLocaleString('es-MX')} MXN
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center border border-dashed border-amber-300 bg-amber-50 rounded-xl text-amber-900 text-xs font-semibold">
              El presupuesto está siendo elaborado por el equipo administrativo de oficina.
            </div>
          )}

          {/* Action Buttons for Client Approval */}
          {budget && budget.status !== 'Aprobado' && (
            <div className="pt-4 border-t border-slate-200 space-y-4">
              {!showRejectForm ? (
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span>Rechazar / Solicitar Ajuste</span>
                  </button>

                  <button
                    onClick={handleApprove}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>Aprobar Presupuesto</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReject} className="bg-rose-50 border border-rose-200 p-4 rounded-xl space-y-3 text-xs">
                  <span className="font-bold text-rose-900 block">Indica el motivo del rechazo o ajuste requerido:</span>
                  <textarea
                    rows={2}
                    required
                    value={rejectComment}
                    onChange={e => setRejectComment(e.target.value)}
                    placeholder="Ej. Requerimos revisar los costos de mano de obra o aplicar descuento especial..."
                    className="w-full bg-white border border-rose-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-rose-500 outline-hidden"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(false)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold"
                    >
                      Enviar Ajuste
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {budget?.status === 'Aprobado' && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center text-xs text-emerald-900 space-y-1">
              <div className="font-bold text-sm text-emerald-800 flex items-center justify-center space-x-1">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Presupuesto Autorizado</span>
              </div>
              <p>El técnico ha sido notificado para continuar con los trabajos de reparación.</p>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
