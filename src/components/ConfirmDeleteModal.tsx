import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemDescription?: string;
  itemType?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Eliminar registro permanentemente?',
  itemDescription = 'este registro',
  itemType = 'registro'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4 relative overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Top Warning Banner */}
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 shadow-xs">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1 pr-6">
            <h3 className="text-lg font-black text-slate-900 leading-tight">
              {title}
            </h3>
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mt-0.5">
              Acción Permanente e Irreversible
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Content */}
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 space-y-2 text-xs text-rose-950">
          <p className="font-semibold text-slate-800">
            Estás a punto de borrar permanentemente <span className="font-extrabold text-rose-700 underline">{itemDescription}</span>.
          </p>
          <div className="bg-white/90 p-2.5 rounded-xl border border-rose-200 text-[11px] space-y-1 text-slate-600">
            <div className="flex items-center space-x-1.5 text-rose-700 font-bold">
              <span>⚠️ Consecuencias de esta acción:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 pl-1 text-slate-700 font-medium">
              <li>Se eliminará de las vistas locales y reportes.</li>
              <li>Se borrará permanentemente de la base de datos de <strong className="text-rose-700">Supabase</strong>.</li>
              <li>No se podrá recuperar la información de este {itemType}.</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Sí, Eliminar de la Base de Datos</span>
          </button>
        </div>

      </div>
    </div>
  );
};
