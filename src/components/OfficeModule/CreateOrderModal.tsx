import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PriorityType } from '../../types';
import { X, PlusCircle, Building, User, AlertCircle, Wrench } from 'lucide-react';

export const CreateOrderModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const { clients, technicians, createOrder } = useApp();

  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(
    clients[0]?.departments[0]?.id || ''
  );
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityType>('Media');
  const [technicianId, setTechnicianId] = useState<string>('');

  if (!isOpen) return null;

  const currentClient = clients.find(c => c.id === selectedClientId);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedClientId(newId);
    const cli = clients.find(c => c.id === newId);
    if (cli && cli.departments.length > 0) {
      setSelectedDepartmentId(cli.departments[0].id);
    } else {
      setSelectedDepartmentId('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedDepartmentId || !description.trim()) {
      return;
    }

    createOrder({
      clientId: selectedClientId,
      departmentId: selectedDepartmentId,
      description: description.trim(),
      priority,
      technicianId: technicianId || undefined
    });

    // Reset form & close
    setDescription('');
    setPriority('Media');
    setTechnicianId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Crear Reporte de Mantenimiento (OS)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Cliente
            </label>
            <select
              value={selectedClientId}
              onChange={handleClientChange}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all"
              required
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Departamento / Ubicación
            </label>
            <select
              value={selectedDepartmentId}
              onChange={e => setSelectedDepartmentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all"
              required
            >
              {currentClient?.departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.contactName})
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Descripción del Problema
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe detalladamente la falla reported, equipo afectado o servicio requerido..."
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all placeholder:text-slate-400"
              required
            />
          </div>

          {/* Priority & Tech */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as PriorityType)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all"
              >
                <option value="Alta">🔴 Alta (Urgente)</option>
                <option value="Media">🟡 Media (Estándar)</option>
                <option value="Baja">🟢 Baja (Programada)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Asignar Técnico
              </label>
              <select
                value={technicianId}
                onChange={e => setTechnicianId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all"
              >
                <option value="">-- Sin asignar por ahora --</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.specialty})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Generar Orden OS</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
