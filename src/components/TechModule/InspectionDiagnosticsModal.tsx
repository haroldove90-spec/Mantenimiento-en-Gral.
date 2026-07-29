import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder, RequestedPart } from '../../types';
import { X, Camera, Plus, Trash2, Send, Wrench, AlertCircle, PlayCircle } from 'lucide-react';

export const InspectionDiagnosticsModal: React.FC<{
  order: ServiceOrder;
  isOpen: boolean;
  onClose: () => void;
}> = ({ order, isOpen, onClose }) => {
  const { startInspection, submitTechDiagnostic, spareParts } = useApp();

  const [notes, setNotes] = useState(order.diagnosticNotes || '');
  const [photos, setPhotos] = useState<string[]>(order.diagnosticPhotos || []);
  const [requestedParts, setRequestedParts] = useState<RequestedPart[]>(order.requestedParts || []);

  if (!isOpen) return null;

  // Add dummy diagnostic photo
  const handleAddSamplePhoto = () => {
    const samplePhotos = [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80'
    ];
    const randomPic = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
    setPhotos([...photos, randomPic]);
  };

  const handleAddPart = () => {
    const defaultPart = spareParts[0];
    const newP: RequestedPart = {
      id: `rp-${Date.now()}`,
      partId: defaultPart?.id,
      name: defaultPart?.name || 'Pieza requerida',
      quantity: 1,
      estimatedUnitPrice: defaultPart?.unitPrice || 450,
      notes: ''
    };
    setRequestedParts([...requestedParts, newP]);
  };

  const handleStartInspectionClick = () => {
    startInspection(order.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitTechDiagnostic({
      orderId: order.id,
      notes,
      photos,
      requestedParts
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Diagnóstico e Inspección Técnica</h3>
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

            {/* Start Inspection Button if status is Pendiente de Revisión */}
            {order.status === 'Pendiente de Revisión' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-center justify-between">
                <div>
                  <span className="font-bold block">Iniciar Inspección en Sitio</span>
                  <p className="text-blue-700 text-[11px]">Presiona para marcar hora de inicio en el reporte.</p>
                </div>
                <button
                  type="button"
                  onClick={handleStartInspectionClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-xs"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Iniciar</span>
                </button>
              </div>
            )}
          {/* Notes */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Notas del Diagnóstico Inicial</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Escribe los hallazgos técnicos, medición de voltajes, presiones, causas de la falla..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              required
            />
          </div>

          {/* Photographic Evidence */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700 flex items-center space-x-1">
                <Camera className="w-4 h-4 text-slate-500" />
                <span>Evidencia Fotográfica ({photos.length})</span>
              </label>
              <button
                type="button"
                onClick={handleAddSamplePhoto}
                className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-bold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Capturar Foto</span>
              </button>
            </div>

            {photos.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-slate-300 rounded-lg text-slate-400">
                Aún no hay fotos adjuntas. Toma evidencia con la cámara.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p, idx) => (
                  <div key={idx} className="relative group">
                    <img src={p} alt="Evidencia" className="w-full h-20 object-cover rounded-lg border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-rose-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Spare Parts Request */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700">Refacciones / Piezas Necesarias para Oficina</label>
              <button
                type="button"
                onClick={handleAddPart}
                className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-bold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Repuesto</span>
              </button>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto">
              {requestedParts.map((p, idx) => (
                <div key={p.id || idx} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <input
                    type="text"
                    value={p.name}
                    onChange={e => {
                      const updated = [...requestedParts];
                      updated[idx].name = e.target.value;
                      setRequestedParts(updated);
                    }}
                    placeholder="Nombre del repuesto..."
                    className="flex-1 bg-white border border-slate-300 rounded-md p-1 font-medium"
                  />
                  <input
                    type="number"
                    min="1"
                    value={p.quantity}
                    onChange={e => {
                      const updated = [...requestedParts];
                      updated[idx].quantity = Number(e.target.value);
                      setRequestedParts(updated);
                    }}
                    className="w-14 bg-white border border-slate-300 rounded-md p-1 text-center font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setRequestedParts(requestedParts.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md flex items-center space-x-1.5 text-xs"
            >
              <Send className="w-4 h-4" />
              <span>Enviar a Oficina</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
