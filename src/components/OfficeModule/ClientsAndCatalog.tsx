import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, Package, Plus, MapPin, Phone, Mail, Search, Tag, Database, Edit, Trash2, CheckCircle2, XCircle, UserX, UserCheck } from 'lucide-react';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import { Client, SparePart } from '../../types';

export const ClientsAndCatalog: React.FC = () => {
  const { clients, spareParts, addClient, updateClient, deleteClient, toggleClientStatus, addSparePart, updateSparePart, toggleSparePartStatus, deleteSparePart } = useApp();
  const [activeTab, setActiveTab] = useState<'clients' | 'catalog'>('clients');

  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'client' | 'part'; name: string; description: string } | null>(null);

  // Client Modal State (Create or Edit)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientTaxId, setNewClientTaxId] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientWhatsapp, setNewClientWhatsapp] = useState('');
  const [newClientModel, setNewClientModel] = useState('');
  const [newClientFault, setNewClientFault] = useState('');

  // Spare Part Modal State (Create or Edit)
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [partCode, setPartCode] = useState('');
  const [partName, setPartName] = useState('');
  const [partCategory, setPartCategory] = useState('General');
  const [partPrice, setPartPrice] = useState(500);
  const [partStock, setPartStock] = useState(10);

  const q = (searchQuery || '').toLowerCase();
  const filteredClients = clients.filter(c =>
    (c.name || '').toLowerCase().includes(q) ||
    (c.taxId || '').toLowerCase().includes(q) ||
    (c.contactName || '').toLowerCase().includes(q)
  );

  const filteredParts = spareParts.filter(p =>
    (p.name || '').toLowerCase().includes(q) ||
    (p.code || '').toLowerCase().includes(q) ||
    (p.category || '').toLowerCase().includes(q)
  );

  // Feedback state
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isClientSubmitting, setIsClientSubmitting] = useState(false);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) {
      showFeedback('error', 'El nombre del cliente es obligatorio');
      return;
    }

    setIsClientSubmitting(true);

    try {
      if (editingClientId) {
        await updateClient(editingClientId, {
          name: newClientName.trim(),
          taxId: newClientTaxId.trim() || 'XAXX010101000',
          email: newClientEmail.trim() || 'contacto@cliente.com',
          address: newClientAddress.trim() || 'Dirección no especificada',
          phone: newClientPhone.trim() || 'S/N',
          whatsapp: newClientWhatsapp.trim() || newClientPhone.trim() || 'S/N',
          model: newClientModel.trim(),
          fault: newClientFault.trim()
        });
        showFeedback('success', `¡Cliente "${newClientName.trim()}" actualizado correctamente!`);
        setEditingClientId(null);
      } else {
        await addClient({
          name: newClientName.trim(),
          taxId: newClientTaxId.trim() || 'XAXX010101000',
          email: newClientEmail.trim() || 'contacto@cliente.com',
          address: newClientAddress.trim() || 'Dirección no especificada',
          phone: newClientPhone.trim() || 'S/N',
          whatsapp: newClientWhatsapp.trim() || newClientPhone.trim() || 'S/N',
          model: newClientModel.trim(),
          fault: newClientFault.trim(),
          status: 'Activo',
          departments: [
            {
              id: `dep-${Date.now()}-1`,
              name: 'Planta / Matriz Principal',
              contactName: newClientName.trim(),
              phone: newClientPhone.trim() || 'S/N',
              address: newClientAddress.trim() || 'Dirección no especificada'
            }
          ]
        });
        showFeedback('success', `¡Cliente "${newClientName.trim()}" registrado y sincronizado con éxito!`);
      }

      setIsClientModalOpen(false);
      setNewClientName('');
      setNewClientTaxId('');
      setNewClientEmail('');
      setNewClientAddress('');
      setNewClientPhone('');
      setNewClientWhatsapp('');
      setNewClientModel('');
      setNewClientFault('');
    } catch (err: any) {
      console.error('Error al guardar cliente:', err);
      showFeedback('error', 'Ocurrió un problema al guardar el cliente.');
    } finally {
      setIsClientSubmitting(false);
    }
  };

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim()) return;

    if (editingPartId) {
      updateSparePart(editingPartId, {
        code: partCode,
        name: partName,
        category: partCategory,
        unitPrice: Number(partPrice),
        stock: Number(partStock)
      });
      setEditingPartId(null);
    } else {
      addSparePart({
        code: partCode || `REF-${Math.floor(Math.random() * 9000 + 1000)}`,
        name: partName,
        category: partCategory,
        unitPrice: Number(partPrice),
        stock: Number(partStock),
        status: 'Activo'
      });
    }

    setIsPartModalOpen(false);
    setPartName('');
    setPartCode('');
    setPartPrice(500);
    setPartStock(10);
  };

  return (
    <div className="space-y-6">
      
      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center space-x-3 text-sm font-bold shadow-xs border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Toggle Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'clients'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Directorio de Clientes ({clients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'catalog'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Catálogo de Refacciones ({spareParts.length})</span>
          </button>
        </div>

        {/* Search & Add Button */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'clients' ? "Buscar cliente o RFC..." : "Buscar refacción..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {activeTab === 'clients' ? (
            <button
              onClick={() => setIsClientModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          ) : (
            <button
              onClick={() => setIsPartModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Refacción</span>
            </button>
          )}
        </div>
      </div>

      {/* CLIENTS VIEW - HORIZONTAL LIST */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          {filteredClients.map(client => (
            <div
              key={client.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-start justify-between gap-6"
            >
              {/* Client Info Block */}
              <div className="space-y-3 lg:w-1/3 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{client.name}</h4>
                    <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 inline-block mt-0.5">
                      RFC: {client.taxId}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate font-medium">{client.email}</span>
                  </div>
                  {(client.phone || client.contactPhone) && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium">Tel: {client.phone || client.contactPhone}</span>
                    </div>
                  )}
                  {client.whatsapp && (
                    <div className="flex items-center space-x-2 text-emerald-700 font-semibold">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">WA</span>
                      <span>WhatsApp: {client.whatsapp}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Service Details & Actions */}
              <div className="flex-1 flex flex-col justify-between gap-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Dirección</span>
                    <div className="font-semibold text-slate-800 flex items-start space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{client.address || client.fiscalAddress || 'Sin dirección registrada'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Modelo de Equipo / Aparato</span>
                    <div className="font-bold text-slate-900 bg-blue-50 text-blue-800 p-2 rounded-lg border border-blue-100">
                      {client.model || 'No especificado'}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Falla / Reporte Inicial</span>
                    <div className="font-medium text-slate-700 bg-amber-50 text-amber-900 p-2 rounded-lg border border-amber-200 line-clamp-3">
                      {client.fault || 'Sin reporte inicial'}
                    </div>
                  </div>
                </div>

                {/* Client CRUD Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => {
                      setEditingClientId(client.id);
                      setNewClientName(client.name);
                      setNewClientTaxId(client.taxId || '');
                      setNewClientEmail(client.email);
                      setNewClientAddress(client.address || '');
                      setNewClientPhone(client.phone || '');
                      setNewClientWhatsapp(client.whatsapp || '');
                      setNewClientModel(client.model || '');
                      setNewClientFault(client.fault || '');
                      setIsClientModalOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => toggleClientStatus(client.id)}
                    className={`font-bold flex items-center space-x-1 cursor-pointer ${
                      client.status === 'Inactivo' ? 'text-emerald-600 hover:text-emerald-800' : 'text-amber-600 hover:text-amber-800'
                    }`}
                  >
                    {client.status === 'Inactivo' ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Activar</span>
                      </>
                    ) : (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        <span>Desactivar</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() =>
                      setItemToDelete({
                        id: client.id,
                        type: 'client',
                        name: client.name,
                        description: `al cliente "${client.name}" (RFC: ${client.taxId || 'N/A'})`
                      })
                    }
                    className="text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Borrar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SPARE PARTS CATALOG VIEW */}
      {activeTab === 'catalog' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Refacción / Repuesto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-right">Precio Base (MXN)</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredParts.map(part => (
                <tr key={part.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-blue-600">{part.code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{part.name}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium text-[11px]">
                      {part.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] ${
                        part.stock <= 5
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {part.stock} unids
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800">
                    ${part.unitPrice.toLocaleString('es-MX')} MXN
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={() => {
                          setEditingPartId(part.id);
                          setPartCode(part.code);
                          setPartName(part.name);
                          setPartCategory(part.category);
                          setPartPrice(part.unitPrice);
                          setPartStock(part.stock);
                          setIsPartModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 cursor-pointer"
                        title="Editar refacción"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => toggleSparePartStatus(part.id)}
                        className={`p-1.5 rounded-lg cursor-pointer ${
                          part.status === 'Inactivo'
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-amber-600 hover:bg-amber-50'
                        }`}
                        title={part.status === 'Inactivo' ? 'Activar refacción' : 'Desactivar refacción'}
                      >
                        {part.status === 'Inactivo' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() =>
                          setItemToDelete({
                            id: part.id,
                            type: 'part',
                            name: part.name,
                            description: `la refacción "${part.name}" (Código: ${part.code})`
                          })
                        }
                        className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Eliminar refacción de la base de datos"
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

      {/* NEW CLIENT MODAL */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 shrink-0 bg-white flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Agregar Nuevo Cliente</h3>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg bg-slate-50"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nombre / Razón Social</label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={e => setNewClientName(e.target.value)}
                    placeholder="Ej. Grupo Industrial Monterrey"
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-800 text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">RFC</label>
                    <input
                      type="text"
                      value={newClientTaxId}
                      onChange={e => setNewClientTaxId(e.target.value)}
                      placeholder="GIM990101XX1"
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-800 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Email</label>
                    <input
                      type="email"
                      value={newClientEmail}
                      onChange={e => setNewClientEmail(e.target.value)}
                      placeholder="compras@cliente.com"
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-800 text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Dirección */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dirección *</label>
                  <input
                    type="text"
                    required
                    value={newClientAddress}
                    onChange={e => setNewClientAddress(e.target.value)}
                    placeholder="Ej. Calle 16 de Septiembre #450, Col. Centro, Monterrey"
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-800 text-xs font-medium"
                  />
                </div>

                {/* Teléfono & WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Teléfono *</label>
                    <input
                      type="tel"
                      required
                      value={newClientPhone}
                      onChange={e => setNewClientPhone(e.target.value)}
                      placeholder="811-234-5678"
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-800 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">WhatsApp</label>
                    <input
                      type="tel"
                      value={newClientWhatsapp}
                      onChange={e => setNewClientWhatsapp(e.target.value)}
                      placeholder="811-987-6543"
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-800 text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Modelo y Falla (Opcionales) */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Modelo de Equipo / Sistema <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={newClientModel}
                    onChange={e => setNewClientModel(e.target.value)}
                    placeholder="Ej. Minisplit Inverter Carrier 2 TR / Refrigerador Comercial"
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-800 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Falla / Notas Iniciales <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={newClientFault}
                    onChange={e => setNewClientFault(e.target.value)}
                    placeholder="Ej. Mantenimiento preventivo periódico programado..."
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-800 text-xs font-medium resize-none"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  disabled={isClientSubmitting}
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 bg-white rounded-lg text-xs font-semibold text-slate-700 cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isClientSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-md cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {isClientSubmitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{isClientSubmitting ? 'Guardando...' : 'Guardar Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW PART MODAL */}
      {isPartModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 shrink-0 bg-white flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {editingPartId ? 'Editar Refacción del Catálogo' : 'Agregar Refacción al Catálogo'}
              </h3>
              <button
                onClick={() => {
                  setIsPartModalOpen(false);
                  setEditingPartId(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg bg-slate-50"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePart} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nombre de Refacción</label>
                  <input
                    type="text"
                    required
                    value={partName}
                    onChange={e => setPartName(e.target.value)}
                    placeholder="Ej. Batería de Gel 12V 100Ah"
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-800 text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Código</label>
                    <input
                      type="text"
                      value={partCode}
                      onChange={e => setPartCode(e.target.value)}
                      placeholder="BAT-GEL-12V"
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-800 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Categoría</label>
                    <input
                      type="text"
                      value={partCategory}
                      onChange={e => setPartCategory(e.target.value)}
                      placeholder="Electrónica / HVAC"
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-800 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Precio Base (MXN)</label>
                    <input
                      type="number"
                      value={partPrice}
                      onChange={e => setPartPrice(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-800 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Stock Inicial</label>
                    <input
                      type="number"
                      value={partStock}
                      onChange={e => setPartStock(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-800 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPartModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 bg-white rounded-lg text-xs font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-md"
                >
                  Guardar Refacción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) {
            if (itemToDelete.type === 'client') {
              deleteClient(itemToDelete.id);
            } else if (itemToDelete.type === 'part') {
              deleteSparePart(itemToDelete.id);
            }
            setItemToDelete(null);
          }
        }}
        title={itemToDelete?.type === 'client' ? '¿Eliminar cliente permanentemente?' : '¿Eliminar refacción permanentemente?'}
        itemDescription={itemToDelete?.description || 'este registro'}
        itemType={itemToDelete?.type === 'client' ? 'cliente' : 'refacción'}
      />

    </div>
  );
};
