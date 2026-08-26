import React, { useState, useRef, useEffect } from 'react';
import { useApp, getOrderClientInfo } from '../../context/AppContext';
import { ServiceOrder, RequestedPart } from '../../types';
import {
  X,
  Camera,
  Upload,
  Plus,
  Trash2,
  Send,
  Wrench,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Video,
  Smartphone,
  Laptop,
  MapPin,
  Phone,
  User,
  Building,
  ExternalLink
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

export const InspectionDiagnosticsModal: React.FC<{
  order: ServiceOrder;
  isOpen: boolean;
  onClose: () => void;
}> = ({ order, isOpen, onClose }) => {
  const { startInspection, submitTechDiagnostic, spareParts, clients } = useApp();
  const clientInfo = getOrderClientInfo(order, clients);

  const [notes, setNotes] = useState(order.diagnosticNotes || '');
  const [photos, setPhotos] = useState<string[]>(order.diagnosticPhotos || []);
  const [requestedParts, setRequestedParts] = useState<RequestedPart[]>(order.requestedParts || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Hidden Inputs for PC and Mobile Camera
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Live in-app camera stream state
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNotes(order.diagnosticNotes || '');
      setPhotos(order.diagnosticPhotos || []);
      setRequestedParts(order.requestedParts || []);
    }
  }, [isOpen, order]);

  // Clean up live stream on unmount or close
  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  if (!isOpen) return null;

  // 1. Handle File Upload from Computer / Device Storage
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
      setPhotos(prev => [...prev, ...newPhotos]);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 2. Handle Native Mobile Camera Capture
  const handleMobileCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const compressedBase64 = await compressImageFile(files[0]);
      setPhotos(prev => [...prev, compressedBase64]);
    } catch (err) {
      console.error('Error al procesar foto de cámara:', err);
    }
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // 3. Live In-App Camera functions
  const startLiveCamera = async () => {
    setCameraError(null);
    setIsLiveCameraOpen(true);

    try {
      // Request camera permissions with back camera preferred for mobile
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('No se pudo acceder a la cámara en vivo:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permiso de cámara denegado. Concede acceso a la cámara en tu navegador o usa el botón de captura directa.');
      } else {
        setCameraError('No se detectó cámara disponible o el dispositivo no admite transmisión en vivo. Usa el botón de captura nativo.');
      }
    }
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsLiveCameraOpen(false);
    setCameraError(null);
  };

  const capturePhotoFromLiveStream = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotos(prev => [...prev, dataUrl]);
    }
    stopLiveCamera();
  };

  // Add Part
  const handleAddPart = () => {
    const defaultPart = spareParts[0];
    const newP: RequestedPart = {
      id: `rp-${Date.now()}`,
      partId: defaultPart?.id,
      name: defaultPart?.name || 'Pieza / Refacción requerida',
      quantity: 1,
      estimatedUnitPrice: defaultPart?.unitPrice || 450,
      notes: ''
    };
    setRequestedParts([...requestedParts, newP]);
  };

  const handleStartInspectionClick = async () => {
    await startInspection(order.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    setIsSubmitting(true);
    try {
      await submitTechDiagnostic({
        orderId: order.id,
        notes: notes.trim(),
        photos,
        requestedParts
      });
      onClose();
    } catch (err) {
      console.error('Error enviando diagnóstico:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
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
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">Diagnóstico e Inspección Técnica</h3>
                <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                  {order.folio}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{order.clientName} • {order.equipmentType}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopLiveCamera();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">

            {/* Client Information Header Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                  <Building className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{clientInfo.name}</span>
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {clientInfo.departmentName}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-bold text-[10px] text-slate-500 block">Dirección:</span>
                    <p className="font-medium text-slate-900 leading-snug break-words">{clientInfo.address}</p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clientInfo.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-[10px] font-bold text-rose-700 mt-0.5 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Abrir Navegador GPS</span>
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-bold text-[10px] text-slate-500 block">Contacto & Teléfono:</span>
                    <p className="font-bold text-slate-900">{clientInfo.contactName} ({clientInfo.phone || 'S/N'})</p>
                    {clientInfo.phone && (
                      <a
                        href={`tel:${clientInfo.phone.replace(/[^0-9+]/g, '')}`}
                        className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 mt-0.5 hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Llamar al cliente</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Start Inspection Banner */}
            {order.status === 'Pendiente de Revisión' && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="font-bold text-sm block text-blue-950">Marcar Llegada / Iniciar Revisión</span>
                  <p className="text-blue-700 text-[11px] mt-0.5">
                    Registra la hora exacta de arribo al domicilio del cliente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartInspectionClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer text-xs"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Iniciar Ahora</span>
                </button>
              </div>
            )}

            {/* 1. Diagnostic Notes */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 text-xs flex items-center justify-between">
                <span>Notas del Diagnóstico Inicial e Inspección Física *</span>
                <span className="text-slate-400 font-normal text-[11px]">Obligatorio</span>
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Detalla los hallazgos técnicos: voltaje, amperaje, presión de gas, fugas, códigos de error en tarjeta, desgaste mecánico..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all shadow-2xs resize-none"
                required
              />
            </div>

            {/* 2. Photographic Evidence Section */}
            <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Evidencia Fotográfica de la Falla</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.2 rounded-full font-bold">
                      {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sube capturas del equipo, placa técnica o piezas dañadas.
                  </p>
                </div>

                {/* Upload & Mobile Camera Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Button: Mobile Camera / Native Capture */}
                  <button
                    type="button"
                    onClick={() => {
                      if (cameraInputRef.current) {
                        cameraInputRef.current.click();
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer text-xs"
                    title="Abre la cámara del dispositivo móvil para tomar una foto directamente"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>📸 Tomar Foto Móvil</span>
                  </button>

                  {/* Button: In-App Live Camera */}
                  <button
                    type="button"
                    onClick={startLiveCamera}
                    className="bg-teal-700 hover:bg-teal-800 text-white px-3 py-2 rounded-xl font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer text-xs"
                    title="Activar visor de cámara en pantalla con permisos en vivo"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Cámara en Vivo</span>
                  </button>

                  {/* Button: Upload from PC / Storage */}
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-xl font-bold flex items-center space-x-1.5 shadow-2xs cursor-pointer text-xs"
                    title="Subir una o varias imágenes guardadas en el ordenador o galería"
                  >
                    <Laptop className="w-3.5 h-3.5 text-slate-500" />
                    <span>💻 Subir del Ordenador</span>
                  </button>

                </div>
              </div>

              {/* Live Camera Viewfinder Overlay */}
              {isLiveCameraOpen && (
                <div className="bg-slate-900 p-3 rounded-2xl border border-slate-700 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-white text-xs">
                    <span className="font-bold flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                      <span>Visor de Cámara en Vivo</span>
                    </span>
                    <button
                      type="button"
                      onClick={stopLiveCamera}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {cameraError ? (
                    <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-200 rounded-xl text-[11px] space-y-2">
                      <p className="flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{cameraError}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (cameraInputRef.current) cameraInputRef.current.click();
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                      >
                        Abrir Cámara Nativa Directa
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-center space-x-3">
                        <button
                          type="button"
                          onClick={capturePhotoFromLiveStream}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2 rounded-xl flex items-center space-x-2 text-xs shadow-lg cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>¡Capturar y Adjuntar Foto!</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopLiveCamera}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs font-semibold"
                        >
                          Cerrar Visor
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Photos Gallery Grid */}
              {photos.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-300 rounded-2xl bg-white space-y-2">
                  <Camera className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-slate-500 font-semibold text-xs">
                    No hay fotografías de evidencia adjuntadas.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Usa <strong>"Tomar Foto Móvil"</strong> o <strong>"Subir del Ordenador"</strong> para capturar evidencias.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {photos.map((p, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-slate-300 bg-black aspect-square shadow-2xs"
                    >
                      <img
                        src={p}
                        alt={`Evidencia ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setPreviewPhoto(p)}
                          className="bg-white/90 hover:bg-white text-slate-900 p-1.5 rounded-lg shadow-sm cursor-pointer"
                          title="Ver en grande"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                          className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg shadow-sm cursor-pointer"
                          title="Eliminar foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Spare Parts Request */}
            <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-bold text-slate-800 text-xs block">
                    Refacciones / Piezas Necesarias para Cotizar
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Especifica qué materiales o repuestos debe cotizar la administración.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPart}
                  className="text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1 text-xs cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Pieza</span>
                </button>
              </div>

              {requestedParts.length === 0 ? (
                <div className="p-3 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-[11px]">
                  No se han solicitado refacciones adicionales (sólo mano de obra / diagnóstico).
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {requestedParts.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs"
                    >
                      <input
                        type="text"
                        value={p.name}
                        onChange={e => {
                          const updated = [...requestedParts];
                          updated[idx].name = e.target.value;
                          setRequestedParts(updated);
                        }}
                        placeholder="Ej. Capacitor 45uF / Válvula de Expansión / Banda V..."
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-xs text-slate-800 focus:bg-white outline-hidden"
                        required
                      />
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500">Cant:</span>
                          <input
                            type="number"
                            min="1"
                            value={p.quantity}
                            onChange={e => {
                              const updated = [...requestedParts];
                              updated[idx].quantity = Math.max(1, Number(e.target.value));
                              setRequestedParts(updated);
                            }}
                            className="w-12 bg-white border border-slate-300 rounded-md p-1 text-center font-bold text-xs"
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setRequestedParts(requestedParts.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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

          </div>

          {/* Submit Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between">
            <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Al enviar, se notificará a Administración para emitir presupuesto formal.
            </div>

            <div className="flex items-center space-x-2 ml-auto">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  stopLiveCamera();
                  onClose();
                }}
                className="px-4 py-2.5 border border-slate-300 bg-white rounded-xl text-slate-700 font-semibold text-xs cursor-pointer hover:bg-slate-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md flex items-center space-x-2 text-xs cursor-pointer disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando en Supabase...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Guardar y Enviar a Oficina</span>
                  </>
                )}
              </button>
            </div>
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
