import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, Package, Plus, MapPin, Phone, Mail, Search, Tag, Database } from 'lucide-react';

export const ClientsAndCatalog: React.FC = () => {
  const { clients, spareParts, addClient, addSparePart } = useApp();
  const [activeTab, setActiveTab] = useState<'clients' | 'catalog'>('clients');

  const [searchQuery, setSearchQuery] = useState('');

  // New Client Modal State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientTaxId, setNewClientTaxId] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [dep1Name, setDep1Name] = useState('');
  const [dep1Contact, setDep1Contact] = useState('');
  const [dep1Phone, setDep1Phone] = useState('');
  const [dep2Name, setDep2Name] = useState('');
  const [dep2Contact, setDep2Contact] = useState('');
  const [dep2Phone, setDep2Phone] = useState('');
  const [dep3Name, setDep3Name] = useState('');
  const [dep3Contact, setDep3Contact] = useState('');
  const [dep3Phone, setDep3Phone] = useState('');

  // New Spare Part Modal State
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
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

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    addClient({
      name: newClientName,
      taxId: newClientTaxId || 'XAXX010101000',
      email: newClientEmail || 'contacto@cliente.com',
      departments: [
        { id: `dep-${Date.now()}-1`, name: dep1Name || 'Planta Principal', contactName: dep1Contact || 'Contacto 1', phone: dep1Phone || '555-0001' },
        { id: `dep-${Date.now()}-2`, name: dep2Name || 'Sucursal Norte', contactName: dep2Contact || 'Contacto 2', phone: dep2Phone || '555-0002' },
        { id: `dep-${Date.now()}-3`, name: dep3Name || 'Almacén Central', contactName: dep3Contact || 'Contacto 3', phone: dep3Phone || '555-0003' }
      ]
    });

    setIsClientModalOpen(false);
    setNewClientName('');
    setNewClientTaxId('');
    setNewClientEmail('');
  };

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim()) return;

    addSparePart({
      code: partCode || `REF-${Math.floor(Math.random() * 9000 + 1000)}`,
      name: partName,
      category: partCategory,
      unitPrice: Number(partPrice),
      stock: Number(partStock)
    });

    setIsPartModalOpen(false);
    setPartName('');
    setPartCode('');
  };

  return (
    <div className="space-y-6">
      
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

                <div className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate font-medium">{client.email}</span>
                </div>
              </div>

              {/* Departments Block (Horizontal Row) */}
              <div className="flex-1 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Departamentos / Ubicaciones Registradas ({client.departments.length}):
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {client.departments.map(dep => (
                    <div
                      key={dep.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 hover:border-blue-300 transition-colors"
                    >
                      <div className="font-bold text-slate-800 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{dep.name}</span>
                      </div>
                      <div className="text-slate-500 text-[11px] space-y-0.5 pt-0.5">
                        <div className="truncate">Contacto: <span className="text-slate-700 font-medium">{dep.contactName}</span></div>
                        <div className="font-mono text-slate-700">Tel: {dep.phone}</div>
                      </div>
                    </div>
                  ))}
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

                <div className="pt-3 border-t border-slate-200">
                  <span className="font-bold text-slate-800 block mb-2">Departamentos / Ubicaciones (3 por defecto):</span>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Dep 1: Ej. Nave A - Producción"
                      value={dep1Name}
                      onChange={e => setDep1Name(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-800 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Dep 2: Ej. Edificio B - Laboratorio"
                      value={dep2Name}
                      onChange={e => setDep2Name(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-800 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Dep 3: Ej. Almacén Central"
                      value={dep3Name}
                      onChange={e => setDep3Name(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 bg-white rounded-lg text-xs font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-md"
                >
                  Guardar Cliente
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
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Agregar Refacción al Catálogo</h3>
              <button
                onClick={() => setIsPartModalOpen(false)}
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

    </div>
  );
};
