import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder } from '../../types';
import { X, CheckCircle2, Camera, PenTool, Send, ShieldCheck, Plus, AlertCircle } from 'lucide-react';

export const ExecutionAndCloseModal: React.FC<{
  order: ServiceOrder;
  isOpen: boolean;
  onClose: () => void;
}> = ({ order, isOpen, onClose }) => {
  const { submitTechResolution } = useApp();

  const [solutionNotes, setSolutionNotes] = useState(
    order.solutionNotes || 'Se efectuó la sustitución de piezas defectuosas, ajuste de torques y pruebas operativas a carga nominal durante 30 minutos sin anomalías.'
  );
  const [solutionPhotos, setSolutionPhotos] = useState<string[]>(order.solutionPhotos || []);
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
      signature: sigStr
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl relative my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Ejecución y Cierre de Orden</h3>
              <p className="text-xs text-slate-500">{order.folio} - {order.clientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Budget Approval Banner */}
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold block">¡Presupuesto Aprobado por el Cliente!</span>
            <p className="text-emerald-800 text-[11px]">
              Mano de obra y refacciones fueron autorizadas. Registra la solución para con cluir.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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

          {/* Submit */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md flex items-center space-x-1.5"
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
