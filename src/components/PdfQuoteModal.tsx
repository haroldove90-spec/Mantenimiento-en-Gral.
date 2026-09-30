import React, { useState } from 'react';
import { ServiceOrder } from '../types';
import { X, Printer, Download, Wrench, ShieldCheck, FileCheck, ReceiptText, MessageCircle, FileText, CheckCircle2 } from 'lucide-react';
import { exportNotaDeVentaPDF, numberToSpanishPesos, printHtmlContent, generateNotaDeVentaHtml } from '../lib/exportUtils';

export const PdfQuoteModal: React.FC<{
  order: ServiceOrder;
  isOpen: boolean;
  onClose: () => void;
  defaultDocType?: 'nota_venta' | 'cotizacion';
}> = ({ order, isOpen, onClose, defaultDocType }) => {
  if (!isOpen) return null;

  const [docType, setDocType] = useState<'nota_venta' | 'cotizacion'>(
    defaultDocType || (order.status === 'Cobrado/Cerrado' || order.budget?.status === 'Aprobado' ? 'nota_venta' : 'cotizacion')
  );

  const b = order.budget;
  const partsSubtotal = b?.parts?.reduce(
    (sum, p) => sum + (p.quantity || 1) * (p.estimatedUnitPrice || 0),
    0
  ) || 0;

  const laborCost = b?.laborCost !== undefined ? b.laborCost : (order.collectedAmount || 850);
  const subtotal = laborCost + partsSubtotal;
  const taxRate = b?.taxRate ?? 0;
  const hasTax = taxRate > 0;
  const taxAmount = subtotal * taxRate;
  const total = b?.grandTotal !== undefined && b.grandTotal > 0
    ? b.grandTotal
    : (b ? subtotal + taxAmount : (order.collectedAmount || subtotal));

  const totalInWords = numberToSpanishPesos(total);
  const isNotaVenta = docType === 'nota_venta';
  const folioDisplay = isNotaVenta ? `NV-${order.folio}` : order.folio;

  const handlePrint = () => {
    exportNotaDeVentaPDF(order, { documentType: docType });
  };

  const handleWhatsAppShare = () => {
    const phone = (order.clientPhone || '').replace(/\D/g, '');
    const docLabel = isNotaVenta ? 'Nota de Venta' : 'Cotización';
    const msg = `*SIJ SERVICIOS - ${docLabel.toUpperCase()}*\n\n` +
      `Estimado(a) *${order.clientName}*,\n` +
      `Le compartimos los detalles de su ${docLabel} para el folio *${folioDisplay}*:\n\n` +
      `🛠️ *Servicio/Equipo:* ${order.equipmentType || 'Mantenimiento General'}\n` +
      `📋 *Falla Atendida:* ${order.description || 'Revisión y puesta en marcha'}\n` +
      `💰 *Total:* $${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\n` +
      `📝 *Cantidad con Letra:* ${totalInWords}\n` +
      `🛡️ *Garantía:* 90 días en mano de obra y refacciones\n\n` +
      `Para dudas o asistencia técnica, estamos a su servicio en SIJ Mantenimiento.`;

    const url = phone
      ? `https://wa.me/52${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl relative overflow-hidden border border-slate-200">
        
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 no-print shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              {isNotaVenta ? <ReceiptText className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div>
              <span className="font-bold text-xs sm:text-sm block">
                {isNotaVenta ? 'Comprobante y Nota de Venta' : 'Presupuesto y Cotización Oficial'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Folio: {folioDisplay} • Tamaño Carta</span>
            </div>
          </div>

          {/* Document Type Switcher */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setDocType('nota_venta')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                isNotaVenta ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5" />
              <span>Nota de Venta</span>
            </button>
            <button
              onClick={() => setDocType('cotizacion')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                !isNotaVenta ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Cotización</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleWhatsAppShare}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Compartir nota por WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer active:scale-95"
              title="Imprimir o guardar como PDF en Tamaño Carta"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl transition-colors bg-slate-800 hover:bg-slate-700 cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area (Letter Size Preview) */}
        <div className="p-6 sm:p-10 text-slate-800 space-y-6 bg-white overflow-y-auto flex-1 font-sans">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-blue-600 pb-5 gap-4">
            <div className="flex items-start space-x-3">
              <img
                src="https://battwitnhrezwotkcvbc.supabase.co/storage/v1/object/public/logo/sij.png"
                alt="SIJ Logo"
                className="h-12 w-auto object-contain"
                onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900">
                  SIJ MANTENIMIENTO Y SERVICIOS
                </h1>
                <p className="text-xs font-bold text-blue-700">Climatización, Refrigeración y Mantenimiento Técnico Industrial</p>
                <p className="text-[11px] text-slate-500 mt-0.5">RFC: SMT8801019A1 • Tel: 800-555-SERVICIOS / 55-8942-1200</p>
                <p className="text-[11px] text-slate-500">Blvd. Manuel Ávila Camacho #1970 • Email: facturacion@sijservicios.com</p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <div className="inline-block px-3 py-1 bg-blue-600 text-white font-extrabold text-xs rounded-md uppercase tracking-wider mb-1">
                {isNotaVenta ? 'NOTA DE VENTA / REMISIÓN' : 'COTIZACIÓN Y PRESUPUESTO'}
              </div>
              <div className="text-xl font-black font-mono text-slate-900">{folioDisplay}</div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Folio Orden: <strong className="text-slate-800">{order.folio}</strong>
              </p>
              <p className="text-[11px] text-slate-500">
                Fecha: {order.budget?.sentAt || new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}
              </p>
            </div>
          </div>

          {/* Client & Service Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-1">
              <span className="font-extrabold text-slate-500 block uppercase text-[10px] tracking-wider border-b border-slate-200 pb-1 mb-1">
                Datos del Cliente & Ubicación:
              </span>
              <div className="font-bold text-slate-900 text-sm">{order.clientName}</div>
              <div className="text-slate-600">Sucursal: <strong>{order.departmentName || 'Matriz Principal'}</strong></div>
              <div className="text-slate-600">Teléfono: {order.clientPhone || 'S/N'}</div>
              <div className="text-slate-600">Correo: {order.clientEmail || 'N/A'}</div>
            </div>

            <div className="space-y-1">
              <span className="font-extrabold text-slate-500 block uppercase text-[10px] tracking-wider border-b border-slate-200 pb-1 mb-1">
                Detalles del Servicio & Equipo:
              </span>
              <div className="text-slate-800">Equipo Atendido: <strong className="text-blue-700">{order.equipmentType || 'Equipo General'}</strong></div>
              <div className="text-slate-800">Técnico Responsable: <strong>{order.technicianName || 'Técnico Especialista SIJ'}</strong></div>
              <div className="text-slate-800">Prioridad: <strong>{order.priority}</strong></div>
              <div className="text-slate-800">
                Estado: <span className="font-bold text-emerald-700">{order.status === 'Cobrado/Cerrado' ? 'PAGADO / CONCLUIDO' : 'EN SERVICIO'}</span>
              </div>
            </div>
          </div>

          {/* Problem & Solution description */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
            <div className="font-bold text-slate-700 uppercase text-[10px]">Descripción del Servicio / Falla:</div>
            <p className="text-slate-800 leading-relaxed">{order.description || 'Mantenimiento preventivo / correctivo en sitio.'}</p>
            {order.solutionNotes && (
              <div className="pt-2 border-t border-slate-200 mt-2">
                <span className="font-bold text-blue-900 uppercase text-[10px] block">Trabajos Técnicos Realizados:</span>
                <p className="text-blue-950 font-medium">{order.solutionNotes}</p>
              </div>
            )}
          </div>

          {/* Items breakdown table */}
          <div className="overflow-hidden border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Concepto / Descripción</th>
                  <th className="py-2.5 px-3 text-center">Cant.</th>
                  <th className="py-2.5 px-3 text-right">P. Unitario</th>
                  <th className="py-2.5 px-3 text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Labor Line */}
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    Mano de Obra y Servicio Técnico Especializado
                    <p className="text-slate-500 font-normal text-[11px]">Inspección, diagnóstico, ejecución de maniobras y puesta a punto.</p>
                  </td>
                  <td className="py-2.5 px-3 text-center font-medium">1</td>
                  <td className="py-2.5 px-3 text-right">${laborCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td className="py-2.5 px-3 text-right font-bold">${laborCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                </tr>

                {/* Parts Lines */}
                {b?.parts && b.parts.length > 0 ? (
                  b.parts.map((p, idx) => {
                    const lineTotal = (p.quantity || 1) * (p.estimatedUnitPrice || 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {p.name}
                          {p.notes && <p className="text-slate-500 font-normal text-[10.5px]">{p.notes}</p>}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium">{p.quantity}</td>
                        <td className="py-2.5 px-3 text-right">${(p.estimatedUnitPrice || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 text-right font-bold">${lineTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-2">
            {/* Amount in words */}
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700">
              <span className="font-bold text-slate-500 uppercase text-[10px] block mb-0.5">Importe con Letra:</span>
              <p className="font-bold text-slate-900 text-xs">(SON: {totalInWords})</p>
              <p className="text-[10.5px] text-slate-500 mt-1">
                Condición Fiscal: <strong>{hasTax ? 'IVA (16%) Incluido' : 'Precio Neto Directo (Sin IVA)'}</strong>
              </p>
            </div>

            <div className="w-full sm:w-72 space-y-1.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Neto:</span>
                <span className="font-bold text-slate-800">${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
              </div>
              <div className="flex justify-between text-slate-600 items-center">
                <span>{hasTax ? `IVA (${Math.round(taxRate * 100)}%):` : 'Impuesto (IVA):'}</span>
                <span className={`font-semibold ${hasTax ? 'text-slate-800' : 'text-slate-500 italic'}`}>
                  {hasTax ? `$${taxAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` : 'Sin IVA ($0.00 MXN)'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 border-t-2 border-slate-900 pt-2">
                <span>TOTAL A PAGAR:</span>
                <span className="text-blue-700 text-base font-black">${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
              </div>
            </div>
          </div>

          {/* Guarantee & Terms */}
          <div className="border border-slate-200 bg-slate-50/60 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Póliza de Garantía SIJ: 90 días naturales sobre mano de obra y refacciones suministradas.</span>
            </div>
            <p className="text-slate-500">
              El cliente declara haber recibido a entera conformidad las refacciones y el servicio técnico prestado en los equipos listados.
            </p>
            {b?.notes && <p className="text-slate-600 italic">Notas: {b.notes}</p>}
          </div>

          {/* Formal Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
            <div className="border-t-2 border-slate-400 pt-2 space-y-0.5">
              <div className="font-bold text-slate-900">{order.technicianName || 'Técnico Especialista SIJ'}</div>
              <div className="text-slate-500 text-[10px]">Firma del Técnico Responsable</div>
              <div className="text-slate-400 text-[9px]">SIJ Mantenimiento y Servicios</div>
            </div>

            <div className="border-t-2 border-slate-400 pt-2 space-y-0.5">
              <div className="font-bold text-slate-900">{order.clientName}</div>
              <div className="text-slate-500 text-[10px]">Firma / Sello de Conformidad del Cliente</div>
              <div className="text-slate-400 text-[9px]">Nombre, Firma y Fecha de Recepción</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
