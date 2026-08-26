import React, { useState, useRef } from 'react';
import { useApp, getOrderClientInfo } from '../../context/AppContext';
import { ServiceOrder, PaymentMethod } from '../../types';
import {
  X,
  CheckCircle2,
  Camera,
  PenTool,
  Send,
  ShieldCheck,
  Plus,
  AlertCircle,
  DollarSign,
  CreditCard,
  Smartphone,
  Laptop,
  Trash2,
  Eye,
  MapPin,
  Phone,
  User,
  Building
} from 'lucide-react';

// Helper to compress image and convert to Base64
const compressImageFile = (file: File, maxWidth = 1280, maxHeight = 1280, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const ExecutionAndCloseModal: React.FC<{
  order: ServiceOrder;
  isOpen: boolean;
  onClose: () => void;
}> = ({ order, isOpen, onClose }) => {
  const { submitTechResolution, clients } = useApp();
  const clientInfo = getOrderClientInfo(order, clients);

  const totalToCollect = order.budget?.grandTotal || 0;

  const [solutionNotes, setSolutionNotes] = useState(
    order.solutionNotes || 'Se efectuó la sustitución de piezas defectuosas, ajuste de torques y pruebas operativas a carga nominal durante 30 minutos sin anomalías.'
  );
  const [solutionPhotos, setSolutionPhotos] = useState<string[]>(order.solutionPhotos || []);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo');
  const [signedName, setSignedName] = useState('');
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Hidden file inputs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Canvas for Client Signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const compressedBase64 = await compressImageFile(files[i]);
        newPhotos.push(compressedBase64);
      } catch (err) {
        console.error('Error al procesar imagen:', err);
      }
    }
    if (newPhotos.length > 0) {
      setSolutionPhotos(prev => [...prev, ...newPhotos]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMobileCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const compressedBase64 = await compressImageFile(files[0]);
      setSolutionPhotos(prev => [...prev, compressedBase64]);
    } catch (err) {
      console.error('Error al procesar foto de cámara:', err);
    }
    if (cameraInputRef.current) cameraInputRef.current.value = '';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sigStr = signedName ? `Firma Digital: ${signedName}` : hasSignature ? 'Firma Digital Registrada' : 'Conformidad Digital';

    setIsSubmitting(true);
    try {
      await submitTechResolution({
        orderId: order.id,
        solutionNotes,
        solutionPhotos,
        signature: sigStr,
        paymentMethod,
        collectedAmount: totalToCollect
      });
      onClose();
    } catch (err) {
      console.error('Error cerrando orden:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Hidden inputs */}
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={handleMobileCameraCapture}
          className="hidden"
        />

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">Ejecución y Cierre de Orden</h3>
                <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                  {order.folio}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{order.clientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">

            {/* Client Info Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                  <Building className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{clientInfo.name}</span>
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {clientInfo.departmentName}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 text-xs">
                <div className="flex items-start space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="leading-tight font-medium text-slate-800 break-words">{clientInfo.address}</span>
                </div>
                <div className="flex items-start space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-bold text-slate-900">{clientInfo.contactName} ({clientInfo.phone || 'S/N'})</span>
                </div>
              </div>
            </div>

            {/* Budget Approval Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900 flex items-center space-x-3 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block text-emerald-950">¡Presupuesto Aprobado por el Cliente!</span>
                <p className="text-emerald-800 text-[11px]">
                  Mano de obra y refacciones fueron autorizadas. Registra la solución y el cobro para concluir.
                </p>
              </div>
            </div>

            {/* Read-Only Collection Block defined by Office */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Cobro Total Autorizado (Oficina)</span>
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Bloqueado para Edición
                </span>
              </div>

              <div className="flex items-baseline justify-between bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-300 text-xs font-semibold">Monto Total a Cobrar:</span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  ${totalToCollect.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center space-x-1">
                  <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                  <span>Forma de Pago Recibida (Obligatorio)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(['Efectivo', 'Transferencia', 'Tarjeta', 'Cheque'] as PaymentMethod[]).map(pm => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
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
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block text-xs">Notas Técnicas de la Solución Aplicada *</label>
              <textarea
                rows={3}
                value={solutionNotes}
                onChange={e => setSolutionNotes(e.target.value)}
                placeholder="Describe detalladamente los trabajos ejecutados y pruebas..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none"
                required
              />
            </div>

            {/* Solution Photos with Camera and PC upload */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Fotos del Trabajo Terminado ({solutionPhotos.length})</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (cameraInputRef.current) cameraInputRef.current.click();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1 text-xs shadow-xs cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>📸 Cámara Móvil</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.click();
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1 text-xs shadow-2xs cursor-pointer"
                  >
                    <Laptop className="w-3.5 h-3.5 text-slate-500" />
                    <span>💻 Subir Archivo</span>
                  </button>
                </div>
              </div>

              {solutionPhotos.length === 0 ? (
                <div className="text-center py-4 border-2 border-dashed border-slate-300 rounded-xl bg-white text-slate-400 text-xs">
                  Captura foto del equipo reparado y funcionando.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {solutionPhotos.map((p, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-300 bg-black aspect-square shadow-2xs">
                      <img src={p} alt={`Solución ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewPhoto(p)}
                          className="bg-white text-slate-900 p-1.5 rounded-lg cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSolutionPhotos(solutionPhotos.filter((_, i) => i !== idx))}
                          className="bg-rose-600 text-white p-1.5 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Client Digital Signature Box */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center space-x-1.5 text-xs">
                  <PenTool className="w-4 h-4 text-blue-600" />
                  <span>Firma Digital de Conformidad del Cliente</span>
                </label>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Limpiar Firma
                </button>
              </div>

              <input
                type="text"
                placeholder="Nombre de la persona que recibe (Ej. Ing. Carlos Pérez)"
                value={signedName}
                onChange={e => setSignedName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-800 outline-hidden"
              />

              <canvas
                ref={canvasRef}
                width={400}
                height={110}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full bg-white border border-slate-300 rounded-xl cursor-crosshair touch-none shadow-inner"
              />
              <p className="text-[10px] text-slate-400 text-center font-medium">Firma táctil sobre el recuadro blanco</p>
            </div>

          </div>

          {/* Submit Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-end space-x-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 bg-white rounded-xl text-slate-700 font-semibold text-xs cursor-pointer hover:bg-slate-100 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md flex items-center space-x-2 text-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Cerrando Orden...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cerrar Orden y Guardar</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Enlarged Photo Preview Modal */}
        {previewPhoto && (
          <div className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center p-4">
            <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
              <button
                onClick={() => setPreviewPhoto(null)}
                className="absolute top-2 right-2 bg-white/20 hover:bg-white text-white hover:text-black p-2 rounded-full backdrop-blur-xs transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={previewPhoto}
                alt="Vista Previa"
                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
