import React, { useState } from 'react';
import { useApp, deduplicateTechnicians } from '../../context/AppContext';
import { BarChart3, Clock, CheckCircle2, Building, Wrench, Calendar, TrendingUp, Trash2, AlertTriangle, Plus, Edit3, Power, X, Save } from 'lucide-react';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import { EditOrderModal } from './EditOrderModal';
import { ServiceOrder, Technician } from '../../types';

export const ReportsAndMetrics: React.FC = () => {
  const { orders, clients, technicians, deleteOrder, deleteTechnician, toggleTechStatus, addTechnician, updateTechnician } = useApp();
  const [selectedClientId, setSelectedClientId] = useState<string>('all');

  const activeTechnicians = deduplicateTechnicians(technicians).filter(
    t => !['tecnico 1', 'tecnico 2', 'técnico 1', 'técnico 2'].includes(t.name.toLowerCase().trim())
  );

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'order' | 'tech'; description: string; name: string } | null>(null);

  // Edit Order modal state
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);

  // Add / Edit Technician modal state
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [techName, setTechName] = useState('');
  const [techPhone, setTechPhone] = useState('');
  const [techEmail, setTechEmail] = useState('');
  const [techSpecialty, setTechSpecialty] = useState('Climatización HVAC');
  const [techStatus, setTechStatus] = useState<'Activo' | 'Inactivo'>('Activo');

  const handleOpenAddTech = () => {
    setEditingTech(null);
    setTechName('');
    setTechPhone('');
    setTechEmail('');
    setTechSpecialty('Climatización HVAC');
    setTechStatus('Activo');
    setIsTechModalOpen(true);
  };

  const handleOpenEditTech = (t: Technician) => {
    setEditingTech(t);
    setTechName(t.name);
    setTechPhone(t.phone || '');
    setTechEmail(t.email || '');
    setTechSpecialty(t.specialty || 'Climatización HVAC');
    setTechStatus(t.status || 'Activo');
    setIsTechModalOpen(true);
  };

  const handleSaveTech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!techName.trim()) return;

    if (editingTech) {
      updateTechnician(editingTech.id, {
        name: techName.trim(),
        phone: techPhone.trim(),
        email: techEmail.trim(),
        specialty: techSpecialty.trim(),
        status: techStatus
      });
    } else {
      await addTechnician({
        name: techName.trim(),
        phone: techPhone.trim(),
        email: techEmail.trim(),
        specialty: techSpecialty.trim(),
        status: techStatus
      });
    }
    setIsTechModalOpen(false);
  };

  const filteredOrders = orders.filter(
    o => selectedClientId === 'all' || o.clientId === selectedClientId
  );

  const handleDeleteRequest = (item: { id: string; type: 'order' | 'tech'; description: string; name: string }) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'order') {
      deleteOrder(itemToDelete.id);
    } else if (itemToDelete.type === 'tech') {
      deleteTechnician(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Métricas & Historial de Mantenimiento</h3>
            <p className="text-xs text-slate-500">Analítica de atención por técnico y departamentos</p>
          </div>
        </div>

        {/* Client filter */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filtrar por Cliente:</label>
          <select
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-2 font-medium focus:ring-2 focus:ring-purple-500 outline-hidden"
          >
            <option value="all">Todos los Clientes</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Technician Performance Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
            <Wrench className="w-4 h-4 text-purple-600" />
            <span>Técnicos de Campo & Rendimiento ({activeTechnicians.length})</span>
          </h4>
          <button
            onClick={handleOpenAddTech}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Técnico</span>
          </button>
        </div>

        {activeTechnicians.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-slate-400 text-xs font-medium">
            No hay técnicos registrados. Agrega nuevos técnicos con el botón "+ Nuevo Técnico".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeTechnicians.map(tech => {
              const techOrders = orders.filter(o => o.technicianId === tech.id);
              const completedTechOrders = techOrders.filter(o => o.status === 'Finalizada');
              const isInactive = tech.status === 'Inactivo';

              return (
                <div
                  key={tech.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs space-y-3 relative group transition-all ${
                    isInactive ? 'border-amber-200 bg-amber-50/20 opacity-80' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm border border-slate-200">
                        {tech.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h5 className="font-bold text-slate-900 text-sm">{tech.name}</h5>
                          {isInactive && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-bold">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-purple-600 font-medium block">{tech.specialty || 'Técnico Especialista'}</span>
                        {tech.phone && <span className="text-[10px] text-slate-400 block">{tech.phone}</span>}
                      </div>
                    </div>

                    {/* Admin Action Buttons for Technician */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditTech(tech)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Editar técnico"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => toggleTechStatus(tech.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isInactive
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                        }`}
                        title={isInactive ? 'Reactivar técnico' : 'Desactivar técnico'}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteRequest({
                            id: tech.id,
                            type: 'tech',
                            description: `al técnico ${tech.name} (${tech.specialty || 'General'})`,
                            name: tech.name
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar técnico de la base de datos"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">T. Respuesta</div>
                      <div className="text-sm font-bold text-slate-800 flex items-center space-x-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{tech.avgResponseTimeHours || 2.5} hrs</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Completadas</div>
                      <div className="text-sm font-bold text-emerald-600 flex items-center space-x-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{completedTechOrders.length} OS</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Maintenance History Table per Department / Client */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Historial de Mantenimiento por Cliente y Departamento ({filteredOrders.length} Registros)</span>
          </h4>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
            No se encontraron registros de mantenimiento en este filtro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold">
                <tr>
                  <th className="py-2.5 px-3">Folio</th>
                  <th className="py-2.5 px-3">Cliente / Ubicación</th>
                  <th className="py-2.5 px-3">Descripción</th>
                  <th className="py-2.5 px-3">Técnico</th>
                  <th className="py-2.5 px-3 text-center">Estatus</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map(ord => (
                  <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-600">{ord.folio}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{ord.clientName}</div>
                      <div className="text-[11px] text-slate-500">{ord.departmentName}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-xs truncate">{ord.description}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {ord.technicianName || 'Sin asignar'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                          ord.status === 'Finalizada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'No Aceptado'
                            ? 'bg-rose-100 text-rose-800'
                            : ord.status === 'En Reparación'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {ord.createdAt}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setEditingOrder(ord)}
                          className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Editar orden completa (Administrador)"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteRequest({
                              id: ord.id,
                              type: 'order',
                              description: `la orden con Folio "${ord.folio}" de ${ord.clientName}`,
                              name: ord.folio
                            })
                          }
                          className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Borrar registro de mantenimiento permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reusable Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={itemToDelete?.type === 'order' ? '¿Eliminar orden de servicio permanentemente?' : '¿Eliminar técnico permanentemente?'}
        itemDescription={itemToDelete?.description || 'este registro'}
        itemType={itemToDelete?.type === 'order' ? 'orden de servicio' : 'técnico'}
      />

      {/* Edit Order Modal */}
      {editingOrder && (
        <EditOrderModal
          isOpen={!!editingOrder}
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
        />
      )}

      {/* Add / Edit Technician Modal */}
      {isTechModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {editingTech ? 'Editar Técnico' : 'Registrar Nuevo Técnico'}
                  </h3>
                  <p className="text-[11px] text-purple-700">Gestión de técnicos de campo</p>
                </div>
              </div>
              <button
                onClick={() => setIsTechModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTech} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={techName}
                  onChange={e => setTechName(e.target.value)}
                  placeholder="Ej. Ing. Carlos Mendoza"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={techPhone}
                    onChange={e => setTechPhone(e.target.value)}
                    placeholder="Ej. 55 1234 5678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={techEmail}
                    onChange={e => setTechEmail(e.target.value)}
                    placeholder="tecnico@empresa.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Especialidad</label>
                  <select
                    value={techSpecialty}
                    onChange={e => setTechSpecialty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
                  >
                    <option value="Climatización HVAC">Climatización HVAC</option>
                    <option value="Refrigeración Comercial">Refrigeración Comercial</option>
                    <option value="Electricidad Industrial">Electricidad Industrial</option>
                    <option value="Electrónica & Control">Electrónica & Control</option>
                    <option value="Mantenimiento General">Mantenimiento General</option>
                    <option value="Compresores & Bombas">Compresores & Bombas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estado</label>
                  <select
                    value={techStatus}
                    onChange={e => setTechStatus(e.target.value as 'Activo' | 'Inactivo')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTechModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingTech ? 'Guardar Cambios' : 'Crear Técnico'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
