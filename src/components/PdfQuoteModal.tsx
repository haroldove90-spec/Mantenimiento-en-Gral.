import React from 'react';
import { ServiceOrder } from '../types';
import { X, Printer, Download, Wrench, ShieldCheck, FileCheck } from 'lucide-react';

export const PdfQuoteModal: React.FC<{
  order: ServiceOrder;
  isOpen: boolean;
  onClose: () => void;
}> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order.budget) return null;

  const b = order.budget;
  const partsSubtotal = b.parts.reduce(
    (sum, p) => sum + (p.quantity || 1) * (p.estimatedUnitPrice || 0),
    0
  );
  const subtotal = b.laborCost + partsSubtotal;
  const taxAmount = subtotal * b.taxRate;
  const total = subtotal + taxAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
        
        {/* Top Control Bar - Fixed */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-blue-400 shrink-0" />
            <span className="font-semibold text-xs sm:text-sm">Vista Previa de Cotización (PDF/Documento)</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area - Scrollable */}
        <div className="p-6 sm:p-10 text-slate-800 space-y-8 bg-white print:p-0 print:m-0 overflow-y-auto flex-1 quote-print-area">
          <style>{`
            @page {
              size: letter portrait;
              margin: 10mm 12mm;
            }
            @media print {
              body * {
                visibility: hidden;
              }
              .quote-print-area, .quote-print-area * {
                visibility: visible;
              }
              .quote-print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
              }
            }
          `}</style>
          
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  <Wrench className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  SERVICIOS DE MANTENIMIENTO TÉCNICO
                </span>
              </div>
              <p className="text-xs text-slate-500">Mantenimiento Industrial, Climatización y Electromecánica</p>
              <p className="text-xs text-slate-500">RFC: SMT8801019A1 | Tel: 800-555-SERVICIOS</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-md border border-blue-200 uppercase mb-2">
                PRESUPUESTO OFICIAL
              </span>
              <div className="text-lg font-bold text-slate-900">{order.folio}</div>
              <p className="text-xs text-slate-500">
                Fecha: {order.budget.sentAt || new Date().toLocaleDateString('es-MX')}
              </p>
            </div>
          </div>

          {/* Client & Order Meta */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-700 block uppercase mb-1">Datos del Cliente:</span>
              <div className="font-semibold text-slate-900 text-sm">{order.clientName}</div>
              <div className="text-slate-600 mt-0.5">Ubicación: {order.departmentName}</div>
            </div>

            <div>
              <span className="font-bold text-slate-700 block uppercase mb-1">Detalles del Servicio:</span>
              <div className="text-slate-800 font-medium">Prioridad: <span className="font-semibold">{order.priority}</span></div>
              <div className="text-slate-600 mt-0.5 line-clamp-2">Falla: {order.description}</div>
            </div>
          </div>

          {/* Items breakdown table */}
          <div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800 text-slate-800 uppercase font-bold">
                  <th className="py-2.5">Concepto / Descripción</th>
                  <th className="py-2.5 text-center">Cant.</th>
                  <th className="py-2.5 text-right">P. Unitario</th>
                  <th className="py-2.5 text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Labor Line */}
                <tr>
                  <td className="py-3 font-semibold text-slate-900">
                    Mano de Obra Especializada & Diagnóstico
                    <p className="text-slate-500 font-normal">Inspección técnica, ejecución e informe de servicio en sitio.</p>
                  </td>
                  <td className="py-3 text-center">1</td>
                  <td className="py-3 text-right">${b.laborCost.toLocaleString('es-MX')} MXN</td>
                  <td className="py-3 text-right font-semibold">${b.laborCost.toLocaleString('es-MX')} MXN</td>
                </tr>

                {/* Parts Lines */}
                {b.parts.map((p, idx) => {
                  const lineTotal = (p.quantity || 1) * (p.estimatedUnitPrice || 0);
                  return (
                    <tr key={idx}>
                      <td className="py-3 font-semibold text-slate-900">
                        {p.name}
                        {p.notes && <p className="text-slate-500 font-normal">{p.notes}</p>}
                      </td>
                      <td className="py-3 text-center font-medium">{p.quantity}</td>
                      <td className="py-3 text-right">${p.estimatedUnitPrice.toLocaleString('es-MX')} MXN</td>
                      <td className="py-3 text-right font-semibold">${lineTotal.toLocaleString('es-MX')} MXN</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">${subtotal.toLocaleString('es-MX')} MXN</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>IVA (16%):</span>
                <span className="font-semibold">${taxAmount.toLocaleString('es-MX')} MXN</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-800 pt-2">
                <span>Total:</span>
                <span className="text-blue-700">${total.toLocaleString('es-MX')} MXN</span>
              </div>
            </div>
          </div>

          {/* Guarantee & Terms Footer */}
          <div className="border-t border-slate-200 pt-6 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center space-x-1 font-semibold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Garantía de Servicio de 90 días en refacciones y mano de obra.</span>
            </div>
            <p>{b.notes}</p>
          </div>

        </div>
      </div>
    </div>
  );
};
