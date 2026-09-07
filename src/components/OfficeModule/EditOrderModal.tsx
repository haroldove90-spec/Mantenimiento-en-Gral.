import React, { useState, useEffect } from 'react';
import { useApp, deduplicateTechnicians } from '../../context/AppContext';
import { ServiceOrder, OrderStatus, PriorityType, Technician } from '../../types';
import {
  X,
  Edit3,
  Building2,
  Phone,
  Mail,
  MapPin,
  Wrench,
  Calendar,
  User,
  AlertCircle,
  Save,
  CheckCircle,
  Power,
  ShieldAlert,
  Hash
} from 'lucide-react';

const STAGES: OrderStatus[] = [
  'Pendiente de Visita',
  'En Diagnóstico',
  'Presupuesto Pendiente',
  'Esperando Aprobación',
  'No Aceptado',
  'En Reparación',
  'Pendiente de Entrega',
  'Cobrado/Cerrado',
  'Garantía Reabierta',
  'Cancelada'
];

interface EditOrderModalProps {
  order: ServiceOrder;
  isOpen: boolean;
  onClose: () => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, isOpen, onClose }) => {
  const { updateOrder, technicians, clients, currentUser } = useApp();

  // Form states initialized with current order values
  const [clientName, setClientName] = useState(order.clientName || '');
  const [departmentName, setDepartmentName] = useState(order.departmentName || '');
  const [clientPhone, setClientPhone] = useState(order.clientPhone || '');
  const [clientAddress, setClientAddress] = useState(order.clientAddress || '');
  const [clientEmail, setClientEmail] = useState(order.clientEmail || '');
  const [equipmentType, setEquipmentType] = useState(order.equipmentType || '');
  const [brand, setBrand] = useState(order.brand || '');
  const [model, setModel] = useState(order.model || '');
  const [serialNumber, setSerialNumber] = useState(order.serialNumber || '');
  const [description, setDescription] = useState(order.description || '');
  const [priority, setPriority] = useState<PriorityType>(order.priority || 'Media');
  const [status, setStatus] = useState<OrderStatus>(order.status || 'Pendiente de Visita');
  const [technicianId, setTechnicianId] = useState(order.technicianId || '');
  const [scheduledDate, setScheduledDate] = useState(order.scheduledDate || '');
  const [routeOrder, setRouteOrder] = useState<number>(order.routeOrder || 1);
  const [routeNotes, setRouteNotes] = useState(order.routeNotes || '');
  const [isActive, setIsActive] = useState<boolean>(order.isActive !== false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setClientName(order.clientName || '');
      setDepartmentName(order.departmentName || '');
      setClientPhone(order.clientPhone || '');
      setClientAddress(order.clientAddress || '');
      setClientEmail(order.clientEmail || '');
      setEquipmentType(order.equipmentType || '');
      setBrand(order.brand || '');
      setModel(order.model || '');
      setSerialNumber(order.serialNumber || '');
      setDescription(order.description || '');
      setPriority(order.priority || 'Media');
      setStatus(order.status || 'Pendiente de Visita');
      setTechnicianId(order.technicianId || '');
      setScheduledDate(order.scheduledDate || '');
      setRouteOrder(order.routeOrder || 1);
      setRouteNotes(order.routeNotes || '');
      setIsActive(order.isActive !== false);
      setFeedback(null);
    }
  }, [isOpen, order]);

  if (!isOpen) return null;

  // Deduplicate technicians list
  const uniqueTechs: Technician[] = deduplicateTechnicians(technicians);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setFeedback({ type: 'error', message: 'La descripción de la falla o servicio es obligatoria.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const assignedTech = uniqueTechs.find(t => t.id === technicianId);
      const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });

      const newTimelineEntry = {
        id: `tl-${Date.now()}`,
        timestamp: nowStr,
        title: 'Orden editada por Administrador',
        author: currentUser?.name || 'Administración',
        note: `Cambios guardados: Estatus: ${status}, Prioridad: ${priority}, Activa: ${isActive ? 'Sí' : 'No'}`
      };

      await updateOrder(order.id, {
        clientName: clientName.trim(),
        departmentName: departmentName.trim(),
        clientPhone: clientPhone.trim(),
        clientAddress: clientAddress.trim(),
        clientEmail: clientEmail.trim(),
        equipmentType: equipmentType.trim(),
        brand: brand.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim(),
        description: description.trim(),
        priority,
        status,
        isActive,
        technicianId: assignedTech ? assignedTech.id : undefined,
        technicianName: assignedTech ? assignedTech.name : undefined,
        scheduledDate: scheduledDate || undefined,
        routeOrder: Number(routeOrder) || 1,
        routeNotes: routeNotes.trim() || undefined,
        timeline: [...order.timeline, newTimelineEntry]
      });

      setFeedback({ type: 'success', message: '¡Orden de servicio actualizada y sincronizada con éxito!' });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error al actualizar orden:', err);
      setFeedback({ type: 'error', message: 'Ocurrió un error al guardar los cambios en la orden.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full my-auto flex flex-col shadow-2xl overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-blue-600 text-white font-mono font-bold px-2 py-0.5 rounded text-xs">
                  {order.folio}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {isActive ? '● Activa' : '○ Desactivada / Inactiva'}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                Editar Orden de Servicio (Administración)
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`px-5 py-3 text-xs font-bold flex items-center space-x-2 ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-rose-50 text-rose-800 border-b border-rose-200'
          }`}>
            {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-800 text-xs">
          
          {/* Quick Active / Inactive Switch */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-800 text-sm block">Estado de la Orden</span>
              <p className="text-slate-500 text-xs mt-0.5">
                Desactive esta orden para ocultarla de los flujos activos sin perder historial ni cotizaciones.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-xs ${
                isActive
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isActive ? 'Orden Activa' : 'Desactivada / Inactiva'}</span>
            </button>
          </div>

          {/* SECTION 1: DATOS DEL CLIENTE Y CONTACTO */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 text-slate-900 font-bold text-xs uppercase tracking-wider pb-1 border-b border-slate-200">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>1. Datos del Cliente y Ubicación</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre de la Empresa o Cliente:</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="Ej. OXXO Matriz"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Sucursal / Departamento:</label>
                <input
                  type="text"
                  value={departmentName}
                  onChange={e => setDepartmentName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="Ej. Sucursal Reforma"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Teléfono / WhatsApp:</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="Ej. 55 1234 5678"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="cliente@correo.com"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Dirección del Servicio:</label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={e => setClientAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="Calle, Número, Colonia, Ciudad"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: DATOS DEL EQUIPO & FALLA REPORTADA */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 text-slate-900 font-bold text-xs uppercase tracking-wider pb-1 border-b border-slate-200">
              <Wrench className="w-4 h-4 text-emerald-600" />
              <span>2. Equipo y Falla Reportada</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tipo de Equipo / Servicio:</label>
                <input
                  type="text"
                  value={equipmentType}
                  onChange={e => setEquipmentType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="Ej. Climatización HVAC"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Marca:</label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="Ej. Carrier / Daikin"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Modelo / No. Serie:</label>
                <input
                  type="text"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="Ej. Mod. 2024 / SN-8921"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="font-bold text-slate-700 block mb-1">
                  Descripción del Problema o Servicio Reportado: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="Describa el motivo del servicio, falla reportada o requerimiento..."
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: ESTATUS, TÉCNICO & ASIGNACIÓN */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 text-slate-900 font-bold text-xs uppercase tracking-wider pb-1 border-b border-slate-200">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>3. Control Operativo, Estatus y Asignación</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Estatus de la Orden:</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as OrderStatus)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-bold cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-hidden ${
                    status === 'No Aceptado'
                      ? 'bg-rose-100 text-rose-900 border-rose-300'
                      : status === 'Cobrado/Cerrado'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : status === 'Pendiente de Entrega'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-slate-50 text-slate-800 border-slate-300'
                  }`}
                >
                  {STAGES.map(s => (
                    <option key={s} value={s}>
                      {s === 'No Aceptado' ? '❌ No Aceptado' : s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Prioridad:</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as PriorityType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Técnico Asignado:</label>
                <select
                  value={technicianId}
                  onChange={e => setTechnicianId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="">-- Sin Asignar --</option>
                  {uniqueTechs.map(t => (
                    <option key={t.id} value={t.id}>
                      👨‍🔧 {t.name} ({t.specialty || 'Técnico'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Fecha Programada:</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Turno / Orden de Ruta:</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={routeOrder}
                  onChange={e => setRouteOrder(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="font-bold text-slate-700 block mb-1">Notas Internas / Instrucciones de Ruta:</label>
                <input
                  type="text"
                  value={routeNotes}
                  onChange={e => setRouteNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="Ej. Pasar a caseta de seguridad antes de ingresar, llevar escalera de 4m..."
                />
              </div>
            </div>
          </div>

          {/* Footer actions inside form */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios en Orden'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
