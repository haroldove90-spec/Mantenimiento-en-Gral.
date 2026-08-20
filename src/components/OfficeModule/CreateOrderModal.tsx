import React, { useState, useEffect, useMemo } from 'react';
import { useApp, deduplicateTechnicians } from '../../context/AppContext';
import { PriorityType } from '../../types';
import { SendCredentialsWhatsAppModal } from '../SendCredentialsWhatsAppModal';
import {
  X,
  PlusCircle,
  Building,
  User,
  AlertCircle,
  Wrench,
  Phone,
  MapPin,
  Mail,
  Sparkles,
  CheckCircle2,
  Calendar,
  UserPlus,
  MessageSquare
} from 'lucide-react';

export const CreateOrderModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const { clients, technicians, createOrder, addClient, setSelectedClientOrderFolio } = useApp();

  // Mode: existing vs new client
  const [clientMode, setClientMode] = useState<'existing' | 'new'>(
    clients.length > 0 ? 'existing' : 'new'
  );

  // Existing client selection state
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(
    clients[0]?.departments?.[0]?.id || ''
  );

  // New client inline registration state
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientDept, setNewClientDept] = useState('Matriz Principal');
  const [newClientContact, setNewClientContact] = useState('');

  // Service Order fields
  const [equipmentType, setEquipmentType] = useState('Aire Acondicionado Industrial');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityType>('Media');
  const [technicianId, setTechnicianId] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    type: 'client' | 'tech';
    recipientName: string;
    recipientPhone?: string;
    recipientEmail?: string;
    recipientPassword?: string;
    folio?: string;
  } | null>(null);

  // Sync client state when clients prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      if (clients.length === 0) {
        setClientMode('new');
      } else {
        if (!selectedClientId || !clients.some(c => c.id === selectedClientId)) {
          const firstClient = clients[0];
          setSelectedClientId(firstClient.id);
          setSelectedDepartmentId(firstClient.departments?.[0]?.id || 'dept-default');
        }
      }
    }
  }, [isOpen, clients]);

  if (!isOpen) return null;

  const currentClient = clients.find(c => c.id === selectedClientId);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedClientId(newId);
    const cli = clients.find(c => c.id === newId);
    if (cli && cli.departments && cli.departments.length > 0) {
      setSelectedDepartmentId(cli.departments[0].id);
    } else {
      setSelectedDepartmentId(`dept-${newId}-1`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!description.trim()) {
      setErrorMessage('Por favor ingresa la descripción del problema o falla.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalClientId = selectedClientId;
      let finalDepartmentId = selectedDepartmentId;
      let finalClientName = currentClient?.name;
      let finalDeptName = currentClient?.departments?.find(d => d.id === selectedDepartmentId)?.name || 'Matriz Principal';

      // 1. If registering a new client directly from form
      if (clientMode === 'new') {
        if (!newClientName.trim()) {
          setErrorMessage('Por favor escribe el nombre de la empresa o cliente.');
          setIsSubmitting(false);
          return;
        }

        const deptName = newClientDept.trim() || 'Matriz Principal';
        const contactPerson = newClientContact.trim() || newClientName.trim();
        const clientPhone = newClientPhone.trim() || 'S/N';
        const clientAddress = newClientAddress.trim() || 'Ubicación General';

        const createdClient = await addClient({
          name: newClientName.trim(),
          phone: clientPhone,
          whatsapp: clientPhone,
          email: newClientEmail.trim() || '',
          address: clientAddress,
          fiscalAddress: clientAddress,
          deliveryAddress: clientAddress,
          taxId: 'XAXX010101000',
          status: 'Activo',
          departments: [
            {
              id: `dept-${Date.now()}-1`,
              name: deptName,
              contactName: contactPerson,
              phone: clientPhone,
              address: clientAddress
            }
          ]
        });

        finalClientId = createdClient.id;
        finalDepartmentId = createdClient.departments?.[0]?.id || `dept-${createdClient.id}-1`;
        finalClientName = createdClient.name;
        finalDeptName = deptName;
      } else {
        // Validation for existing client mode
        if (!finalClientId) {
          setErrorMessage('No hay un cliente seleccionado. Por favor selecciona o registra uno nuevo.');
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Create the Service Order
      const newOrder = createOrder({
        clientId: finalClientId,
        departmentId: finalDepartmentId || `dept-${finalClientId}-1`,
        equipmentType: equipmentType.trim() || 'Equipo General',
        description: description.trim(),
        priority,
        technicianId: technicianId || undefined,
        scheduledDate,
        clientName: finalClientName,
        departmentName: finalDeptName
      });

      if (newOrder && newOrder.folio) {
        setSelectedClientOrderFolio(newOrder.folio);
      }

      setSuccessMessage(`¡Orden ${newOrder.folio} generada con éxito para ${finalClientName}!`);

      // Prepare target phone and email for WhatsApp credentials modal
      const targetPhone = clientMode === 'new' ? newClientPhone : currentClient?.phone || currentClient?.whatsapp;
      const targetEmail = clientMode === 'new' ? newClientEmail : currentClient?.email;

      setWhatsAppModalData({
        type: 'client',
        recipientName: finalClientName,
        recipientPhone: targetPhone,
        recipientEmail: targetEmail,
        recipientPassword: '1234 (o su contraseña)',
        folio: newOrder.folio
      });

      // Reset form fields
      setDescription('');
      setNewClientName('');
      setNewClientPhone('');
      setNewClientEmail('');
      setNewClientAddress('');
      setNewClientContact('');
      setNewClientDept('Matriz Principal');
      setPriority('Media');
      setTechnicianId('');
      setIsSubmitting(false);

    } catch (err: any) {
      console.error('Error al generar orden:', err);
      setErrorMessage(err.message || 'Ocurrió un error al registrar la orden.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
                Crear Reporte de Mantenimiento (OS)
              </h3>
              <p className="text-xs text-slate-500">
                Apertura de orden de servicio técnico y asignación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl transition-colors bg-slate-50 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form with scrollable body & fixed footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-left">
            
            {/* Feedback Notifications */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Client Mode Selector Tabs */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Información del Cliente
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  {clients.length} cliente{clients.length !== 1 ? 's' : ''} en sistema
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setClientMode('existing')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    clientMode === 'existing'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Cliente Registrado ({clients.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setClientMode('new')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    clientMode === 'new'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Registrar Nuevo Cliente</span>
                </button>
              </div>
            </div>

            {/* TAB 1: EXISTING CLIENT */}
            {clientMode === 'existing' && (
              <div className="space-y-3.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                {clients.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-center space-y-2">
                    <div className="flex items-center justify-center space-x-2 text-amber-800 text-xs font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>No hay clientes registrados en el sistema</span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      Para crear esta orden de servicio, captura los datos en la pestaña <strong>"Registrar Nuevo Cliente"</strong> y se guardará automáticamente en Supabase y en el sistema.
                    </p>
                    <button
                      type="button"
                      onClick={() => setClientMode('new')}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Registrar Nuevo Cliente Ahora</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Client Selection */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Seleccionar Cliente
                        </label>
                        <button
                          type="button"
                          onClick={() => setClientMode('new')}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-0.5 cursor-pointer"
                        >
                          <span>+ Nuevo Cliente</span>
                        </button>
                      </div>
                      <select
                        value={selectedClientId}
                        onChange={handleClientChange}
                        className="w-full bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium"
                        required
                      >
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>
                            🏢 {c.name} {c.phone ? `(${c.phone})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Department / Location Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Departamento / Sucursal / Ubicación
                      </label>
                      <select
                        value={selectedDepartmentId}
                        onChange={e => setSelectedDepartmentId(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium"
                        required
                      >
                        {currentClient?.departments && currentClient.departments.length > 0 ? (
                          currentClient.departments.map(d => (
                            <option key={d.id} value={d.id}>
                              📍 {d.name} {d.contactName ? `(${d.contactName})` : ''}
                            </option>
                          ))
                        ) : (
                          <option value={`dept-${selectedClientId}-1`}>
                            📍 Matriz Principal ({currentClient?.name || 'Contacto'})
                          </option>
                        )}
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: INLINE REGISTRATION OF NEW CLIENT */}
            {clientMode === 'new' && (
              <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center space-x-1.5 text-blue-800 text-xs font-bold">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Registro Inmediato de Cliente (Guarda en Supabase)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nombre de la Empresa o Cliente *
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={newClientName}
                        onChange={e => setNewClientName(e.target.value)}
                        placeholder="Ej. Carnicería San Juan"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium"
                        required={clientMode === 'new'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Teléfono / WhatsApp <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={newClientPhone}
                        onChange={e => setNewClientPhone(e.target.value)}
                        placeholder="Ej. 3312345678"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dirección / Domicilio <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={newClientAddress}
                        onChange={e => setNewClientAddress(e.target.value)}
                        placeholder="Ej. Av. Hidalgo 450, Centro"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Correo Electrónico (Opcional)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={newClientEmail}
                        onChange={e => setNewClientEmail(e.target.value)}
                        placeholder="Ej. contacto@sanjuan.com"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sucursal / Departamento
                    </label>
                    <input
                      type="text"
                      value={newClientDept}
                      onChange={e => setNewClientDept(e.target.value)}
                      placeholder="Ej. Matriz Principal / Almacén"
                      className="w-full px-3 py-2 bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Persona de Contacto en Sitio
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={newClientContact}
                        onChange={e => setNewClientContact(e.target.value)}
                        placeholder="Ej. Don Juan / Encargado"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ORDER DETAILS SECTION */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Datos del Servicio / Reporte
              </label>

              {/* Equipment Type & Scheduled Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Equipo / Sistema *
                  </label>
                  <div className="relative">
                    <Wrench className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={equipmentType}
                      onChange={e => setEquipmentType(e.target.value)}
                      placeholder="Ej. Aire Acondicionado Industrial"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha Programada de Atención *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción Detallada del Problema / Falla *
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe detalladamente la falla reportada, equipo afectado, síntomas o servicio requerido..."
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Priority & Tech */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prioridad de Atención
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as PriorityType)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all font-medium"
                  >
                    <option value="Alta">🔴 Alta (Urgente / Paro de Equipo)</option>
                    <option value="Media">🟡 Media (Estándar / Preventivo)</option>
                    <option value="Baja">🟢 Baja (Programada / Revisión)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Asignar Técnico de Campo
                  </label>
                  <select
                    value={technicianId}
                    onChange={e => setTechnicianId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all font-medium"
                  >
                    <option value="">-- Sin asignar por ahora --</option>
                    {deduplicateTechnicians(technicians)
                      .filter(
                        t =>
                          t.status !== 'Inactivo' &&
                          !['tecnico 1', 'tecnico 2', 'técnico 1', 'técnico 2'].includes(t.name.toLowerCase().trim())
                      )
                      .map(t => (
                        <option key={t.id} value={t.id}>
                          👨‍🔧 {t.name} ({t.specialty || 'Técnico de Campo'})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Fixed */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-slate-300 bg-white rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <PlusCircle className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Guardando en Supabase...' : 'Generar Orden OS'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    {/* WhatsApp Credentials Sender Modal */}
    {whatsAppModalData && (
      <SendCredentialsWhatsAppModal
        isOpen={true}
        onClose={() => {
          setWhatsAppModalData(null);
          onClose();
        }}
        type={whatsAppModalData.type}
        recipientName={whatsAppModalData.recipientName}
        recipientPhone={whatsAppModalData.recipientPhone}
        recipientEmail={whatsAppModalData.recipientEmail}
        recipientPassword={whatsAppModalData.recipientPassword}
        folio={whatsAppModalData.folio}
      />
    )}
  </>
  );
};

