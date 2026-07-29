import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder, RequestedPart } from '../../types';
import {
  X,
  FileSpreadsheet,
  Plus,
  Trash2,
  Send,
  Printer,
  CheckCircle2,
  DollarSign,
  Share2,
  MessageSquare
} from 'lucide-react';

export const BudgetGeneratorModal: React.FC<{
  order: ServiceOrder;
  isOpen: boolean;
  onClose: () => void;
  onOpenPdfPreview: () => void;
}> = ({ order, isOpen, onClose, onOpenPdfPreview }) => {
  const { saveBudget, sendBudgetToClient, spareParts } = useApp();

  const initialBudget = order.budget;
  const [laborCost, setLaborCost] = useState<number>(initialBudget?.laborCost || 1200);
  const [parts, setParts] = useState<RequestedPart[]>(
    initialBudget?.parts && initialBudget.parts.length > 0
      ? initialBudget.parts
      : order.requestedParts.length > 0
      ? order.requestedParts
      : []
  );
  const [notes, setNotes] = useState<string>(
    initialBudget?.notes || 'Incluye diagnóstico técnico, refacciones originales y garantía de 90 días.'
  );

  if (!isOpen) return null;

  // Add custom or catalog part line
  const handleAddPart = () => {
    const defaultCatalogPart = spareParts[0];
    const newP: RequestedPart = {
      id: `part-${Date.now()}`,
      partId: defaultCatalogPart?.id,
      name: defaultCatalogPart?.name || 'Refacción General',
      quantity: 1,
      estimatedUnitPrice: defaultCatalogPart?.unitPrice || 500
    };
    setParts([...parts, newP]);
  };

  const handleUpdatePart = (index: number, field: keyof RequestedPart, value: any) => {
    const updated = [...parts];
    updated[index] = { ...updated[index], [field]: value };
    setParts(updated);
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const partsSubtotal = parts.reduce(
    (sum, p) => sum + (p.quantity || 1) * (p.estimatedUnitPrice || 0),
    0
  );
  const subtotal = laborCost + partsSubtotal;
  const taxRate = 0.16;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  const handleSave = () => {
    saveBudget(order.id, {
      laborCost,
      parts,
      taxRate,
      notes
    });
  };

  const handleSaveAndSend = () => {
    handleSave();
    sendBudgetToClient(order.id);
    onClose();
  };

  // WhatsApp Share text generator
  const getWhatsAppMessage = () => {
    const text = `Hola *${order.clientName}*, le enviamos el presupuesto para la Orden *${order.folio}* (${order.departmentName}):\n\n- Mano de obra: $${laborCost.toLocaleString()} MXN\n- Refacciones (${parts.length}): $${partsSubtotal.toLocaleString()} MXN\n- IVA (16%): $${taxAmount.toLocaleString()} MXN\n*Total:* $${total.toLocaleString()} MXN\n\nPuede revisar y autorizar su presupuesto en nuestro portal de clientes.\nGracias por su confianza.`;
    return encodeURIComponent(text);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">Generador de Presupuesto / Cotización</h3>
              <p className="text-xs text-slate-500">Folio: <span className="font-semibold text-slate-700">{order.folio}</span> - {order.clientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors bg-slate-50 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">

          {/* Diagnostic requested parts banner if field tech requested parts */}
          {order.requestedParts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
              <div className="font-semibold text-amber-950 mb-1 flex items-center space-x-1.5">
                <span>🛠️ Refacciones solicitadas desde el campo por el Técnico ({order.technicianName || 'Técnico'})</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                {order.requestedParts.map(p => (
                  <li key={p.id}>
                    {p.quantity}x {p.name} {p.notes ? `(${p.notes})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Labor Cost */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mano de Obra y Servicio Técnico (MXN)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-semibold">$</span>
              <input
                type="number"
                min="0"
                value={laborCost}
                onChange={e => setLaborCost(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-sm rounded-lg pl-7 pr-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
              />
            </div>
          </div>

          {/* Parts breakdown table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Refacciones y Repuestos Requeridos
              </label>
              <button
                type="button"
                onClick={handleAddPart}
                className="text-xs text-emerald-700 font-semibold hover:text-emerald-800 flex items-center space-x-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Repuesto</span>
              </button>
            </div>

            {parts.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-slate-300 rounded-lg text-xs text-slate-400">
                Sin refacciones agregadas. Haz clic arriba para añadir repuestos.
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {parts.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-50 p-3 border border-slate-200 rounded-xl text-xs"
                  >
                    <input
                      type="text"
                      value={p.name}
                      onChange={e => handleUpdatePart(idx, 'name', e.target.value)}
                      placeholder="Nombre del repuesto..."
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 font-medium"
                    />
                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      <div className="w-20">
                        <label className="text-[10px] text-slate-400 block sm:hidden font-bold mb-0.5">Cant.</label>
                        <input
                          type="number"
                          min="1"
                          value={p.quantity}
                          onChange={e => handleUpdatePart(idx, 'quantity', Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-center font-medium text-slate-800"
                          title="Cantidad"
                        />
                      </div>
                      <div className="w-28 relative">
                        <label className="text-[10px] text-slate-400 block sm:hidden font-bold mb-0.5">P. Unitario</label>
                        <span className="absolute left-2.5 top-1.5 sm:top-2 text-slate-400">$</span>
                        <input
                          type="number"
                          min="0"
                          value={p.estimatedUnitPrice}
                          onChange={e => handleUpdatePart(idx, 'estimatedUnitPrice', Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded-lg pl-5 pr-2 py-1.5 font-medium text-slate-800 text-right"
                          title="Precio Unitario"
                        />
                      </div>
                      <div className="w-24 text-right font-bold text-slate-800 text-xs">
                        ${((p.quantity || 1) * (p.estimatedUnitPrice || 0)).toLocaleString()}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePart(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg bg-white border border-slate-200 sm:border-0"
                        title="Eliminar repuesto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Notas / Términos de la Cotización
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
            />
          </div>

          {/* Calculations Summary Box */}
          <div className="bg-slate-900 text-white p-4 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Mano de obra:</span>
              <span className="font-semibold">${laborCost.toLocaleString('es-MX')} MXN</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Refacciones ({parts.length}):</span>
              <span className="font-semibold">${partsSubtotal.toLocaleString('es-MX')} MXN</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Subtotal:</span>
              <span className="font-semibold">${subtotal.toLocaleString('es-MX')} MXN</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>IVA (16%):</span>
              <span className="font-semibold">${taxAmount.toLocaleString('es-MX')} MXN</span>
            </div>
            <div className="border-t border-slate-700 pt-2 flex justify-between text-sm font-bold text-emerald-400">
              <span>TOTAL COTIZACIÓN:</span>
              <span>${total.toLocaleString('es-MX')} MXN</span>
            </div>
          </div>

        </div>

        {/* Footer - Fixed */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={onOpenPdfPreview}
              className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Ver PDF</span>
            </button>

            <a
              href={`https://wa.me/?text=${getWhatsAppMessage()}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                handleSave();
                onClose();
              }}
              className="px-4 py-2 border border-slate-300 bg-white rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Guardar Borrador
            </button>

            <button
              type="button"
              onClick={handleSaveAndSend}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center space-x-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Enviar a Cliente</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
