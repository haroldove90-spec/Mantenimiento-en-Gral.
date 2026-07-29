import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder, PaymentMethod } from '../../types';
import { X, CheckCircle2, Camera, PenTool, Send, ShieldCheck, Plus, AlertCircle, DollarSign, CreditCard } from 'lucide-react';

export const ExecutionAndCloseModal: React.FC<{
  order: ServiceOrder;
  isOpen: boolean;
  onClose: () => void;
}> = ({ order, isOpen, onClose }) => {
  const { submitTechResolution } = useApp();

  const totalToCollect = order.budget?.grandTotal || 0;

  const [solutionNotes, setSolutionNotes] = useState(
    order.solutionNotes || 'Se efectuó la sustitución de piezas defectuosas, ajuste de torques y pruebas operativas a carga nominal durante 30 minutos sin anomalías.'
  );
  const [solutionPhotos, setSolutionPhotos] = useState<string[]>(order.solutionPhotos || []);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo');
  const [signedName, setSignedName] = useState('');
  const [hasSignature, setHasSignature] = useState(false);

  // Simple Canvas for Client Signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  if (!isOpen) return null;

  const handleAddSamplePhoto = () => {
    const samples = [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80'
    ];
    const pic = samples[Math.floor(Math.random() * samples.length)];
    setSolutionPhotos([...solutionPhotos, pic]);
  };

  // Canvas Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sigStr = signedName ? `Firma Digital: ${signedName}` : hasSignature ? 'Firma Digital Registrada' : 'Conformidad Digital';

    submitTechResolution({
      orderId: order.id,
      solutionNotes,
      solutionPhotos,
      signature: sigStr,
      paymentMethod,
      collectedAmount: totalToCollect
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Ejecución y Cierre de Orden</h3>
              <p className="text-xs text-slate-500">{order.folio} - {order.clientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg bg-slate-50 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">

            {/* Budget Approval Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block">¡Presupuesto Aprobado por el Cliente!</span>
                <p className="text-emerald-800 text-[11px]">
                  Mano de obra y refacciones fueron autorizadas. Registra la solución y el cobro para concluir.
                </p>
              </div>
            </div>

            {/* Read-Only Collection Block defined by Office */}
            <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Cobro Total a Realizar (Definido por Administración)</span>
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Bloqueado para Edición
                </span>
              </div>

              <div className="flex items-baseline justify-between bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-300 text-xs font-semibold">Monto Autorizado en Cotización:</span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  ${totalToCollect.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center space-x-1">
                  <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                  <span>Forma de Pago Recibida (Obligatorio)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(['Efectivo', 'Transferencia', 'Tarjeta', 'Cheque'] as PaymentMethod[]).map(pm => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition-all ${
                        paymentMethod === pm
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          {/* Solution Notes */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Notas Técnicas de la Solución Aplicada</label>
            <textarea
              rows={3}
              value={solutionNotes}
              onChange={e => setSolutionNotes(e.target.value)}
              placeholder="Describe detalladamente los trabajos ejecutados y pruebas..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              required
            />
          </div>

          {/* Solution Photos */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700 flex items-center space-x-1">
                <Camera className="w-4 h-4 text-slate-500" />
                <span>Fotos del Trabajo Terminado ({solutionPhotos.length})</span>
              </label>
              <button
                type="button"
                onClick={handleAddSamplePhoto}
                className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-bold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Foto Final</span>
              </button>
            </div>

            {solutionPhotos.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-slate-300 rounded-lg text-slate-400">
                Captura foto del equipo reparado y funcionando.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {solutionPhotos.map((p, idx) => (
                  <img key={idx} src={p} alt="Solución" className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                ))}
              </div>
            )}
          </div>

          {/* Client Digital Signature Box */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center space-x-1">
                <PenTool className="w-4 h-4 text-blue-600" />
                <span>Firma Digital de Conformidad del Cliente</span>
              </label>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-[10px] text-slate-500 hover:text-slate-800 underline"
              >
                Limpiar Firma
              </button>
            </div>

            <input
              type="text"
              placeholder="Nombre de quien recibe (Ej. Ing. Carlos Pérez)"
              value={signedName}
              onChange={e => setSignedName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs mb-2"
            />

            <canvas
              ref={canvasRef}
              width={400}
              height={100}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full bg-white border border-slate-300 rounded-lg cursor-crosshair touch-none"
            />
            <p className="text-[10px] text-slate-400 text-center">Firma táctil sobre el recuadro blanco</p>
          </div>
          </div>

          {/* Submit Footer - Fixed */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 bg-white rounded-lg text-slate-700 font-semibold text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md flex items-center space-x-1.5 text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Cerrar Orden y Enviar</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
